# 🎯 Permission Logic Bug - Author Can't View Own Draft Articles

**Status**: ✅ FIXED  
**Severity**: HIGH - Blocks authors from viewing their own work  
**Date**: March 30, 2026

---

## 📋 **The Problem Summary**

| User Type | Can See in List | Can View Detail | Issue |
|-----------|-----------------|-----------------|-------|
| **Author** (Bagian Pengembangan) | ✅ Yes | ❌ No - "Gagal memuat pengetahuan" | **Draft not accessible** |
| **Editor** (Khairil Azmi) | ✅ Yes | ✅ Yes | Works correctly |
| **Anonymous** | N/A | ❌ No - 404 | Works correctly (no access) |

---

## 🔍 **Root Cause: Incorrect Permission Check in Frontend**

### **The Broken Logic**

File: `frontend/src/pages/ArticleDetailPage.jsx` (OLD CODE - Lines 115-120)

```javascript
// ❌ WRONG - Only staff/editors can use internal API
const isStaffOrEditor = user?.is_staff || user?.is_editor || user?.is_admin;

if (isStaffOrEditor) {
  response = await internalAPI.getArticle(idOrSlug);  // Draft articles work
} else {
  response = await publicAPI.getArticle(idOrSlug);     // Only published articles work
}
```

### **Why This Was Wrong**

The backend's internal API supports THREE types of users:

```python
# Backend: backend/apps/api/v1/internal/views.py (get_queryset)
if user.is_editor() or user.is_admin():
    # Editors see ALL articles
    return Article.objects.all()
else:
    # Non-editors (including authors) see ONLY THEIR OWN articles
    return Article.objects.filter(author=user)
```

**But the frontend only checked for `is_editor` or `is_admin`!**

This means:
- ✅ Editors could use internal API (is_editor=true)
- ❌ Authors couldn't use internal API (is_editor=false) ← **THE BUG**
- ❌ Authors fell back to public API (published only)
- ❌ Draft articles don't exist in public API → 404

---

## 📊 **The Bug Flow**

### **Author (Bagian Pengembangan) Tries to View Article 24 (Draft)**

```
1. User clicks "Lihat" on article 24
   ↓
2. ArticleDetailPage componentmounts
   ↓
3. Frontend checks: isStaffOrEditor = is_staff || is_editor || is_admin
   ↓
4. User is author only:
   - is_staff = false
   - is_editor = false  ← Author doesn't have editor role!
   - is_admin = false
   ↓
5. isStaffOrEditor = FALSE
   ↓
6. Takes public API branch ❌
   ↓
7. Call: GET /api/v1/public/articles/24/
   ↓
8. Backend filters: WHERE status='published'
   ↓
9. Article 24 has status='review' → NOT FOUND
   ↓
10. Returns: 404 Not Found
    ↓
11. Frontend displays: "Gagal memuat pengetahuan" ❌
```

### **Editor (Khairil Azmi) Views Same Article 24**

```
1. User clicks "Lihat" on article 24
   ↓
2. ArticleDetailPage mounts
   ↓
3. Frontend checks: isStaffOrEditor = is_staff || is_editor || is_admin
   ↓
4. User is editor:
   - is_editor = TRUE ← Editor has this role!
   ↓
5. isStaffOrEditor = TRUE ✓
   ↓
6. Takes internal API branch ✓
   ↓
7. Call: GET /api/v1/internal/articles/24/
   ↓
8. Backend filters: No status filter (editor can see all)
   ↓
9. Article 24 exists → Returns 200 OK ✓
   ↓
10. Frontend displays: Article content ✓
```

---

## ✅ **The Fix: Use Backend's Permission Model**

### **New Logic**

File: `frontend/src/pages/ArticleDetailPage.jsx` (NEW CODE - Lines 112-139)

```javascript
// ✅ CORRECT - Check if user is AUTHENTICATED, not role
if (user) {
  // User is authenticated - they can access internal API
  // Backend's get_queryset will filter what they can see:
  // - Authors: only their own articles
  // - Editors: all articles
  response = await internalAPI.getArticle(idOrSlug);
} else {
  // User NOT authenticated - use public API (published only)
  response = await publicAPI.getArticle(idOrSlug);
}
```

### **Why This Works**

**The key insight**: The backend already handles permission filtering in `get_queryset()`

```python
# Backend permission model:
# ┌─ Authenticated user
# │  ├─ Is Editor/Admin? → See ALL articles
# │  └─ Is Author? → See ONLY OWN articles
# │
# └─ Anonymous user
#    └─ Only see PUBLISHED articles (public API)
```

**Frontend should respect this:**
- ✅ If authenticated → Use internal API (backend filters for them)
- ❌ If not authenticated → Use public API (published only)

---

## 🔄 **New Correct Flow**

### **Author Views Their Draft Article**

```
1. User clicks "Lihat"
   ↓
2. Frontend checks: if (user) { ... }
   ↓
3. user exists (authenticated) → TRUE ✓
   ↓
4. Uses internal API ✓
   ↓
5. Backend's get_queryset: filter(author=user) ✓
   ↓
6. Article 24 found (user is author) ✓
   ↓
7. Returns: 200 with article data ✓
   ↓
8. Frontend displays: Article content  ✓
```

### **Anonymous User Views Published Article**

```
1. Anonymous user (no auth token)
   ↓
2. Frontend checks: if (user) { ... }
   ↓
3. user=null (not authenticated) → FALSE
   ↓
4. Uses public API ✓
   ↓
5. Backend filters: WHERE status='published'
   ↓
6. Published article found ✓
   ↓
7. Returns: 200 with article data ✓
   ↓
8. Frontend displays: Article content ✓
```

### **Anonymous User Views Draft Article**

```
1. Anonymous user tries to access article 24 (draft)
   ↓
2. Frontend: if (user) → FALSE
   ↓
3. Uses public API
   ↓
4. Backend filters: WHERE status='published'
   ↓
5. Article 24 not published → NOT FOUND
   ↓
6. Returns: 404
   ↓
7. Frontend displays: "Gagal memuat pengetahuan" ✓ (correct behavior)
```

---

## 📊 **Comparison: Before vs After**

### **BEFORE** ❌ - Role-Based Check

```
Authentication Status → is_editor? → API Used
┌──────────────────────────────────────────────────────┐
│ Author (authenticated)  → NO       → PUBLIC → 404 ❌  │
│ Editor (authenticated)  → YES      → INTERNAL → 200 ✓ │
│ Anonymous              → NO       → PUBLIC → 400 OK  │
└──────────────────────────────────────────────────────┘
```

### **AFTER** ✅ - Authentication-Based Check

```
Authentication Status → Authenticated? → API Used
┌──────────────────────────────────────────────────────┐
│ Author (authenticated)  → YES      → INTERNAL → 200 ✓ │
│ Editor (authenticated)  → YES      → INTERNAL → 200 ✓ │
│ Anonymous              → NO       → PUBLIC → OK      │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 **Key Changes**

### Change 1: Simplified Permission Check

**OLD**: Checked role (is_staff || is_editor || is_admin)
```javascript
const isStaffOrEditor = user?.is_staff || user?.is_editor || user?.is_admin;
```

**NEW**: Check authentication status (user exists)
```javascript
if (user) {  // Much simpler!
```

### Change 2: Updated Comment

Clarified that:
- Backend's `get_queryset` filters data based on user permissions
- Authors see only their own articles
- Editors see all articles
- Frontend just checks authentication

---

## 📝 **Files Modified**

### `frontend/src/pages/ArticleDetailPage.jsx`

**Lines 112-139**: Complete rewrite of API selection logic

**Old Logic** (3 conditions to check):
```javascript
const isStaffOrEditor = user?.is_staff || user?.is_editor || user?.is_admin;
if (isStaffOrEditor) {
  response = await internalAPI.getArticle(idOrSlug);
} else {
  response = await publicAPI.getArticle(idOrSlug);
}
```

**New Logic** (1 condition to check):
```javascript
if (user) {
  response = await internalAPI.getArticle(idOrSlug);
} else {
  response = await publicAPI.getArticle(idOrSlug);
}
```

---

## 🧪 **How to Verify**

### Test 1: Author Viewing Own Draft

1. **Login as**: Bagian Pengembangan (author)
2. **Go to**: Dashboard → Articles list
3. **Action**: Click "Lihat" on article 24 (draft)
4. **Expected**: ✅ Article displays (no error)
5. **Before fix**: ❌ "Gagal memuat pengetahuan"
6. **After fix**: ✅ Article content

### Test 2: Editor Viewing Draft (Should Still Work)

1. **Login as**: Khairil Azmi (editor)
2. **Go to**: Dashboard → Articles list
3. **Action**: Click "Lihat" on article 24 (draft)
4. **Expected**: ✅ Article displays
5. **Before fix**: ✅ Already worked
6. **After fix**: ✅ Still works

### Test 3: Anonymous User Cannot View Draft

1. **Logout** / Use incognito window
2. **Navigate to**: http://localhost:5175/knowledges/24
3. **Expected**: ❌ "Gagal memuat pengetahuan" (correct)
4. **Before fix**: ❌ Same error (correct)
5. **After fix**: ❌ Same error (correct - expected behavior)

### Test 4: Anonymous User Can View Published

1. **Logout** / Use incognito window
2. **Navigate to**: http://localhost:5175/knowledges/1 (published article)
3. **Expected**: ✅ Article displays
4. **Before fix**: ✅ Works
5. **After fix**: ✅ Works

---

## 💡 **Deeper Insights**

### Why the Old Logic Was Flawed

The old code assumed only staff/editors should access the internal API, treating authors as "public users". This misunderstood the backend's architecture:

```
Backend Architecture:
├─ Public API: For anonymous/public access (published only)
├─ Internal API: For all authenticated users
│  ├─ Authors can access their own articles
│  └─ Editors can access all articles
└─ Public API was never meant to serve authenticated users' private content
```

The frontend was forcing authors into the public API, which was the wrong choice.

### Permission Hierarchy

```
Anonymous User
  └─ Can access: Public API only
     └─ Can see: Published articles only

Authenticated User (Author)
  └─ Can access: Internal API (filtered to own articles)
     └─ Can see: Own articles (all statuses)

Authenticated User (Editor)
  └─ Can access: Internal API (all articles)
     └─ Can see: All articles (all statuses)
```

---

## ✨ **Impact**

| Aspect | Before | After |
|--------|--------|-------|
| Author access to own draft | ❌ Blocked | ✅ Works |
| Editor access to all articles | ✅ Works | ✅ Still works |
| Anonymous access to published | ✅ Works | ✅ Still works |
| Anonymous access to draft | ❌ 404 | ❌ Still 404 (correct) |
| Code complexity | Higher (3 conditions) | Lower (1 condition) |
| Alignment with backend | ❌ Misaligned | ✅ Aligned |

---

## 🔗 **Related Architecture**

### Backend API Layers

**Public API** (`/api/v1/public/articles/`)
- Purpose: Anonymous public access
- Filter: `status='published'` AND `is_published=True`
- Access: AllowAny

**Internal API** (`/api/v1/internal/articles/`)
- Purpose: Authenticated user access
- Filter: Backend's `get_queryset()` per user role
- Access: IsAuthenticated
- Permissions: Authors see own, editors see all

### Frontend API Clients

**publicAPI**
- Purpose: Public/anonymous access
- Auth: Optional (included if available, but backend doesn't require)
- Used for: Published articles only

**internalAPI**
- Purpose: Authenticated user access
- Auth: Required (JWT token)
- Used for: All articles user has access to (based on permissions)

---

## 📌 **Lesson Learned**

**Don't use role checks when authentication state would suffice.**

The backend already implements permission filtering. The frontend just needs to route authenticated users to the authenticated endpoint.

```javascript
// Anti-pattern
if (user.is_editor || user.is_admin || user.is_staff) {
  usePrivateAPI();
} else {
  usePublicAPI();
}

// Better pattern
if (user) {
  usePrivateAPI();  // Backend knows the user's role and filters accordingly
} else {
  usePublicAPI();
}
```

