#!/usr/bin/env python
"""Fix article image paths - add missing 'articles/' prefix"""
import os
import sys
import django
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.content.models import Article

articles = Article.objects.filter(is_published=True).order_by('id')

print("Fixing article image paths...")
fixed = 0

for article in articles:
    if article.image and article.image.name:
        current = article.image.name
        
        # If it starts with 'articles/' but doesn't have double 'articles/articles/', fix it
        if current.startswith('articles/') and not current.startswith('articles/articles/'):
            corrected = current.replace('articles/', 'articles/articles/', 1)
            article.image.name = corrected
            article.save(update_fields=['image'])
            fixed += 1
            print(f"✓ Article {article.id}: Fixed path")

print(f"\nFixed {fixed} articles")

# Now verify
print("\nVerifying...")
for i in range(1, 4):
    article = Article.objects.get(id=i)
    if article.image:
        p = Path(article.image.path)
        status = "✓" if p.exists() else "✗"
        print(f"{status} Article {i}: {article.image.name} -> exists: {p.exists()}")
