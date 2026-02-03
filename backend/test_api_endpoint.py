#!/usr/bin/env python
"""
Test the statistics API endpoint via HTTP
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

# Get admin user
admin_user = User.objects.get(username='admin')
print(f"✓ Using admin user: {admin_user.username}")

# Generate token
refresh = RefreshToken.for_user(admin_user)
access_token = str(refresh.access_token)
print(f"✓ Generated token: {access_token[:50]}...")

# Create API client and authenticate
client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

# Test the endpoint
print("\n" + "="*70)
print("Testing GET /api/v1/admin/statistics/")
print("="*70)

response = client.get('/api/v1/admin/statistics/')
print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    print("✓ SUCCESS! Response received:")
    import json
    data = response.json() if hasattr(response, 'json') else response.data
    print(json.dumps(data, indent=2, default=str)[:1000])
    print("\n... (output truncated)")
else:
    print(f"✗ ERROR! Response:")
    print(response.content.decode('utf-8')[:500])
