#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings

print('✓ CORS_ALLOWED_ORIGINS:')
for origin in settings.CORS_ALLOWED_ORIGINS:
    print(f'  - {origin}')

print('\n✓ CSRF_TRUSTED_ORIGINS:')
for origin in settings.CSRF_TRUSTED_ORIGINS:
    print(f'  - {origin}')

print('\n✓ corsheaders middleware installed:', 'corsheaders' in settings.INSTALLED_APPS)
print('✓ corsheaders middleware in MIDDLEWARE:', 'corsheaders.middleware.CorsMiddleware' in settings.MIDDLEWARE)
