from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from .models import Brand, Color, Size, Product, ProductImage, Navbar, Order, OrderItem
from .models import UserCheckoutDetail
from .models import OrderTrackingEvent

@admin.register(OrderTrackingEvent)
class OrderTrackingEventAdmin(admin.ModelAdmin):
    list_display = ("order", "status", "timestamp", "location")
    list_filter = ("status",)
    search_fields = ("order__id", "location", "note")
    ordering = ("-timestamp",)
class OrderTrackingEventInline(admin.TabularInline):
    model = OrderTrackingEvent
    extra = 1
    fields = ("status", "timestamp", "location", "note")

@admin.register(UserCheckoutDetail)
class UserCheckoutDetailAdmin(admin.ModelAdmin):
    list_display = ("email", "first_name", "last_name", "user", "payment_method", "card_last4", "created")
    readonly_fields = ("created", "updated", "card_last4", "payment_token")
    search_fields = ("email", "first_name", "last_name", "user__username")
    list_filter = ("payment_method", "created")


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    list_display = ("name", "hex", "preview")
    search_fields = ("name", "hex")

    def preview(self, obj):
        return format_html(
            '<span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:{};border:1px solid #ddd;"></span>',
            obj.hex or "transparent",
        )
    preview.short_description = "Color"


@admin.register(Size)
class SizeAdmin(admin.ModelAdmin):
    list_display = ("label",)
    search_fields = ("label",)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("preview", "image", "alt_text", "order")
    readonly_fields = ("preview",)
    ordering = ("order",)

    def preview(self, obj):
        file_field = getattr(obj, "image", None)
        if file_field and getattr(file_field, "url", None):
            return format_html('<img src="{}" style="height:60px;object-fit:cover;border-radius:4px;"/>', file_field.url)
        return ""
    preview.short_description = "Preview"


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "brand", "category", "price", "stock", "is_active")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ProductImageInline]
    search_fields = ("title", "subtitle", "description")
    list_filter = ("category", "brand", "is_active")
    ordering = ("-created",)


@admin.register(Navbar)
class NavbarAdmin(admin.ModelAdmin):
    list_display = ("site_name", "logo_preview")
    readonly_fields = ("logo_preview",)

    def logo_preview(self, obj):
        if getattr(obj, "logo", None) and getattr(obj.logo, "url", None):
            return mark_safe(f'<img src="{obj.logo.url}" style="height:60px;border-radius:6px;" />')
        return "No logo"
    logo_preview.short_description = "Logo Preview"


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    readonly_fields = ("title", "price", "quantity", "size")
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "fullname", "email", "payment_method", "total_amount", "created", "paid")
    inlines = [OrderItemInline]
    list_filter = ("payment_method", "paid", "created")
    readonly_fields = ("created",)
    search_fields = ("fullname", "email")
    ordering = ("-created",)
    inlines = [OrderItemInline, OrderTrackingEventInline]
