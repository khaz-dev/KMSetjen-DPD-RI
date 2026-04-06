#!/usr/bin/env python
"""Debug media serving configuration."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from urllib.request import urlopen
import subprocess

print("=" * 80)
print("MEDIA SERVING DEBUG")
print("=" * 80)

print("\n[1] DJANGO SETTINGS")
print("-" * 80)
print(f"MEDIA_URL: {settings.MEDIA_URL}")
print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
print(f"DEBUG: {settings.DEBUG}")
print(f"ENVIRONMENT: {os.environ.get('ENVIRONMENT', 'not set')}")

print("\n[2] MEDIA DIRECTORY STATUS")
print("-" * 80)
media_root = settings.MEDIA_ROOT
print(f"MEDIA_ROOT exists: {os.path.exists(media_root)}")

if os.path.exists(media_root):
    articles_dir = os.path.join(media_root, 'articles')
    categories_dir = os.path.join(media_root, 'categories')
    
    article_files = os.listdir(articles_dir) if os.path.exists(articles_dir) else []
    category_files = os.listdir(categories_dir) if os.path.exists(categories_dir) else []
    
    print(f"Articles directory exists: {os.path.exists(articles_dir)}")
    print(f"  Files: {len(article_files)}")
    if article_files:
        print(f"  Sample: {article_files[0]}")
    
    print(f"Categories directory exists: {os.path.exists(categories_dir)}")
    print(f"  Files: {len(category_files)}")
    if category_files:
        print(f"  Sample: {category_files[0]}")

print("\n[3] URLS CONFIGURATION")
print("-" * 80)
with open('config/urls.py', 'r') as f:
    urls_content = f.read()
    if 'static(' in urls_content:
        print("✓ static() helper imported")
        if 'MEDIA_URL' in urls_content:
            print("✓ Media serving configured")
        else:
            print("✗ Media serving NOT configured")
    else:
        print("✗ static() helper NOT imported")

print("\n[4] TEST MEDIA SERVING")
print("-" * 80)
print("Testing if Django serves media files...")

# Check if any process is listening on 8002
result = subprocess.run(
    'netstat -ano | findstr :8002',
    shell=True,
    capture_output=True,
    text=True
)

if result.stdout:
    print("✓ Django server running on port 8002")
    print("\nTrying to fetch: http://localhost:8002/media/articles/article_1_dpd_ri_knowledge_man.png")
    try:
        response = urlopen('http://localhost:8002/media/articles/article_1_dpd_ri_knowledge_man.png', timeout=3)
        print(f"✓ SUCCESS: Status {response.status}")
        content = response.read(100)
        print(f"  Content type: {response.headers.get('Content-Type')}")
        print(f"  Content preview (first 100 bytes): {content[:50]}")
    except Exception as e:
        print(f"✗ FAILED: {e}")
else:
    print("✗ Django server NOT running on port 8002")

print("\n" + "=" * 80)
