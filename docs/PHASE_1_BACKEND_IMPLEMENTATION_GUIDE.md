# Phase 1 Backend Implementation - Step-by-Step Guide

**For:** Backend Developer  
**Objective:** Implement 5 API endpoints for file upload/management  
**Estimated Time:** 2-3 hours  
**Difficulty:** Medium  
**Dependencies:** Django REST Framework, File model already exists

---

## 📋 PRE-REQUISITES CHECK

### Verify Backend Model Exists
```bash
# Run this to check
python manage.py sqlmigrations content

# You should see File model migrations
# If not, need to create:
# - File model in apps/content/models.py
# - Migration and run migrate
```

### Verify Django REST Framework is installed
```bash
python manage.py shell
>>> import rest_framework
# Should not error
```

---

## 🎯 IMPLEMENTATION CHECKLIST

### Step 1: Create File Serializer
**File:** `backend/apps/api/v1/internal/serializers.py`

```python
from rest_framework import serializers
from apps.content.models import File

class FileSerializer(serializers.ModelSerializer):
    """Serializer for File model"""
    
    class Meta:
        model = File
        fields = [
            'id',
            'article',
            'file',
            'original_filename',
            'file_size',
            'mime_type',
            'description_en',
            'description_id',
            'created_at',
            'uploaded_by',
            'order_index'
        ]
        read_only_fields = ['id', 'article', 'created_at', 'uploaded_by', 'file_size']
    
    def create(self, validated_data):
        """
        Custom create to:
        1. Set file_size from uploaded file
        2. Set mime_type from uploaded file
        3. Set uploaded_by to current user
        """
        file_obj = validated_data.get('file')
        validated_data['file_size'] = file_obj.size
        validated_data['mime_type'] = file_obj.content_type
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)
```

**Checklist:**
- [ ] File created at correct path
- [ ] All required fields in serializer
- [ ] Custom create method handles file metadata
- [ ] read_only_fields are correct
- [ ] Tests pass for serializer

---

### Step 2: Create FileViewSet
**File:** `backend/apps/api/v1/internal/viewsets.py`

```python
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.content.models import File, Article
from .serializers import FileSerializer
from django.shortcuts import get_object_or_404

class FileViewSet(viewsets.ModelViewSet):
    """
    API endpoints for article file management.
    
    List:
        GET /articles/{article_id}/files/
        
    Create (Upload):
        POST /articles/{article_id}/files/
        Content-Type: multipart/form-data
        
    Retrieve:
        GET /articles/{article_id}/files/{id}/
        
    Update:
        PATCH /articles/{article_id}/files/{id}/
        
    Delete:
        DELETE /articles/{article_id}/files/{id}/
        
    Reorder:
        POST /articles/{article_id}/files/reorder/
        Body: {"file_ids": [1, 2, 3]}
    """
    
    serializer_class = FileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter files by article_id from URL"""
        article_id = self.kwargs.get('article_id')
        if article_id:
            return File.objects.filter(
                article_id=article_id
            ).order_by('order_index')
        return File.objects.none()
    
    def get_article(self):
        """Get article from URL parameter"""
        article_id = self.kwargs.get('article_id')
        article = get_object_or_404(Article, id=article_id)
        
        # IMPORTANT: Check user permission
        # User must be the article author or staff
        if article.author != self.request.user and not self.request.user.is_staff:
            self.permission_denied(self.request)
        
        return article
    
    def perform_create(self, serializer):
        """Set article and user when creating file"""
        article = self.get_article()
        serializer.save(article=article)
    
    def perform_destroy(self, instance):
        """Delete file from storage before removing from DB"""
        # Delete file from storage
        if instance.file:
            instance.file.delete(save=False)
        instance.delete()
    
    @action(detail=False, methods=['post'])
    def reorder(self, request, article_id=None):
        """
        Reorder files for an article.
        
        Expected request body:
        {
            "file_ids": [3, 1, 2]
        }
        """
        article = self.get_article()
        file_ids = request.data.get('file_ids', [])
        
        if not isinstance(file_ids, list):
            return Response(
                {'error': 'file_ids must be a list'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update order_index for each file
        for index, file_id in enumerate(file_ids):
            try:
                file_obj = File.objects.get(id=file_id, article=article)
                file_obj.order_index = index
                file_obj.save()
            except File.DoesNotExist:
                return Response(
                    {'error': f'File {file_id} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Return updated files
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
```

**Checklist:**
- [ ] ViewSet created at correct path
- [ ] get_queryset filters by article_id
- [ ] Permission checks (only article author)
- [ ] perform_create sets article
- [ ] perform_destroy deletes file from storage
- [ ] Reorder endpoint implemented
- [ ] Tests pass for viewset

---

### Step 3: Add URL Routes
**File:** `backend/apps/api/v1/internal/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .viewsets import FileViewSet

# Create router
router = SimpleRouter()

# IMPORTANT: Register FileViewSet with nested article_id
# This creates the URLs with {article_id} in path
router.register(
    r'articles/(?P<article_id>\d+)/files',
    FileViewSet,
    basename='article-files'
)

urlpatterns = [
    path('', include(router.urls)),
]
```

**Checklist:**
- [ ] FileViewSet registered with router
- [ ] Nested URL pattern includes article_id
- [ ] Router included in main URL config
- [ ] URLs match frontend expectations (check frontend api.js)

---

### Step 4: Verify File Model
**File:** `backend/apps/content/models.py`

```python
from django.db import models
from django.core.validators import FileExtensionValidator

class File(models.Model):
    """File attachment for articles"""
    
    article = models.ForeignKey(
        'Article',
        on_delete=models.CASCADE,
        related_name='files'
    )
    
    file = models.FileField(
        upload_to='articles/%Y/%m/',
        validators=[
            FileExtensionValidator(
                allowed_extensions=[
                    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
                    'txt', 'zip', 'rar', '7z', 'jpg', 'jpeg', 'png', 'gif',
                    'mp4', 'avi', 'mov', 'mkv'
                ]
            )
        ]
    )
    
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    
    description_en = models.CharField(max_length=255, blank=True)
    description_id = models.CharField(max_length=255, blank=True)
    
    uploaded_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True
    )
    
    order_index = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order_index', 'created_at']
    
    def __str__(self):
        return f"{self.original_filename} ({self.id})"
```

**Checklist:**
- [ ] File model exists
- [ ] Has ForeignKey to Article
- [ ] Has all required fields (file, filename, size, mime_type, descriptions)
- [ ] Has ordering by order_index
- [ ] Has created_at timestamp
- [ ] Migrations created and run

---

### Step 5: Add Middleware (Optional but Recommended)

**File:** `backend/apps/api/v1/internal/middleware.py`

```python
def validate_file_upload(request):
    """
    Optional middleware to validate file uploads
    before they reach the ViewSet
    """
    if request.method == 'POST' and 'file' in request.FILES:
        file_obj = request.FILES['file']
        
        # Check file size (50MB = 52428800 bytes)
        MAX_FILE_SIZE = 52428800
        if file_obj.size > MAX_FILE_SIZE:
            raise ValueError(f"File size {file_obj.size} exceeds maximum {MAX_FILE_SIZE}")
        
        # Check MIME type
        ALLOWED_MIMES = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed',
            'image/jpeg',
            'image/png',
            'image/gif',
            'video/mp4',
            'video/x-msvideo',
            'video/quicktime',
            'video/x-matroska'
        ]
        
        if file_obj.content_type not in ALLOWED_MIMES:
            raise ValueError(f"File type {file_obj.content_type} not allowed")
    
    return request
```

**Note:** This is optional - can also be done in ViewSet

---

### Step 6: URL Configuration Setup

**File:** `backend/apps/api/urls.py` (if main file)

```python
from django.urls import path, include

urlpatterns = [
    path('v1/internal/', include('apps.api.v1.internal.urls')),
    path('v1/public/', include('apps.api.v1.public.urls')),
]
```

**Or in main project settings:**

```python
# In main urls.py
from django.urls import path, include

urlpatterns = [
    path('api/', include('apps.api.urls')),
]
```

**Checklist:**
- [ ] URLs properly nested
- [ ] File endpoints accessible at /api/v1/internal/articles/{id}/files/
- [ ] No URL conflicts

---

## 🧪 TESTING ENDPOINTS

### Test 1: List Files (Before Upload)
```bash
curl -X GET http://localhost:8000/api/v1/internal/articles/1/files/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with empty list []
```

### Test 2: Upload File
```bash
curl -X POST http://localhost:8000/api/v1/internal/articles/1/files/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "description_en=Test file" \
  -F "description_id=File uji"

# Expected: 201 Created with file object
```

### Test 3: List Files (After Upload)
```bash
curl -X GET http://localhost:8000/api/v1/internal/articles/1/files/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with file list
```

### Test 4: Update File Description
```bash
curl -X PATCH http://localhost:8000/api/v1/internal/articles/1/files/1/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description_en": "Updated description"}'

# Expected: 200 OK with updated file
```

### Test 5: Delete File
```bash
curl -X DELETE http://localhost:8000/api/v1/internal/articles/1/files/1/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 204 No Content
```

### Test 6: Reorder Files
```bash
curl -X POST http://localhost:8000/api/v1/internal/articles/1/files/reorder/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"file_ids": [2, 1, 3]}'

# Expected: 200 OK with reordered file list
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Create Files
- [ ] FileSerializer created in serializers.py
- [ ] FileViewSet created in viewsets.py
- [ ] URL routes added in urls.py
- [ ] File model verified in models.py

### Phase 2: Test Endpoints
- [ ] List files endpoint works
- [ ] Upload file endpoint works
- [ ] Update file endpoint works
- [ ] Delete file endpoint works
- [ ] Reorder files endpoint works

### Phase 3: Verify Data
- [ ] Files stored in database
- [ ] Files stored in correct directory (articles/%Y/%m/)
- [ ] File metadata captured (size, MIME type)
- [ ] Files associated with correct article
- [ ] Files deleted when article deleted

### Phase 4: Permission Checks
- [ ] Only article author can manage files
- [ ] Staff can manage all files
- [ ] Non-author cannot delete files
- [ ] 401 error for unauthenticated
- [ ] 403 error for non-author

### Phase 5: Error Handling
- [ ] 400 Bad Request for invalid data
- [ ] 404 Not Found for non-existent file
- [ ] 413 Payload Too Large for files > 50MB
- [ ] Error messages are helpful
- [ ] Errors translate to frontend

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] FILE_UPLOAD_MAX_MEMORY_SIZE >= 50MB in settings
- [ ] FILE_UPLOAD_DIRECTORY_PERMISSIONS set correctly
- [ ] MEDIA_ROOT configured properly
- [ ] MEDIA_URL set for serving files
- [ ] File storage backend configured
- [ ] Migrations run: `python manage.py migrate`
- [ ] Static/media files collected (if applicable)
- [ ] Tests pass: `python manage.py test`
- [ ] No console errors or warnings

---

## 📊 PERFORMANCE CONSIDERATIONS

### File Size Handling
```python
# In settings.py
FILE_UPLOAD_MAX_MEMORY_SIZE = 52428800  # 50MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 52428800   # 50MB
```

### Query Optimization
```python
# In ViewSet get_queryset
# Already uses select_related for article if needed
queryset = File.objects.filter(
    article_id=article_id
).select_related('uploaded_by').order_by('order_index')
```

### Pagination (Optional for future)
```python
# Add to ViewSet if files list gets large
pagination_class = PageNumberPagination
paginate_by = 50
```

---

## 🐛 COMMON ISSUES & FIXES

### Issue 1: 404 on Upload Endpoint
**Solution:** Check URL pattern is correct
```python
# In urls.py - should be nested with article_id
router.register(
    r'articles/(?P<article_id>\d+)/files',
    FileViewSet,
    basename='article-files'
)
```

### Issue 2: 400 Bad Request - Invalid file
**Solution:** Check serializer create method
```python
# Make sure to set file_size and mime_type
def create(self, validated_data):
    file_obj = validated_data.get('file')
    validated_data['file_size'] = file_obj.size
    validated_data['mime_type'] = file_obj.content_type
    return super().create(validated_data)
```

### Issue 3: Permission Denied (403)
**Solution:** Check user is article author
```python
# In get_article() method
if article.author != self.request.user and not self.request.user.is_staff:
    self.permission_denied(self.request)
```

### Issue 4: Files Not Deleting from Storage
**Solution:** Override perform_destroy
```python
def perform_destroy(self, instance):
    if instance.file:
        instance.file.delete(save=False)
    instance.delete()
```

---

## ⏱️ TIME ESTIMATE

| Task | Time | Status |
|------|------|--------|
| Create FileSerializer | 15 min | ⏳ |
| Create FileViewSet | 30 min | ⏳ |
| Add URL routes | 10 min | ⏳ |
| Verify File model | 10 min | ⏳ |
| Test endpoints | 30 min | ⏳ |
| Permission checks | 15 min | ⏳ |
| Error handling | 20 min | ⏳ |
| **Total** | **2-2.5 hours** | ⏳ |

---

## ✨ FINAL NOTES

1. **Frontend is Ready:** No changes needed - all API methods already exist in frontend
2. **Database:** File model exists, just needs endpoints
3. **Authentication:** JWT already working, endpoints will use it automatically
4. **Testing:** Manual curl tests above cover all operations
5. **Deployment:** Make sure settings.py has FILE_UPLOAD_MAX_MEMORY_SIZE set

---

## 📞 SUPPORT RESOURCES

- **Django REST Framework Docs:** https://www.django-rest-framework.org/
- **File Uploads:** https://docs.djangoproject.com/en/3.2/topics/files/
- **Permissions:** https://www.django-rest-framework.org/api-guide/permissions/
- **ViewSets:** https://www.django-rest-framework.org/api-guide/viewsets/

---

**This guide should take 2-3 hours to implement completely. After this, Phase 1 will be 100% complete and ready for user testing.**
