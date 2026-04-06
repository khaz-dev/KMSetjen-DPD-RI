#!/usr/bin/env python
"""Check what image paths are stored in the database."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.content.models import Article, Category

print("=" * 80)
print("CHECKING ARTICLE IMAGE PATHS IN DATABASE")
print("=" * 80)

articles = Article.objects.filter(image__isnull=False)[:10]
for article in articles:
    print(f"Article {article.id}: {article.title_en[:40]:40} | Image: {article.image}")

print("\n" + "=" * 80)
print("CHECKING CATEGORY IMAGE PATHS IN DATABASE")
print("=" * 80)

categories = Category.objects.filter(image__isnull=False)[:10]
for category in categories:
    print(f"Category {category.id}: {category.name_en[:40]:40} | Image: {category.image}")

print("\n" + "=" * 80)
print("CHECKING SETTINGS")
print("=" * 80)

from django.conf import settings
print(f"MEDIA_URL: {settings.MEDIA_URL}")
print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
print(f"DEBUG: {settings.DEBUG}")

# Check if media directory exists and what's in it
print(f"\nMedia directory exists: {os.path.exists(settings.MEDIA_ROOT)}")
if os.path.exists(settings.MEDIA_ROOT):
    print(f"Contents of media directory:")
    for root, dirs, files in os.walk(settings.MEDIA_ROOT):
        level = root.replace(settings.MEDIA_ROOT, '').count(os.sep)
        indent = ' ' * 2 * level
        print(f'{indent}{os.path.basename(root)}/')
        subindent = ' ' * 2 * (level + 1)
        for file in files[:10]:  # Limit to first 10 files per dir
            print(f'{subindent}{file}')
        if len(files) > 10:
            print(f'{subindent}... and {len(files) - 10} more files')
