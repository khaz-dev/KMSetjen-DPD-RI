# Lampiran File Section Missing - ROOT CAUSE ANALYSIS

**Issue:** The "Lampiran File" (File Attachment) section is missing/not visible on the editor page at `http://localhost:5175/editor`

**Date:** March 31, 2026  
**Component:** [frontend/src/pages/ArticleEditorPage.jsx](frontend/src/pages/ArticleEditorPage.jsx)

---

## Executive Summary

The Lampiran File section is **conditionally hidden** based on whether the article has been created yet. The bug is in the **logic that determines when to show the file upload section**.

### The Problem
```
URL: http://localhost:5175/editor (NEW article, no ID)
Expected: ✅ File upload section should be available
Reality:  ❌ File upload section is HIDDEN
```

---

## ROOT CAUSE ANALYSIS

### The Buggy Condition (Line 1014)

**File:** `frontend/src/pages/ArticleEditorPage.jsx` (Lines 1014-1020)

```jsx
{/* File Manager */}
{id && (
  <Form.Group className="mb-4">
    <Form.Label>{t('editor.file_attachments')}</Form.Label>
    {/* File upload content... */}
  </Form.Group>
)}
```

### Why This Is A Bug

The condition `{id && (` checks if a URL parameter `id` exists:

```javascript
const { id } = useParams();  // Line 35
```

This means:
- ✅ When URL is `/editor/123` → `id = "123"` → File section **SHOWS**
- ❌ When URL is `/editor` → `id = undefined` → File section **HIDDEN**

### However...

When you save a new article as a draft, the backend creates it and returns an ID, BUT:

1. The URL is updated: `/editor` → `/editor/{id}` (Line 257)
2. **BUT** the React component's `id` state from `useParams()` is NOT re-read
3. **So** the file section remains hidden even though the article exists

---

## THE DATA FLOW

### Scenario: Creating a New Article

```
1. User visits: http://localhost:5175/editor
   ├─ useParams() extracts: id = undefined
   ├─ File section condition: {undefined && (...)} = false
   └─ Result: File section HIDDEN ❌

2. User fills in form and clicks "Save Draft"
   ├─ saveDraft() is called
   ├─ POST /api/v1/internal/articles/ (no ID, creating new)
   ├─ Backend creates article and returns: { id: 123, title_id: "...", ... }
   ├─ URL updated: window.history.replaceState(..., `/editor/123`)
   ├─ BUT formData.id is NOT updated (stays null)
   └─ BUT useParams() is NOT re-read by component
   
3. After save:
   ├─ URL in browser: /editor/123 ✅
   ├─ useParams().id: still undefined ❌ (not re-read!)
   ├─ File section condition: {undefined && (...)} = false
   └─ File section STILL HIDDEN ❌
```

---

## CODE ANALYSIS

### The Saving Logic (Lines 141-265)

When a new article is created:

```javascript
const response = await fetch(
  id ? `${apiBaseUrl}/v1/internal/articles/${id}/` : `${apiBaseUrl}/v1/internal/articles/`,
  {
    method: id ? 'PUT' : 'POST',  // ← POST for new articles
    headers,
    body: requestBody
  }
);

const data = await response.json();

// Update URL if creating new article
if (!id) {
  window.history.replaceState(null, '', `/editor/${data.id}`);  // ← URL changed
}

return data;
```

**Problem:** The URL is changed, but:
- `id` from `useParams()` is not re-read
- The component doesn't know the article was created
- File upload remains hidden

### The Buggy Condition (Line 1014)

```javascript
{id && (  // ← This checks URL param, not whether article exists
  <Form.Group className="mb-4">
```

---

## Why This Happens

### Root Technical Issues

1. **Using URL parameter instead of state**: The component uses `id` from `useParams()`, which is only read once at component mount
2. **URL change doesn't trigger re-read**: Changing `window.history.replaceState()` doesn't cause `useParams()` to update
3. **No state update after save**: The component doesn't update its own state to reflect that an article was created

### The Defensive Layer Failure

The component should track article creation through state:

```javascript
// ❌ CURRENT: Only checks URL param
{id && (...)}

// ✅ SHOULD BE: Check if article was created/loaded
{(id || formData.id) && (...)}  // ← Include formData.id
```

---

## THE FIX

### Solution 1: Use formData.id (RECOMMENDED - Simpler)

After saving the draft, update `formData.id` with the newly created ID:

**File:** `frontend/src/pages/ArticleEditorPage.jsx` (Lines 254-260)

Change from:
```javascript
const data = await response.json();
setLastSaved(new Date());
success(t('editor.draft_saved_success'));

// Update URL if creating new article
if (!id) {
  window.history.replaceState(null, '', `/editor/${data.id}`);
}

return data;
```

To:
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

return data;
```

Then change the condition (Line 1014):
```javascript
// ❌ OLD
{id && (

// ✅ NEW
{(id || formData.id) && (
```

### Solution 2: Use useEffect to Watch URL (Alternative)

Add this hook to sync `useParams()` into state:

```javascript
const [articleId, setArticleId] = useState(id);

useEffect(() => {
  setArticleId(id);
}, [id]);
```

Then use `articleId` instead of `id` in the condition.

---

## VERIFICATION CHECKLIST

After implementing the fix, verify:

- [ ] Visit `/editor` (new article)
- [ ] File upload section is visible ✅
- [ ] Enter title and category
- [ ] Click "Save Draft"
- [ ] Article is created with new ID ✅
- [ ] URL changes from `/editor` to `/editor/123` ✅
- [ ] File upload section is STILL visible ✅
- [ ] You can upload files ✅
- [ ] Refresh page - files persist ✅
- [ ] Go back to editing an existing article - files show ✅

---

## SUMMARY

| Aspect | Details |
|--------|---------|
| **Bug Type** | UI visibility / conditional rendering |
| **Location** | `frontend/src/pages/ArticleEditorPage.jsx` Line 1014 |
| **Root Cause** | File section hidden if URL param `id` is undefined |
| **Why It Happens** | New articles don't have URL `id` until after save, but condition isn't updated |
| **Impact** | Users can't upload files when creating new articles |
| **Fix Difficulty** | LOW - 2 simple changes |
| **Recommended Fix** | Update `formData.id` after save, change condition to `{(id \|\| formData.id) && (` |

---

## Code Changes Required

**File:** `frontend/src/pages/ArticleEditorPage.jsx`

### Change 1: Update formData.id after save (Line 254-258)
Add state update to preserve the new article ID

### Change 2: Update condition (Line 1014)
Change `{id && (` to `{(id || formData.id) && (`

That's it! Two simple changes will fix the issue.
