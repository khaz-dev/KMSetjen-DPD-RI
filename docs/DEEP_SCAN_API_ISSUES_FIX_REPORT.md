# Deep Scan & Fix Report - Backend/Frontend API Issues

## Date: January 14, 2026

---

## Issues Found & Fixed

### 1. **BACKEND: check-slug Endpoint 404 Error**

**Symptom:**
- Browser console: `Failed to load resource: the server responded with a status of 404 (Not Found)`
- Backend logs: `WARNING 2026-01-14 07:51:03,457 basehttp "GET /api/v1/internal/articles/check-slug/?slug=... HTTP/1.1" 404 78`

**Root Cause:**
- The DRF DefaultRouter was supposed to auto-register the `@action(detail=False)` method as `/articles/check-slug/`
- However, the route wasn't being properly recognized or registered
- Django routing was sending 404 for the endpoint

**Solution Applied:**
- **File:** `backend/apps/api/v1/internal/urls.py`
- Added explicit URL pattern for the check-slug action:
```python
path('articles/check-slug/', ArticleViewSet.as_view({'get': 'check_slug'}), name='article-check-slug'),
```
- This ensures the endpoint is explicitly registered and accessible
- Now responds to: `GET /api/v1/internal/articles/check-slug/?slug=...`

---

### 2. **FRONTEND: Public API Getting 401 Unauthorized**

**Symptom:**
- Browser console:
  - `:8000/api/v1/public/articles/popular/` - 401 Unauthorized
  - `:8000/api/v1/public/categories/` - 401 Unauthorized
  - `:8000/api/v1/public/tags/` - 401 Unauthorized

**Root Cause:**
- The frontend `apiClient` was adding JWT authorization header to ALL requests
- Public API endpoints should NOT require authentication
- If JWT token was invalid/expired, the server rejected public requests with 401
- This violates the principle of separation: authenticated vs. public endpoints

```javascript
// WRONG - Sent JWT token to public endpoints
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;  // ← Adds to ALL requests
    }
    return config;
  }
);
```

**Solution Applied:**
- **File:** `frontend/src/services/api.js`
- Created SEPARATE axios clients:
  1. **`apiClient`** - For authenticated/internal requests (with JWT token)
  2. **`publicClient`** - For public requests (without JWT token)

- Updated all public API calls to use `publicClient`:
  - `publicAPI.getArticles()` → uses `publicClient`
  - `publicAPI.getPopularArticles()` → uses `publicClient`
  - `publicAPI.getCategories()` → uses `publicClient`
  - `publicAPI.getTags()` → uses `publicClient`

- Authenticated calls continue using `apiClient`:
  - `internalAPI.*()` → uses `apiClient` (with JWT)
  - `authAPI.*()` → uses `apiClient` (with JWT)

---

### 3. **SECONDARY: Auth Endpoint 401 Errors**

**Symptom:**
- Browser console: `:8000/api/auth/me/` - 401 Unauthorized

**Root Cause:**
- This endpoint REQUIRES authentication (correct behavior)
- 401 indicates the JWT token is expired, invalid, or not provided
- This is a separate auth state management issue, not an API routing issue

**Note:**
- This is expected when user is not authenticated
- Will be resolved when user logs in successfully
- No code changes needed for this - it's by design

---

## Summary of Changes

### Backend Files Modified:
1. **`backend/apps/api/v1/internal/urls.py`**
   - Added explicit URL pattern for check-slug endpoint
   - Ensures proper routing of slug validation requests

### Frontend Files Modified:
1. **`frontend/src/services/api.js`**
   - Created separate `publicClient` for public API requests
   - Updated `publicAPI` to use `publicClient` instead of `apiClient`
   - Maintained `apiClient` for authenticated requests

---

## Testing Checklist

- [ ] Backend: Navigate to http://localhost:3000/editor
- [ ] Type in title field and verify slug auto-generates
- [ ] Verify slug validation badge appears (checking, then valid)
- [ ] Check browser console for no 404 errors on check-slug
- [ ] Verify no 401 errors for public endpoints in console
- [ ] Check backend logs for no "Not Found" warnings
- [ ] Verify popular articles load on home page without 401
- [ ] Test category loading without auth errors
- [ ] Test tag loading without auth errors

---

## Expected Results After Fix

✅ **check-slug endpoint:** 200 OK response with availability status
✅ **Public articles:** Loads without JWT token requirement
✅ **Popular articles:** 200 OK, no 401 errors
✅ **Categories:** 200 OK, no 401 errors
✅ **Tags:** 200 OK, no 401 errors
✅ **Auth endpoints:** Still require JWT (401 if not authenticated - expected)

---

## Files to Restart

After deploying these changes:
1. **Backend:** Restart Django development server
2. **Frontend:** No restart needed (hot reload)
3. **Browser:** Clear cache and refresh page

---

## Root Causes Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| check-slug 404 | DRF router not auto-registering action | Added explicit URL pattern |
| Public API 401 | JWT token sent to public endpoints | Created separate publicClient |
| Auth 401 | Expected for unauthenticated requests | No fix needed (by design) |

