# 🔧 QUICK FIX REFERENCE - Article 404 Bug

## ⚡ TL;DR - What Was Wrong?

```javascript
// ❌ OLD CODE (BROKEN)
const isStaffOrEditor = user?.is_staff || user?.is_superuser || user?.groups?.some(g => 
  g.name === 'Editors'  // ← Backend doesn't return 'groups', only 'roles'
);

// ✅ NEW CODE (FIXED)
const isStaffOrEditor = user?.is_staff || user?.is_editor || user?.is_admin;
```

---

## 🔍 What Was the Problem?

| Symptom | Cause |
|---------|-------|
| Article shows "Gagal memalu pengetahuan" (Failed to load) | Article has `status='review'` (unpublished) |
| Browser console shows 404 error | Frontend was using PUBLIC API instead of INTERNAL API |
| Backend logs: `GET /api/v1/public/articles/24/ 404` | Staff/editor check didn't recognize the user as staff |
| But `/api/v1/internal/articles/24/` returned 200 OK | Internal API works, frontend just didn't use it |

---

## 🐛 Root Cause

Frontend code was checking for fields that **don't exist** in the backend response:

**What frontend was checking:**
- `user?.is_superuser` → ❌ Not in backend response
- `user?.groups?.some(g => g.name === 'Editors')` → ❌ Backend returns `roles` array, not `groups`

**What backend actually returns:**
```json
{
  "is_staff": true,      // ← Exists
  "is_editor": true,     // ← Exists but wasn't checked!
  "is_admin": false,     // ← Exists but wasn't checked!
  "roles": ["editor"],   // ← Array of role codes, not objects
  // Note: No "groups" or "is_superuser" fields
}
```

---

## 📝 The Fix

**File**: `frontend/src/pages/ArticleDetailPage.jsx` (Line 117)

**What changed:**
```diff
- const isStaffOrEditor = user?.is_staff || user?.is_superuser || user?.groups?.some(g => 
-   g.name === 'Editors' || g.name === 'Admin' || g.name === 'Administrator'
- );
+ const isStaffOrEditor = user?.is_staff || user?.is_editor || user?.is_admin;
```

---

## ✅ Verification

| Check | Result |
|-------|--------|
| Backend returns `is_editor` field? | ✅ Yes |
| Backend returns `is_admin` field? | ✅ Yes |
| Internal API returns 200 for draft articles? | ✅ Yes |
| Header component already uses correct fields? | ✅ Yes |
| Any other files with same bug? | ✅ No |

---

## 🧪 How to Test

### Test 1: Editor viewing draft article
```
1. Login as editor_user (has is_editor=true)
2. Go to dashboard
3. Click on article 24 (status='review')
4. ✅ Should see article content (not "Gagal memuat pengetahuan")
```

### Test 2: Regular user viewing draft article
```
1. Login as regular_user (has is_editor=false)
2. Direct link to http://localhost:5175/knowledges/24
3. ✅ Should see "Gagal memuat pengetahuan" (expected)
```

### Test 3: Regular user viewing published article
```
1. Login as regular_user
2. Go to dashboard
3. Click on published article
4. ✅ Should see article content
```

---

## 📊 API Behavior Summary

### Public API (`/v1/public/articles/24/`)
- Filter: `status='published'` ONLY
- Result for article 24: ❌ 404 (status='review')
- For normal users: ✅ Used
- For editors: ❌ NOT used anymore (fixed!)

### Internal API (`/v1/internal/articles/24/`)
- Filter: No status filter
- Result for article 24: ✅ 200 OK (all statuses work)
- For normal users: ❌ Not accessible (not authenticated)
- For editors: ✅ NOW used (fixed!)

---

## 📌 Key Changes

**Before**: Editors fell through to public API → Got 404
**After**: Editors correctly use internal API → Get article data

---

## 🎯 Impact

- ✅ Editors/staff can now view draft articles
- ✅ Non-staff users still correctly see errors for unpublished articles
- ✅ No breaking changes to API
- ✅ No database migrations needed
- ✅ No new dependencies

---

## 📚 Related Documentation

- Full analysis: [ARTICLE_404_BUG_ANALYSIS_AND_FIX.md](ARTICLE_404_BUG_ANALYSIS_AND_FIX.md)
- Backend User model: `backend/apps/core/models.py`
- Backend Auth API: `backend/apps/auth/views.py`
- Frontend Article page: `frontend/src/pages/ArticleDetailPage.jsx`

