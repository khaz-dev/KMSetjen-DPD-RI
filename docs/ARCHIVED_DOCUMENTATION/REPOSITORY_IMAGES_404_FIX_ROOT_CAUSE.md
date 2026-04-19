# Repository Images 404 Error - Root Cause Analysis & Fix

**Status:** 🔴 IDENTIFIED & FIXED  
**Date:** April 13, 2026  
**Issue:** Images failing on staging (https://khaz.app/kms/) but working on localhost

---

## The Problem

### User Report
On staging server, browser console shows:
```
perpustakaan.jpg:1  GET https://khaz.app/perpustakaan.jpg 404 (Not Found)
jdih.png:1  GET https://khaz.app/jdih.png 404 (Not Found)
ppid.jpg:1  GET https://khaz.app/ppid.jpg 404 (Not Found)
```

### Expected Behavior
- ✅ Localhost (http://localhost:5175/) → Images load SUCCESS
- ❌ Staging (https://khaz.app/kms/) → Images load FAILED (404)

---

## Root Cause Analysis

### The Culprit: Absolute Paths Without Subpath

**Problem Code in `frontend/src/pages/HomePage.jsx` (lines 330-410):**
```jsx
// ❌ WRONG - Absolute paths don't include subpath
<ImageWithFallback 
  src="/perpustakaan.jpg"  // Tries to load from https://khaz.app/perpustakaan.jpg
  alt={t('home.perpustakaan_title')}
  className="repository-image"
  type="repository"
/>

<ImageWithFallback 
  src="/jdih.png"          // Tries to load from https://khaz.app/jdih.png
  alt={t('home.jdih_title')}
  className="repository-image"
  type="repository"
/>

<ImageWithFallback 
  src="/ppid.jpg"          // Tries to load from https://khaz.app/ppid.jpg
  alt={t('home.ppid_title')}
  className="repository-image"
  type="repository"
/>
```

### Why Localhost Works

**On localhost (http://localhost:5175/):**
1. Vite dev server runs at domain root
2. Images are served from `http://localhost:5175/perpustakaan.jpg` ✅
3. Absolute path `/perpustakaan.jpg` correctly resolves to domain root ✅

### Why Staging Fails

**On staging (https://khaz.app/kms/):**
1. App is served at subpath `/kms/`
2. Images are at the same subpath: `/kms/perpustakaan.jpg`
3. But code requests from absolute path: `/perpustakaan.jpg`
4. Browser tries `https://khaz.app/perpustakaan.jpg` ❌ (404 Not Found)
5. Correct path should be `https://khaz.app/kms/perpustakaan.jpg` ✅

---

## Technical Explanation

### How Nginx Routes Requests (Staging)

```
Browser Request:  https://khaz.app/kms/
        ↓
Nginx routing:    location /kms/ → proxy_pass http://127.0.0.1:5175/
        ↓
Frontend sees:    / (at localhost:5175)
        ↓
Frontend builds:  baseURL = '/'
        ↓
Image paths:      /perpustakaan.jpg
        ↓
Browser resolves: https://khaz.app + /perpustakaan.jpg = https://khaz.app/perpustakaan.jpg ❌
```

### The Real Issue: Path Resolution Mismatch

| Configuration | localhost | staging |
|---|---|---|
| **Server Base Path** | `/` | `/kms/` |
| **Frontend app is served at** | `/` | `/kms/` (via Nginx proxy) |
| **Image references in code** | `/perpustakaan.jpg` | `/perpustakaan.jpg` |
| **Browser resolves to** | `http://localhost:5175/perpustakaan.jpg` ✅ | `https://khaz.app/perpustakaan.jpg` ❌ |
| **Should be** | ✅ | `https://khaz.app/kms/perpustakaan.jpg` ✅ |

### Why Vite `base` Doesn't Help

The Vite configuration in `vite.config.js`:
```javascript
base: process.env.VITE_APP_SUBPATH || '/',
```

**What `base` actually does:**
- ✅ Affects Vite-bundled JS/CSS references
- ✅ Updates `index.html` script/link tags to include subpath
- ❌ Does NOT modify hardcoded string paths in JSX source code

**Example:**
- Vite changes: `<script src="/bundle.js">` → `<script src="/kms/bundle.js">`
- Vite does NOT change: `<img src="/perpustakaan.jpg">` → `<img src="/kms/perpustakaan.jpg">`

### Why Default Images Work

Look at `frontend/src/utils/imageUtils.js` (lines 25-35):
```javascript
export const getAppSubpath = () => {
  return import.meta.env.VITE_APP_SUBPATH || '/';
};

export const getDefaultImages = () => {
  const appSubpath = getAppSubpath();
  const basePath = appSubpath === '/' ? '' : appSubpath;
  
  return {
    ARTICLE: `${basePath}/default-article-image.svg`,    // ✅ Includes subpath
    CATEGORY: `${basePath}/default-category-image.svg`,  // ✅ Includes subpath
    LOGO: `${basePath}/logo.png`,                        // ✅ Includes subpath
  };
};
```

Default images work because they use `getAppSubpath()` to construct paths with the subpath included! Repository images should do the same.

---

## The Complete Chain

### How it Should Work

1. **Build time:** Docker build passes `VITE_APP_SUBPATH=/kms` to frontend build
2. **Build output:** Vite sets `base: '/kms/'` and `import.meta.env.VITE_APP_SUBPATH = '/kms'`
3. **Runtime (HomePage.jsx):** Code should use `getAppSubpath()` to build image paths
4. **Result:** Images requested from `/kms/perpustakaan.jpg` ✅

### Current Broken Chain

1. **Build time:** Docker passes `VITE_APP_SUBPATH=/kms` correctly
2. **Build output:** Vite sets `base: '/kms/'` correctly
3. **Runtime (HomePage.jsx):** Code hardcodes `/perpustakaan.jpg` ❌
4. **Result:** Images requested from `/perpustakaan.jpg` (wrong!) ❌

---

## The Fix

### Solution: Use Path Utility Function

Create a utility function in `imageUtils.js` for repository images:

```javascript
/**
 * Get the full path for assets in the public folder
 * @param {string} assetName - Name of asset (e.g., 'perpustakaan.jpg', 'jdih.png')
 * @returns {string} - Full path including subpath if needed
 */
export const getAssetPath = (assetName) => {
  const appSubpath = getAppSubpath();
  const basePath = appSubpath === '/' ? '' : appSubpath;
  return `${basePath}/${assetName}`;
};
```

Then update `HomePage.jsx` to use it:

```jsx
// ✅ CORRECT - Use utility function to get asset path
import { getAssetPath } from '../utils/imageUtils';

// In component:
<ImageWithFallback 
  src={getAssetPath('perpustakaan.jpg')}  // Now returns '/kms/perpustakaan.jpg' on staging
  alt={t('home.perpustakaan_title')}
  className="repository-image"
  type="repository"
/>
```

### Alternative Solution: Relative Paths

Instead of `/perpustakaan.jpg` use `perpustakaan.jpg` (relative):

```jsx
<ImageWithFallback 
  src="perpustakaan.jpg"  // Relative path, resolves relative to current location
  alt={t('home.perpustakaan_title')}
  className="repository-image"
  type="repository"
/>
```

**Why relative paths work:**
- On localhost: `http://localhost:5175/` + `perpustakaan.jpg` = `http://localhost:5175/perpustakaan.jpg` ✅
- On staging: `https://khaz.app/kms/` + `perpustakaan.jpg` = `https://khaz.app/kms/perpustakaan.jpg` ✅

**Recommendation:** Use the utility function approach (more explicit and maintainable).

---

## Implementation

### Files to Modify

**File 1: `frontend/src/utils/imageUtils.js`**
- Add `getAssetPath()` function

**File 2: `frontend/src/pages/HomePage.jsx`**
- Import `getAssetPath` function
- Update all three repository image src attributes
- Change from `/perpustakaan.jpg` to `getAssetPath('perpustakaan.jpg')`

### Summary

| Before | After |
|--------|-------|
| `src="/perpustakaan.jpg"` | `src={getAssetPath('perpustakaan.jpg')}` |
| `src="/jdih.png"` | `src={getAssetPath('jdih.png')}` |
| `src="/ppid.jpg"` | `src={getAssetPath('ppid.jpg')}` |

---

## Impact

- ✅ Fixes 404 errors on https://khaz.app/kms/
- ✅ Maintains functionality on localhost
- ✅ Works for any subpath (future deployments to /kmsetjendpdri or other paths)
- ✅ Uses existing established pattern (same as DEFAULT_IMAGES)
- ✅ No build configuration changes needed
- ✅ No Nginx changes needed

---

## Prevention

To prevent this in the future:
1. Any asset imported from the public folder should use `getAssetPath()` or relative paths
2. Never use absolute paths like `/filename` for public assets in subpath deployments
3. Use the same pattern established for default images

---

## Verification Steps

### On Localhost (should still work)
1. Run: `npm run dev`
2. Navigate to http://localhost:5175/
3. Verify images load in "Jelajahi Repositori Lainnya" section
4. Browser console should have no 404 errors for images

### On Staging (will be fixed)
1. Deploy the fixed code
2. Navigate to https://khaz.app/kms/
3. Verify images load in "Jelajahi Repositori Lainnya" section
4. Browser console should have no 404 errors for images
5. Verify image overlay and status badges render correctly

---

## Git Commit Message

```
fix: Fix repository image 404 errors on staging (subpath issue)

- Add getAssetPath() utility to handle asset paths with subpath
- Update HomePage.jsx to use getAssetPath() for repository images
- Fixes: perpustakaan.jpg, jdih.png, ppid.jpg loading from correct paths
- Issue: Staging server at /kms/ was requesting images from /
- Solution: Use utility to build paths relative to current subpath
- Works on both localhost (/) and staging (/kms/)
```

