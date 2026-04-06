#!/usr/bin/env python
import os
import django
import sys
import json
from urllib.parse import urlencode

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from apps.api.v1.internal.views import ArticleViewSet
from rest_framework.request import Request as DRFRequest
from rest_framework.test import APIRequestFactory

# Create a test request
factory = APIRequestFactory()

# Test parameters as they would come from the frontend
slug = 'ringkasan-evaluasi-kinerja-triwulan-i-setjen-dpd-ri-tahun-2026'
exclude_id = 27
version_type = 'draft'

# Create the GET request with query parameters
url = f'/api/v1/internal/articles/check-slug/?slug={slug}&exclude_id={exclude_id}&version_type={version_type}'
django_request = factory.get(url)
request = DRFRequest(django_request)

# Create the viewset and call check_slug
viewset = ArticleViewSet()
viewset.request = request
viewset.format_kwarg = None

# Call the check_slug action
response = viewset.check_slug(request)

print("check_slug endpoint response:")
print(f"Status code: {response.status_code}")
print(f"Data: {json.dumps(response.data, indent=2)}")
print(f"\nAvailable: {response.data.get('available')}")
print(f"Message: {response.data.get('message')}")

# Also test with exclude_id as string (how it comes from query params)print("\n\n--- Test with exclude_id as STRING (27 instead of int) ---")
url2 = f'/api/v1/internal/articles/check-slug/?slug={slug}&exclude_id=27&version_type={version_type}'
request2 = factory.get(url2)
viewset2 = ArticleViewSet()
viewset2.request = request2
viewset2.format_kwarg = None
response2 = viewset2.check_slug(request2)

print("check_slug endpoint response (exclude_id='27' as string):")
print(f"Status code: {response2.status_code}")
print(f"Data: {json.dumps(response2.data, indent=2)}")
print(f"\nAvailable: {response2.data.get('available')}")
print(f"Message: {response2.data.get('message')}")
