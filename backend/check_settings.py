#!/usr/bin/env python
"""Check Django Settings"""
import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
import django
django.setup()

from django.conf import settings

print(f"DEBUG: {settings.DEBUG}")
print(f"SECURE_SSL_REDIRECT: {settings.SECURE_SSL_REDIRECT}")
print(f"ENVIRONMENT: {settings.ENVIRONMENT}")

# Also check if the .env file is being read
import environ
env = environ.Env()
env.read_env('.env')
print(f"\nEnviron Module reads:")
print(f"DEBUG from .env: {env('DEBUG', default='not found')}")
print(f"ENVIRONMENT from .env: {env('ENVIRONMENT', default='not found')}")
