"""Debug middleware to log settings"""
import logging

logger = logging.getLogger(__name__)

class DebugSettingsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        from django.conf import settings
        logger.warning(f"MIDDLEWARE INIT: SECURE_SSL_REDIRECT={settings.SECURE_SSL_REDIRECT}, DEBUG={settings.DEBUG}")
        self.logged = False
    
    def __call__(self, request):
        if not self.logged:
            from django.conf import settings
            logger.warning(f"MIDDLEWARE CALL: SECURE_SSL_REDIRECT={settings.SECURE_SSL_REDIRECT}, DEBUG={settings.DEBUG}, REQUEST SCHEME={request.scheme}")
            self.logged = True
        
        response = self.get_response(request)
        return response
