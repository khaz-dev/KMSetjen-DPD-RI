"""Middleware for capturing request context for audit logging."""
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class AuditContextMiddleware(MiddlewareMixin):
    """Capture IP address and user-agent for audit logging."""
    
    def process_request(self, request):
        # Get client IP address
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        # Store in request for use in views
        request.audit_ip_address = ip
        request.audit_user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        return None


class CORSMiddleware(MiddlewareMixin):
    """Custom CORS middleware for cross-origin requests."""
    
    def process_response(self, request, response):
        origin = request.META.get('HTTP_ORIGIN')
        
        # CORS headers are handled by django-cors-headers
        # This middleware is for additional custom handling if needed
        
        return response
