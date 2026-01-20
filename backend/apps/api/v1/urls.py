"""
API v1 URLs.
"""
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET"])
def v1_api_root(request):
    """API v1 root endpoint"""
    return JsonResponse({
        'message': 'KMSetjen DPD RI API v1',
        'version': '1.0.0',
        'endpoints': {
            'public': '/api/v1/public/',
            'internal': '/api/v1/internal/',
        }
    })

urlpatterns = [
    path('', v1_api_root, name='v1-api-root'),
    path('public/', include('apps.api.v1.public.urls')),
    path('internal/', include('apps.api.v1.internal.urls')),
]
