#!/usr/bin/env python
"""Debug image path issues"""
import os
import sys
import django
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.content.models import Article

# Check first few articles
for i in range(1, 4):
    article = Article.objects.get(id=i)
    print(f"Article {i}:")
    print(f"  DB image.name: {article.image.name}")
    
    if article.image:
        print(f"  image.path: {article.image.path}")
        p = Path(article.image.path)
        print(f"  Path exists: {p.exists()}")
        if p.exists():
            print(f"  File size: {p.stat().st_size}")
