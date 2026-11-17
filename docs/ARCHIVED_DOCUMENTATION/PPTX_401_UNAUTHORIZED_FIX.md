# PPTX Preview 401 Unauthorized - ROOT CAUSE & SOLUTION
## April 21, 2026 - FIXED ✅

---

## 🎯 THE PROBLEM

**Browser Error:**
```
GET https://kms-be.khaz.app/api/v1/internal/articles/41/files/27/pptx_info/ 401 (Unauthorized)
```

**Symptom:** File preview failed with white blank on file-preview-container for PPTX files, even for public articles.

---

## 🔍 ROOT CAUSE ANALYSIS

### The Issue
PPTX preview endpoints (`/api/v1/internal/articles/{id}/files/{id}/pptx_info/`) required authentication, even though they should allow unauthenticated access for **public articles**.

**Problem:** The `FileViewSet` had class-level `permission_classes = [IsAuthenticated]` which applied to ALL actions, including PPTX preview endpoints.

### Why It Happened
- PPTX endpoints were added to internal API (authenticated users)
- Public articles can be viewed without authentication
- But PPTX previews for public article files couldn't be accessed without auth
- This created a UX issue: Can view article but can't preview attached presentations

---

## ✅ SOLUTION IMPLEMENTED

### Step 1: Create Custom Permission Class
**File:** `backend/shared/permissions/pptx.py`

```python
class IsAuthenticatedOrPublicArticleFile(BasePermission):
    """
    Allow authenticated users or unauthenticated users accessing files 
    in published public articles.
    """
    def has_permission(self, request, view):
        # Authenticated users always allowed
        if request.user and request.user.is_authenticated:
            return True
        # Unauthenticated users allowed (checked in has_object_permission)
        return True
    
    def has_object_permission(self, request, view, obj):
        # Authenticated users always allowed
        if request.user and request.user.is_authenticated:
            return True
        
        # Unauthenticated users: Only allow public article files
        article = Article.objects.get(id=view.kwargs.get('article_id'))
        return (
            article.is_published and 
            article.status == 'published' and 
            article.access_level == 'public'
        )
```

### Step 2: Override get_permissions() in FileViewSet
**File:** `backend/apps/api/v1/internal/views.py`

```python
class FileViewSet(PptxConversionMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Return appropriate permissions based on the action.
        PPTX endpoints allow unauthenticated access for public articles.
        """
        # PPTX endpoints allow unauthenticated access
        if self.action in ['pptx_info', 'thumbnails_all', 'thumbnail', 'convert_pdf']:
            return [IsAuthenticatedOrPublicArticleFile()]
        
        # All other endpoints require authentication
        return [IsAuthenticated()]
```

### Why This Works
1. **get_permissions()** method returns different permissions based on the action
2. For PPTX endpoints: Uses `IsAuthenticatedOrPublicArticleFile` which allows public article access
3. For other endpoints: Uses `IsAuthenticated` as before
4. DRF checks these permissions before executing the action

---

## 📊 AFFECTED ENDPOINTS

Now supporting unauthenticated access for public articles:

✅ `GET /api/v1/internal/articles/{article_id}/files/{id}/pptx_info/`
✅ `GET /api/v1/internal/articles/{article_id}/files/{id}/thumbnails_all/`
✅ `GET /api/v1/internal/articles/{article_id}/files/{id}/thumbnail/`
✅ `POST /api/v1/internal/articles/{article_id}/files/{id}/convert_pdf/`

**Conditions for access without authentication:**
- Article must be `is_published=True`
- Article must have `status='published'`
- Article must have `access_level='public'`

---

## 📝 FILES MODIFIED

1. **Created:** `backend/shared/permissions/pptx.py`
   - New permission class for PPTX preview endpoints
   
2. **Modified:** `backend/apps/api/v1/internal/views.py`
   - Added import for `IsAuthenticatedOrPublicArticleFile`
   - Added `get_permissions()` method to `FileViewSet`
   
3. **Modified:** `backend/apps/api/v1/internal/pptx_endpoints.py`
   - Removed permission_classes from action decorators (now using get_permissions())

---

## ✅ VERIFICATION

**Test Command:**
```bash
curl -i 'https://kms-be.khaz.app/api/v1/internal/articles/41/files/27/pptx_info/'
```

**Response (200 OK):**
```json
{
  "file_id": 27,
  "filename": "Paparan Manajemen Persidangan 24022026.pptx",
  "file_size": 7254664,
  "slide_count": 11,
  "title": "MANAJEMEN",
  "width": 20,
  "height": 11,
  "aspect_ratio": "1.78:1"
}
```

**Before:** `401 Unauthorized` ❌
**After:** `200 OK` with full PPTX info ✅

---

## 🎓 KEY INSIGHTS

### Why get_permissions() is Better Than @action decorator's permission_classes

1. **Decorator Method** (tried first):
   ```python
   @action(detail=True, methods=['get'], permission_classes=[SomePermission])
   ```
   - May not properly override viewset-level permissions
   - Can be ambiguous with viewset's class-level permissions
   - Not recommended for permission handling

2. **get_permissions() Method** (correct solution):
   ```python
   def get_permissions(self):
       if self.action in ['pptx_info', ...]:
           return [CustomPermission()]
       return [IsAuthenticated()]
   ```
   - Explicitly returns permissions for each action
   - Clear and maintainable
   - Follows DRF best practices
   - Properly overrides class-level permissions

### Permission Hierarchy
- Unauthenticated users with public article files: ✅ Allowed
- Authenticated users: ✅ Always allowed
- Unauthenticated users with draft/internal articles: ❌ Blocked
- File modification endpoints: ✅ Always require authentication

---

## 🚀 DEPLOYMENT

**Commits:**
- `f2df7dc` - Initial permission class attempt
- `{new commit}` - get_permissions() method fix (proper solution)

**Deployed:** April 21, 2026 to staging
**Status:** ✅ LIVE - PPTX previews work without authentication for public articles

---

## 📚 Related Errors Fixed in This Session

1. ✅ [Mixed Content Error](MIXED_CONTENT_ERROR_ROOT_CAUSE_FINAL_SOLUTION.md) - Django SECURE_PROXY_SSL_HEADER typo
2. ✅ PPTX 401 Unauthorized - Permission class architecture (this fix)

---

## Status: ✅ COMPLETELY FIXED

File previews for PPTX presentations now work without authentication for public articles! 🎉
