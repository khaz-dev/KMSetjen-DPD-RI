#!/usr/bin/env python
"""Fix database to match actual files on disk"""
import os
import sys
import django
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.content.models import Article

print("Fixing database image paths to match files on disk...")

# Get actual files
media_dir = Path("media/articles/articles")
article_files = {f.stem.split('_', 1)[1]: f.name for f in media_dir.glob("article_*.png")}  # Map to filename

articles = Article.objects.filter(is_published=True).order_by('id')
fixed = 0

for article in articles:
    # Find matching file for this article ID
    matching_file = next((f for f in media_dir.glob(f"article_{article.id}_*.png")), None)
    
    if matching_file:
        correct_path = f"articles/{matching_file.name}"
        if article.image.name != correct_path:
            article.image.name = correct_path
            article.save(update_fields=['image'])
            fixed += 1
            print(f"✓ Article {article.id}: Set to {matching_file.name}")
        else:
            print(f"✓ Article {article.id}: Already correct")
    else:
        print(f"✗ Article {article.id}: No file found")

print(f"\nFixed {fixed} articles")
