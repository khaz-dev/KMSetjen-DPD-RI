"""
PHASE 4 QUICK START - API Testing Guide
========================================

## Setup

Start server:
```bash
cd backend
python manage.py runserver
```

## Test Authentication

### 1. Register User
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "first_name": "Test",
    "last_name": "User",
    "department": "Testing Dept"
  }'
```

### 2. Login (Get Token)
```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

Save the access token:
```bash
export TOKEN="<access_token_from_response>"
```

### 3. Get Current User
```bash
curl http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer $TOKEN"
```

## Test Article CRUD

### 1. Create Article
```bash
curl -X POST http://localhost:8000/api/v1/internal/articles/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title_id": "Artikel Test",
    "title_en": "Test Article",
    "content_id": "Isi artikel untuk testing...",
    "content_en": "Article content for testing...",
    "summary_id": "Ringkasan test",
    "summary_en": "Test summary",
    "category": 1,
    "status": "DRAFT",
    "access_level": "PUBLIC",
    "is_bilingual": true,
    "language": "id"
  }'
```

Save the article ID from response: `export ARTICLE_ID=<id>`

### 2. Get Article Detail
```bash
curl http://localhost:8000/api/v1/internal/articles/$ARTICLE_ID/ \
  -H "Authorization: Bearer $TOKEN"
```

### 3. List User's Articles
```bash
curl http://localhost:8000/api/v1/internal/articles/ \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Update Article (Partial)
```bash
curl -X PATCH http://localhost:8000/api/v1/internal/articles/$ARTICLE_ID/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title_en": "Updated Test Article",
    "summary_en": "Updated summary"
  }'
```

### 5. Update Article (Full)
```bash
curl -X PUT http://localhost:8000/api/v1/internal/articles/$ARTICLE_ID/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title_id": "Artikel Test",
    "title_en": "Completely Updated",
    "content_id": "New content",
    "content_en": "New content",
    "category": 1,
    "status": "DRAFT",
    "access_level": "PUBLIC"
  }'
```

## Test Article Workflow

### 1. Submit for Review
```bash
curl -X POST http://localhost:8000/api/v1/internal/articles/$ARTICLE_ID/submit-review/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Ready for editor review"
  }'
```

### 2. Create Editor User (for testing approval)
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "editor",
    "email": "editor@example.com",
    "password": "editorpass123",
    "first_name": "Editor",
    "last_name": "User"
  }'
```

Then in Django shell, add editor role:
```bash
python manage.py shell
from django.contrib.auth import get_user_model
from apps.core.models import Role
User = get_user_model()
user = User.objects.get(username='editor')
role = Role.objects.get(code='EDITOR')
user.roles.add(role)
user.save()
exit()
```

Login as editor:
```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "editor", "password": "editorpass123"}'

export EDITOR_TOKEN="<editor_access_token>"
```

### 3. Approve Article (as Editor)
```bash
curl -X POST http://localhost:8000/api/v1/internal/articles/$ARTICLE_ID/approve/ \
  -H "Authorization: Bearer $EDITOR_TOKEN"
```

### 4. Publish Article (as Editor)
```bash
curl -X POST http://localhost:8000/api/v1/internal/articles/$ARTICLE_ID/publish/ \
  -H "Authorization: Bearer $EDITOR_TOKEN"
```

### 5. Archive Article (as Author)
```bash
curl -X POST http://localhost:8000/api/v1/internal/articles/$ARTICLE_ID/archive/ \
  -H "Authorization: Bearer $TOKEN"
```

## Test Dashboard

### Get User Dashboard
```bash
curl http://localhost:8000/api/v1/internal/articles/dashboard/ \
  -H "Authorization: Bearer $TOKEN"
```

Returns:
```json
{
  "user": {...},
  "statistics": {
    "total_articles": 1,
    "published": 1,
    "drafts": 0,
    "in_review": 0,
    "total_views": 0
  },
  "recent_articles": [...]
}
```

## Test User Management

### Update Profile
```bash
curl -X POST http://localhost:8000/api/auth/update-profile/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "preferred_language": "en",
    "theme_mode": "dark"
  }'
```

### Change Password
```bash
curl -X POST http://localhost:8000/api/auth/change-password/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "testpass123",
    "new_password": "newpass123"
  }'
```

## Test Permission Errors

### Try to Update Other User's Article (should fail)
```bash
# Create another article by editor user
curl -X POST http://localhost:8000/api/v1/internal/articles/ \
  -H "Authorization: Bearer $EDITOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title_id": "Editor Article",
    "title_en": "Editor Article",
    "content_id": "Content",
    "content_en": "Content",
    "category": 1,
    "status": "DRAFT"
  }'

# Save the ID: export OTHER_ARTICLE_ID=<id>

# Try to update with contributor token (should fail with 403)
curl -X PATCH http://localhost:8000/api/v1/internal/articles/$OTHER_ARTICLE_ID/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title_en": "Hacked"}'
```

Expected response: 403 Forbidden

### Try to Delete Other User's Article (should fail)
```bash
curl -X DELETE http://localhost:8000/api/v1/internal/articles/$OTHER_ARTICLE_ID/ \
  -H "Authorization: Bearer $TOKEN"
```

Expected response: 403 Forbidden

## Run Automated Tests

### All tests
```bash
pytest tests/api/test_internal_api.py -v
```

### Specific test
```bash
pytest tests/api/test_internal_api.py::TestArticleCreateAPI::test_create_article -v
```

### With output
```bash
pytest tests/api/test_internal_api.py -v -s
```

### With coverage
```bash
pytest tests/api/test_internal_api.py --cov=apps.api.v1.internal --cov=apps.auth
```

## Test Full Workflow

Complete workflow test:
```bash
# 1. Register
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"workflow","email":"workflow@test.com","password":"pass123"}' \
  | jq -r '.user.id')

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"workflow","password":"pass123"}' \
  | jq -r '.access')

# 3. Create article
ARTICLE_ID=$(curl -s -X POST http://localhost:8000/api/v1/internal/articles/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title_id":"Test","title_en":"Test","content_id":"Content","content_en":"Content","category":1}' \
  | jq -r '.id')

# 4. Submit for review
curl -s -X POST http://localhost:8000/api/v1/internal/articles/$ARTICLE_ID/submit-review/ \
  -H "Authorization: Bearer $TOKEN" | jq .

# 5. Get dashboard
curl -s http://localhost:8000/api/v1/internal/articles/dashboard/ \
  -H "Authorization: Bearer $TOKEN" | jq .
```

## Common Issues

**401 Unauthorized:**
- Token missing or invalid
- Check: `Authorization: Bearer <token>`
- Refresh token if expired: POST /api/auth/token/refresh/

**403 Forbidden:**
- Permission denied
- Author trying to update other user's article
- Contributor trying to publish article
- Check permission matrix

**400 Bad Request:**
- Missing required fields
- Invalid field values
- Check field names match serializer

**404 Not Found:**
- Article doesn't exist
- Wrong article ID
- User doesn't have permission to view

## Useful Commands

Check Django models:
```bash
python manage.py shell
from apps.content.models import Article
Article.objects.count()
Article.objects.filter(author__username='testuser')
```

Check JWT token contents:
```bash
python -c "from rest_framework_simplejwt.tokens import AccessToken; print(AccessToken('<token>'))"
```

View audit logs:
```bash
python manage.py shell
from apps.audit.models import AuditLog
AuditLog.objects.order_by('-timestamp')[:10]
```

---

**Done testing Phase 4!** Now proceed to Phase 5 (Admin API) or Phase 6 (Frontend).
"""
