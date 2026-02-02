#!/usr/bin/env python
"""
Fix database to point to actual generated article image files
"""
import os
import sys
import django
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.content.models import Article

print("Fixing database paths to match actual generated files...")

# Get all article files - prefer the newly generated ones (with double underscores)
media_dir = Path("media/articles/articles")
article_files = sorted(media_dir.glob("article_*.png"))

print(f"Found {len(article_files)} total article files")
print()

# For each article, find the right file
articles = Article.objects.filter(is_published=True).order_by('id')
fixed = 0
conflicts = []

for article in articles:
    # Find all files for this article
    matching_files = sorted([f for f in article_files if f.name.startswith(f"article_{article.id}_")])
    
    if not matching_files:
        print(f"✗ Article {article.id}: No files found")
        continue
    
    if len(matching_files) == 1:
        # Only one file, use it
        correct_file = matching_files[0]
    else:
        # Multiple files - prefer the one with double underscores (newer generated)
        double_underscore = [f for f in matching_files if '__' in f.name]
        if double_underscore:
            correct_file = double_underscore[0]
        else:
            correct_file = matching_files[-1]  # Use last one
    
    correct_path = f"articles/{correct_file.name}"
    if article.image.name != correct_path:
        article.image.name = correct_path
        article.save(update_fields=['image'])
        fixed += 1
        print(f"✓ Article {article.id}: Set to {correct_file.name}")
    else:
        print(f"✓ Article {article.id}: Already correct")

print(f"\nFixed {fixed} articles")
print("\nVerifying...")

# Check if all files exist now
articles_ok = 0
for article in articles:
    if article.image:
        file_path = Path(article.image.path) if hasattr(article.image, 'path') else None
        if file_path and file_path.exists():
            articles_ok += 1

print(f"Articles with accessible files: {articles_ok} / {articles.count()}")
if articles_ok == articles.count():
    print("✅ ALL FIXED!")
