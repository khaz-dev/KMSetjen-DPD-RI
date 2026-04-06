#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.content.models import Article
from django.db.models import Q

# Check article 27 and any published version
print("Article 27 Details:")
article_27 = Article.objects.get(id=27)
print(f"  ID: 27")
print(f"  Slug: {article_27.slug}")
print(f"  Version Type: {article_27.version_type}")
print(f"  Draft Article: {article_27.draft_article_id}")
print(f"  Status: {article_27.status}")

# Check if there's a published version
if article_27.version_type == 'published':
    draft = article_27.draft_article
    print(f"  This IS a published version. Draft article ID: {draft.id if draft else 'None'}")
else:
    published = Article.objects.filter(draft_article_id=27).first()
    print(f"  This IS a draft. Published version: {published.id if published else 'None'}")

# Check all articles with same slug
print(f"\nAll articles with slug '{article_27.slug}':")
all_same_slug = Article.objects.filter(slug=article_27.slug)
for art in all_same_slug:
    print(f"  ID {art.id}: version_type={art.version_type}, status={art.status}, draft_article_id={art.draft_article_id}")

# Check the question about exclude_id - does it exclude correctly?
print("\n\nTesting slug validation logic for Article 27:")
slug = article_27.slug
version_type = 'draft'
exclude_id = 27

print(f"Query params: slug='{slug}', exclude_id={exclude_id}, version_type='{version_type}'")
query = Article.objects.filter(slug=slug, version_type=version_type)
print(f"Before exclude: {query.count()} articles found")
for art in query:
    print(f"  - ID {art.id}")

query_after_exclude = query.exclude(id=exclude_id)
print(f"After excluding id={exclude_id}: {query_after_exclude.count()} articles found")
for art in query_after_exclude:
    print(f"  - ID {art.id}")

available = not query_after_exclude.exists()
print(f"Slug available for Article 27: {available}")
