# core/serializers.py
from decimal import Decimal
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import serializers

from .models import (
    Navbar, Product, ProductImage, Brand, Color, Size,
    Cart, CartItem, Order, OrderItem, UserCheckoutDetail
)

from .models import OrderTrackingEvent

class OrderTrackingEventSerializer(serializers.ModelSerializer):
    timestamp_readable = serializers.SerializerMethodField()

    class Meta:
        model = OrderTrackingEvent
        fields = ("id", "status", "timestamp", "timestamp_readable", "location", "note")

    def get_timestamp_readable(self, obj):
        # Example: "May 21,2025 | 03:45 pm"
        return obj.timestamp.strftime("%b %d,%Y | %I:%M %p")


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ("id", "url", "alt_text", "order")

    def get_url(self, obj):
        if not getattr(obj, "image", None):
            return None
        request = self.context.get("request", None)

        if request is not None:
            try:
                return request.build_absolute_uri(obj.image.url)
            except Exception:
                return obj.image.url

        site_protocol = getattr(settings, "SITE_PROTOCOL", None)
        site_domain = getattr(settings, "SITE_DOMAIN", None)
        if site_protocol and site_domain:
            return f"{site_protocol}://{site_domain}{obj.image.url}"

        return obj.image.url


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ("id", "name", "slug")


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ("id", "name", "hex")


class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ("id", "label")


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    brand = BrandSerializer(read_only=True)
    colors = ColorSerializer(many=True, read_only=True)
    sizes = SizeSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "title",
            "subtitle",
            "slug",
            "price",
            "mrp",
            "description",
            "category",
            "style",
            "brand",
            "sizes",
            "colors",
            "rating",
            "images",
            "stock",
        )


class ProductDetailSerializer(ProductSerializer):
    variant_thumbs = serializers.SerializerMethodField()

    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ("variant_thumbs",)

    def get_variant_thumbs(self, obj):
        imgs = obj.images.all().order_by("order")[:5]
        request = self.context.get("request", None)
        urls = []
        for im in imgs:
            if not getattr(im, "image", None):
                urls.append(None)
                continue
            if request is not None:
                try:
                    urls.append(request.build_absolute_uri(im.image.url))
                except Exception:
                    urls.append(im.image.url)
            else:
                site_protocol = getattr(settings, "SITE_PROTOCOL", None)
                site_domain = getattr(settings, "SITE_DOMAIN", None)
                if site_protocol and site_domain:
                    urls.append(f"{site_protocol}://{site_domain}{im.image.url}")
                else:
                    urls.append(im.image.url)
        return urls


class NavbarSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Navbar
        fields = ("id", "site_name", "logo", "logo_url")

    def get_logo_url(self, obj):
        if not getattr(obj, "logo", None):
            return None

        request = self.context.get("request", None)
        if request is not None:
            try:
                return request.build_absolute_uri(obj.logo.url)
            except Exception:
                return obj.logo.url

        site_protocol = getattr(settings, "SITE_PROTOCOL", None)
        site_domain = getattr(settings, "SITE_DOMAIN", None)
        if site_protocol and site_domain:
            return f"{site_protocol}://{site_domain}{obj.logo.url}"

        return obj.logo.url


# ---------- Cart serializers ----------
class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True, required=False
    )
    line_total = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CartItem
        fields = ("id", "product", "product_id", "quantity", "size", "line_total")
        read_only_fields = ("id", "product", "line_total")

    def get_line_total(self, obj):
        try:
            lt = obj.line_total()
            return str(lt) if isinstance(lt, Decimal) else lt
        except Exception:
            return "0.00"

    def validate_quantity(self, value):
        if value is None:
            raise serializers.ValidationError("Quantity is required.")
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True)

    class Meta:
        model = Cart
        fields = ("id", "user", "created", "updated", "items")
        read_only_fields = ("created", "updated", "id")

    def _resolve_product_instance(self, val):
        if hasattr(val, "id"):
            return val
        try:
            pid = int(val)
        except Exception:
            pid = None
        if pid is None:
            raise serializers.ValidationError({"product": "Invalid product identifier."})
        return get_object_or_404(Product, pk=pid)

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        cart = Cart.objects.create(**validated_data)
        for it in items_data:
            prod = it.get("product") or it.get("product_id") or it.get("product_id", None)
            if prod is None:
                raise serializers.ValidationError({"product": "Product is required for each cart item."})
            product = self._resolve_product_instance(prod)
            quantity = int(it.get("quantity", 1) or 1)
            size = it.get("size", "") or ""
            CartItem.objects.create(cart=cart, product=product, quantity=quantity, size=size)
        return cart

    def update(self, instance, validated_data):
        replace = validated_data.pop("replace", False)
        incoming_items = validated_data.pop("items", [])

        incoming_map = {}
        for it in incoming_items:
            prod = it.get("product") or it.get("product_id")
            if prod is None:
                continue
            if hasattr(prod, "id"):
                prod_id = prod.id
            else:
                try:
                    prod_id = int(prod)
                except Exception:
                    raise serializers.ValidationError({"product": f"Invalid product id: {prod}"})
            size = it.get("size", "") or ""
            qty = int(it.get("quantity", 1) or 1)
            incoming_map[(prod_id, size)] = {"product_id": prod_id, "quantity": qty, "size": size}

        existing_items = {(ci.product.id, ci.size or ""): ci for ci in instance.items.all()}

        if replace:
            for key, ci in list(existing_items.items()):
                if key not in incoming_map:
                    ci.delete()
            for key, payload in incoming_map.items():
                if key in existing_items:
                    ci = existing_items[key]
                    ci.quantity = payload["quantity"]
                    ci.save()
                else:
                    CartItem.objects.create(cart=instance, product_id=payload["product_id"], quantity=payload["quantity"], size=payload["size"])
        else:
            for key, payload in incoming_map.items():
                if key in existing_items:
                    ci = existing_items[key]
                    ci.quantity = payload["quantity"]
                    ci.save()
                else:
                    CartItem.objects.create(cart=instance, product_id=payload["product_id"], quantity=payload["quantity"], size=payload["size"])

        instance.save()
        return instance


# ---------- Order serializers (create) ----------
class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())

    class Meta:
        model = OrderItem
        fields = ("product", "quantity", "size")
        extra_kwargs = {"quantity": {"required": True}}


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)

    class Meta:
        model = Order
        fields = ("fullname", "email", "shipping_address", "payment_method", "items")

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Order must contain at least one item.")
        return value

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        with transaction.atomic():
            total = Decimal("0")
            locked = {}
            for it in items_data:
                prod_obj = it["product"]
                pid = prod_obj.pk if hasattr(prod_obj, "pk") else int(prod_obj)
                if pid not in locked:
                    locked[pid] = Product.objects.select_for_update().get(pk=pid)
                product = locked[pid]
                qty = int(it["quantity"])
                if product.stock < qty:
                    raise serializers.ValidationError({
                        "stock": f"Not enough stock for product {product.title}. Requested {qty}, available {product.stock}."
                    })
            order = Order.objects.create(**validated_data, total_amount=Decimal("0"))
            for it in items_data:
                prod_obj = it["product"]
                pid = prod_obj.pk if hasattr(prod_obj, "pk") else int(prod_obj)
                product = locked[pid]
                qty = int(it["quantity"])
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    title=product.title,
                    price=product.price,
                    quantity=qty,
                    size=it.get("size", ""),
                )
                total += (product.price or Decimal("0")) * Decimal(qty)
                product.stock = max(product.stock - qty, 0)
                product.save()
            order.total_amount = total
            order.save()
            return order


# ---------- NEW: Order detail serializers (after ProductSerializer) ----------
class OrderItemDetailSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ("id", "product", "title", "price", "quantity", "size")


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemDetailSerializer(many=True, read_only=True)
    tracking_events = OrderTrackingEventSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "user",
            "fullname",
            "email",
            "payment_method",
            "total_amount",
            "shipping_address",
            "created",
            "paid",
            "items",
            "tracking_events",
        )
        read_only_fields = ("id", "created", "paid", "total_amount")


# --------- UserCheckoutDetail serializer ----------
class UserCheckoutDetailSerializer(serializers.ModelSerializer):
    # Accept raw_card_number only temporarily from the frontend (if you MUST),
    # but ensure we never save cvv and never persist full card number.
    raw_card_number = serializers.CharField(write_only=True, required=False, allow_blank=True,
                                            help_text="Raw PAN (write-only). Will be masked and only last4 kept.")
    raw_expiration = serializers.CharField(write_only=True, required=False, allow_blank=True,
                                           help_text="MM/YY or MM/YYYY")

    class Meta:
        model = UserCheckoutDetail
        # Do not include payment_token or card_last4 as writable from user directly.
        fields = (
            "id", "first_name", "last_name", "email", "phone_number",
            "card_holder_name", "card_last4", "card_brand", "card_expiry", "raw_card_number", "raw_expiration",
            "payment_method", "address_line1", "city", "state", "pincode", "landmark", "created",
        )
        read_only_fields = ("id", "card_last4", "card_brand", "card_expiry", "created")

    def validate(self, data):
        # Basic validation: if payment_method is 'card', ensure we have raw_card_number or token
        pm = data.get("payment_method") or self.instance and self.instance.payment_method
        raw = data.get("raw_card_number")
        token = data.get("payment_token") if "payment_token" in data else None
        if pm == "card" and not (raw or token):
            raise serializers.ValidationError({"payment_method": "Card payments require card number or gateway token."})
        return data

    def create(self, validated_data):
        # Extract any raw card info and fill card_last4/card_brand/card_expiry from it
        raw_pan = validated_data.pop("raw_card_number", None)
        raw_exp = validated_data.pop("raw_expiration", None)
        # naive brand detection
        card_brand = ""
        card_last4 = ""
        card_expiry = ""
        if raw_pan:
            digits = "".join(ch for ch in raw_pan if ch.isdigit())
            if len(digits) >= 4:
                card_last4 = digits[-4:]
            # simple BIN checks (very basic)
            if digits.startswith("4"):
                card_brand = "VISA"
            elif digits.startswith(("51", "52", "53", "54", "55")):
                card_brand = "MASTERCARD"
            # else leave blank
        if raw_exp:
            card_expiry = raw_exp

        validated_data["card_last4"] = card_last4
        validated_data["card_brand"] = card_brand
        validated_data["card_expiry"] = card_expiry

        # user will be set in the view (do not rely on serializer to set request.user)
        return UserCheckoutDetail.objects.create(**validated_data)

    def update(self, instance, validated_data):
        # Avoid updating card_last4/card_brand directly in update unless raw_pan provided
        raw_pan = validated_data.pop("raw_card_number", None)
        raw_exp = validated_data.pop("raw_expiration", None)
        if raw_pan:
            digits = "".join(ch for ch in raw_pan if ch.isdigit())
            if len(digits) >= 4:
                instance.card_last4 = digits[-4:]
            if digits.startswith("4"):
                instance.card_brand = "VISA"
            elif digits.startswith(("51","52","53","54","55")):
                instance.card_brand = "MASTERCARD"
        if raw_exp:
            instance.card_expiry = raw_exp

        # update other simple fields
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance