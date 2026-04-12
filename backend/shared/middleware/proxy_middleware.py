"""
Middleware to handle reverse proxy script name and URL prefix.

When running Django behind a reverse proxy (like Nginx) with a URL prefix,
the proxy needs to communicate the script name via X-Script-Name header.
This middleware converts it to Django's SCRIPT_NAME.
"""
import logging
import re
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class ScriptNameMiddleware(MiddlewareMixin):
    """
    Middleware to set SCRIPT_NAME from X-Script-Name header.
    
    This allows Django to correctly generate URLs when running behind
    a reverse proxy with a URL prefix like /kms.
    
    It also:
    1. Fixes redirect URLs to include the script name
    2. Rewrites static and media file URLs in HTML responses to include the script name
    
    Without this, Django will generate incorrect URLs like:
      /admin/login/?next=/admin/
      /static/admin/css/base.css
    Instead of:
      /kms/admin/login/?next=/kms/admin/
      /kms/static/admin/css/base.css
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
            
            logger.debug(
                f"ScriptNameMiddleware: Set SCRIPT_NAME='{script_name}' "
                f"for path {request.path}"
            )
        
        return None
    
    def process_response(self, request, response):
        """
        Process response to:
        1. Fix redirect URLs and 'next' parameters to include SCRIPT_NAME
        2. Rewrite static/media URLs in HTML to include SCRIPT_NAME
        """
        script_name = request.META.get('SCRIPT_NAME', '')
        
        # Fix redirect responses
        if response.status_code in [301, 302, 303, 307, 308]:
            self._fix_redirect_location(response, script_name)
        
        # Rewrite static and media URLs in HTML responses
        if script_name and 'text/html' in response.get('Content-Type', ''):
            self._rewrite_static_urls(response, script_name)
        
        return response
    
    def _fix_redirect_location(self, response, script_name):
        """Fix Location header in redirect responses"""
        if not script_name:
            return
        
        location = response.get('Location', '')
        
        # If Location header exists and is relative (not absolute with http/https)
        if location and not location.startswith('http'):
            # Parse the location URL
            parsed = urlparse(location)
            path = parsed.path
            query_string = parsed.query
            fragment = parsed.fragment
            
            logger.debug(
                f"ScriptNameMiddleware: Processing redirect - "
                f"path='{path}', script_name='{script_name}', "
                f"starts_with_script_name={path.startswith(script_name)}"
            )
            
            # Check if the path already includes the script name
            if path and not path.startswith(script_name):
                # Add script name to the path
                new_path = script_name + path
                
                # Parse query parameters
                new_query_parts = []
                if query_string:
                    params = parse_qs(query_string, keep_blank_values=True)
                    
                    # Fix the 'next' parameter if it exists and doesn't include script_name
                    if 'next' in params:
                        next_url = params['next'][0]
                        if next_url.startswith('/') and not next_url.startswith(script_name):
                            params['next'] = [script_name + next_url]
                            logger.debug(
                                f"ScriptNameMiddleware: Updated 'next' parameter from '{next_url}' "
                                f"to '{script_name + next_url}'"
                            )
                    
                    # Rebuild query string
                    for key, values in params.items():
                        for value in values:
                            if value:
                                new_query_parts.append(f"{key}={value}")
                            else:
                                new_query_parts.append(key)
                
                new_query_string = '&'.join(new_query_parts)
                
                # Rebuild the location URL
                new_location = urlunparse((parsed.scheme, parsed.netloc, new_path, parsed.params, new_query_string, fragment))
                response['Location'] = new_location
                
                logger.info(
                    f"ScriptNameMiddleware: Fixed redirect Location header - "
                    f"from '{location}' to '{new_location}' - "
                    f"(status={response.status_code})"
                )
    
    def _rewrite_static_urls(self, response, script_name):
        """Rewrite /static/ and /media/ URLs in HTML to include script name"""
        try:
            # Get response content
            content = response.content.decode(response.charset or 'utf-8')
            original_content = content
            
            # Patterns to match static and media URLs
            # Match href="/static/..." and src="/static/..." and similar patterns
            # But avoid rewriting already rewritten URLs
            patterns = [
                # href="/static/...
                (r'href=(["\'])(/static/)', rf'href=\1{script_name}\2'),
                # src="/static/...
                (r'src=(["\'])(/static/)', rf'src=\1{script_name}\2'),
                # href="/media/...
                (r'href=(["\'])(/media/)', rf'href=\1{script_name}\2'),
                # src="/media/...
                (r'src=(["\'])(/media/)', rf'src=\1{script_name}\2'),
                # url(/static/...) in CSS
                (r'url\((["\']?)(/static/)', rf'url(\1{script_name}\2'),
                # url(/media/...) in CSS
                (r'url\((["\']?)(/media/)', rf'url(\1{script_name}\2'),
            ]
            
            # Apply all regex patterns to rewrite URLs
            for pattern, replacement in patterns:
                content = re.sub(pattern, replacement, content)
            
            # If content was modified, update response
            if content != original_content:
                response.content = content.encode(response.charset or 'utf-8')
                logger.debug(
                    f"ScriptNameMiddleware: Rewrote static/media URLs in HTML response"
                )
        except Exception as e:
            # If something goes wrong with rewriting, just return the original response
            logger.error(f"ScriptNameMiddleware: Error rewriting URLs: {e}")
            pass
