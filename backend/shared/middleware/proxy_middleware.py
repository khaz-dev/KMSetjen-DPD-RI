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
        
        if not location:
            return
        
        # Parse the location URL (works for both relative and absolute URLs)
        parsed = urlparse(location)
        path = parsed.path
        query_string = parsed.query
        fragment = parsed.fragment
        
        logger.debug(
            f"ScriptNameMiddleware: Processing redirect - "
            f"location='{location}', scheme='{parsed.scheme}', netloc='{parsed.netloc}', "
            f"path='{path}', script_name='{script_name}'"
        )
        
        # Check if path needs script_name prefix
        # This applies to both relative URLs (scheme='') and absolute URLs on same domain
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
            
            # Rebuild the location URL (preserves scheme, netloc for absolute URLs)
            new_location = urlunparse((parsed.scheme, parsed.netloc, new_path, parsed.params, new_query_string, fragment))
            response['Location'] = new_location
            
            logger.info(
                f"ScriptNameMiddleware: Fixed redirect Location header - "
                f"from '{location}' to '{new_location}' - "
                f"(status={response.status_code})"
            )
    
    def _rewrite_static_urls(self, response, script_name):
        """Rewrite URLs in HTML to include script name for subpath support"""
        try:
            # Get response content
            content = response.content.decode(response.charset or 'utf-8')
            original_content = content
            
            # Replace all relative admin URLs that don't already have the script_name prefix
            # Pattern: Match /admin/ or /auth/ etc but NOT /api/ or /kms/
            # This handles form actions, links, and other admin-related paths
            
            # First, escape the script_name for use in regex
            escaped_script = re.escape(script_name)
            
            # Replace form actions, hrefs, etc. that point to /admin/ and similar paths
            # We need to handle paths with query strings like /admin/login/?next=/admin/
            patterns = [
                # action="/admin/..." or action='/admin/...' - matches everything up to closing quote
                (r'(action=")(/admin[^"]*?)(")', rf'\1{script_name}\2\3'),
                (r"(action=')(/admin[^']*?)(')", rf"\1{script_name}\2\3"),
                
                # href="/admin/..." or href='/admin/...'
                (r'(href=")(/admin[^"]*?)(")', rf'\1{script_name}\2\3'),
                (r"(href=')(/admin[^']*?)(')", rf"\1{script_name}\2\3"),
                
                # Same for /auth paths
                (r'(action=")(/auth[^"]*?)(")', rf'\1{script_name}\2\3'),
                (r"(action=')(/auth[^']*?)(')", rf"\1{script_name}\2\3"),
                
                # href="/static/..." or href='/static/...'
                (r'(href=")(/static[^"]*?)(")', rf'\1{script_name}\2\3'),
                (r"(href=')(/static[^']*?)(')", rf"\1{script_name}\2\3"),
                
                # src="/static/..."
                (r'(src=")(/static[^"]*?)(")', rf'\1{script_name}\2\3'),
                (r"(src=')(/static[^']*?)(')", rf"\1{script_name}\2\3"),
                
                # href="/media/..." and src="/media/..."
                (r'((?:href|src)=")(/media[^"]*?)(")', rf'\1{script_name}\2\3'),
                (r"((?:href|src)=')(/media[^']*?)(')", rf"\1{script_name}\2\3"),
                
                # CSS url() with static files
                (r'(url\()(["\']?)(/static[^"\']*?)\2(\))', rf'\1\2{script_name}\3\2\4'),
                
                # CSS url() with media files
                (r'(url\()(["\']?)(/media[^"\']*?)\2(\))', rf'\1\2{script_name}\3\2\4'),
                
                # ============================================================
                # NEW: Generic patterns to catch /admin/ and /jsi18n/ in ANY context
                # These catch inline JavaScript, data attributes, assignments, etc.
                # that the specific HTML attribute patterns might miss
                # ============================================================
                
                # Match any /admin/... surrounded by quotes (catches inline JS, data attrs, etc)
                # Pattern: "/admin/..." or '/admin/...'
                # This handles: window.location="/admin/...", var path="/admin/", etc.
                (r'(["\'])(/admin[^"\']*?)\1', rf'\1{script_name}\2\1'),
                
                # Match any /jsi18n/... surrounded by quotes (Django i18n endpoint)
                # This handles: <script src="/admin/jsi18n/">, var i18n="/jsi18n/", etc.
                (r'(["\'])(/jsi18n/[^"\']*?)\1', rf'\1{script_name}\2\1'),
                
                # Match /auth/... (for Django rest framework auth endpoints)
                (r'(["\'])(/auth[^"\']*?)\1', rf'\1{script_name}\2\1'),
                
                # Match patterns like: = "/admin/...", : "/admin/..."
                # This handles JavaScript assignments and simple key: value patterns
                (r'([=:]\s*)(["\'])(/admin[^"\']*?)\2', rf'\1\2{script_name}\3\2'),
                (r'([=:]\s*)(["\'])(/jsi18n/[^"\']*?)\2', rf'\1\2{script_name}\3\2'),
            ]
            
            # Apply all patterns
            for pattern, replacement in patterns:
                # Skip if path already contains the script_name to avoid double-rewriting
                before_count = content.count(script_name)
                content = re.sub(pattern, replacement, content)
                after_count = content.count(script_name)
                
                if after_count > before_count:
                    logger.debug(
                        f"ScriptNameMiddleware: Pattern matched - added {after_count - before_count} "
                        f"script_name prefixes"
                    )
            
            # If content was modified, update response
            if content != original_content:
                response.content = content.encode(response.charset or 'utf-8')
                logger.info(
                    f"ScriptNameMiddleware: Rewrote relative URLs in HTML response (form actions, links, etc.)"
                )
        except Exception as e:
            # If something goes wrong with rewriting, just return the original response
            logger.error(f"ScriptNameMiddleware: Error rewriting URLs: {e}")
            pass
