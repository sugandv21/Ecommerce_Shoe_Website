from rest_framework import serializers
from rest_framework import serializers
from .models import AboutPage, AboutImage, AboutFeature
from .models import ContactPage, ContactSubmission
from .models import Banner, Overview, Category

class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ["id", "image", "overlay_text", "button_text"]

class OverviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Overview
        fields = ["id", "title", "description"]

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "title", "image"]

class ContactPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactPage
        fields = '__all__'

class ContactSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactSubmission
        fields = '__all__'

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