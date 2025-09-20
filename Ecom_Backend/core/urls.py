# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet,
    FiltersForCategory,
    NavbarDetail,
    CartViewSet,
    OrderCreateAPIView,
    CartItemViewSet,
    UserCheckoutDetailCreateAPIView,
    OrderDetailAPIView,
)
from .views_auth import RegisterAPIView, VerifyEmailAPIView, LoginAPIView, logout_view, csrf, me

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")
router.register(r"cart", CartViewSet, basename="cart")
router.register(r"cart-items", CartItemViewSet, basename="cart-item")
from .views import OrderTrackingAPIView

urlpatterns = [
    path("orders/", OrderCreateAPIView.as_view(), name="orders-create"),
    path("orders/<int:pk>/", OrderDetailAPIView.as_view(), name="order-detail"),
    path("filters/", FiltersForCategory.as_view(), name="filters"),
    path("navbar/", NavbarDetail.as_view(), name="navbar"),
    path("checkout-details/", UserCheckoutDetailCreateAPIView.as_view(), name="checkout-details"), 
    path("orders/<int:pk>/tracking/", OrderTrackingAPIView.as_view(), name="order-tracking"),
    # auth endpoints
    path("auth/csrf/", csrf, name="auth-csrf"),
    path("auth/register/", RegisterAPIView.as_view(), name="auth-register"),
    path("auth/verify-email/", VerifyEmailAPIView.as_view(), name="auth-verify-email"),
    path("auth/login/", LoginAPIView.as_view(), name="auth-login"),
    path("auth/logout/", logout_view, name="auth-logout"),
    path("auth/me/", me, name="auth-me"),   

    path("", include(router.urls)),
]
