#!/usr/bin/env python
"""
Test the statistics API endpoint
"""
import os
import sys
import django

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(__file__))

# Setup Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

# Create API client
client = APIClient()

# Get admin user
try:
    admin_user = User.objects.get(username='admin')
    print(f"✓ Found admin user: {admin_user.username} (ID: {admin_user.id})")
    print(f"  - is_superuser: {admin_user.is_superuser}")
    print(f"  - is_staff: {admin_user.is_staff}")
    print(f"  - roles: {[r.code for r in admin_user.roles.all()]}")
except User.DoesNotExist:
    print("✗ Admin user not found")
    sys.exit(1)

# Authenticate and get token
from rest_framework_simplejwt.tokens import RefreshToken

refresh = RefreshToken.for_user(admin_user)
access_token = str(refresh.access_token)
print(f"\n✓ Generated access token: {access_token[:50]}...")

# Test the statistics endpoint
print("\n" + "="*60)
print("Testing GET /api/v1/admin/statistics/")
print("="*60)

client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

try:
    response = client.get('/api/v1/admin/statistics/')
    print(f"Status Code: {response.status_code}")
    print(f"Content-Type: {response.get('Content-Type')}")
    
    if response.status_code == 200:
        print("\n✓ SUCCESS! Response data:")
        import json
        data = response.json() if hasattr(response, 'json') else response.data
        print(json.dumps(data, indent=2, default=str))
    else:
        print(f"\n✗ ERROR! Response:")
        print(f"Body: {response.content}")
        
except Exception as e:
    print(f"✗ Exception: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
