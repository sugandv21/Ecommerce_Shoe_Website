
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404

from .models import (
    Banner,
    Overview,
    Category,
    AboutPage,
    ContactPage,
    ContactSubmission,
)
from .serializers import (
    BannerSerializer,
    OverviewSerializer,
    CategorySerializer,
    AboutPageSerializer,
    ContactPageSerializer,
    ContactSubmissionSerializer,
)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.views.decorators.csrf import ensure_csrf_cookie

@api_view(["GET"])
@ensure_csrf_cookie
def set_csrf_token(request):
    """
    Simple endpoint to set the csrftoken cookie for single-page apps.
    Call GET /csrf/ from the frontend before any POSTs.
    """
    return Response({"detail": "CSRF cookie set"})

class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class OverviewViewSet(viewsets.ModelViewSet):
    queryset = Overview.objects.all()
    serializer_class = OverviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class AboutPageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for the AboutPage. We return the latest AboutPage entry.
    """
    queryset = AboutPage.objects.all()
    serializer_class = AboutPageSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = None

    def get_queryset(self):
        # return most recent AboutPage (if any). ReadOnly so no create/update here.
        return AboutPage.objects.order_by("-id")[:1]


class ContactPageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ContactPage is intended to store the page configuration (title, description, image).
    We expose a `latest` action for convenience.
    """
    queryset = ContactPage.objects.all()
    serializer_class = ContactPageSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        # make sure the default list returns latest config (but keep list available)
        return ContactPage.objects.order_by("-created_at")

    @action(detail=False, methods=["get"])
    def latest(self, request, *args, **kwargs):
        contact_page = ContactPage.objects.order_by("-created_at").first()
        if not contact_page:
            default_data = {
                "title": "Contact Us",
                "description": "Please reach out with your queries.",
                "form_title": "Enquiry Form",
            }
            return Response(default_data, status=status.HTTP_200_OK)
        serializer = self.get_serializer(contact_page)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ContactSubmissionViewSet(viewsets.ModelViewSet):
    """
    Create/list contact submissions. Email sending is handled by post_save signal.
    """
    queryset = ContactSubmission.objects.order_by("-submitted_at")
    serializer_class = ContactSubmissionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

