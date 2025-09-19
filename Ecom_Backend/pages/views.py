from rest_framework import viewsets
from django.core.mail import send_mail
from rest_framework.response import Response
from .models import AboutPage
from .serializers import AboutPageSerializer
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import ContactPage, ContactSubmission
from .serializers import ContactPageSerializer, ContactSubmissionSerializer
from .models import Banner, Overview, Category
from .serializers import BannerSerializer, OverviewSerializer, CategorySerializer

class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer

class OverviewViewSet(viewsets.ModelViewSet):
    queryset = Overview.objects.all()
    serializer_class = OverviewSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class ContactPageViewSet(viewsets.ModelViewSet):
    queryset = ContactPage.objects.all()
    serializer_class = ContactPageSerializer
    
    def get_queryset(self):
        # Return the latest contact page configuration
        return ContactPage.objects.order_by('-created_at')[:1]
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        # Get the latest contact page configuration
        contact_page = ContactPage.objects.order_by('-created_at').first()
        if not contact_page:
            # Return default data if no configuration exists
            default_data = {
                "title": "Contact Us",
                "description": "## For Online Orders\nImpatry: Complaint\n99/9/2020\n\nAny other queries\n99/9/2020\n99/9/2020\n10 AM-20 PM\n\nEmail: contentcreaters@n.inf@gmail.com",
                "form_title": "Enquiry Form"
            }
            return Response(default_data)
        
        serializer = ContactPageSerializer(contact_page)
        return Response(serializer.data)

class ContactSubmissionViewSet(viewsets.ModelViewSet):
    queryset = ContactSubmission.objects.all()
    serializer_class = ContactSubmissionSerializer
    
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)

        # Extract data
        name = request.data.get("name")
        email = request.data.get("email")

        # Send confirmation email
        if email:
            send_mail(
                subject="Thank you for contacting us",
                message=f"Hi {name},\n\nThank you for reaching us. We will contact you shortly.\n\n- Team\n\nStepUp",
                from_email="yourcompany@gmail.com",
                recipient_list=[email],
                fail_silently=False,
            )

        return response

class AboutPageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AboutPage.objects.all()
    serializer_class = AboutPageSerializer
    pagination_class = None

    def get_queryset(self):
        return AboutPage.objects.order_by("-id")[:1]