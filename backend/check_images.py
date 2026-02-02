#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.content.models import Article, Category

print('=== ARTICLES WITH IMAGE FIELD ===')
articles = Article.objects.all()[:10]
for article in articles:
    image_name = article.image.name if article.image else 'NONE'
    print(f'Article {article.id}: {article.title_en[:40]}')
    print(f'  image.name = {image_name}')
    print()

print('\n=== CATEGORIES WITH IMAGE FIELD ===')
categories = Category.objects.all()
for cat in categories:
    image_name = cat.image.name if cat.image else 'NONE'
    print(f'Category {cat.id}: {cat.name_en}')
    print(f'  image.name = {image_name}')
    print()
