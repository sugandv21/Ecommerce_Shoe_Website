# core/serializers_auth.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "confirm_password", "first_name", "last_name")

    def validate(self, data):
        if data.get("password") != data.get("confirm_password"):
            raise serializers.ValidationError({"password": "Password and confirm_password do not match."})
        # validate password strength
        try:
            validate_password(data.get("password"), user=None)
        except Exception as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        # start inactive until email verification (optional)
        user.is_active = False
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()  # this field accepts username OR email
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        from django.contrib.auth import authenticate
        identifier = data.get("username")
        password = data.get("password")

        # If identifier looks like an email, try to resolve it to a username first
        user = None
        if identifier and "@" in identifier:
            try:
                # Prefer a case-insensitive match for email
                user_obj = User.objects.filter(email__iexact=identifier).first()
                if user_obj:
                    # authenticate expects username (or whatever your backend uses)
                    user = authenticate(username=user_obj.username, password=password)
            except Exception:
                user = None

        # Fallback: try authenticate treating identifier as username
        if user is None:
            user = authenticate(username=identifier, password=password)

        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("Account not active. Please verify your email.")
        data["user"] = user
        return data
