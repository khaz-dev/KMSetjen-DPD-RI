"""
URL Configuration for KMSetjen DPD RI project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.http import require_http_methods
from config.favicon_views import favicon_view, favicon_svg_view

@require_http_methods(["GET"])
def api_root(request):
    """Redirect backend root to Django admin login page."""
    return redirect('/admin/login/?next=/admin/')

@require_http_methods(["GET"])
def health_check(request):
    """Health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'service': 'KMSetjen DPD RI API',
        'version': '1.0.0'
    })

@require_http_methods(["GET"])
def api_endpoint(request):
    """API root endpoint showing available API versions"""
    return JsonResponse({
        'message': 'KMSetjen DPD RI REST API',
        'version': '1.0.0',
        'available_versions': {
            'v1': '/api/v1/',
        },
        'authentication': '/api/auth/',
    })

urlpatterns = [
    # Favicon support for root domain (for admin pages)
    path('favicon.ico', favicon_view, name='favicon-ico'),
    path('favicon.svg', favicon_svg_view, name='favicon-svg'),
    
    # Root API
    path('', api_root, name='api-root'),
    path('health/', health_check, name='health-check'),
    
    # API endpoint
    path('api/', api_endpoint, name='api-endpoint'),
    
    # Django Admin
    path('admin/', admin.site.urls),
    
    # API v1
    path('api/v1/', include('apps.api.v1.urls')),
    
    # Authentication
    path('api/auth/', include('apps.auth.urls')),
]

# Serve media and static files
# CRITICAL: Remove DEBUG condition - media files must be served on production too
# Django will serve media files on production since Nginx proxies to Django
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# Only serve static files in DEBUG mode (WhiteNoiseMiddleware handles in production)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
