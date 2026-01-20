"""Rate limiting and security middleware."""
import logging
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework import status
import json

logger = logging.getLogger('django.security')


class RateLimitMiddleware(MiddlewareMixin):
    """
    Rate limiting middleware for API endpoints.
    Tracks requests per IP and enforces rate limits.
    """
    
    # Rate limit configuration (requests per hour)
    RATE_LIMITS = {
        '/api/auth/login/': 5,          # 5 login attempts per hour
        '/api/auth/register/': 3,       # 3 registrations per hour
        '/api/auth/token/': 10,         # 10 token requests per hour
        '/api/v1/articles/': 100,       # 100 article requests per hour
    }
    
    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def is_rate_limited(self, path, ip):
        """Check if request should be rate limited."""
        # Check if path has rate limit
        limit = self.RATE_LIMITS.get(path)
        if not limit:
            return False
        
        # Get cache key
        cache_key = f'ratelimit:{path}:{ip}'
        
        # Get current count
        current = cache.get(cache_key, 0)
        
        if current >= limit:
            logger.warning(
                f'Rate limit exceeded: {ip} - {path} ({current}/{limit})'
            )
            return True
        
        # Increment counter (1 hour TTL)
        cache.set(cache_key, current + 1, 3600)
        return False
    
    def process_request(self, request):
        """Check rate limits on request."""
        path = request.path
        ip = self.get_client_ip(request)
        
        # Only check POST/PUT/DELETE requests
        if request.method not in ['POST', 'PUT', 'DELETE', 'PATCH']:
            return None
        
        # Check rate limit
        if self.is_rate_limited(path, ip):
            logger.warning(
                f'Rate limit exceeded for {ip} on {path}'
            )
            return JsonResponse(
                {'error': 'Too many requests. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        return None


class InputSanitizationMiddleware(MiddlewareMixin):
    """
    Input sanitization and validation middleware.
    Prevents common attacks like XSS and injection.
    """
    
    # Dangerous patterns
    DANGEROUS_PATTERNS = [
        '<script',
        'javascript:',
        'onerror=',
        'onclick=',
        'onload=',
        'eval(',
        'alert(',
        'document.cookie',
        'window.location',
    ]
    
    def contains_dangerous_content(self, data):
        """Check if data contains dangerous patterns."""
        if isinstance(data, str):
            data_lower = data.lower()
            for pattern in self.DANGEROUS_PATTERNS:
                if pattern in data_lower:
                    return True
        elif isinstance(data, dict):
            for key, value in data.items():
                if self.contains_dangerous_content(key) or \
                   self.contains_dangerous_content(value):
                    return True
        elif isinstance(data, (list, tuple)):
            for item in data:
                if self.contains_dangerous_content(item):
                    return True
        
        return False
    
    def process_request(self, request):
        """Check input for dangerous content."""
        # Check GET parameters
        if request.GET:
            if self.contains_dangerous_content(dict(request.GET)):
                logger.warning(
                    f'Dangerous content detected in GET from {self.get_client_ip(request)}'
                )
                return JsonResponse(
                    {'error': 'Invalid input detected.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check POST body
        if request.method == 'POST' and request.content_type == 'application/json':
            try:
                data = json.loads(request.body)
                if self.contains_dangerous_content(data):
                    logger.warning(
                        f'Dangerous content detected in POST from {self.get_client_ip(request)}'
                    )
                    return JsonResponse(
                        {'error': 'Invalid input detected.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except json.JSONDecodeError:
                pass
        
        return None
    
    def get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityAuditMiddleware(MiddlewareMixin):
    """
    Security audit middleware.
    Logs all security-relevant events.
    """
    
    def process_request(self, request):
        """Log incoming request."""
        # Log authentication attempts
        if '/auth/' in request.path:
            logger.info(
                f'Auth request: {request.method} {request.path} '
                f'from {self.get_client_ip(request)}'
            )
        
        return None
    
    def process_response(self, request, response):
        """Log response status for security events."""
        # Log failed authentication attempts (401/403)
        if response.status_code in [401, 403]:
            logger.warning(
                f'Access denied: {request.method} {request.path} '
                f'- Status {response.status_code} from {self.get_client_ip(request)}'
            )
        
        # Log errors (500)
        if response.status_code >= 500:
            logger.error(
                f'Server error: {request.method} {request.path} '
                f'- Status {response.status_code}'
            )
        
        return response
    
    def get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class FilePreviewMiddleware(MiddlewareMixin):
    """
    Allow X-Frame-Options for file preview/serving endpoints.
    Allows iframes to display files from the API for preview functionality.
    
    IMPORTANT: This middleware MUST be positioned LAST in the MIDDLEWARE list.
    Since responses are processed in reverse order of the middleware list,
    placing this last ensures it runs FIRST on responses, before any other
    middleware can set headers.
    """
    
    FRAMEABLE_PATHS = [
        '/api/v1/internal/articles/',  # Must end with /files/ for specific matching
        '/media/',                       # Media files
        '/static/',                      # Static files
    ]
    
    def process_response(self, request, response):
        """
        Override X-Frame-Options for file preview/serving endpoints.
        This runs FIRST on responses (because middleware runs in reverse),
        ensuring it takes precedence over Django's XFrameOptionsMiddleware.
        """
        path = request.path
        
        # Check if this is a file serving/preview path
        should_allow = False
        
        # Allow /media/ files (static files serving)
        if path.startswith('/media/'):
            should_allow = True
        # Allow /static/ files (static files serving)
        elif path.startswith('/static/'):
            should_allow = True
        # Allow ONLY file-specific API endpoints, not general article endpoints
        elif path.startswith('/api/v1/internal/articles/') and '/files/' in path:
            should_allow = True
        
        if should_allow:
            response['X-Frame-Options'] = 'ALLOWALL'
            logger.debug(f'[FilePreview] Setting ALLOWALL for: {request.method} {path}')
        else:
            # Log what we're NOT allowing (for debugging)
            if any(x in path for x in ['media', 'static', 'articles', 'files']):
                logger.debug(f'[FilePreview] NOT allowing frames for: {request.method} {path} (keeping Django default)')
        
        return response