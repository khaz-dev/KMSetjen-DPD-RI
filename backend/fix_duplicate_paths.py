#!/usr/bin/env python
"""
Fix the duplicate 'articles/' path in newly generated images
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.content.models import Article

print("Fixing duplicate 'articles/' in image paths...")

articles = Article.objects.filter(is_published=True).order_by('id')
fixed = 0

for article in articles:
    if article.image:
        # Check if it has triple articles/
        if 'articles/articles/articles/' in article.image.name:
            # Fix by removing the extra 'articles/'
            correct_path = article.image.name.replace('articles/articles/articles/', 'articles/articles/')
            article.image.name = correct_path
            article.save(update_fields=['image'])
            fixed += 1
            print(f"✓ Article {article.id}: Fixed path to {correct_path}")

print(f"\nFixed {fixed} articles")
