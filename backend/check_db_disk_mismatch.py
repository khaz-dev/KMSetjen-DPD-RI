#!/usr/bin/env python
"""
Check mismatch between database image references and actual files
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
print("DATABASE vs DISK MISMATCH CHECK")
print("=" * 80)

print("\n=== ARTICLES ===")
articles = Article.objects.filter(is_published=True).order_by('id')

# Get actual files on disk
article_media_dir = Path("media/articles/articles")
actual_files = sorted([f.name for f in article_media_dir.glob("*.png")])

print(f"Database records: {articles.count()}")
print(f"Files on disk: {len(actual_files)}")
print()

mismatch_count = 0
for article in articles:
    db_image_name = article.image.name if article.image else "NO IMAGE"
    actual_file = None
    
    # Extract just the filename from the full path
    if article.image:
        db_filename = article.image.name.split('/')[-1]  # Get just filename part
        
        # Check if file exists
        file_path = Path(f"media/articles/articles/{db_filename}")
        if file_path.exists():
            status = "✓"
        else:
            status = "✗"
            mismatch_count += 1
            actual_file = next((f for f in actual_files if f.startswith(f"article_{article.id}_")), None)
            
        print(f"{status} Article {article.id}: {article.title_en[:30]}")
        print(f"   DB expects: {db_filename}")
        if not file_path.exists() and actual_file:
            print(f"   Disk has: {actual_file}")
        print()

print("\n" + "=" * 80)
print("=== CATEGORIES ===")
categories = Category.objects.all().order_by('id')

# Get actual files on disk
category_media_dir = Path("media/categories/categories")
actual_category_files = sorted([f.name for f in category_media_dir.glob("*.png")])

print(f"Database records: {categories.count()}")
print(f"Files on disk: {len(actual_category_files)}")
print()

for cat in categories:
    db_image_name = cat.image.name if cat.image else "NO IMAGE"
    
    if cat.image:
        db_filename = cat.image.name.split('/')[-1]
        file_path = Path(f"media/categories/categories/{db_filename}")
        
        if file_path.exists():
            status = "✓"
        else:
            status = "✗"
            mismatch_count += 1
            
        print(f"{status} Category {cat.id}: {cat.name_en}")
        print(f"   DB expects: {db_filename}")
        if not file_path.exists():
            matching_file = next((f for f in actual_category_files if cat.name_id.lower().replace(" ", "_") in f.lower()), None)
            if matching_file:
                print(f"   Disk has: {matching_file}")
        print()

print("=" * 80)
print(f"MISMATCH COUNT: {mismatch_count}")
if mismatch_count > 0:
    print("⚠️  FOUND ISSUE: Database image references don't match actual files!")
else:
    print("✓ All database references match actual files")
