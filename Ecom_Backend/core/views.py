import logging
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, viewsets, permissions, mixins, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.exceptions import NotFound, PermissionDenied
from django.db.models import Q
from rest_framework import serializers


from .models import (
    Navbar, Product, Brand, Color, Size,
    Cart, CartItem, Order
)
from .serializers import (
    NavbarSerializer, ProductSerializer, ProductDetailSerializer,
    CartSerializer, CartItemSerializer,
    OrderCreateSerializer
)
from .models import UserCheckoutDetail
from .serializers import UserCheckoutDetailSerializer

from .serializers import OrderDetailSerializer
from .models import Order
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import OrderTrackingEvent
from .serializers import OrderTrackingEventSerializer
from rest_framework.permissions import AllowAny


logger = logging.getLogger(__name__)

# in your views.py (update these two classes)

from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404

from rest_framework.permissions import AllowAny

class OrderTrackingAPIView(RetrieveAPIView):
    # permission_classes = [IsAuthenticatedOrReadOnly]
    permission_classes = [AllowAny]  
    serializer_class = OrderTrackingEventSerializer
    lookup_url_kwarg = "pk"

    def get(self, request, pk, *args, **kwargs):
        order = get_object_or_404(Order, pk=pk)
        # ownership check with email fallback
        user = request.user
        email_param = (request.query_params.get("email") or "").strip().lower()

        if order.user_id:
            if user.is_authenticated:
                if not (user.is_staff or order.user_id == user.id):
                    raise PermissionDenied("You do not have permission to view this order's tracking.")
            else:
                # allow anonymous if they supply matching order email
                if not email_param or email_param != (order.email or "").strip().lower():
                    raise PermissionDenied("Provide the order email to view tracking or sign in.")
        # else if order.user is None, allow (public order) or proceed
        events = order.tracking_events.all()
        ser = self.get_serializer(events, many=True)
        return Response(ser.data)


class OrderDetailAPIView(RetrieveAPIView):
    """
    Public order detail endpoint.
    WARNING: This will expose full order details (items, shipping address, email) to anyone
    who knows the order id. Use with care.
    """
    queryset = Order.objects.all().prefetch_related("items__product")
    serializer_class = OrderDetailSerializer
    permission_classes = [AllowAny]

class UserCheckoutDetailCreateAPIView(generics.CreateAPIView):
    queryset = UserCheckoutDetail.objects.all()
    serializer_class = UserCheckoutDetailSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)




class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provides:
      - GET /api/products/         -> list
      - GET /api/products/{pk}/    -> retrieve (detail serializer with variant_thumbs)
    """
    queryset = Product.objects.filter(is_active=True).select_related("brand").prefetch_related("images", "colors", "sizes")
    permission_classes = [permissions.AllowAny]
    pagination_class = LimitOffsetPagination

    # default serializer for list (lighter) and detail (richer)
    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductSerializer

    def get_queryset(self):
        # reuse filters from your previous ProductList.get_queryset
        qs = (
            Product.objects.filter(is_active=True)
            .select_related("brand")
            .prefetch_related("images", "colors", "sizes")
            .order_by("-created")
        )

        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__iexact=category)

        q = self.request.query_params.get("search")
        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(subtitle__icontains=q)
                | Q(description__icontains=q)
            )

        style = self.request.query_params.get("style")
        if style:
            qs = qs.filter(style__iexact=style)

        brand = self.request.query_params.get("brands") or self.request.query_params.get("brand")
        if brand:
            if brand.isdigit():
                qs = qs.filter(brand__id=int(brand))
            else:
                qs = qs.filter(brand__slug=brand)

        color = self.request.query_params.get("color")
        if color:
            color = color.strip()
            if color.startswith("#"):
                qs = qs.filter(colors__hex__iexact=color)
            elif color.isdigit():
                qs = qs.filter(colors__id=int(color))
            else:
                qs = qs.filter(colors__name__iexact=color)

        size = self.request.query_params.get("size")
        if size:
            if size.isdigit():
                qs = qs.filter(sizes__id=int(size))
            else:
                qs = qs.filter(sizes__label__iexact=size)

        return qs.distinct()


class FiltersForCategory(APIView):
    def get(self, request, *args, **kwargs):
        category = request.query_params.get("category", "womens")
        base_qs = Product.objects.filter(is_active=True)
        if category:
            base_qs = base_qs.filter(category__iexact=category)

        styles = list(base_qs.order_by().values_list("style", flat=True).distinct())
        styles = [s for s in styles if s]
        size_qs = Size.objects.filter(products__in=base_qs).distinct()
        sizes = [{"id": s.id, "label": s.label} for s in size_qs]
        brand_qs = Brand.objects.filter(products__in=base_qs).distinct()
        brands = [{"id": b.id, "name": b.name, "slug": b.slug} for b in brand_qs]
        color_qs = Color.objects.filter(products__in=base_qs).distinct()
        colors = [{"id": c.id, "name": c.name, "hex": c.hex} for c in color_qs]

        return Response({
            "style": [{"id": s, "label": s, "value": s} for s in styles],
            "size": sizes,
            "brands": brands,
            "color": [{"id": c["id"], "name": c["name"], "value": c["hex"]} for c in colors],
        }, status=status.HTTP_200_OK)


class NavbarDetail(generics.RetrieveAPIView):
    queryset = Navbar.objects.all().order_by("-id")
    serializer_class = NavbarSerializer

    def get_object(self):
        return self.queryset.first()


# ---- Cart & CartItem viewsets (unchanged behaviour, only small improvements) ----
class CartViewSet(viewsets.GenericViewSet,
                  mixins.RetrieveModelMixin,
                  mixins.CreateModelMixin,
                  mixins.UpdateModelMixin,
                  mixins.DestroyModelMixin,
                  mixins.ListModelMixin):
    """
    Exposes:
      - GET /api/cart/my/
      - POST /api/cart/
      - GET/PUT/PATCH /api/cart/{id}/
      - POST /api/cart/{id}/add_item/
      - POST /api/cart/{id}/remove_item/
    """
    serializer_class = CartSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Cart.objects.filter(user=user)
        return Cart.objects.none()

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            cart = serializer.save(user=self.request.user)
        else:
            cart = serializer.save()
            try:
                self.request.session['cart_id'] = cart.id
            except Exception:
                pass
        return cart

    def get_object(self):
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        pk = self.kwargs.get(lookup_url_kwarg or 'pk')
        try:
            cart = Cart.objects.get(pk=pk)
        except Cart.DoesNotExist:
            raise NotFound("Cart not found.")

        user = self.request.user
        if user.is_authenticated:
            if cart.user_id != user.id:
                raise PermissionDenied("You do not have permission to access this cart.")
            return cart

        session_cart_id = None
        try:
            session_cart_id = self.request.session.get('cart_id')
        except Exception:
            session_cart_id = None

        if cart.user is None and (session_cart_id is None or str(session_cart_id) == str(cart.id)):
            if session_cart_id is None:
                try:
                    self.request.session['cart_id'] = cart.id
                except Exception:
                    pass
            return cart

        raise PermissionDenied("You do not have permission to access this cart.")

    @action(detail=False, methods=["get"], url_path="my")
    def my(self, request):
        user = request.user
        if user.is_authenticated:
            cart, _ = Cart.objects.get_or_create(user=user)
            serializer = self.get_serializer(cart)
            return Response(serializer.data)

        session_cart_id = request.session.get('cart_id')
        if session_cart_id:
            try:
                cart = Cart.objects.get(pk=session_cart_id)
                serializer = self.get_serializer(cart)
                return Response(serializer.data)
            except Cart.DoesNotExist:
                pass

        cart = Cart.objects.create()
        try:
            request.session['cart_id'] = cart.id
        except Exception:
            pass
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_item(self, request, pk=None):
        cart = self.get_object()
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))
        size = request.data.get("size", "") or ""

        if not product_id:
            return Response({"product_id": "Required"}, status=status.HTTP_400_BAD_REQUEST)

        product = get_object_or_404(Product, pk=product_id)

        with transaction.atomic():
            ci, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                size=size,
                defaults={"quantity": quantity}
            )
            if not created:
                ci.quantity = ci.quantity + quantity
                ci.save()

        try:
            if request.user.is_anonymous:
                request.session.setdefault('cart_id', cart.id)
        except Exception:
            pass

        serializer = self.get_serializer(cart)
        return Response(serializer.data)
        
    def update(self, request, *args, **kwargs):
        cart = self.get_object()
        data = request.data.copy() if isinstance(request.data, dict) else request.data

        logger.debug("[CartViewSet.update] data for update: %s", data)

        # Ensure `items` is present and properly formatted (list of dicts with product_id or product keys)
        items = data.get("items", None)
        if items is None:
            return Response({"detail": "No items provided"}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(items, list):
            return Response({"detail": "items must be a list"}, status=status.HTTP_400_BAD_REQUEST)

        # Use the CartSerializer.update explicitly (so nested logic runs exactly as defined)
        serializer = self.get_serializer(cart, data=data, partial=False)
        try:
            serializer.is_valid(raise_exception=True)
            updated = serializer.save()
            out = self.get_serializer(updated).data
            return Response(out, status=status.HTTP_200_OK)
        except serializers.ValidationError as ve:
            logger.debug("[CartViewSet.update] validation errors: %s", ve.detail)
            return Response({"detail": "validation_error", "errors": ve.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            logger.exception("Cart update save failed")
            return Response({"detail": "update_failed", "error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=True, methods=["post"], url_path="remove_item")
    def remove_item(self, request, pk=None):
        cart = self.get_object()
        payload = request.data or {}

        cart_item_id = payload.get("cartItemId") or payload.get("cart_item_id") or payload.get("id")
        product_id = payload.get("productId") or payload.get("product_id")
        size = (payload.get("size") or "").strip()

        if cart_item_id:
            try:
                ci = CartItem.objects.get(pk=cart_item_id, cart=cart)
                ci.delete()
            except CartItem.DoesNotExist:
                return Response({"detail": "Cart item not found"}, status=status.HTTP_404_NOT_FOUND)
        elif product_id:
            qs = CartItem.objects.filter(cart=cart, product_id=product_id)
            if size != "":
                qs = qs.filter(size=size)
            deleted_count, _ = qs.delete()
            if deleted_count == 0:
                return Response({"detail": "No matching cart item(s) found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"detail": "Provide cartItemId or productId"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CartItemViewSet(viewsets.GenericViewSet,
                      mixins.DestroyModelMixin,
                      mixins.RetrieveModelMixin,
                      mixins.ListModelMixin):
    """
    DELETE /api/cart-items/<id>/  -> deletes a single CartItem and returns the updated cart
    GET /api/cart-items/          -> list items for current user/session (optional)
    """
    serializer_class = CartItemSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return CartItem.objects.filter(cart__user=user).select_related("cart", "product")
        session_cart_id = None
        try:
            session_cart_id = self.request.session.get('cart_id')
        except Exception:
            session_cart_id = None
        if session_cart_id:
            return CartItem.objects.filter(cart_id=session_cart_id).select_related("cart", "product")
        return CartItem.objects.none()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()  # will ensure permissions/404
        cart = instance.cart
        instance.delete()
        # return updated cart (include request in context so image URLs are absolute)
        serializer = CartSerializer(cart, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrderCreateAPIView(CreateAPIView):
    serializer_class = OrderCreateSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        try:
            data = request.data.copy()
            cart_id = data.get("cart_id")
            if cart_id and not data.get("items"):
                try:
                    cart = Cart.objects.get(pk=cart_id)
                except Cart.DoesNotExist:
                    return Response({"cart_id": "Invalid cart_id"}, status=status.HTTP_400_BAD_REQUEST)
                data["items"] = []
                for ci in cart.items.all():
                    data["items"].append({
                        "product": ci.product.id,
                        "quantity": ci.quantity,
                        "size": ci.size
                    })
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            order = serializer.save()
            if cart_id:
                try:
                    cart = Cart.objects.get(pk=cart_id)
                    cart.items.all().delete()
                except Cart.DoesNotExist:
                    pass
            return Response({"order_id": order.id, "message": "Order created"}, status=status.HTTP_201_CREATED)
        except Exception as exc:
            logger.exception("Error creating order")
            return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

