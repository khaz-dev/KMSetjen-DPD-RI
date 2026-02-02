# FILE UPLOAD ENDPOINTS - MANUAL TESTING GUIDE

## Prerequisites
1. Start the Django backend: `python manage.py runserver`
2. Get JWT token by logging in via API
3. Replace {TOKEN} with actual token
4. Replace {ARTICLE_ID} with actual article ID

## Test Commands

### 1. Get JWT Token (Get your auth token)
```bash
curl -X POST http://localhost:8002/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'

# Save the access token from response
```

### 2. Create Test Article (if needed)
```bash
curl -X POST http://localhost:8002/api/v1/internal/articles/ \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title_en": "Test Article",
    "title_id": "Artikel Test",
    "content_en": "Test content",
    "content_id": "Konten test",
    "category": 1
  }'

# Save the article ID from response
```

### 3. List Files (Empty)
```bash
curl -X GET http://localhost:8002/api/v1/internal/articles/{ARTICLE_ID}/files/ \
  -H "Authorization: Bearer {TOKEN}"

# Expected: 200 OK with empty array []
```

### 4. Upload File (Create a test file first)
```bash
# Create a test file
echo "This is test content" > test.txt

# Upload the file
curl -X POST http://localhost:8002/api/v1/internal/articles/{ARTICLE_ID}/files/ \
  -H "Authorization: Bearer {TOKEN}" \
  -F "file=@test.txt" \
  -F "description_en=Test file" \
  -F "description_id=File uji"

# Save the file ID from response
```

### 5. List Files (After upload)
```bash
curl -X GET http://localhost:8002/api/v1/internal/articles/{ARTICLE_ID}/files/ \
  -H "Authorization: Bearer {TOKEN}"

# Expected: 200 OK with file list
```

### 6. Get File Detail
```bash
curl -X GET http://localhost:8002/api/v1/internal/articles/{ARTICLE_ID}/files/{FILE_ID}/ \
  -H "Authorization: Bearer {TOKEN}"

# Expected: 200 OK with file object
```

### 7. Update File Description
```bash
curl -X PATCH http://localhost:8002/api/v1/internal/articles/{ARTICLE_ID}/files/{FILE_ID}/ \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"description_en": "Updated description"}'

# Expected: 200 OK with updated file
```

### 8. Upload Second File (for reorder test)
```bash
echo "Second test file" > test2.txt

curl -X POST http://localhost:8002/api/v1/internal/articles/{ARTICLE_ID}/files/ \
  -H "Authorization: Bearer {TOKEN}" \
  -F "file=@test2.txt" \
  -F "description_en=Second file" \
  -F "description_id=File kedua"

# Save the second file ID
```

### 9. Reorder Files
```bash
curl -X POST http://localhost:8002/api/v1/internal/articles/{ARTICLE_ID}/files/reorder/ \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"file_ids": [{FILE_ID_2}, {FILE_ID_1}]}'

# Expected: 200 OK with reordered file list
```

### 10. Delete File
```bash
curl -X DELETE http://localhost:8002/api/v1/internal/articles/{ARTICLE_ID}/files/{FILE_ID}/ \
  -H "Authorization: Bearer {TOKEN}"

# Expected: 204 No Content
```

### 11. Verify File Deleted
```bash
curl -X GET http://localhost:8002/api/v1/internal/articles/{ARTICLE_ID}/files/ \
  -H "Authorization: Bearer {TOKEN}"

# Expected: File should not be in list
```

## Error Cases to Test

### Test File Too Large
```bash
# Create a large file (> 50MB if size validation is implemented)
# Try to upload - should get 400 Bad Request
```

### Test Permission Denial (non-owner)
```bash
# Use a token from a different user
# Try to delete file - should get 403 Forbidden
```

### Test Non-Existent File
```bash
curl -X GET http://localhost:8002/api/v1/internal/articles/{ARTICLE_ID}/files/99999/ \
  -H "Authorization: Bearer {TOKEN}"

# Expected: 404 Not Found
```

### Test Without Authentication
```bash
curl -X GET http://localhost:8002/api/v1/internal/articles/{ARTICLE_ID}/files/

# Expected: 401 Unauthorized
```

## Expected Response Format

### File List Response
```json
[
  {
    "id": 1,
    "article": 7,
    "file": "http://localhost:8002/media/articles/2026/01/test.pdf",
    "original_filename": "test.pdf",
    "file_size": 2048,
    "file_size_display": "2.00 KB",
    "mime_type": "application/pdf",
    "description_en": "Test file",
    "description_id": "File uji",
    "uploaded_by": 1,
    "order_index": 0,
    "created_at": "2026-01-14T09:30:00Z"
  }
]
```

### Upload Response (201 Created)
```json
{
  "id": 1,
  "article": 7,
  "file": "http://localhost:8002/media/articles/2026/01/test.pdf",
  "original_filename": "test.pdf",
  "file_size": 2048,
  "file_size_display": "2.00 KB",
  "mime_type": "application/pdf",
  "description_en": "Test file",
  "description_id": "File uji",
  "uploaded_by": 1,
  "order_index": 0,
  "created_at": "2026-01-14T09:30:00Z"
}
```

## PowerShell Version of Commands

### Upload File (PowerShell)
```powershell
$token = "YOUR_JWT_TOKEN"
$articleId = 7

$file = Get-Item "C:\path\to\test.txt"
curl -X POST "http://localhost:8002/api/v1/internal/articles/$articleId/files/" `
  -H "Authorization: Bearer $token" `
  -F "file=@$($file.FullName)" `
  -F "description_en=Test file" `
  -F "description_id=File uji"
```

### Reorder Files (PowerShell)
```powershell
$token = "YOUR_JWT_TOKEN"
$articleId = 7

$body = @{
    file_ids = @(2, 1)
} | ConvertTo-Json

curl -X POST "http://localhost:8002/api/v1/internal/articles/$articleId/files/reorder/" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $body
```

## Troubleshooting

### 401 Unauthorized
- Check token is valid
- Verify token format: "Bearer {TOKEN}"
- Token may have expired

### 403 Forbidden
- User is not article owner
- Must be author or editor to manage files

### 404 Not Found
- File doesn't exist
- File doesn't belong to article
- Article doesn't exist

### 400 Bad Request
- File too large (>50MB)
- Invalid file type
- Malformed request body

### 500 Internal Server Error
- Check Django server logs
- Verify database is running
- Check file storage permissions
