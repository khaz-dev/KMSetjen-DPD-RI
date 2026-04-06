# Delete Article Flow - Complete Analysis & Fix

## 📋 What Happens When User Clicks "Hapus" Button

User is on: `http://localhost:5175/dashboard`
User clicks "Hapus" button on an article

### Frontend Flow
1. User clicks "Hapus" button in article-item component
2. Delete confirmation modal appears
3. User confirms deletion
4. Frontend calls: `DELETE /api/v1/internal/articles/{article_id}/`

### Backend Flow (AFTER FIX)

```
DELETE /api/v1/internal/articles/{article_id}/
         ↓
ArticleViewSet.destroy(request, pk=article_id)
         ↓
Gets article instance from database
         ↓
Logs action in audit trail
         ↓
Calls perform_destroy(instance)
         ↓
Calls instance.delete()  [Article.delete() method]
         ↓
[CUSTOM LOGIC] Delete featured image from storage
         ↓
[CUSTOM LOGIC] Delete all file attachments from storage
         ↓
[DJANGO CASCADE] Delete article from database
         ↓
[DJANGO CASCADE] Delete all File objects associated with article
         ↓
Response 204 No Content
```

## 🎯 Impact on Draft Version

### Scenario: User deletes DRAFT article

**State Before Delete:**
```
Article (Draft)     - id: 100, version_type: 'draft'
  ├── image: featured_image.jpg
  └── files: [attachment1.pdf, attachment2.docx]

Article (Published) - id: 101, version_type: 'published', draft_article: 100
  ├── image: featured_image.jpg
  └── files: [attachment1.pdf, attachment2.docx]
```

**After Delete (WITH FIX):**
```
Article (Draft)     - ❌ DELETED
  ├── image: ❌ DELETED from storage
  └── files: ❌ DELETED from storage and DB

Article (Published) - ✅ REMAINS (draft_article now = NULL)
  ├── image: ✅ REMAINS in storage
  └── files: ✅ REMAIN in storage and DB
```

**Without our fix (old behavior):**
```
Article (Draft)     - ❌ DELETED
  ├── image: ❌ DELETED
  └── files: ❌ DELETED

Article (Published) - ❌ CASCADE DELETED (BUG!)
  ├── image: ❌ CASCADE DELETED (BUG!)
  └── files: ❌ CASCADE DELETED (BUG!)
```

## 🎯 Impact on Published Version

### Scenario: User deletes PUBLISHED article directly (via admin)

**State Before Delete:**
```
Article (Draft)     - id: 100, version_type: 'draft'
Article (Published) - id: 101, version_type: 'published', draft_article: 100
```

**After Delete:**
```
Article (Draft)     - ✅ REMAINS (unaffected)
Article (Published) - ❌ DELETED (expected)
```

The previous `draft_article` link is already broken (SET_NULL), so draft survives.

## 📁 Impact on Featured Image (Gambar Unggulan)

### Featured Image Storage Path
- Path format: `articles/article_{article_id}_image.{ext}`
- Example draft: `articles/article_100_image.jpg`
- Example published: `articles/article_101_image.jpg`

### When deleting Draft:
✅ **Before**: Delete draft → image from storage deleted ✓
✅ **After**: Delete draft → image from storage STILL deleted ✓ (no change in behavior)
✅ **Published image**: REMAINS in storage ✅ (different file path, not deleted)

### When deleting Published:
✅ **Delete published image**: Deleted from storage ✓
✅ **Draft image**: Remains intact ✅ (different file object)

## 📎 Impact on File Attachments (Lampiran File)

### File Storage Path
- Path format: `articles/%Y/%m/filename.ext` (by date)
- Each file is separate File object in database
- Each File has article foreign key

### When deleting Draft with Files:
1. **Storage cleanup** (via custom delete() method):
   - Reads all File objects where article_id = draft_id
   - For each file: delete from storage
   - Handles errors gracefully
   
2. **Database cleanup** (via Django CASCADE):
   - File objects deleted from DB
   - Text metadata deleted

3. **Result**:
   ✅ Draft files deleted from storage
   ✅ Published files REMAIN in storage
   ✅ Published File objects REMAIN in DB

### When deleting Published:
1. Published files deleted from storage
2. Published File objects deleted from DB
3. Draft files REMAIN

## 🔧 The Fix Explained

### Change 1: ForeignKey on_delete

```python
# BEFORE ❌
draft_article = models.OneToOneField(
    'self',
    on_delete=models.CASCADE,
    ...
)

# AFTER ✅
draft_article = models.OneToOneField(
    'self',
    on_delete=models.SET_NULL,
    ...
)
```

**Reason**: 
- CASCADE: When draft deleted, published (which points to draft) is deleted
- SET_NULL: When draft deleted, published.draft_article becomes NULL
- Result: Published article survives

### Change 2: Custom delete() Method

```python
def delete(self, *args, **kwargs):
    # 1. Delete featured image from storage
    if self.image:
        storage_path = self.image.name
        if storage_path:
            try:
                default_storage.delete(storage_path)
            except Exception:
                pass
    
    # 2. Delete all file attachments from storage
    for file_obj in self.files.all():
        if file_obj.file:
            try:
                file_obj.file.delete(save=False)
            except Exception:
                pass
    
    # 3. Let Django delete from database
    super().delete(*args, **kwargs)
```

**Benefits**:
- Ensures storage files are cleaned up BEFORE database deletion
- Prevents orphaned files in storage
- Error handling: one file error doesn't block other deletions
- Works for all article deletions

## 📊 Comparison Matrix

| Action | Draft Files | Published Files | Draft Article | Published Article |
|--------|------------|-----------------|----------------|-------------------|
| **Delete Draft (OLD)** | ❌ Deleted | ❌ Deleted | ❌ Deleted | ❌ Deleted |
| **Delete Draft (NEW)** | ✅ Deleted | ✅ Remains | ✅ Deleted | ✅ Remains |
| **Delete Published** | ✅ Remains | ❌ Deleted | ✅ Remains | ❌ Deleted |

## ✅ Testing Verification

Backend system checks: **PASS**
Database migration: **APPLIED**
Server startup: **SUCCESS**

### Manual Test Cases (recommended):

1. **Create draft → Create published → Delete draft**
   - ✅ Verify published version still exists
   - ✅ Verify published files still accessible
   - ✅ Verify draft files deleted

2. **Open published article in view**
   - ✅ Verify it still displays after draft deletion
   - ✅ Verify featured image shows
   - ✅ Verify file attachments downloadable

3. **Check database directly**
   - ✅ Verify published article record exists with draft_article = NULL
   - ✅ Verify published files exist in database
   - ✅ Verify featured image file exists in storage

## 🎓 Architecture Insight

### Version Linking Model
```
Draft (id: 100)
  │
  ├─→ published_version (reverse relation)
  │     └─→ Published (id: 101)
  │           └─→ draft_article: 100
  │
  ├─→ files: [File1, File2]
  │     └─→ stored in articles/2025/04/...
  │
  └─→ image: featured.jpg
        └─→ stored in articles/article_100_image.jpg

Published (id: 101)
  │
  ├─→ draft_article: 100 (forward relation)
  │
  ├─→ files: [File3, File4]
  │     └─→ stored in articles/2025/04/...
  │
  └─→ image: featured.jpg
        └─→ stored in articles/article_101_image.jpg
```

**Key Point**: Draft and Published have **separate** File objects and image files, so deleting one doesn't affect the other's files.
