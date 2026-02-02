# API Documentation - KMSetjen DPD RI Content Management System

**Version:** 1.0.0  
**Last Updated:** January 5, 2026  
**Base URL:** `http://api.localhost:8002/api/v1`

---

## Table of Contents
1. [Authentication](#authentication)
2. [User Management API](#user-management-api)
3. [Role & Permission API](#role--permission-api)
4. [Category API](#category-api)
5. [Article API](#article-api)
6. [Admin Statistics API](#admin-statistics-api)
7. [Audit Log API](#audit-log-api)
8. [Response Format](#response-format)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints require JWT token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Refresh
- **Endpoint:** `POST /auth/token/refresh/`
- **Body:** `{ "refresh": "<refresh_token>" }`
- **Response:** `{ "access": "<new_access_token>" }`

---

## User Management API

### List Users
- **Endpoint:** `GET /admin/users/`
- **Authentication:** Required (Admin role)
- **Query Parameters:**
  - `page` (integer, optional): Page number (default: 1)
  - `search` (string, optional): Search by username, email, or name
  - `is_active` (boolean, optional): Filter by active status
  
**Request:**
```bash
curl -X GET "http://api.localhost:8002/api/v1/admin/users/?page=1&search=john" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "count": 150,
  "next": "http://api.localhost:8002/api/v1/admin/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_active": true,
      "is_staff": false,
      "is_superuser": false,
      "date_joined": "2025-01-01T10:00:00Z",
      "last_login": "2025-01-05T15:30:00Z"
    }
  ]
}
```

### Create User
- **Endpoint:** `POST /admin/users/`
- **Authentication:** Required (Admin role)
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "username": "new_user",
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "first_name": "New",
  "last_name": "User",
  "is_active": true,
  "is_staff": false
}
```

**Response (201 Created):**
```json
{
  "id": 151,
  "username": "new_user",
  "email": "newuser@example.com",
  "first_name": "New",
  "last_name": "User",
  "is_active": true,
  "is_staff": false,
  "date_joined": "2025-01-05T16:00:00Z"
}
```

### Update User
- **Endpoint:** `PUT /admin/users/{id}/`
- **Authentication:** Required (Admin role)
- **Content-Type:** `application/json`

**Request Body:**
```json
{
  "email": "updated@example.com",
  "first_name": "Updated",
  "last_name": "Name",
  "is_active": true,
  "is_staff": true
}
```

**Response (200 OK):**
```json
{
  "id": 151,
  "username": "new_user",
  "email": "updated@example.com",
  "first_name": "Updated",
  "last_name": "Name",
  "is_active": true,
  "is_staff": true
}
```

### Delete User
- **Endpoint:** `DELETE /admin/users/{id}/`
- **Authentication:** Required (Admin role)
- **Response:** `204 No Content`

### Activate User
- **Endpoint:** `POST /admin/users/{id}/activate/`
- **Authentication:** Required (Admin role)
- **Response (200 OK):**
```json
{ "status": "activated", "message": "User activated successfully" }
```

### Deactivate User
- **Endpoint:** `POST /admin/users/{id}/deactivate/`
- **Authentication:** Required (Admin role)
- **Response (200 OK):**
```json
{ "status": "deactivated", "message": "User deactivated successfully" }
```

---

## Role & Permission API

### List Roles
- **Endpoint:** `GET /admin/roles/`
- **Authentication:** Required (Admin role)
- **Query Parameters:**
  - `page` (integer, optional): Page number
  - `search` (string, optional): Search by role code or name

**Response (200 OK):**
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "code": "ADMIN",
      "name": "Administrator",
      "description": "Full system access",
      "permissions": [1, 2, 3, 4],
      "user_count": 3
    }
  ]
}
```

### Create Role
- **Endpoint:** `POST /admin/roles/`
- **Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "code": "MODERATOR",
  "name": "Content Moderator",
  "description": "Can moderate content",
  "permission_ids": [5, 6, 7]
}
```

**Response (201 Created):**
```json
{
  "id": 4,
  "code": "MODERATOR",
  "name": "Content Moderator",
  "description": "Can moderate content",
  "permissions": [5, 6, 7]
}
```

### Update Role
- **Endpoint:** `PUT /admin/roles/{id}/`
- **Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "name": "Content Moderator",
  "description": "Can moderate and approve content",
  "permission_ids": [5, 6, 7, 8]
}
```

**Response (200 OK):**
```json
{
  "id": 4,
  "code": "MODERATOR",
  "name": "Content Moderator",
  "description": "Can moderate and approve content",
  "permissions": [5, 6, 7, 8]
}
```

### Delete Role
- **Endpoint:** `DELETE /admin/roles/{id}/`
- **Authentication:** Required (Admin role)
- **Response:** `204 No Content`
- **Note:** Cannot delete role if users are assigned

### List Permissions
- **Endpoint:** `GET /admin/permissions/`
- **Authentication:** Required (Admin role)

**Response (200 OK):**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "code": "users.create",
      "name": "Create Users",
      "description": "Can create new users"
    }
  ]
}
```

---

## Category API

### List Categories
- **Endpoint:** `GET /public/categories/`
- **Authentication:** Not required (Public)
- **Query Parameters:**
  - `page` (integer, optional): Page number
  - `search` (string, optional): Search by name

**Response (200 OK):**
```json
{
  "count": 12,
  "results": [
    {
      "id": 1,
      "name_en": "Technology",
      "name_id": "Teknologi",
      "description": "Technology news and updates",
      "article_count": 45,
      "created_at": "2025-01-01T10:00:00Z"
    }
  ]
}
```

### Create Category
- **Endpoint:** `POST /public/categories/`
- **Authentication:** Required

**Request Body:**
```json
{
  "name_en": "Health",
  "name_id": "Kesehatan",
  "description": "Health and wellness articles"
}
```

**Response (201 Created):**
```json
{
  "id": 13,
  "name_en": "Health",
  "name_id": "Kesehatan",
  "description": "Health and wellness articles",
  "article_count": 0
}
```

### Update Category
- **Endpoint:** `PUT /public/categories/{id}/`
- **Authentication:** Required

**Response (200 OK):**
```json
{
  "id": 13,
  "name_en": "Health",
  "name_id": "Kesehatan",
  "description": "Updated description"
}
```

### Delete Category
- **Endpoint:** `DELETE /public/categories/{id}/`
- **Authentication:** Required
- **Response:** `204 No Content`

---

## Article API

### List Articles
- **Endpoint:** `GET /internal/articles/`
- **Authentication:** Required

**Query Parameters:**
- `page` (integer, optional): Page number
- `status` (string, optional): PENDING, APPROVED, REJECTED, PUBLISHED
- `category` (integer, optional): Filter by category ID
- `author` (integer, optional): Filter by author ID

**Response (200 OK):**
```json
{
  "count": 150,
  "results": [
    {
      "id": 1,
      "title": "Sample Article",
      "slug": "sample-article",
      "content": "Article content...",
      "excerpt": "Brief excerpt...",
      "author": {
        "id": 1,
        "username": "john_doe",
        "first_name": "John"
      },
      "category": {
        "id": 1,
        "name_en": "Technology",
        "name_id": "Teknologi"
      },
      "status": "PUBLISHED",
      "view_count": 150,
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-05T15:00:00Z",
      "published_at": "2025-01-01T11:00:00Z"
    }
  ]
}
```

### Get Article Detail
- **Endpoint:** `GET /internal/articles/{id}/`
- **Authentication:** Required

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Sample Article",
  "slug": "sample-article",
  "content": "Full article content...",
  "excerpt": "Brief excerpt...",
  "author": { ... },
  "category": { ... },
  "status": "PUBLISHED",
  "view_count": 150,
  "created_at": "2025-01-01T10:00:00Z",
  "updated_at": "2025-01-05T15:00:00Z",
  "published_at": "2025-01-01T11:00:00Z",
  "review_comment": "Approved after revision"
}
```

### Review Article
- **Endpoint:** `POST /internal/articles/{id}/review/`
- **Authentication:** Required (Admin/Editor role)

**Request Body:**
```json
{
  "status": "APPROVED",
  "review_comment": "Well written, approved for publication"
}
```

OR

```json
{
  "status": "REJECTED",
  "review_comment": "Needs more sources and better structure"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "status": "APPROVED",
  "review_comment": "Well written, approved for publication",
  "reviewed_at": "2025-01-05T16:00:00Z"
}
```

---

## Admin Statistics API

### Get System Statistics
- **Endpoint:** `GET /admin/statistics/`
- **Authentication:** Required (Admin role)

**Response (200 OK):**
```json
{
  "total_users": 150,
  "total_articles": 45,
  "total_audit_logs": 1200,
  "articles_in_review": 5,
  "users_by_role": [
    { "role": "Admin", "count": 3 },
    { "role": "Editor", "count": 12 },
    { "role": "User", "count": 135 }
  ],
  "articles_by_status": [
    { "status": "Published", "count": 40 },
    { "status": "Pending", "count": 5 }
  ],
  "audit_activity": [
    { "action": "Create", "count": 450 },
    { "action": "Update", "count": 380 },
    { "action": "Delete", "count": 370 }
  ]
}
```

---

## Audit Log API

### List Audit Logs
- **Endpoint:** `GET /admin/audit-logs/`
- **Authentication:** Required (Admin role)

**Query Parameters:**
- `page` (integer, optional): Page number
- `action` (string, optional): CREATE, UPDATE, DELETE, PUBLISH, APPROVE, REJECT
- `resource_type` (string, optional): Article, User, Role, Category
- `date_from` (string, optional): ISO date format
- `date_to` (string, optional): ISO date format

**Response (200 OK):**
```json
{
  "count": 1200,
  "results": [
    {
      "id": 1,
      "user": {
        "id": 1,
        "username": "admin_user",
        "first_name": "Admin"
      },
      "action": "CREATE",
      "resource_type": "Article",
      "resource_id": "45",
      "resource_name": "Sample Article",
      "details": "Article created by user",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "timestamp": "2025-01-05T16:00:00Z"
    }
  ]
}
```

---

## Response Format

### Success Response
```json
{
  "status": "success",
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Paginated Response
```json
{
  "count": 150,
  "next": "http://api.localhost:8002/api/v1/endpoint/?page=2",
  "previous": null,
  "results": [ ... ]
}
```

---

## Error Handling

### Error Response Format
```json
{
  "status": "error",
  "message": "Error description",
  "errors": {
    "field_name": ["Error message for field"]
  }
}
```

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Validation Error - Invalid data |
| 429 | Rate Limited - Too many requests |
| 500 | Internal Server Error |

### Example Error Response
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "username": ["Username already exists"],
    "email": ["Email is invalid"]
  }
}
```

---

## Rate Limiting

- **Rate Limit:** 1000 requests per hour per IP
- **Rate Limit Header:** `X-RateLimit-Remaining`
- **Reset Time Header:** `X-RateLimit-Reset`

When rate limit is exceeded:
```json
{
  "status": "error",
  "message": "Rate limit exceeded. Please try again later.",
  "retry_after": 3600
}
```

---

## Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Handle pagination** by checking `next` field
3. **Implement retry logic** for network errors
4. **Cache responses** appropriately
5. **Use filtering** to reduce data transfer
6. **Monitor rate limits** using response headers
7. **Validate input** before sending to API
8. **Log errors** for debugging

---

## Testing API Endpoints

### Using cURL
```bash
# List users
curl -X GET "http://api.localhost:8002/api/v1/admin/users/" \
  -H "Authorization: Bearer <token>"

# Create user
curl -X POST "http://api.localhost:8002/api/v1/admin/users/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"username": "new_user", "email": "test@example.com", "password": "Pass123!"}'
```

### Using Postman
1. Import the provided Postman collection
2. Set environment variable: `base_url` = `http://api.localhost:8002/api/v1`
3. Set environment variable: `token` = your JWT token
4. Run requests with `{{base_url}}` and `Authorization: Bearer {{token}}`

---

**For support:** Contact development team or check GitHub documentation
