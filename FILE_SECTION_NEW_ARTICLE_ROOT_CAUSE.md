# File Section Not Showing on New Article Editor - ROOT CAUSE ANALYSIS

**Issue:** File section (Lampiran) doesn't appear on `/editor` when creating new articles. It only appears AFTER clicking "Save Draft" first.

**Date:** March 31, 2026

---

## Executive Summary

The file section is intentionally hidden when creating new articles because:

1. **Visibility Condition (Line 1023):** Only shows if article has ID
```javascript
{(id || formData.id) && (
```

2. **Upload Requirement (Line 459-462):** Backend requires article to exist before file upload
```javascript
if (!file || !id) {
  setError('t:errors.save_article_first');
  return;
}
```

**Problem:** This creates poor UX - users must save first before uploading files, even though they're still drafting.

---

## ROOT CAUSE

### Issue 1: File Section Hidden for New Articles
**Location:** `frontend/src/pages/ArticleEditorPage.jsx` (Line 1023)

The condition checks if article exists:
```javascript
{(id || formData.id) && (  // ← Both undefined for NEW articles
  <Form.Group className="mb-4">
```

**Impact:** File section not visible when user first opens `/editor`

### Issue 2: Backend Requires Article First
**Location:** `frontend/src/pages/ArticleEditorPage.jsx` (Line 459-462)

Upload handler checks:
```javascript
if (!file || !id) {
  setError('t:errors.save_article_first');  // ← User must save first
  return;
}
```

**Impact:** Even if section was visible, file upload would fail

### Issue 3: Backend API Design
The file upload endpoint requires article ID: `/api/v1/internal/articles/{articleId}/files/`

**Impact:** Can't upload files until article is created in database

---

## THE FIX STRATEGY

### Option A: Always Show File Section + Auto-Save on First Upload (RECOMMENDED)

**Approach:**
1. **Always show file section** - remove the visibility condition
2. **Auto-save article** when user tries to upload on new article
3. **Then upload the file** to the newly created article

**Steps:**
1. Change condition to always show file section:
```javascript
// Remove: {(id || formData.id) && (
// Add: {(
```

2. Modify `handleFileUpload` to auto-save first:
```javascript
if (!id && !formData.id) {
  // Auto-save article first
  const savedArticle = await saveDraft();
  articleIdForUpload = savedArticle.id;
} else {
  articleIdForUpload = id || formData.id;
}
// Then upload file using articleIdForUpload
```

**Pros:**
- ✅ File section visible immediately
- ✅ Users can start drafting with files in mind
- ✅ Seamless UX - auto-save on demand
- ✅ No new backend changes needed

**Cons:**
- ⚠️ Auto-save might create empty articles if user changes mind
- ⚠️ Need to handle validation (title, category required)

### Option B: Hide Until User Actions

**Don't change anything** - this is current behavior

**Pros:**
- ✅ No empty articles created
- ✅ Simple - no new logic needed

**Cons:**
- ❌ Poor UX - must save before uploading
- ❌ Not intuitive for users

---

## IMPLEMENTATION: Option A (Recommended)

### Change 1: Always Show File Section

**File:** `frontend/src/pages/ArticleEditorPage.jsx` (Line 1023)

```javascript
// ❌ BEFORE
{(id || formData.id) && (

// ✅ AFTER
{(
```

This always shows the file section, even for new articles.

### Change 2: Auto-Save Before Upload

**File:** `frontend/src/pages/ArticleEditorPage.jsx` (Line 457-485)

```javascript
const handleFileUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) {
    return;
  }

  // If article doesn't exist yet, save it first
  let articleId = id || formData.id;
  if (!articleId) {
    try {
      // Auto-save the article first
      const savedData = await saveDraft();
      articleId = savedData?.id;
      if (!articleId) {
        setError('t:errors.failed_create_article_for_upload');
        return;
      }
    } catch (err) {
      setError('t:errors.save_article_first');
      return;
    }
  }

  // Validate file size
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    setError('t:errors.file_too_large_50mb');
    return;
  }

  try {
    setFileUploading(true);
    const response = await internalAPI.uploadFile(articleId, file);
    const uploadedFile = response.data || response;
    setFiles(prev => [...prev, uploadedFile]);
    setError('');
  } catch (err) {
    console.error('File upload error:', err);
    setError('t:errors.file_upload_failed');
  } finally {
    setFileUploading(false);
    e.target.value = '';
  }
};
```

### Change 3: Fix Delete Function

**File:** `frontend/src/pages/ArticleEditorPage.jsx` (Line 500-515)

The delete function also needs the same fix:

```javascript
const confirmFileDelete = async () => {
  const delId = id || formData.id;
  if (!delId || !deleteFileId) return;

  try {
    setDeletingFile(true);
    await internalAPI.deleteFile(delId, deleteFileId);
    setFiles(prev => prev.filter(f => f.id !== deleteFileId));
    setShowDeleteFileModal(false);
    setDeleteFileId(null);
  } catch (err) {
    console.error('File delete error:', err);
    setError('t:errors.file_delete_failed');
  } finally {
    setDeletingFile(false);
  }
};
```

---

## EXPECTED BEHAVIOR AFTER FIX

### New Article Creation User Flow

```
1. User clicks "Buat Pengetahuan" button
   └─ Navigates to /editor

2. Page loads
   ├─ File section: VISIBLE ✅ (always shown now)
   ├─ Upload input: ENABLED ✅
   └─ "No files uploaded" message shows

3. User starts filling form (title, category)
   └─ Can upload files at any point (even if incomplete)

4. User clicks file upload while still drafting
   ├─ API response lacks title validation error
   └─ Suggests continuing or completing form first

5. User adds title and category, then tries uploading
   ├─ Auto-save triggered silently
   ├─ Article created in database
   ├─ File uploaded to article
   ├─ Success message
   └─ File appears in list ✅

6. User can keep uploading more files
   ├─ Subsequent uploads work normally (id exists)
   └─ No more auto-save needed

7. User finishes draft
   ├─ All files already uploaded
   ├─ Click "Save Draft" to finalize
   └─ Article complete with files ✅
```

---

## POTENTIAL ISSUES & MITIGATION

### Issue 1: Auto-Save Creates Incomplete Draft
**Problem:** If user uploads file but never completes article, incomplete draft exists

**Mitigation:**
- This is actually fine - it's still a draft
- User can delete it or complete it later
- Better than preventing file upload

### Issue 2: Duplicate Article Creation
**Problem:** What if saveDraft() is called twice?

**Mitigation:**
```javascript
if (!id && !formData.id) {
  // Only auto-save if no ID yet
  // saveDraft() will set formData.id
  // Second call will use the existing ID
}
```

### Issue 3: Validation Errors on Auto-Save
**Problem:** Title/category required for save, but user might not have filled them

**Solution:** Show error message:
```javascript
"Harap isi Judul dan Kategori terlebih dahulu sebelum upload file"
(Please fill Title and Category first before uploading files)
```

---

## TESTING CHECKLIST

✅ After implementing:

- [ ] Open `/editor` (new article)
- [ ] **File section visible immediately** ✅
- [ ] **Upload input enabled** ✅
- [ ] Try uploading without title/category
- [ ] **Friendly error message** ✅
- [ ] Fill title and category
- [ ] Try uploading again
- [ ] **Auto-save triggered** ✅
- [ ] **URL changes to /editor/123** ✅
- [ ] **File uploaded successfully** ✅
- [ ] Upload another file
- [ ] **Works without auto-save (article exists)** ✅
- [ ] Refresh page
- [ ] **Files persist** ✅

---

## Summary

| Item | Current | After Fix |
|------|---------|-----------|
| File section on `/editor` | Hidden | **Visible** ✅ |
| Can upload before save | ❌ No | **Yes** ✅ |
| User experience | Must save first | Can work naturally ✅ |
| Auto-save on upload | No | **Yes** ✅ |
| Backend calls | Same | Same ✅ |

The fix improves UX significantly without backend changes!
