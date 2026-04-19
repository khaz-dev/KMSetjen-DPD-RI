# Logo Path Bug - Root Cause Analysis & Fix

## Issue Summary
- **Local Dev**: `http://localhost:5175/knowledges` → logo path `/knowledges/logo.png` ❌ BROKEN
- **Staging**: `https://khaz.app/kms/knowledges` → logo path `/kms/logo.png` ✅ WORKING

## Root Cause

### The Culprit: `getAppSubpath()` in `frontend/src/utils/imageUtils.js` (Lines 7-19)

The function attempts to **detect the app subpath by examining `window.location.pathname`**:

```javascript
export const getAppSubpath = () => {
  const path = window.location.pathname;
  const match = path.match(/^(\/[a-z_]+)/);  // Matches first URL segment
  if (match && match[1] && match[1] !== '/') {
    return match[1];  // Returns first segment as "app subpath"
  }
  return import.meta.env.VITE_APP_SUBPATH || '/';
};
```

### Why This Is Wrong

This approach **cannot distinguish between app subpath and page routes**:

**Local Development Scenario:**
```
URL: http://localhost:5175/knowledges
window.location.pathname = '/knowledges'
Regex match: ['/knowledges', '/knowledges']  ← First segment IS knowledges!
Function returns: '/knowledges'  ← WRONG! This is a page route, not app subpath
Logo path computed: '/knowledges/logo.png'
Browser tries to load: GET /knowledges/logo.png ← Relative to /knowledges route = BROKEN
```

**Staging Scenario:**
```
URL: https://khaz.app/kms/knowledges
window.location.pathname = '/kms/knowledges'
Regex match: ['/kms', '/kms']  ← First segment IS /kms
Function returns: '/kms'  ← CORRECT (by coincidence)
Logo path computed: '/kms/logo.png'
Browser tries to load: GET /kms/logo.png ← Correctly points to static asset = WORKING
```

### Why Staging "Works"

On staging, the application IS deployed under `/kms` subpath, so:
- Routes are `/kms/knowledges`, `/kms/category/:id`, etc.
- Static assets are at `/kms/logo.png`
- The bug still "detects" `/kms` correctly (by luck) because it IS the first segment

### Why This Is Still Fragile

This approach fails when:
1. You're on local dev (subpath is `/`, page route is first segment)
2. You have a page route that starts with a different letter than other routes
3. You need to replicate production locally (staging uses `/kms/knowledges` routes)

## The Real Issue

**The `getAppSubpath()` function should NOT try to detect the app subpath from the URL**. 

The app subpath is a **deployment-time configuration**, not something that should be detected from the current page. It should come from:
- **Vite's `base` config** (which respects `VITE_APP_SUBPATH` environment variable)
- Environment variables (built into the app at compile time)

Attempting to detect it from `window.location.pathname` is unreliable because:
- The pathname includes both the app subpath AND the page route
- They cannot be distinguished without additional context
- The app subpath is a build-time constant, not a runtime mystery

## The Solution

### Option 1: Rely Only on Environment Variable (RECOMMENDED)

Remove URL-based detection. Use ONLY `VITE_APP_SUBPATH`:

```javascript
export const getAppSubpath = () => {
  // Use environment variable set at build time
  return import.meta.env.VITE_APP_SUBPATH || '/';
};
```

### Option 2: Use Vite's Import to Get Base

Leverage Vite's built-in `import.meta.url` patterns:

```javascript
export const getAppSubpath = () => {
  // Vite automatically sets this in the bundled code
  return import.meta.env.BASE_URL;
};
```

### Prerequisite: Correct Environment Configuration

Update `.env` file to have **separate configurations** for local vs production:

**Current `.env` (Mixed - problematic):**
```
VITE_APP_SUBPATH=/kms  ← This is for PRODUCTION, breaks local dev!
```

**Should be:**
```
VITE_APP_SUBPATH=/     ← For local development
```

Then for production builds, use:
```
VITE_APP_SUBPATH=/kms
```

Or create `.env.production` file specifically for production builds.

## Implementation

The fix involves:
1. ✅ Update `imageUtils.js` to remove URL pathname detection
2. ✅ Ensure `.env` has correct `VITE_APP_SUBPATH=/` for local dev
3. ✅ Keep Vite's `base: process.env.VITE_APP_SUBPATH || '/'` configured correctly
4. ✅ Rebuild and clean cache

## Files to Fix

- `frontend/src/utils/imageUtils.js` - Lines 7-19 (getAppSubpath function)
- `.env` - Add proper dev/production separation

## Expected Behavior After Fix

**Local Dev:**
```
URL: http://localhost:5175/knowledges
VITE_APP_SUBPATH: /
getAppSubpath() returns: /
Logo path: /logo.png
Browser URL: GET http://localhost:5175/logo.png ✅ CORRECT
```

**Staging:**
```
URL: https://khaz.app/kms/knowledges
VITE_APP_SUBPATH: /kms
getAppSubpath() returns: /kms
Logo path: /kms/logo.png
Browser URL: GET https://khaz.app/kms/logo.png ✅ CORRECT
```
