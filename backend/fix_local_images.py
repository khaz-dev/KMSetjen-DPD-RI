#!/usr/bin/env python
"""
Fix database image references to match actual files on disk (LOCAL DEVELOPMENT FIX)
"""
import os
import sys
import django
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.content.models import Article, Category

print("=" * 80)
print("FIXING LOCAL DATABASE IMAGE REFERENCES")
print("=" * 80)

# Get actual files on disk
article_media_dir = Path("media/articles/articles")
category_media_dir = Path("media/categories/categories")

article_files = {f.name: f for f in article_media_dir.glob("*.png")}
category_files = {f.name: f for f in category_media_dir.glob("*.png")}

print(f"\nFound {len(article_files)} article images on disk")
print(f"Found {len(category_files)} category images on disk")

# Fix articles
print("\n" + "=" * 80)
print("FIXING ARTICLES")
print("=" * 80)

articles = Article.objects.filter(is_published=True).order_by('id')
fixed_articles = 0

for article in articles:
    # Find matching file for this article
    matching_file = None
    for filename in article_files.keys():
        if filename.startswith(f"article_{article.id}_"):
            matching_file = filename
            break
    
    if matching_file:
        # Update database to point to actual file
        correct_path = f"articles/articles/{matching_file}"
        if article.image.name != correct_path:
            article.image.name = correct_path
            article.save(update_fields=['image'])
            fixed_articles += 1
            print(f"✓ Article {article.id}: Updated to {matching_file}")
        else:
            print(f"✓ Article {article.id}: Already correct")
    else:
        print(f"✗ Article {article.id}: NO MATCHING FILE on disk")

print(f"\nFixed {fixed_articles} articles")

# Fix categories
print("\n" + "=" * 80)
print("FIXING CATEGORIES")
print("=" * 80)

category_mapping = {
    'Public Policy': 'kebijakan_publik.png',
    'Kebijakan Publik': 'kebijakan_publik.png',
    'Announcements': 'pengumuman.png',
    'Pengumuman': 'pengumuman.png',
    'Guides & Tutorials': 'panduan_and_tutorial',
    'Panduan & Tutorial': 'panduan_and_tutorial',
    'Reports & Evaluation': 'laporan_and_evaluasi',
    'Laporan & Evaluasi': 'laporan_and_evaluasi',
    'News & Media': 'berita_and_media',
    'Berita & Media': 'berita_and_media',
}

categories = Category.objects.all().order_by('id')
fixed_categories = 0

for cat in categories:
    # Find matching file for this category
    matching_file = None
    
    # Try to find by category name
    for filename in category_files.keys():
        # Check various name patterns
        if cat.name_en.lower().replace(" ", "_").replace("&", "and") in filename.lower() or \
           cat.name_id.lower().replace(" ", "_").replace("&", "and") in filename.lower():
            matching_file = filename
            break
    
    if matching_file:
        correct_path = f"categories/categories/{matching_file}"
        if cat.image.name != correct_path:
            cat.image.name = correct_path
            cat.save(update_fields=['image'])
            fixed_categories += 1
            print(f"✓ Category {cat.id} ({cat.name_en}): Updated to {matching_file}")
        else:
            print(f"✓ Category {cat.id} ({cat.name_en}): Already correct")
    else:
        print(f"✗ Category {cat.id} ({cat.name_en}): NO MATCHING FILE on disk")

print(f"\nFixed {fixed_categories} categories")

print("\n" + "=" * 80)
print("VERIFICATION")
print("=" * 80)

# Verify all are correct now
articles_ok = 0
for article in Article.objects.filter(is_published=True):
    if article.image and Path(article.image.path).exists():
        articles_ok += 1

categories_ok = 0
for cat in Category.objects.all():
    if cat.image and Path(cat.image.path).exists():
        categories_ok += 1

print(f"Articles with valid files: {articles_ok} / {Article.objects.filter(is_published=True).count()}")
print(f"Categories with valid files: {categories_ok} / {Category.objects.all().count()}")

if articles_ok > 0 or categories_ok > 0:
    print("\n✅ LOCAL DATABASE FIXED!")
else:
    print("\n⚠️  Still issues - check log above")
