"""
Views for serving static files like favicon
"""
import os
from django.http import FileResponse, HttpResponseNotFound
from django.conf import settings
import mimetypes


def _favicon_candidates(filename):
    """Return ordered favicon search paths for local and container deployments."""
    return [
        os.path.join(settings.BASE_DIR, '..', 'frontend', 'public', filename),
        os.path.join(settings.BASE_DIR, 'config', 'assets', filename),
        os.path.join(settings.BASE_DIR, 'staticfiles', filename),
    ]


def _serve_favicon(filename, default_mime_type):
    for path in _favicon_candidates(filename):
        if os.path.exists(path):
            mime_type, _ = mimetypes.guess_type(path)
            response = FileResponse(open(path, 'rb'), content_type=mime_type or default_mime_type)
            response['Cache-Control'] = 'public, max-age=31536000, immutable'
            return response
    return HttpResponseNotFound('Favicon not found')


def favicon_view(request):
    """
    Serve favicon.ico from available asset directories.
    """
    return _serve_favicon('favicon.ico', 'image/x-icon')


def favicon_svg_view(request):
    """
    Serve favicon.svg from available asset directories.
    """
    return _serve_favicon('favicon.svg', 'image/svg+xml')
