#!/usr/bin/env python
"""Quick test to check API response values."""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.content.models import Article
from apps.api.v1.internal.serializers import InternalArticleDetailSerializer
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.first()

article = Article.objects.get(id=27)
print('Article 27 Raw Values:')
print(f'  status: {repr(article.status)}')
print(f'  access_level: {repr(article.access_level)}')

print('\nSerialized Response:')
serializer = InternalArticleDetailSerializer(article, context={'request': type('R', (), {'user': user})()})
data = serializer.data
print(f'  status: {repr(data.get("status"))}')
print(f'  access_level: {repr(data.get("access_level"))}')

print('\nFull response (relevant fields):')
print(json.dumps({
    'id': data.get('id'),
    'title_id': data.get('title_id'),
    'status': data.get('status'),
    'access_level': data.get('access_level'),
}, indent=2))
