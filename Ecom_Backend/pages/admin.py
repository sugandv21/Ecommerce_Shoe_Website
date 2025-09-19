from django.contrib import admin
from django.utils.safestring import mark_safe
from django.contrib import admin
from .models import AboutPage, AboutImage, AboutFeature
from .models import ContactPage, ContactSubmission
from .models import Banner, Overview, Category

@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("id", "overlay_text")

@admin.register(Overview)
class OverviewAdmin(admin.ModelAdmin):
    list_display = ("id", "title")

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "title")

@admin.register(ContactPage)
class ContactPageAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_at', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(ContactSubmission)
class ContactSubmissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'submitted_at']
    readonly_fields = ['submitted_at']
    list_filter = ['submitted_at']
    search_fields = ['name', 'email']

class AboutImageInline(admin.TabularInline):
    model = AboutImage
    extra = 1

class AboutFeatureInline(admin.TabularInline):
    model = AboutFeature
    extra = 3

@admin.register(AboutPage)
class AboutPageAdmin(admin.ModelAdmin):
    inlines = [AboutImageInline, AboutFeatureInline]



