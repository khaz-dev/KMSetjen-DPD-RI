# Lampiran File Section Not Loading Immediately - ROOT CAUSE ANALYSIS

**Issue:** File section not appearing immediately when editing articles (`/editor/25`) - requires save and reload

**Date:** March 31, 2026

---

## Executive Summary

The Lampiran File section doesn't appear immediately on existing articles because:

1. **First issue:** After creating a new article, `window.history.replaceState()` changes the browser URL but React Router doesn't update `useParams()` correspondingly
2. **Second issue:** The file loading happens asynchronously, but the section visibility logic might have timing issues

---

## ROOT CAUSE: URL Change Not Reflected in useParams()

### The Problem (Line 261)

**File:** `frontend/src/pages/ArticleEditorPage.jsx`

```javascript
// After saving a new article:
if (!id) {
  window.history.replaceState(null, '', `/editor/${data.id}`);
  //                          ↑ Browser URL changes here
  //                          But React Router doesn't know!
}
```

### What Happens

```
1. User creates new article (/editor)
   ├─ useParams().id = undefined
   ├─ formData.id = null (initially)
   └─ File section: HIDDEN (correct - no article yet)

2. User clicks "Save Draft"
   ├─ API response: { id: 123, title: "..." }
   ├─ setFormData(..., id: 123) ✓
   ├─ window.history.replaceState(_, _, '/editor/123') 
   │  └─ Browser URL: /editor/123 ✓
   ├─ BUT useParams().id = still undefined ❌ (React Router not updated!)
   └─ File section condition: (undefined || 123) = 123 ✓ SHOULD show

3. After save completes
   ├─ File section: VISIBLE ✓ (because formData.id = 123)
   ├─ Files load: ✓ (via internalAPI.getArticleFiles using formData.id)
   └─ Everything works!

4. BUT if user reloads page
   ├─ Browser URL: /editor/123 (from address bar)
   ├─ useParams().id = "123" ✓ (NOW React Router reads it)
   ├─ loadArticle() called ✓
   └─ Files load ✓
```

### Why This Is Confusing

The condition I fixed previously:
```javascript
{(id || formData.id) && (
```

This SHOULD work because `formData.id` is set. But there are two issues:

1. **Initial render timing:** While `loadArticle()` is running, `loading` is true, so nothing renders (line 708)
2. **React Router not synced:** The URL in the browser doesn't match what `useParams()` reports

---

## THE REAL FIX

Use `navigate()` from React Router instead of `window.history.replaceState()`:

### Current Code (Line 261)
```javascript
if (!id) {
  window.history.replaceState(null, '', `/editor/${data.id}`);
}
```

### Fixed Code
```javascript
if (!id && navigate) {
  navigate(`/editor/${data.id}`, { replace: true });
}
```

### Why This Works

1. **React Router synced:** `navigate()` updates React Router's internal state
2. **useParams() updates:** Next call to `useParams()` returns the new `id`
3. **URL in sync:** Browser URL matches what React Router knows
4. **No page reload:** The `{ replace: true }` option doesn't reload the page
5. **Clean flow:**
   - After save: navigate to `/editor/123`
   - React Router updates
   - `useParams()` now has `id = "123"`
   - File section renders immediately with the correct ID
   - `loadArticle()` is called (if needed)

---

## IMPLEMENTATION

### Change 1: Use navigate() Instead of window.history.replaceState()

**File:** `frontend/src/pages/ArticleEditorPage.jsx` (Line 261)

```javascript
// ❌ BEFORE
if (!id) {
  window.history.replaceState(null, '', `/editor/${data.id}`);
}

// ✅ AFTER
if (!id && navigate) {
  navigate(`/editor/${data.id}`, { replace: true });
}
```

### Change 2: Keep the simplified condition (already fixed)

```javascript
{(id || formData.id) && (  // ✅ Works with both URL id and formData.id
```

---

## Alternative: Completely Different Approach

If you want to avoid navigation complexity, you could:

```javascript
if (!id) {
  // Use formData.id only
  // Don't change the URL at all
  // Window stays at /editor
}
```

But this is less clean because:
- Users can't share the link to the specific article
- Browser history is confusing
- Better to use `navigate()` which is the React Router way

---

## COMPLETE FLOW AFTER FIX

### Scenario 1: Creating New Article

```
1. User visits /editor
   ├─ id = undefined (from URL)
   ├─ formData.id = null
   ├─ File section: HIDDEN ✓ (correct)

2. User fills form + clicks "Save Draft"
   ├─ API creates article: { id: 123 }
   ├─ setFormData(..., id: 123) ✓
   ├─ navigate('/editor/123', { replace: true }) ✓
   │  └─ URL bar now shows: /editor/123
   │  └─ React Router state updated
   ├─ useParams() now returns: { id: '123' }
   ├─ Component re-renders with new params
   └─ File section: VISIBLE IMMEDIATELY ✓

3. formData.id = 123 + id from useParams = '123'
   ├─ Condition: ('123' || 123) = true ✓
   ├─ Files load via internalAPI.getArticleFiles('123')
   ├─ Files display
   └─ User can add attachments immediately ✓
```

### Scenario 2: Editing Existing Article

```
1. User visits /editor/25 (existing article)
   ├─ id = '25' (from URL)
   ├─ formData.id = null (initially)
   ├─ File section: VISIBLE ✓ (because id = '25')
   ├─ loading = true (showing spinner)

2. loadArticle() runs
   ├─ Fetches article data
   ├─ Sets formData with all fields
   ├─ Calls internalAPI.getArticleFiles('25')
   ├─ Sets files state
   ├─ loading = false

3. Form renders with files
   ├─ File section: VISIBLE ✓
   ├─ Files list: POPULATED ✓
   └─ User can modify/delete files immediately ✓
```

---

## TESTING CHECKLIST

After implementing the fix:

- [ ] Create new article at `/editor`
- [ ] File section is hidden ✓
- [ ] Fill title and category
- [ ] Click "Save Draft"
- [ ] **File section appears immediately** (NO NEED TO RELOAD) ✅
- [ ] URL changes to `/editor/123` ✓
- [ ] Can upload files ✓
- [ ] Visit `/editor/25` (existing article)
- [ ] **File section appears immediately** ✅
- [ ] Files loaded from server ✓
- [ ] Can delete/modify files ✓
- [ ] Refresh page - everything persists ✓

---

## Why Using navigate() Is Better

| Method | Advantage | Disadvantage |
|--------|-----------|--------------|
| `window.history.replaceState()` | Direct control | React Router doesn't know, `useParams()` out of sync |
| `navigate(..., { replace: true })` | React Router synced, clean, idiomatic | None |

React Router's `navigate()` is the recommended way because it keeps the entire routing system in sync.

---

## Summary

| Issue | Root Cause | Fix | Impact |
|-------|-----------|-----|--------|
| File section not showing after creating article | URL changed but React Router not updated | Use `navigate()` instead of `window.history.replaceState()` | Files appear immediately after save, no reload needed |
| Could happen on existing articles too | Timing/loading issues | Ensure condition includes both `id` and `formData.id` | Robust file section visibility |
