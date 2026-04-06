#!/usr/bin/env python
"""Debug script to investigate slug validation issue."""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from apps.content.models import Article
from django.db.models import Q

print("=" * 80)
print("SLUG VALIDATION DEBUG - Article 27")
print("=" * 80)

# Check the Article model's unique constraint
print("\n[1] Article Model Constraints:")
for constraint in Article._meta.constraints:
    print(f"  - {constraint}")

# Check if Article 27 exists
try:
    article = Article.objects.get(id=27)
    print(f"\n[2] Article 27 Exists:")
    print(f"  - ID: {article.id}")
    print(f"  - Slug: '{article.slug}'")
    print(f"  - Version Type: {article.version_type}")
    print(f"  - Status: {article.status}")
    print(f"  - Title (ID): {article.title_id[:50]}...")
    
    # Check if there are other articles with the same slug
    print(f"\n[3] Articles with slug '{article.slug}':")
    same_slug_articles = Article.objects.filter(slug=article.slug)
    print(f"  Total: {same_slug_articles.count()}")
    for a in same_slug_articles:
        print(f"    - ID: {a.id}, Version: {a.version_type}, Status: {a.status}, Author: {a.author}")
    
    # Simulate the check_slug query
    print(f"\n[4] Simulating check_slug endpoint query:")
    print(f"  Query: Article.objects.filter(slug='{article.slug}', version_type='draft')")
    query = Article.objects.filter(slug=article.slug, version_type='draft')
    print(f"  Results before exclude: {query.count()}")
    for a in query:
        print(f"    - ID: {a.id}, Status: {a.status}")
    
    print(f"\n  Query after exclude(id=27):")
    query = query.exclude(id=27)
    print(f"  Results: {query.count()}")
    for a in query:
        print(f"    - ID: {a.id}, Status: {a.status}")
    
    # Check what the UpdateSerializer would do
    print(f"\n[5] Checking UPDATE validation (from InternalArticleUpdateSerializer):")
    current_slug = article.slug
    new_slug = article.slug  # User didn't change it
    print(f"  Current Slug: '{current_slug}'")
    print(f"  New Slug: '{new_slug}'")
    print(f"  Slug Changed: {new_slug != current_slug}")
    
    if new_slug == current_slug:
        print("  -> No validation needed (slug not changed)")
    else:
        # This would be validated
        query = Article.objects.exclude(id=article.id).filter(
            slug=new_slug,
            version_type=Article.VERSION_DRAFT
        )
        print(f"  -> Would check for duplicates: {query.count()} found")
    
    # Check if there's a published version with the same slug
    print(f"\n[6] Checking for published version with same slug:")
    published = Article.objects.filter(
        slug=article.slug,
        version_type=Article.VERSION_PUBLISHED
    )
    print(f"  Published articles with slug '{article.slug}': {published.count()}")
    for p in published:
        print(f"    - ID: {p.id}, Status: {p.status}, Title: {p.title_id[:50]}")

except Article.DoesNotExist:
    print("ERROR: Article 27 does not exist!")

print("\n" + "=" * 80)
