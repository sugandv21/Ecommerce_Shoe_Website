# pages/signals.py
import logging
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.conf import settings
from django.core.mail import send_mail
from django.core.signing import TimestampSigner
from django.urls import reverse
from django.contrib.auth import get_user_model

from .models import ContactSubmission

logger = logging.getLogger(__name__)
User = get_user_model()
signer = TimestampSigner()


@receiver(post_save, sender=User)
def send_registration_email(sender, instance, created, **kwargs):
    if created:
        try:
            token = signer.sign(instance.pk)
            verify_path = reverse("auth-verify-email")
            if getattr(settings, "SITE_DOMAIN", None):
                verify_url = f"{getattr(settings,'SITE_PROTOCOL','https')}://{settings.SITE_DOMAIN}{verify_path}?token={token}"
            else:
                verify_url = f"{verify_path}?token={token}"

            subject = "Verify your account"
            message = f"Thanks for registering. Verify: {verify_url}"
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [instance.email], fail_silently=True)
        except Exception:
            logger.exception("Failed to send registration email for user %s", getattr(instance, "pk", "<unknown>"))


@receiver(post_save, sender=ContactSubmission)
def send_contact_submission_emails(sender, instance, created, **kwargs):
    if not created:
        return

    logger.info("ContactSubmission signal fired for id=%s email=%s", getattr(instance, "id", None), getattr(instance, "email", None))

    try:
        name = instance.name or ""
        email = instance.email or ""
        phone = instance.phone or ""
        message_body = instance.message or ""
        submission_id = getattr(instance, "id", None)
    except Exception:
        logger.exception("ContactSubmission instance missing expected fields: %s", instance)
        return

    # confirmation to submitter
    if email:
        try:
            logger.info("Attempting to send confirmation email to %s", email)
            send_mail(
                subject="Thank you for contacting us",
                message=f"Hi {name},\n\nYour enquiry has been submitted successfully. We will contact you shortly.\n\n- StepUp Team",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,  # use True in production
            )
            logger.info("Confirmation email queued/sent to %s", email)
        except Exception:
            logger.exception("Failed to send confirmation email to %s", email)

    # notify staff users
    try:
        staff_users = (
            User.objects.filter(is_active=True, is_staff=True)
            .exclude(email__isnull=True)
            .exclude(email__exact="")
        )
        admin_emails = list(staff_users.values_list("email", flat=True))
        logger.info("Staff admin emails to notify: %s", admin_emails)

        if not admin_emails:
            logger.warning("No staff users with email found to notify about ContactSubmission id=%s", submission_id)
        else:
            admin_subject = f"New enquiry submitted by {name or 'a user'}"
            admin_message = (
                f"A new enquiry has been submitted on the site.\n\n"
                f"Name: {name}\n"
                f"Email: {email}\n"
                f"Phone: {phone}\n\n"
                f"Message:\n{message_body}\n\n"
                f"Submission ID: {submission_id}\n"
            )

            # admin link built dynamically from instance metadata
            try:
                app_label = instance._meta.app_label
                model_name = instance._meta.model_name
                admin_path = reverse(f"admin:{app_label}_{model_name}_change", args=[submission_id])
                if getattr(settings, "SITE_DOMAIN", None):
                    admin_url = f"{getattr(settings,'SITE_PROTOCOL','https')}://{settings.SITE_DOMAIN}{admin_path}"
                    admin_message += f"\nAdmin link: {admin_url}\n"
            except Exception:
                logger.exception("Failed to build admin link for ContactSubmission id=%s", submission_id)

            logger.info("Attempting to send admin notification email to %s", admin_emails)
            send_mail(
                subject=admin_subject,
                message=admin_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                fail_silently=True,  # use True in production
            )
            logger.info("Admin notification email queued/sent to %s", admin_emails)
    except Exception:
        logger.exception("Failed to send admin notification emails for ContactSubmission id=%s", submission_id)
