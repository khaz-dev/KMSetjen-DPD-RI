#!/usr/bin/env python
"""Debug script to trace settings loading"""
import os
import sys

# Set up paths like Django does
sys.path.insert(0, r'd:\Project\KMSetjen DPD RI\backend')
os.chdir(r'd:\Project\KMSetjen DPD RI\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Now import Django and settings
import django
django.setup()

from django.conf import settings
from pathlib import Path

print("=" * 70)
print("DEBUG: Settings Loaded by Server")
print("=" * 70)

# Check BASE_DIR calculation
print(f"\nBASE_DIR: {settings.BASE_DIR}")

# Check if .env is being read
env_file = os.path.join(settings.BASE_DIR, '.env')
print(f".env file path: {env_file}")
print(f".env exists: {os.path.exists(env_file)}")

# Check DEBUG value
print(f"\nDEBUG: {settings.DEBUG}")
print(f"DEBUG type: {type(settings.DEBUG)}")
print(f"DEBUG repr: {repr(settings.DEBUG)}")
print(f"bool(DEBUG): {bool(settings.DEBUG)}")
print(f"not DEBUG: {not settings.DEBUG}")

# Check SECURE_SSL_REDIRECT
print(f"\nSECURE_SSL_REDIRECT: {settings.SECURE_SSL_REDIRECT}")
print(f"SECURE_SSL_REDIRECT type: {type(settings.SECURE_SSL_REDIRECT)}")

# Check if the logic evaluates correctly
print(f"\nis not DEBUG True? {not settings.DEBUG}")
print(f"if not DEBUG block should execute? {not settings.DEBUG}")

# Check the exact .env content
print(f"\n.env content (DEBUG line only):")
try:
    with open(env_file, 'r') as f:
        for line in f:
            if 'DEBUG' in line and not line.startswith('#'):
                print(f"  {repr(line)}")
except Exception as e:
    print(f"  Error reading .env: {e}")

# Double check environ module
from environ import Env
env = Env()
env.read_env(env_file)
env_debug = env('DEBUG', default='not_found')
print(f"\nDirect environ read (DEBUG): {repr(env_debug)}")
print(f"env.bool(DEBUG): {env.bool('DEBUG', default=True)}")

print("\n" + "=" * 70)
