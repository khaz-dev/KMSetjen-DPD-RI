#!/usr/bin/env python
"""
This script simulates the exact frontend flow when loading article 27:
1. Load article 27
2. Get the slug
3. Call check_slug endpoint
4. Check what response is returned
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.content.models import Article
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request as DRFRequest
from apps.api.v1.internal.views import ArticleViewSet

print("="*80)
print("SIMULATING FRONTEND FLOW FOR ARTICLE 27")
print("="*80)

# Step 1: Load article 27
print("\n[STEP 1] Loading article 27...")
try:
    article = Article.objects.get(id=27)
    print(f"✓ Article loaded:")
    print(f"  ID: {article.id}")
    print(f"  Title: {article.title_id[:50]}...")
    print(f"  Slug: {article.slug}")
    print(f"  Version Type: {article.version_type}")
    print(f"  Status: {article.status}")
except Article.DoesNotExist:
    print("✗ Article 27 not found!")
    exit(1)

# Step 2: Prepare slug parameters
print(f"\n[STEP 2] Preparing parameters for check_slug call...")
slug = article.slug
article_id = article.id
version_type = 'draft'
print(f"  slug: {slug}")
print(f"  exclude_id (article id): {article_id}")
print(f"  version_type: {version_type}")

# Step 3: Call check_slug endpoint
print(f"\n[STEP 3] Calling check_slug endpoint...")
factory = APIRequestFactory()
# Build URL exactly as the frontend would
url = f'/api/v1/internal/articles/check-slug/?slug={slug}&exclude_id={article_id}&version_type={version_type}'
print(f"  URL: {url}")

django_request = factory.get(url)
drf_request = DRFRequest(django_request)

viewset = ArticleViewSet()
viewset.request = drf_request
viewset.format_kwarg = None

response = viewset.check_slug(drf_request)

print(f"\n[RESULT] API Response:")
print(f"  Status Code: {response.status_code}")
print(f"  Response Data: {json.dumps(response.data, indent=2)}")

# Step 4: Analyze the response
print(f"\n[ANALYSIS]:")
if response.data.get('available'):
    print(f"  ✓ Slug is AVAILABLE for article 27")
    print(f"    Frontend should set: slugValidation.isAvailable = true")
    print(f"    Frontend should NOT show error message")
else:
    print(f"  ✗ Slug is NOT AVAILABLE for article 27")
    print(f"    Frontend should set: slugValidation.isAvailable = false")
    print(f"    Frontend WILL show error message: 'Slug sudah digunakan'")
    print(f"    This is the problem the user is experiencing!")
    
print(f"\n" + "="*80)
