# Article Load Error Diagnosis

## Problem Reported
1. Page shows: `errors.failed_load_articles`
2. Console shows: `Uncaught SyntaxError: The requested module '/src/pages/ArticleEditorPage.jsx?t=X' does not provide an export named 'default'`

## Investigation Results

### Issue #1: Module Export Error (MISLEADING)
**Status:** RESOLVED - This is a SECONDARY error, not the root cause

**What it means:**
- The component IS properly exporting default (confirmed by successful build)
- This error appears AFTER the network error occurs
- It's a cascade effect from Hot Module Reload failing

**Why it happens:**
1. User navigates to /editor/27
2. Page tries to load article via API: `GET /api/v1/internal/articles/27/`
3. API call FAILS (see Issue #2 below)
4. Component catches error, sets `error: 'errors.failed_load_articles'`
5. Since component failed to initialize properly, Vite's HMR tried to update
6. HMR saw changes and re-evaluated module
7. But Vite couldn't properly reload the changed module state
8. Result: "does not provide default export" error (cascade damage)

### Issue #2: Cannot Load Article (THE REAL PROBLEM)
**Status:** NEEDS INVESTIGATION - This is why the page is failing

**Location:** `loadArticle` function in ArticleEditorPage.jsx, line 92-174
**Error line:** Line 172: `setError('errors.failed_load_articles');`

**Root causes could be:**
1. ❌ Backend API not running on port 8002
2. ❌ Getting 401 Unauthorized - auth token expired or invalid
3. ❌ Getting 404 - article 27 doesn't exist or user can't access it
4. ❌ Getting 500 - backend error
5. ❌ Network connectivity issue
6. ❌ CORS misconfiguration
7. ❌ API base URL incorrectly configured

## What the Code Does

When `/editor/27` loads:
1. Component mounts with `id = 27`
2. `useEffect` calls `loadArticle()` 
3. Tries to: `GET /api/v1/internal/articles/27/`
4. If fails → shows error `'errors.failed_load_articles'` → displays on page
5. If succeeds → loads article data into form

## How to Fix

### Step 1: Check Backend is Running
```bash
# Check if Django is running on port 8002
netstat -ano | findstr :8002

# If not running, start it:
cd backend
python manage.py runserver 0.0.0.0:8002
```

### Step 2: Check API Connectivity
Open browser console (F12) and run:
```javascript
// Check what API URL is being used
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api';
console.log('API Base URL:', baseUrl);

// Try to fetch the article
const token = localStorage.getItem('access_token');
console.log('Access Token:', token ? 'Found' : 'NOT FOUND');

fetch(`${baseUrl}/v1/internal/articles/27/`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => {
  console.log('Response Status:', r.status);
  return r.json();
})
.then(data => console.log('Response Data:', data))
.catch(err => console.error('Fetch Error:', err));
```

### Step 3: Check Local Storage Auth
```javascript
// In browser console:
console.log('access_token:', localStorage.getItem('access_token'));
console.log('refresh_token:', localStorage.getItem('refresh_token'));
```

### Step 4: Clear Vite Cache & Rebuild
```bash
# Windows PowerShell:
cd frontend
rm -r node_modules/.vite
npm run build
```

### Step 5: Hard Refresh Browser
- Ctrl + Shift + R (full page refresh with cache clear)
- Then navigate to http://localhost:5175/editor/27

## What to Check

1. **Backend Running?**
   - [ ] Port 8002 is listening
   - [ ] No Django errors in console
   - [ ] Database is connected

2. **Authentication?**
   - [ ] access_token in localStorage
   - [ ] Token is not expired
   - [ ] User has permission to view article 27

3. **Article Exists?**
   - [ ] Article with ID 27 exists in database
   - [ ] Current user is theauthor
   - [ ] Article is in draft status (internal API)

4. **Network?**
   - [ ] CORS is configured correctly
   - [ ] API base URL is correct
   - [ ] No proxy/firewall blocking

## Debug Logs to Watch For

When page loads, check browser console for:

**Good sign:**
```
[ArticleEditor] Loaded files: 3
[ArticleEditor] File 0: { id: X, filename: '...', ... }
```

**Bad sign:**
```
Load article error: Error: Failed to load article
Failed to load files: Error: ...
```

## The Module Export Error is a Red Herring

The "does not provide an export named 'default'" error appearing in the console is **NOT** a code problem.

It's Vite's Hot Module Replacement system trying to reload a module that's in a failed state.

**Once you fix the network/auth/backend issue, this error will disappear automatically.**
