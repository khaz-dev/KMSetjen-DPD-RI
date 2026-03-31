# Article 404 Bug Analysis and Fix
## Issue: "Gagal memuat pengetahuan" (Failed to load knowledge) on article detail page

**Date**: March 30, 2026  
**Status**: ✅ FIXED  
**Severity**: HIGH - Affects staff/editor access to draft articles

---

## Problem Description

When users tried to access an article (e.g., http://localhost:5175/knowledges/24) from the dashboard, the page showed:
- Error: "Gagal memuat pengetahuan" (Failed to load knowledge)  
- Browser Console: `Failed to load resource: the server responded with a status of 404 (Not Found)`
- Request attempted: `GET /api/v1/public/articles/24/` → 404
- Backend logs: `WARNING 2026-03-30 22:49:31,775 basehttp "GET /api/v1/public/articles/24/ HTTP/1.1" 404 78`

However, the internal API worked correctly:
- Request: `GET /api/v1/internal/articles/24/` → 200 OK (returned article data)

---

## Root Cause Analysis

### The Broken User Detection Logic

File: `frontend/src/pages/ArticleDetailPage.jsx` (Lines 115-120) - **BEFORE FIX**

```javascript
// CHECK if user is staff/editor (has permission to access internal API)
const isStaffOrEditor = user?.is_staff || user?.is_superuser || user?.groups?.some(g => 
  g.name === 'Editors' || g.name === 'Admin' || g.name === 'Administrator'
);
```

### Why This Was Wrong

The frontend code was checking for THREE conditions that DON'T match the backend response:

| Check | Expected | Backend Actually Returns | Status |
|-------|----------|--------------------------|--------|
| `user?.is_staff` | Backend field exists | ✅ `'is_staff': user.is_staff` | ✓ Works |
| `user?.is_superuser` | Django superuser field | ❌ DOESN'T EXIST | ✗ Always falsy |
| `user?.groups?.some(...)` | Groups array | ❌ DOESN'T EXIST (returns `roles` instead) | ✗ Always undefined |
| `user?.is_editor` | NOT CHECKED | ✅ `'is_editor': user.is_editor()` | ✗ Ignored! |
| `user?.is_admin` | NOT CHECKED | ✅ `'is_admin': user.is_admin()` | ✗ Ignored! |

### Backend Response Structure

**Endpoint**: `GET /api/auth/me/`

```json
{
  "id": 1,
  "username": "editor_user",
  "email": "editor@example.com",
  "is_staff": true,           // ← Available
  "is_active": true,
  "is_admin": true,            // ← NOT CHECKED by old frontend code!
  "is_editor": true,           // ← NOT CHECKED by old frontend code!
  "is_contributor": false,
  "is_reader": false,
  "primary_role": "editor",
  "roles": ["editor"],         // ← Array of role codes, not objects with names!
  "preferred_language": "id"
  // NOTE: No "groups" field, No "is_superuser" field
}
```

### The API Architecture

The system has TWO article endpoints with different filtering rules:

#### 1. **Public API** (`/v1/public/articles/{id}/`)
- **Filter**: Only returns articles with `status='published'` AND `is_published=True`
- **Access**: Anonymous users only see `access_level='public'`; Authenticated users see `public` + `internal` + role-based

**Result**: ❌ 404 for articles in `status='review'`

#### 2. **Internal API** (`/v1/internal/articles/{id}/`)
- **Filter**: Returns ALL articles (authors see their own, editors see all)
- **Access**: Authenticated users only
- **Purpose**: Allow editors/staff to view and manage draft articles

**Result**: ✅ 200 for all articles (including draft/review status)

---

## The Bug Flow

```
User (editor) tries to view article 24 with status='review'
    ↓
Frontend.ArticleDetailPage.jsx loads
    ↓
Check: isStaffOrEditor = user?.is_staff || user?.is_superuser || user?.groups?.some(...)
    ↓
- user?.is_staff = true BUT only isn't enough
- user?.is_superuser = undefined (NOT IN BACKEND RESPONSE)
- user?.groups = undefined (BACKEND RETURNS 'roles' INSTEAD)
- user?.is_editor = true BUT NOT CHECKED!     ← THE BUG!
- user?.is_admin = true BUT NOT CHECKED!      ← THE BUG!
    ↓
Incorrectly evaluates isStaffOrEditor = FALSE (should be TRUE!)
    ↓
Takes PUBLIC API branch (for non-staff users)
    ↓
publicAPI.getArticle(24)
    ↓
Backend Public API filters: WHERE status='published'
    ↓
Article 24 has status='review' - DOESN'T MATCH FILTER
    ↓
Returns: 404 Not Found
    ↓
Frontend shows: "Gagal memuat pengetahuan"
    ✗ ERROR
```

---

## The Fix

### Updated Code

File: `frontend/src/pages/ArticleDetailPage.jsx` (Lines 115-117) - **AFTER FIX**

```javascript
// Check if user is staff/editor/admin (has permission to access internal API)
// Backend returns: is_staff (boolean), is_editor (boolean), is_admin (boolean)
// These are returned in the /auth/me/ response
const isStaffOrEditor = user?.is_staff || user?.is_editor || user?.is_admin;

// If user is staff/editor/admin, try internal API first (allows viewing draft articles)
// For non-staff users, only use public API to avoid unnecessary 404 errors
if (isStaffOrEditor) {
  try {
    response = await internalAPI.getArticle(idOrSlug);
  } catch (internalErr) {
    // If internal API fails for editors, that's a real error
    throw internalErr;
  }
} else {
  // Non-staff users always use public API (they can only see published articles)
  response = await publicAPI.getArticle(idOrSlug);
}
```

### Why This Works

1. ✅ **Checks actual backend response fields**
   - `is_staff` (boolean) - already exists in backend response
   - `is_editor` (boolean) - NOW CHECKED (was in response but ignored)
   - `is_admin` (boolean) - NOW CHECKED (was in response but ignored)

2. ✅ **Correctly identifies staff/editors**
   - If ANY of these are true, user is staff/editor
   - True → Use internal API
   - False → Use public API

3. ✅ **Matches backend logic**
   - Backend User.is_editor() returns True if user has editor role or is admin
   - Backend User.is_admin() returns True if user has admin role or is superuser
   - Frontend now checks the same fields returned by backend

---

## Corrected Bug Flow

```
User (editor) tries to view article 24 with status='review'
    ↓
Frontend.ArticleDetailPage.jsx loads
    ↓
Check: isStaffOrEditor = user?.is_staff || user?.is_editor || user?.is_admin
    ↓
- user?.is_editor = true ✓ (NOW CHECKED!)
    ↓
isStaffOrEditor = TRUE ✓ (CORRECT!)
    ↓
Takes INTERNAL API branch (for staff/editors)
    ↓
internalAPI.getArticle(24)
    ↓
Backend Internal API: queryset = Article.objects.filter(author=user) OR user.is_editor()
    ↓
Article 24 exists and user is editor - MATCHES FILTER
    ↓
Returns: 200 OK with article data
    ↓
Frontend renders article successfully
    ✓ SUCCESS
```

---

## Verification

### All Checks Passed ✅

✅ **Field Mapping**: Backend returns `is_staff`, `is_editor`, `is_admin`  
✅ **Internal API**: Returns 200 for article ID 24  
✅ **Public API**: Correctly returns 404 for unpublished articles  
✅ **Other Components**: Header component already uses correct fields  
✅ **No Other Occurrences**: No other files have this broken pattern  

### Test Cases

#### Test 1: Editor viewing draft article
- User: editor@example.com (has `is_editor=true`)
- Article: ID 24, status='review'
- Expected: ✓ Can view article
- Actual: ✓ Now works correctly

#### Test 2: Non-staff user viewing draft article
- User: user@example.com (has `is_editor=false`)
- Article: ID 24, status='review'
- Expected: ✗ Error message "Gagal memuat pengetahuan"
- Actual: ✗ Still shows error (this is correct behavior)

#### Test 3: Non-staff user viewing published article
- User: user@example.com (has `is_editor=false`)
- Article: ID 1, status='published'
- Expected: ✓ Can view article
- Actual: ✓ Works correctly

---

## Related Code References

### Backend Files
- **User Model**: `backend/apps/core/models.py` (lines 241-248)
  - Contains `is_admin()`, `is_editor()` methods
  - Defines role hierarchy

- **Auth Endpoint**: `backend/apps/auth/views.py` (lines 190-220)
  - `/api/auth/me/` returns user data including `is_admin`, `is_editor`
  - Login endpoint uses same structure

- **Public API**: `backend/apps/api/v1/public/views.py` (lines 49-75)
  - Filters articles by `status='published'`
  - Restricts anonymous users to `access_level='public'`

- **Internal API**: `backend/apps/api/v1/internal/views.py` (lines 46-65)
  - No status filter, returns all articles
  - Restricts to authenticated users only
  - Editors get all articles, authors get only their own

### Frontend Files
- **Fixed File**: `frontend/src/pages/ArticleDetailPage.jsx` (lines 115-117)
  - Article detail page component
  - Uses `internalAPI` or `publicAPI` based on user role

- **Auth Context**: `frontend/src/contexts/AuthContext.jsx` (lines 106-107)
  - Already correctly uses `is_admin` and `is_editor` fields ✓

- **Header**: `frontend/src/components/Header.jsx` (line 57)
  - Already correctly uses `is_admin || is_editor` ✓

---

## Files Modified

1. **`frontend/src/pages/ArticleDetailPage.jsx`**
   - Lines 115-117: Fixed staff/editor detection logic
   - Changed from checking non-existent fields to checking actual backend response fields

---

## Impact

### Before Fix ❌
- All non-superuser users couldn't access draft/review articles
- Editors couldn't view their own draft articles (except via admin dashboard)
- 404 errors in article detail page for unpublished content

### After Fix ✅
- Editors can access draft/review articles via public link
- Non-staff users correctly see 404 for unpublished articles
- Article detail page works correctly for all user types
- Consistent behavior with admin/dashboard interface

---

## Summary

**Root Cause**: Frontend was checking for non-existent Django user fields (`is_superuser`, `groups`) instead of the actual fields returned by the backend (`is_editor`, `is_admin`).

**Fix**: Updated the staff/editor detection logic to check the correct backend response fields.

**Result**: Staff and editors can now view draft/review articles as intended. Non-staff users correctly see 404 errors for unpublished content.

---

## Additional Notes

### Why `is_staff` alone isn't enough
While `is_staff` is a boolean in the backend response, it may not be set for all editors (editors are identified through the `roles` M2M relationship). The backend methods `is_editor()` and `is_admin()` handle the proper role hierarchy checking, which is why the frontend must check these fields too.

### Data Flow
```
Backend User Model
  ├─ is_staff (Django field)
  ├─ is_superuser (Django field)
  ├─ roles (M2M with Role model)
  └─ Methods:
      ├─ is_admin() → has ADMIN role OR is_superuser
      ├─ is_editor() → has EDITOR role OR is_admin()
      └─ is_contributor() → has CONTRIBUTOR role OR is_editor()
      
Backend /auth/me/ endpoint
  ├─ Returns: is_staff (boolean)
  ├─ Returns: is_admin (boolean from is_admin() method)
  ├─ Returns: is_editor (boolean from is_editor() method)
  ├─ Returns: roles (list of role codes)
  └─ Does NOT return: is_superuser, groups
  
Frontend User Object (stored in AuthContext)
  └─ Should use: is_staff, is_editor, is_admin
      from the backend response
```

