
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AboutPageViewSet, ContactPageViewSet, ContactSubmissionViewSet, BannerViewSet, OverviewViewSet, CategoryViewSet
from .views import set_csrf_token
router = DefaultRouter()
router.register("banners", BannerViewSet, basename="banners")
router.register("overviews", OverviewViewSet, basename="overviews")
router.register("categories", CategoryViewSet, basename="categories")
router.register("about", AboutPageViewSet, basename='about')
router.register("contacts", ContactPageViewSet , basename='contacts')
router.register("submissions", ContactSubmissionViewSet , basename='submissions')


urlpatterns = [
    path("", include(router.urls)),
     path("csrf/", set_csrf_token),
]
