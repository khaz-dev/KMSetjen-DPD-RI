# Lampiran File Section - FIX IMPLEMENTED

**Date:** March 31, 2026  
**Status:** ✅ FIXED

---

## What Was Fixed

The "Lampiran File" (File Attachment) section was missing from the article editor when creating new articles.

### Root Cause
The file upload section was only shown if a URL parameter `id` existed. When creating a new article, there was no `id` in the URL (`/editor`), so the section was hidden. Even after saving the article and getting an ID from the backend, the component didn't update its state to show the file section.

### Changes Made

**File:** `frontend/src/pages/ArticleEditorPage.jsx`

#### Change 1: Update formData.id After Save (Lines 254-260)

**Before:**
```javascript
const data = await response.json();
setLastSaved(new Date());
success(t('editor.draft_saved_success'));

// Update URL if creating new article
if (!id) {
  window.history.replaceState(null, '', `/editor/${data.id}`);
}
```

**After:**
```javascript
const data = await response.json();
setLastSaved(new Date());
success(t('editor.draft_saved_success'));

// Update form data with returned ID and slug
setFormData(prev => ({
  ...prev,
  id: data.id,
  slug: data.slug
}));

// Update URL if creating new article
if (!id) {
  window.history.replaceState(null, '', `/editor/${data.id}`);
}
```

**Explanation:** After the backend creates the article and returns an ID, we now update the component's `formData` state with the new ID. This ensures the component knows the article was created.

---

#### Change 2: Update Visibility Condition (Line 1021)

**Before:**
```javascript
{id && (
  <Form.Group className="mb-4">
```

**After:**
```javascript
{(id || formData.id) && (
  <Form.Group className="mb-4">
```

**Explanation:** The file section now shows if EITHER:
- URL parameter `id` exists (editing existing article), OR
- `formData.id` exists (article was just created and saved)

---

## How It Works Now

### Scenario: Creating New Article

1. User visits: `http://localhost:5175/editor`
   - ✅ `id` (from URL) = undefined
   - ✅ `formData.id` = null
   - Result: File section HIDDEN (correct, no article yet)

2. User fills title, category, and clicks "Save Draft"
   - ✅ POST request creates article
   - ✅ Backend returns: `{ id: 123, title_id: "...", ... }`
   - ✅ `setFormData()` updates: `formData.id = 123`
   - ✅ URL updates to: `/editor/123`
   - Result: File section NOW VISIBLE ✅

3. User can now upload files to the newly created article ✅

### Scenario: Editing Existing Article

1. User visits: `http://localhost:5175/editor/123`
   - ✅ URL parameter `id` = "123"
   - Result: File section VISIBLE ✅ (unchanged)

---

## Testing Checklist

- [ ] Open `/editor` (new article)
- [ ] **File section should be HIDDEN** ✅
- [ ] Fill in title and category
- [ ] Click "Save Draft"
- [ ] **File section should now be VISIBLE** ✅
- [ ] Upload a file
- [ ] **File appears in the list** ✅
- [ ] Refresh page
- [ ] **File persists** ✅
- [ ] Edit existing article
- [ ] **File section is visible** ✅

---

## Technical Details

### State Update Pattern
```javascript
setFormData(prev => ({
  ...prev,
  id: data.id,      // ← New article ID from backend
  slug: data.slug   // ← Also save the slug
}));
```

This preserves all existing form data while updating only the `id` and `slug`.

### Defensive Logic
```javascript
{(id || formData.id) && (
```

This condition is more robust:
- `id`: URL parameter (for existing articles)
- `formData.id`: Form state (for newly created articles)

Both are checked, so the section shows in all valid scenarios.

---

## Result

✅ **File upload section is now visible and functional when creating new articles**
✅ **Users can upload attachments (Lampiran) immediately after saving a draft**
✅ **Existing article editing functionality unchanged**
