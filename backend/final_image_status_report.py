#!/usr/bin/env python
"""
Final verification - show what's in database and confirm all images are accessible
"""
import os
import sys
import django
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.content.models import Article, Category

print("=" * 100)
print("LOCAL DEVELOPMENT - FINAL IMAGE STATUS REPORT")
print("=" * 100)

print("\n" + "=" * 100)
print("ARTICLES")
print("=" * 100)

articles = Article.objects.filter(is_published=True).order_by('id')
print(f"\nTotal published articles: {articles.count()}\n")
print(f"{'ID':<4} {'Title':<40} {'Image File':<50} {'Status':<10}")
print("-" * 104)

articles_ok = 0
for article in articles:
    title = article.title_en[:37] if article.title_en else article.title_id[:37]
    if article.image:
        filename = article.image.name.split('/')[-1][:47]
        # Check if file exists
        file_path = Path(article.image.path) if hasattr(article.image, 'path') else None
        if file_path and file_path.exists():
            status = "✓ OK"
            articles_ok += 1
        else:
            status = "✗ MISSING"
        print(f"{article.id:<4} {title:<40} {filename:<50} {status:<10}")
    else:
        print(f"{article.id:<4} {title:<40} {'(no image)':<50} {'✗ EMPTY':<10}")

print(f"\nArticles with valid images: {articles_ok} / {articles.count()}")

print("\n" + "=" * 100)
print("CATEGORIES")
print("=" * 100)

categories = Category.objects.all().order_by('id')
print(f"\nTotal categories: {categories.count()}\n")
print(f"{'ID':<4} {'Name':<40} {'Image File':<50} {'Status':<10}")
print("-" * 104)

categories_ok = 0
for cat in categories:
    name = cat.name_en[:37]
    if cat.image:
        filename = cat.image.name.split('/')[-1][:47]
        # Check if file exists
        file_path = Path(cat.image.path) if hasattr(cat.image, 'path') else None
        if file_path and file_path.exists():
            status = "✓ OK"
            categories_ok += 1
        else:
            status = "✗ MISSING"
        print(f"{cat.id:<4} {name:<40} {filename:<50} {status:<10}")
    else:
        print(f"{cat.id:<4} {name:<40} {'(no image)':<50} {'✗ EMPTY':<10}")

print(f"\nCategories with valid images: {categories_ok} / {categories.count()}")

print("\n" + "=" * 100)
print("SUMMARY")
print("=" * 100)
print(f"\nArticles ready: {articles_ok} / {articles.count()}")
print(f"Categories ready: {categories_ok} / {categories.count()}")
print(f"Total ready: {articles_ok + categories_ok} / {articles.count() + categories.count()}")

if articles_ok == articles.count() and categories_ok == categories.count():
    print("\n✅ ALL IMAGES READY FOR LOCAL DEVELOPMENT!")
    print("\nNext step: Hard refresh browser (Ctrl+Shift+R)")
    print("Expected: All images display on homepage, articles page, and detail pages")
else:
    print(f"\n⚠️  ISSUES FOUND:")
    missing_articles = articles.count() - articles_ok
    missing_categories = categories.count() - categories_ok
    if missing_articles > 0:
        print(f"  - {missing_articles} articles missing images")
    if missing_categories > 0:
        print(f"  - {missing_categories} categories missing images")
