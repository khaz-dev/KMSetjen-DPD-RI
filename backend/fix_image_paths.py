#!/usr/bin/env python
"""
Fix duplicate directory names in image paths.
This script removes duplicate directory names like 'articles/articles/' -> 'articles/'
and 'categories/categories/' -> 'categories/' from the database.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.content.models import Article, Category
from django.db.models import Q

print("=" * 80)
print("FIXING DUPLICATE DIRECTORY NAMES IN IMAGE PATHS")
print("=" * 80)

# Fix Articles
print("\n[1/2] FIXING ARTICLE IMAGE PATHS")
print("-" * 80)

articles_to_fix = Article.objects.filter(
    image__contains='articles/articles/'
)
count = articles_to_fix.count()
print(f"Found {count} articles with duplicate 'articles/articles/' path")

if count > 0:
    for article in articles_to_fix:
        old_path = str(article.image)
        new_path = old_path.replace('articles/articles/', 'articles/')
        article.image = new_path
        article.save()
        print(f"  Article {article.id}: {old_path} → {new_path}")
    print(f"✓ Fixed {count} articles")
else:
    print("✓ No articles need fixing")

# Fix Categories  
print("\n[2/2] FIXING CATEGORY IMAGE PATHS")
print("-" * 80)

categories_to_fix = Category.objects.filter(
    image__contains='categories/categories/'
)
count = categories_to_fix.count()
print(f"Found {count} categories with duplicate 'categories/categories/' path")

if count > 0:
    for category in categories_to_fix:
        old_path = str(category.image)
        new_path = old_path.replace('categories/categories/', 'categories/')
        category.image = new_path
        category.save()
        print(f"  Category {category.id}: {old_path} → {new_path}")
    print(f"✓ Fixed {count} categories")
else:
    print("✓ No categories need fixing")

print("\n" + "=" * 80)
print("VERIFICATION - AFTER FIX")
print("=" * 80)

print("\nArticle image paths (first 5):")
for article in Article.objects.filter(image__isnull=False)[:5]:
    print(f"  Article {article.id}: {article.image}")

print("\nCategory image paths (first 5):")
for category in Category.objects.filter(image__isnull=False)[:5]:
    print(f"  Category {category.id}: {category.image}")

print("\n✓ Database paths have been fixed!")
print("=" * 80)
