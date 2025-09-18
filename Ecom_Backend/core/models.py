from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone  

class OrderTrackingEvent(models.Model):
    """
    Admin-editable order tracking events for an Order.
    Use string 'Order' in the FK so ordering of class definitions does not matter.
    """
    class Status(models.TextChoices):
        PLACED = "placed", "Order Placed"
        DISPATCHED = "dispatched", "Order Dispatched"
        IN_TRANSIT = "in_transit", "Order in transit"
        OUT_FOR_DELIVERY = "out_for_delivery", "Out for delivery"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    order = models.ForeignKey("Order", related_name="tracking_events", on_delete=models.CASCADE)
    status = models.CharField(max_length=32, choices=Status.choices)
    timestamp = models.DateTimeField(default=timezone.now)
    location = models.CharField(max_length=255, blank=True)   # e.g. "Reached at Tenkasi, Post office"
    note = models.TextField(blank=True)                       # optional human note

    class Meta:
        ordering = ("timestamp",)

    def __str__(self):
        return f"{self.get_status_display()} @ {self.timestamp:%Y-%m-%d %H:%M} ({self.location or 'N/A'})"



class UserCheckoutDetail(models.Model):
    """
    Store non-sensitive checkout metadata for a user.
    DO NOT store full PAN or CVV in plaintext here in production.
    Store only last4, brand, expiry and/or a gateway token.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="checkout_details",
        null=True,
        blank=True,
    )

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField()
    phone_number = models.CharField(max_length=20, blank=True)

    # Payment info - keep only non-sensitive fields / gateway token
    card_holder_name = models.CharField(max_length=150, blank=True)

    # Do not store full card number or CVV.
    # Keep last 4 digits and brand for display only.
    card_last4 = models.CharField(max_length=4, blank=True)
    card_brand = models.CharField(max_length=50, blank=True)
    card_expiry = models.CharField(max_length=7, blank=True)  # e.g. "08/28" or "08/2028"

    # Optional: if you integrate a payment gateway, save the gateway token instead
    payment_token = models.CharField(max_length=255, blank=True, help_text="Payment gateway token (if used).")

    # Shipping
    address_line1 = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=20)
    landmark = models.CharField(max_length=150, blank=True)

    # Payment method enumerator (cod, card, upi, paypal etc.)
    payment_method = models.CharField(max_length=50, default="cod")

    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created",)
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["created"]),
        ]

    def __str__(self):
        user_label = self.user.username if self.user else "guest"
        return f"{user_label} - {self.first_name} {self.last_name} ({self.created:%Y-%m-%d})"

    @property
    def masked_card(self):
        """Return a masked card display (e.g. **** **** **** 1234) or empty string."""
        if self.card_last4:
            return f"**** **** **** {self.card_last4}"
        return ""



class Brand(models.Model):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True)

    def __str__(self):
        return self.name


class Color(models.Model):
    name = models.CharField(max_length=50)
    hex = models.CharField(max_length=7, help_text="#rrggbb or named color")

    def __str__(self):
        return f"{self.name} ({self.hex})"


class Size(models.Model):
    # store labels like "Junior UK(3)", "UK(4)" or "US 8" etc.
    label = models.CharField(max_length=40)

    def __str__(self):
        return self.label


class Product(models.Model):
    CATEGORY_CHOICES = (
        ("womens", "Womens"),
        ("mens", "Mens"),
        ("kids", "Kids"),
    )

    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=255, blank=True)
    slug = models.SlugField(max_length=220, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default="womens")
    style = models.CharField(max_length=80, blank=True, help_text="e.g. Sandals, Trainers")
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name="products")
    sizes = models.ManyToManyField(Size, blank=True, related_name="products")
    colors = models.ManyToManyField(Color, blank=True, related_name="products")
    rating = models.FloatField(default=0.0)
    is_active = models.BooleanField(default=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    def variant_image_urls(self, limit: int = 5):
        """
        Return up to `limit` image URLs (ordered by ProductImage.order).
        Useful for product detail thumbnail variants in the frontend.
        Returns a list of strings (may contain None for missing images).
        """
        urls = []
        imgs = self.images.all().order_by("order")[:limit]
        for img in imgs:
            file_field = getattr(img, "image", None)
            if file_field and getattr(file_field, "url", None):
                urls.append(file_field.url)
            else:
                urls.append(None)
        return urls

    @property
    def main_image_url(self):
        """
        Convenience property returning the first image url or None.
        """
        first = self.images.all().order_by("order").first()
        if first and getattr(first, "image", None) and getattr(first.image, "url", None):
            return first.image.url
        return None


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")
    alt_text = models.CharField(max_length=200, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ("order",)

    def __str__(self):
        return f"{self.product.title} img#{self.order}"


class Order(models.Model):
    class PaymentMethod(models.TextChoices):
        GPAY = "gpay", _("GPay")
        PAYPAL = "paypal", _("PayPal")
        CLEARPAY = "clearpay", _("Clearpay")
        KLARNA = "klarna", _("Klarna")
        COD = "cod", _("Cash on Delivery")

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    fullname = models.CharField(max_length=255)
    email = models.EmailField()
    created = models.DateTimeField(auto_now_add=True)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    paid = models.BooleanField(default=False)
    shipping_address = models.TextField(blank=True)

    def __str__(self):
        return f"Order #{self.id} - {self.fullname} - {self.payment_method}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    title = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    size = models.CharField(max_length=50, blank=True)

    def line_total(self):
        return (self.price or Decimal("0")) * Decimal(self.quantity)

    def __str__(self):
        return f"{self.title} x {self.quantity}"


class Cart(models.Model):
    """
    A simple server-side cart. Optionally tied to a user.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def total_amount(self):
        """
        Sum line totals using Decimal starting value to avoid mixing types.
        """
        start = Decimal("0.00")
        return sum((item.line_total() for item in self.items.all()), start)

    def __str__(self):
        if self.user:
            return f"Cart {self.pk} ({self.user})"
        return f"Cart {self.pk} (anonymous)"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey("Product", on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    size = models.CharField(max_length=64, blank=True)

    def line_total(self):
        # product.price is Decimal; multiply returns Decimal
        price = getattr(self.product, "price", Decimal("0"))
        return (price or Decimal("0")) * Decimal(self.quantity)

    class Meta:
        unique_together = ("cart", "product", "size")  # prevent duplicate rows for same product+size

    def __str__(self):
        return f"{self.product.title} x {self.quantity}"


class Navbar(models.Model):
    site_name = models.CharField(max_length=100, default="StepUp")
    logo = models.ImageField(upload_to="navbar_logos/", null=True, blank=True)

    class Meta:
        verbose_name = "Navbar"
        verbose_name_plural = "Navbar"

    def __str__(self):
        return self.site_name
