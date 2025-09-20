
from rest_framework import serializers
from .models import (
    Banner,
    Overview,
    Category,
    AboutPage,
    AboutImage,
    AboutFeature,
    ContactPage,
    ContactSubmission,
)


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ["id", "image", "overlay_text", "button_text", "button_link"]


class OverviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Overview
        fields = ["id", "title", "description"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "title", "image"]


class AboutImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutImage
        fields = ["id", "image"]


class AboutFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutFeature
        fields = ["id", "title", "text"]


class AboutPageSerializer(serializers.ModelSerializer):
    images = AboutImageSerializer(many=True, read_only=True)
    features = AboutFeatureSerializer(many=True, read_only=True)

    class Meta:
        model = AboutPage
        fields = [
            "id",
            "section1_title",
            "section1_content",
            "section2_title",
            "section2_content",
            "images",
            "features",
            "overlay_image1",
            "overlay_image2",
        ]


class ContactPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactPage
        fields = [
            "id",
            "title",
            "description",
            "image",
            "form_title",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class ContactSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactSubmission
        fields = ["id", "name", "email", "phone", "message", "submitted_at"]
        read_only_fields = ["id", "submitted_at"]

    def validate_email(self, value):
        if value is None or value == "":
            return value
        return serializers.EmailField().to_internal_value(value)
