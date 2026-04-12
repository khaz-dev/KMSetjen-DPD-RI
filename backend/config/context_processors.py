"""
Context processors for Django templates
"""
from django.conf import settings


def app_context(request):
    """
    Add application-wide context variables to templates
    - APP_SUBPATH: Application subpath for URL construction
    """
    return {
        'APP_SUBPATH': settings.APP_SUBPATH or '',
    }
