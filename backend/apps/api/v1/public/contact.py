"""
Contact form API views for handling contact form submissions.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import json
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def send_contact_email(request):
    """
    Handle contact form submissions and send emails.
    
    Expected POST data:
    {
        "name": "User Name",
        "email": "user@example.com",
        "subject": "Contact Subject",
        "message": "Message content",
        "recipientEmail": "sdm@dpd.go.id"
    }
    """
    try:
        data = request.data
        
        # Validate required fields
        required_fields = ['name', 'email', 'subject', 'message', 'recipientEmail']
        for field in required_fields:
            if field not in data or not data[field].strip():
                return Response(
                    {'error': f'Missing required field: {field}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Extract data
        name = data.get('name').strip()
        sender_email = data.get('email').strip()
        subject = data.get('subject').strip()
        message = data.get('message').strip()
        recipient_email = data.get('recipientEmail').strip()
        
        # Create email body with user info
        email_body = f"""
New Contact Form Submission:

From: {name}
Email: {sender_email}
Subject: {subject}

Message:
{message}

---
This is an automated email from the KMS Contact Form
"""
        
        # Send email to recipient
        try:
            send_mail(
                subject=f"[KMS Contact] {subject}",
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient_email],
                fail_silently=False,
            )
            logger.info(f"Contact email sent from {sender_email} to {recipient_email}")
            
            # Send confirmation email to sender
            confirmation_subject = "Thank You - We Received Your Message"
            confirmation_body = f"""
Dear {name},

Thank you for contacting us through the KMS Contact Form.

We have received your message with the following details:
Subject: {subject}
Message: {message}

Our team will review your message and get back to you as soon as possible.

If you need immediate assistance, please contact us directly:
Email: sdm@dpd.go.id
Phone: +62-81-3948-4805
Website: https://www.dpd.go.id/

Best regards,
KMS Team - Setjen DPD RI
"""
            
            send_mail(
                subject=confirmation_subject,
                message=confirmation_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[sender_email],
                fail_silently=True,
            )
            
            return Response(
                {
                    'success': True,
                    'message': 'Your message has been sent successfully. We will get back to you soon.'
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as email_error:
            logger.error(f"Email sending failed: {str(email_error)}")
            return Response(
                {
                    'error': 'Failed to send email. Please try again later.',
                    'details': str(email_error) if settings.DEBUG else 'Internal server error'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except json.JSONDecodeError:
        return Response(
            {'error': 'Invalid JSON in request body'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as error:
        logger.error(f"Unexpected error in contact form: {str(error)}")
        return Response(
            {
                'error': 'An unexpected error occurred',
                'details': str(error) if settings.DEBUG else 'Internal server error'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
