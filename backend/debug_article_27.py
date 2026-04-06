#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.content.models import Article
from django.db.models import Count

# Check article 27
try:
    article = Article.objects.get(id=27)
    print("Article 27 found:")
    print(f"  ID: {article.id}")
    print(f"  Slug: {article.slug}")
    print(f"  Version Type: {article.version_type}")
    print(f"  Status: {article.status}")
except Article.DoesNotExist:
    print("Article 27 not found")
    
# Check if there are duplicate slugs
duplicates = Article.objects.values('slug', 'version_type').annotate(count=Count('id')).filter(count__gt=1)
if duplicates.exists():
    print("\nDuplicate slugs found:")
    for dup in duplicates:
        print(f"  {dup['slug']} ({dup['version_type']}): {dup['count']} articles")
        articles_with_slug = Article.objects.filter(slug=dup['slug'], version_type=dup['version_type'])
        for art in articles_with_slug:
            print(f"    - ID {art.id}: {art.title_id}")
else:
    print("\nNo duplicate slugs found in database")
    
#Check all articles with slug 'pengetahuan-test' or similar
print("\n\nSearching for articles with 'test' slug:")
test_articles = Article.objects.filter(slug__contains='test')
for art in test_articles:
    print(f"  ID {art.id}: slug={art.slug}, version_type={art.version_type}, status={art.status}")
