# core/signals.py
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.conf import settings
from django.core.mail import send_mail
from django.core.signing import TimestampSigner
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()
signer = TimestampSigner()

@receiver(post_save, sender=User)
def send_registration_email(sender, instance, created, **kwargs):
    if created:
        token = signer.sign(instance.pk)
        verify_path = reverse("auth-verify-email")
        verify_url = f"{settings.SITE_PROTOCOL}://{settings.SITE_DOMAIN}{verify_path}?token={token}" if getattr(settings, "SITE_DOMAIN", None) else verify_path
        subject = "Verify your account"
        message = f"Thanks for registering. Verify: {verify_url}"
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [instance.email], fail_silently=True)
