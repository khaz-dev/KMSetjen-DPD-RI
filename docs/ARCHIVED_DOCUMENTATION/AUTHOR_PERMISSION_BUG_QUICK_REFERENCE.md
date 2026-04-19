# ⚡ QUICK FIX REFERENCE - Author Can't View Own Draft Articles

## 🎯 The Problem

| Who | Situation | Result |
|-----|-----------|--------|
| Author | Tries to view own draft article | ❌ "Gagal memuat pengetahuan" (404) |
| Editor | Views same draft article | ✅ Works perfectly |

**Why?** The frontend only allowed editors to use the special API for draft articles!

---

## 🐛 Root Cause

```javascript
// ❌ OLD - WRONG
const isStaffOrEditor = user?.is_staff || user?.is_editor || user?.is_admin;

if (isStaffOrEditor) {
  // Only staff/editors can access draft articles
  useInternalAPI();  
} else {
  // Authors forced to use public API (published only)
  usePublicAPI();  // ← 404 for drafts!
}
```

**The Problem**: Authors aren't marked as "staff" or "editor" in the user object, so they couldn't access the internal API even for their own articles!

---

## ✅ The Fix

```javascript
// ✅ NEW - CORRECT
if (user) {
  // ALL authenticated users can use internal API
  // Backend figures out what they can see (own articles for authors, all for editors)
  useInternalAPI();
} else {
  // Only anonymous users use public API
  usePublicAPI();
}
```

**The Insight**: The backend already filters what users can see based on their role. The frontend just needs to let authenticated users use the authenticated API.

---

## 📝 Changes

**File**: `frontend/src/pages/ArticleDetailPage.jsx` (Lines 112-139)

**Changed from checking role** (`is_staff || is_editor || is_admin`)  
**Changed to checking authentication** (`user` exists or not)

---

## 🧪 Quick Test

| User | Article | Status | Expected | Before | After |
|------|---------|--------|----------|--------|-------|
| Author | Own | Draft | ✅ View | ❌ 404 | ✅ View |
| Editor | Any | Draft | ✅ View | ✅ View | ✅ View |
| Anonymous | Any | Draft | ❌ 404 | ❌ 404 | ❌ 404 |
| Anonymous | Any | Published | ✅ View | ✅ View | ✅ View |

---

## 💡 Key Insight

**Backend-frontend responsibility:**

- **Backend**: Handle permission filtering  
  - Authors see: own articles  
  - Editors see: all articles  
  - Public sees: published only

- **Frontend**: Route users to right endpoint  
  - Authenticated → Use internal API  
  - Anonymous → Use public API

**Frontend should NOT** try to replicate the backend's permission logic (which is what the old code was doing).

---

## 🎓 What You Learned

When you have a private API and a public API:
- ❌ Don't check user's specific role in frontend  
- ✅ Do check if user is authenticated or not  
- ✅ Let backend handle "what can this authenticated user see"

