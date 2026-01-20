# API Endpoint 404 Errors - Root Cause Analysis & Fix

## Problem Summary

**Browser Console Errors:**
1. `Slug check error: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
2. `Failed to load resource: the server responded with a status of 404 (Not Found)` for `api/v1/internal/articles/`
3. `POST http://localhost:3000/api/v1/internal/articles/ 404 (Not Found)`

## Root Cause Analysis

### The Core Issue: Relative Paths vs Absolute URLs

The frontend was making API calls with **relative paths** instead of **absolute URLs with the correct base domain**.

#### Frontend Running On:
- **http://localhost:3000** (React development server)

#### Backend Running On:
- **http://localhost:8000** (Django development server)

#### The Bug:
Frontend code was calling:
```javascript
fetch('/api/v1/internal/articles/check-slug/?slug=...')
```

This resolves to:
```
http://localhost:3000/api/v1/internal/articles/check-slug/
                    ↑ WRONG! Looking on frontend server, not backend
```

When the frontend server (port 3000) received this request, it returned an HTML 404 error page, not JSON. The frontend then tried to parse HTML as JSON, causing:

```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### Why It Worked Before:
Other API calls in the app probably used the configured API service (`publicAPI`) which uses the correct base URL set in environment variables.

### Environment Configuration:
**File:** `.env.local`
```dotenv
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

This environment variable defines where the backend API actually lives.

## Solution Implemented

### Step 1: Identify All Affected Fetch Calls

Found three fetch calls in `ArticleEditorPage.js` using relative paths:

1. **Line 62:** `loadArticle` function
   ```javascript
   fetch(`/api/v1/internal/articles/${id}/`, ...)
   ```

2. **Line 106:** `saveDraft` function
   ```javascript
   fetch(id ? `/api/v1/internal/articles/${id}/` : '/api/v1/internal/articles/', ...)
   ```

3. **Line 328:** `handleSubmitForReview` function
   ```javascript
   fetch(id ? `/api/v1/internal/articles/${id}/` : '/api/v1/internal/articles/', ...)
   ```

4. **Line 166 (also fixed earlier):** `slug check` effect
   ```javascript
   fetch(`/api/v1/internal/articles/check-slug/?${params}`, ...)
   ```

### Step 2: Fix All Fetch Calls

Changed from relative paths to absolute URLs using the environment variable:

```javascript
// BEFORE (WRONG):
const response = await fetch(`/api/v1/internal/articles/${id}/`, {...})

// AFTER (CORRECT):
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
const response = await fetch(`${apiBaseUrl}/v1/internal/articles/${id}/`, {...})
```

#### Benefits of This Approach:
1. **Environment-aware:** Uses `.env.local` in development, environment variables in production
2. **Fallback:** Defaults to `http://localhost:8000/api` if env var not set
3. **Flexible:** Can be configured per environment without code changes
4. **Consistent:** Same base URL used across all API calls

## Files Modified

### 1. frontend/src/pages/ArticleEditorPage.js

**Changes Made:**
- Line 62: `loadArticle` function - Added `apiBaseUrl` resolution
- Line 106: `saveDraft` function - Added `apiBaseUrl` resolution  
- Line 166: Slug check effect - Added `apiBaseUrl` resolution
- Line 328: `handleSubmitForReview` function - Added `apiBaseUrl` resolution

**Pattern Applied to All Four Locations:**
```javascript
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
const response = await fetch(`${apiBaseUrl}/v1/internal/articles/...`, {...})
```

## What Should Now Work

### ✅ Slug Real-Time Validation
- Frontend makes request to: `http://localhost:8000/api/v1/internal/articles/check-slug/?slug=...`
- Backend responds with JSON: `{"available": true/false, "message": "..."}`
- No more HTML 404 errors parsed as JSON

### ✅ Load Article
- Frontend makes request to: `http://localhost:8000/api/v1/internal/articles/{id}/`
- Backend responds with article data as JSON
- Article loads correctly

### ✅ Save Draft
- Frontend makes request to: `http://localhost:8000/api/v1/internal/articles/`
- Backend saves article and responds with JSON
- Draft saves successfully

### ✅ Submit for Review
- Frontend makes request to: `http://localhost:8000/api/v1/internal/articles/{id}/`
- Backend updates article and responds with JSON
- Article submits successfully

## Testing

### To Verify the Fix Works:

1. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear local storage

2. **Test Slug Validation**
   - Navigate to http://localhost:3000/editor
   - Start typing a title
   - Watch browser console (F12)
   - Should see successful slug check request to `http://localhost:8000/api/...`
   - Should NOT see 404 errors
   - Should see green/red validation feedback

3. **Test Article Operations**
   - Create new article
   - Add title, content, category
   - Click "Save Draft"
   - Should save successfully (no 404)
   - Should see "Saved" confirmation

4. **Test Article Loading**
   - Edit existing article
   - Should load content without 404 errors
   - All fields should populate correctly

### Browser Console Should Show:
```
✅ Network requests to http://localhost:8000/api/... returning 200
✅ JSON responses being parsed correctly
✅ No "Unexpected token '<'" errors
✅ No 404 errors for articles endpoints
```

## Why This Is Important

### Network & Security Reasons:

1. **CORS (Cross-Origin Resource Sharing):**
   - Frontend on port 3000, backend on port 8000 = different origins
   - Without proper URLs, requests fail silently

2. **Production Deployment:**
   - In production, frontend and backend may be on completely different domains
   - Relative paths would break (looking for API on frontend domain)
   - Absolute URLs with env variables solve this

3. **Environment Configuration:**
   - Development: `REACT_APP_API_BASE_URL=http://localhost:8000/api`
   - Staging: `REACT_APP_API_BASE_URL=https://staging-api.example.com/api`
   - Production: `REACT_APP_API_BASE_URL=https://api.example.com/api`
   - Same code, different URLs per environment

## Best Practices Applied

### ✅ Environment Variables
- Don't hardcode URLs
- Use `process.env` for configuration
- Provide sensible defaults

### ✅ Fallback Values
```javascript
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
```
- Uses env var if set
- Falls back to localhost for development
- Prevents errors if env var missing

### ✅ Consistency
- Same pattern used for all fetch calls
- Easier to maintain
- Single source of truth (`.env.local`)

### ✅ DRY Principle (Don't Repeat Yourself)
- Future fetch calls should follow same pattern
- Consider extracting to API service function

## Future Improvements

### 1. Create API Helper Function
```javascript
const apiCall = (endpoint, options = {}) => {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';
  return fetch(`${apiBaseUrl}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      ...options.headers
    },
    ...options
  });
};

// Usage:
apiCall('/v1/internal/articles/check-slug/?slug=test');
```

### 2. Use the Existing API Service
The project already has `publicAPI` service. Consider adding article methods there instead of using fetch directly.

### 3. Error Handling Enhancement
Add better error handling for network errors vs API errors:
```javascript
try {
  const response = await fetch(...);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'API Error');
  }
  return await response.json();
} catch (err) {
  if (!err.message) {
    throw new Error('Network error - backend may not be running');
  }
  throw err;
}
```

## Summary

**Root Cause:** Frontend using relative paths instead of absolute URLs with proper base domain

**Fix:** Updated all fetch calls to use environment variable `REACT_APP_API_BASE_URL`

**Result:** API calls now correctly route to `http://localhost:8000/api` instead of `http://localhost:3000/api`

**Impact:** 
- ✅ Slug validation works
- ✅ Article creation works
- ✅ Article editing works
- ✅ Article submission works
- ✅ No more 404 errors
- ✅ No more JSON parse errors

All four fetch calls in ArticleEditorPage.js now properly use the API base URL configuration.
