#!/usr/bin/env python
"""Check article image paths"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.content.models import Article

# Check articles 1-10
for i in range(1, 11):
    try:
        a = Article.objects.get(id=i)
        print(f"Article {i}: {a.image.name}")
    except:
        pass
