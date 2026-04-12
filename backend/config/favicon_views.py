"""
Views for serving static files like favicon
"""
import os
from django.http import FileResponse, HttpResponseNotFound
from django.conf import settings
from django.views.decorators.http import condition
from django.utils.http import http_date
import mimetypes


def favicon_view(request):
    """
    Serve favicon.ico from frontend public directory
    Supports both favicon.ico and favicon.svg
    """
    # Try to serve favicon from frontend public directory
    frontend_public_path = os.path.join(settings.BASE_DIR, '..', 'frontend', 'public')
    favicon_path = os.path.join(frontend_public_path, 'favicon.ico')
    
    if os.path.exists(favicon_path):
        # Determine MIME type
        mime_type, _ = mimetypes.guess_type(favicon_path)
        response = FileResponse(open(favicon_path, 'rb'), content_type=mime_type or 'image/x-icon')
        response['Cache-Control'] = 'public, max-age=31536000, immutable'  # Cache for 1 year
        return response
    
    # Fallback: return 404 with proper message
    return HttpResponseNotFound('Favicon not found')


def favicon_svg_view(request):
    """
    Serve favicon.svg from frontend public directory
    """
    # Try to serve favicon from frontend public directory
    frontend_public_path = os.path.join(settings.BASE_DIR, '..', 'frontend', 'public')
    favicon_path = os.path.join(frontend_public_path, 'favicon.svg')
    
    if os.path.exists(favicon_path):
        mime_type, _ = mimetypes.guess_type(favicon_path)
        response = FileResponse(open(favicon_path, 'rb'), content_type=mime_type or 'image/svg+xml')
        response['Cache-Control'] = 'public, max-age=31536000, immutable'  # Cache for 1 year
        return response
    
    # Fallback: return 404
    return HttpResponseNotFound('Favicon not found')
