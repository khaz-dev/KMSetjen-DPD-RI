"""
QUICK START GUIDE - Phase 3 API Testing
========================================

## Start the Server

```bash
cd backend
python manage.py runserver
```

## Test Endpoints with Browser

Open in browser and see results:
- http://localhost:8000/api/v1/public/articles/
- http://localhost:8000/api/v1/public/articles/1/
- http://localhost:8000/api/v1/public/categories/
- http://localhost:8000/api/v1/public/tags/

## Test with Curl

### Articles List
```bash
curl "http://localhost:8000/api/v1/public/articles/"
```

### Articles with Search
```bash
curl "http://localhost:8000/api/v1/public/articles/?search=government"
```

### Articles by Category
```bash
curl "http://localhost:8000/api/v1/public/articles/?category=1"
```

### Articles by Tags
```bash
curl "http://localhost:8000/api/v1/public/articles/?tags=1&tags=2"
```

### Trending Articles
```bash
curl "http://localhost:8000/api/v1/public/articles/trending/"
```

### Latest Articles
```bash
curl "http://localhost:8000/api/v1/public/articles/latest/"
```

### Article Detail
```bash
curl "http://localhost:8000/api/v1/public/articles/1/"
```

### Record View
```bash
curl -X POST "http://localhost:8000/api/v1/public/articles/1/view/"
```

### Categories
```bash
curl "http://localhost:8000/api/v1/public/categories/"
curl "http://localhost:8000/api/v1/public/categories/1/"
```

### Tags
```bash
curl "http://localhost:8000/api/v1/public/tags/"
curl "http://localhost:8000/api/v1/public/tags/1/"
curl "http://localhost:8000/api/v1/public/tags/1/articles/"
```

## Create Test Data

```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
from apps.content.models import Article, Category, Tag

User = get_user_model()

# Create user
user = User.objects.create_user(username='testuser', email='test@example.com', password='pass123')

# Create category
cat = Category.objects.create(name_id='Test', name_en='Test')

# Create article
article = Article.objects.create(
    title_id='Test Article',
    title_en='Test Article',
    content_id='Content',
    content_en='Content',
    author=user,
    category=cat,
    status='PUBLISHED',
    access_level='PUBLIC',
    is_published=True
)

# Create tag
tag = Tag.objects.create(name_id='Test Tag', name_en='Test Tag')
article.tags.add(tag)

print("Test data created!")
```

## Test with Python Requests

```python
import requests

# List articles
response = requests.get('http://localhost:8000/api/v1/public/articles/')
print(response.json())

# Search
response = requests.get('http://localhost:8000/api/v1/public/articles/?search=government')
print(response.json())

# Trending
response = requests.get('http://localhost:8000/api/v1/public/articles/trending/')
print(response.json())

# Record view
response = requests.post('http://localhost:8000/api/v1/public/articles/1/view/')
print(response.json())
```

## Run Automated Tests

```bash
# All tests
pytest tests/api/test_public_api.py -v

# Specific test
pytest tests/api/test_public_api.py::TestArticlePublicAPI::test_list_articles -v

# With output
pytest tests/api/test_public_api.py -v -s

# With coverage
pytest tests/api/test_public_api.py --cov=apps.api.v1.public
```

## View API Documentation

DRF automatically generates docs:
- http://localhost:8000/api/v1/public/ - Root API docs
- http://localhost:8000/api/v1/public/articles/ - Article docs
- http://localhost:8000/api/v1/public/categories/ - Category docs
- http://localhost:8000/api/v1/public/tags/ - Tag docs

## Debug Mode

Enable shell debugging:
```bash
python manage.py shell

from django.test import RequestFactory
from apps.api.v1.public.views import ArticleViewSet

factory = RequestFactory()
request = factory.get('/api/v1/public/articles/')
view = ArticleViewSet.as_view({'get': 'list'})
response = view(request)
print(response.data)
```

## Common Query Parameters

**Pagination:**
- `?page=1` - Get page 1 (default)
- `?page_size=50` - Get 50 items per page (max 100)

**Search:**
- `?search=government` - Search all articles

**Filtering:**
- `?category=1` - Filter by category
- `?tags=1` - Filter by tag
- `?tags=1&tags=2` - Multiple tags (OR)
- `?published_after=2026-01-01` - Articles after date
- `?published_before=2026-12-31` - Articles before date
- `?language=en` - English articles only

**Sorting:**
- `?ordering=-published_at` - Newest first (default)
- `?ordering=published_at` - Oldest first
- `?ordering=title` - By title
- `?ordering=-view_count` - Most viewed

## Combined Examples

```bash
# Newest government articles, 50 per page
curl "http://localhost:8000/api/v1/public/articles/?search=government&page_size=50&ordering=-published_at"

# Popular articles from category 1
curl "http://localhost:8000/api/v1/public/articles/?category=1&ordering=-view_count"

# Articles with multiple tags
curl "http://localhost:8000/api/v1/public/articles/?tags=1&tags=2&language=en"

# Recent policy articles
curl "http://localhost:8000/api/v1/public/articles/?search=policy&published_after=2026-01-01"
```

## Next: Phase 4

When ready, implement:
- Authentication endpoints
- Create article endpoint
- Edit article endpoint
- Delete article endpoint
- Submit for review
- User dashboard
"""
