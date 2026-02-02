#!/usr/bin/env python
"""
Check if local database has image references populated
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.content.models import Article, Category

print("=" * 80)
print("LOCAL DATABASE IMAGE STATUS CHECK")
print("=" * 80)

print("\n=== ARTICLES WITH IMAGES ===")
articles = Article.objects.filter(is_published=True)
print(f"Total published articles: {articles.count()}")

articles_with_images = 0
for article in articles[:10]:  # Show first 10
    has_image = bool(article.image)
    image_name = article.image.name if article.image else "EMPTY"
    status = "✓" if has_image else "✗"
    print(f"{status} Article {article.id}: {article.title_en[:40]}")
    print(f"   Image: {image_name}")
    if has_image:
        articles_with_images += 1

total_articles_with_images = Article.objects.filter(is_published=True, image__isnull=False).exclude(image="").count()
print(f"\nTotal articles with images: {total_articles_with_images} / {articles.count()}")

print("\n" + "=" * 80)
print("=== CATEGORIES WITH IMAGES ===")
categories = Category.objects.all()
print(f"Total categories: {categories.count()}")

categories_with_images = 0
for cat in categories:
    has_image = bool(cat.image)
    image_name = cat.image.name if cat.image else "EMPTY"
    status = "✓" if has_image else "✗"
    print(f"{status} Category {cat.id}: {cat.name_en}")
    print(f"   Image: {image_name}")
    if has_image:
        categories_with_images += 1

total_categories_with_images = Category.objects.filter(image__isnull=False).exclude(image="").count()
print(f"\nTotal categories with images: {total_categories_with_images} / {categories.count()}")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"Articles: {total_articles_with_images} / {articles.count()} have images")
print(f"Categories: {total_categories_with_images} / {categories.count()} have images")

if total_articles_with_images == 0 and total_categories_with_images == 0:
    print("\n⚠️  LOCAL DATABASE IS EMPTY - No images linked in database!")
else:
    print("\n✓ Images are linked in database")
