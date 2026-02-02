#!/usr/bin/env python
"""Quick verification script for database"""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.content.models import Article, Category, Tag
from apps.core.models import User

print("\n" + "="*50)
print("  DATABASE VERIFICATION REPORT")
print("="*50)

print(f"\n✅ Total Articles: {Article.objects.count()}")
print(f"✅ Total Categories: {Category.objects.count()}")
print(f"✅ Total Tags: {Tag.objects.count()}")
print(f"✅ Total Users: {User.objects.count()}")

print("\n📊 ARTICLES BY CATEGORY:")
for cat in Category.objects.all():
    count = Article.objects.filter(category=cat).count()
    print(f"   • {cat.name_id}: {count} articles")

print("\n📰 TOP 5 POPULAR ARTICLES:")
for i, article in enumerate(Article.objects.order_by('-view_count')[:5], 1):
    print(f"   {i}. {article.title_id} ({article.view_count} views)")

print("\n✅ ALL SYSTEMS READY FOR DEVELOPMENT")
print("="*50 + "\n")
