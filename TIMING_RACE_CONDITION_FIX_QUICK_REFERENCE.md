# ⚡ QUICK FIX REFERENCE - Timing Race Condition (Second Issue)

## 🎯 What Was the REAL Problem?

The article was calling the PUBLIC API **before checking if the user was loaded**, causing:
- ❌ Unnecessary 404 error
- ❌ Duplicate API calls  
- ❌ Wasted bandwidth
- ❌ Poor user experience

```
Render 1: user=null → isStaffOrEditor=false → Uses PUBLIC API → 404 ❌
                ↓ (auth loads)
Render 2: user=loaded → isStaffOrEditor=true → Uses INTERNAL API → 200 ✓
```

---

## 🔧 The Culprit

**Race Condition**: Component's `useEffect` ran BEFORE authentication finished loading

```javascript
// ❌ PROBLEM - Runs with user=null first
useEffect(() => {
  const isStaffOrEditor = user?.is_staff || user?.is_editor || user?.is_admin;
  // ... calls API with null user
}, [idOrSlug, user]); // Runs when user changes
```

---

## ✅ The Fix (3 Simple Changes)

### Change 1: Import authLoading state (Line 24)
```diff
- const { user } = useAuth();
+ const { user, loading: authLoading } = useAuth();
```

### Change 2: Wait for auth before loading article (Lines 165-169)
```javascript
// Skip loading article until auth is loaded
if (authLoading) {
  return;  // Exit early
}

loadArticle();
```

### Change 3: Add authLoading to dependency array (Line 169)
```diff
- }, [idOrSlug, user]);
+ }, [idOrSlug, user, authLoading]);
```

---

## 📊 Result

**Before**: 2 API calls (one wrong, one right)
```
GET /v1/public/articles/24/ 404 ❌
GET /v1/internal/articles/24/ 200 ✓
```

**After**: 1 API call (correct only)
```
GET /v1/internal/articles/24/ 200 ✓
```

---

## 🧪 Quick Test

1. Open DevTools → Console
2. Navigate to article page
3. Look for "Failed to load resource: 404" error
4. **Before fix**: ❌ Error appears
5. **After fix**: ✅ No error

---

## 💡 Key Concept: React Timing

```javascript
// ❌ BAD - Runs before dependencies load
useEffect(() => {
  useData();  // data might be null!
}, [data]);

// ✅ GOOD - Waits for dependencies
useEffect(() => {
  if (dataLoading) return;  // Wait
  useData();  // Now data is ready
}, [data, dataLoading]);
```

---

## 📎 Files Modified

- `frontend/src/pages/ArticleDetailPage.jsx` (3 changes)
  - Line 24: Import authLoading
  - Lines 165-169: Add early exit check
  - Line 169: Add authLoading to dependencies

---

## 🎓 What You Learned

**Race Conditions**: When async operations complete at different times, you get bugs
**Solution**: Always check loading states before using async data
**Pattern**: `if (loading) return;` prevents premature execution

