# core/views_auth.py
from django.conf import settings
from django.contrib.auth import login as django_login, logout as django_logout, get_user_model
from django.core.mail import send_mail
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.urls import reverse
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .serializers_auth import RegisterSerializer, LoginSerializer

User = get_user_model()
signer = TimestampSigner()


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf(request):
    """
    Simple endpoint clients can call to ensure CSRF cookie is set.
    """
    return Response({"detail": "csrf cookie set"})


@api_view(["GET"])
@permission_classes([AllowAny])
def me(request):
    """
    Return user info when authenticated; otherwise return null (200).
    This prevents 401 responses for anonymous requests and is safe to call from the frontend.
    """
    user = request.user
    if user and user.is_authenticated:
        return Response({"id": user.id, "username": user.username, "email": user.email})
    # return explicit null so frontend can treat this as "not logged in"
    return Response(None)


class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        # send confirmation email
        token = signer.sign(user.pk)  # "pk:signature"
        verify_path = reverse("auth-verify-email")
        verify_url = f"{self.request.scheme}://{self.request.get_host()}{verify_path}?token={token}"
        subject = "Verify your StepUp account"
        message = (
            f"Thanks for registering.\n\nPlease confirm your email by visiting:\n\n"
            f"{verify_url}\n\nThis link will expire in 1 day."
        )
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)


class VerifyEmailAPIView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        token = request.query_params.get("token")
        if not token:
            return Response({"detail": "Missing token"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            unsigned = signer.unsign(token, max_age=60 * 60 * 24)  # 1 day
            user_pk = int(unsigned)
            user = User.objects.get(pk=user_pk)
            user.is_active = True
            user.save()
            return Response({"detail": "Email verified. You can now log in."})
        except SignatureExpired:
            return Response({"detail": "Token expired."}, status=status.HTTP_400_BAD_REQUEST)
        except (BadSignature, User.DoesNotExist, Exception):
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)


class LoginAPIView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.validated_data["user"]
        django_login(request, user)  # session created
        return Response({"detail": "Logged in", "username": user.username})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    django_logout(request)
    return Response({"detail": "Logged out"})
