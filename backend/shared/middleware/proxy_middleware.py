"""
Middleware to handle reverse proxy script name and URL prefix.

When running Django behind a reverse proxy (like Nginx) with a URL prefix,
the proxy needs to communicate the script name via X-Script-Name header.
This middleware converts it to Django's SCRIPT_NAME.
"""
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class ScriptNameMiddleware(MiddlewareMixin):
    """
    Middleware to set SCRIPT_NAME from X-Script-Name header.
    
    This allows Django to correctly generate URLs when running behind
    a reverse proxy with a URL prefix like /kms.
    
    Without this, Django will generate incorrect redirect URLs like:
      /admin/login/?next=/admin/
    Instead of:
      /kms/admin/login/?next=/kms/admin/
    """
    
    def process_request(self, request):
        """
        Process incoming request to set SCRIPT_NAME from proxy header.
        """
        # Get the X-Script-Name header from the proxy
        script_name = request.META.get('HTTP_X_SCRIPT_NAME', '')
        
        if script_name:
            # Set SCRIPT_NAME so Django knows the URL prefix
            request.META['SCRIPT_NAME'] = script_name
            
            # Also ensure PATH_INFO doesn't include the script name
            # This is already handled by Nginx (it strips /kms from the path before proxying)
            # but we double-check here for safety
            logger.debug(
                f"ScriptNameMiddleware: Set SCRIPT_NAME='{script_name}' "
                f"for path {request.path}"
            )
        
        return None
    
    def process_response(self, request, response):
        """
        Process response - adjust Location header if needed for redirects.
        """
        # Check if this is a redirect response
        if response.status_code in [301, 302, 303, 307, 308]:
            location = response.get('Location', '')
            script_name = request.META.get('SCRIPT_NAME', '')
            
            # If Location header exists and SCRIPT_NAME is set
            if location and script_name and not location.startswith('http'):
                # Check if the location already includes the script name
                if not location.startswith(script_name):
                    # For relative URLs, add the script name prefix
                    if location.startswith('/'):
                        response['Location'] = script_name + location
                        logger.debug(
                            f"ScriptNameMiddleware: Updated Location header from '{location}' "
                            f"to '{script_name + location}'"
                        )
        
        return response
