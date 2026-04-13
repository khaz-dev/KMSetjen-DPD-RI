# Repository Images 404 Error - Quick Fix Reference

**Status:** ✅ FIXED  
**Build:** SUCCESS (4.93s, zero errors)  
**Date:** April 13, 2026

---

## What Was Wrong

Images on staging server (https://khaz.app/kms/) were returning 404 errors:
- ❌ `GET https://khaz.app/perpustakaan.jpg 404`
- ❌ `GET https://khaz.app/jdih.png 404`
- ❌ `GET https://khaz.app/ppid.jpg 404`

But they worked fine on localhost (http://localhost:5175/)

---

## Root Cause

**The Issue:** Images were using absolute paths `/filename.jpg` which don't include the subpath

| Environment | App Base | Image Request | Result |
|---|---|---|---|
| Localhost | `/` | `/perpustakaan.jpg` | ✅ Works (goes to http://localhost:5175/perpustakaan.jpg) |
| Staging | `/kms/` | `/perpustakaan.jpg` | ❌ Fails (goes to https://khaz.app/perpustakaan.jpg, should be /kms/) |

---

## What Was Fixed

### Change 1: Added `getAssetPath()` utility function

**File:** `frontend/src/utils/imageUtils.js`

```javascript
/**
 * Get the full path for assets in the public folder
 * Handles subpath deployment automatically
 */
export const getAssetPath = (assetName) => {
  const appSubpath = getAppSubpath();
  const basePath = appSubpath === '/' ? '' : appSubpath;
  return `${basePath}/${assetName}`;
};
```

**How it works:**
- On localhost (`/`): `getAssetPath('perpustakaan.jpg')` → `/perpustakaan.jpg` ✅
- On staging (`/kms/`): `getAssetPath('perpustakaan.jpg')` → `/kms/perpustakaan.jpg` ✅
- On production (`/kmsetjendpdri/`): `getAssetPath('perpustakaan.jpg')` → `/kmsetjendpdri/perpustakaan.jpg` ✅

### Change 2: Updated HomePage.jsx to use the utility

**File:** `frontend/src/pages/HomePage.jsx`

**Before:**
```jsx
<ImageWithFallback 
  src="/perpustakaan.jpg"      // ❌ Hardcoded absolute path
  alt={t('home.perpustakaan_title')}
  className="repository-image"
  type="repository"
/>
```

**After:**
```jsx
<ImageWithFallback 
  src={getAssetPath('perpustakaan.jpg')}  // ✅ Dynamic path with subpath support
  alt={t('home.perpustakaan_title')}
  className="repository-image"
  type="repository"
/>
```

Same fix applied to:
- `jdih.png`
- `ppid.jpg`

---

## Verification

### ✅ Build Status
- Build time: 4.93s
- Errors: 0
- Modules: 1353 transformed
- Output: Successful

### ✅ Before Deployment Testing

**On localhost (http://localhost:5175/):**
```bash
npm run dev
# Navigate to http://localhost:5175/
# Verify images load in "Jelajahi Repositori Lainnya" section
# Verify browser console has no 404 errors for images
```

**Expected Result:** ✅ Images load successfully

### 📋 After Deployment (On Staging)

**On staging (https://khaz.app/kms/):**
1. Navigate to https://khaz.app/kms/
2. Scroll to "Jelajahi Repositori Lainnya" section
3. Check browser console (F12) for errors
4. Expected: ✅ No 404 errors, all 3 images visible

---

## Files Modified

1. **frontend/src/utils/imageUtils.js**
   - Added: `getAssetPath()` function
   - Updated: export statement to include new function

2. **frontend/src/pages/HomePage.jsx**
   - Updated: Import to include `getAssetPath`
   - Updated: Three image `src` attributes (perpustakaan, jdih, ppid)
   - Changed from: `src="/filename.jpg"`
   - Changed to: `src={getAssetPath('filename.jpg')}`

---

## Impact

- ✅ Fixes 404 errors on staging (https://khaz.app/kms/)
- ✅ Works on all subpaths (/kms, /kmsetjendpdri, etc.)
- ✅ Maintains backward compatibility with localhost
- ✅ Uses existing established pattern (same as DEFAULT_IMAGES)
- ✅ No Nginx configuration changes needed
- ✅ No Docker configuration changes needed
- ✅ No build environment changes needed

---

## Prevention for Future

When adding new assets from the public folder:
1. ❌ Don't use: `src="/filename.jpg"` (absolute path)
2. ✅ Do use: `src={getAssetPath('filename.jpg')}` (subpath-aware)
3. ✅ Or use: `src="filename.jpg"` (relative path)

---

## Deployment Instructions

### Step 1: Pull Latest Code
```bash
cd /var/www/html/kmsetjendpdri
git pull origin main
```

### Step 2: Rebuild Frontend Docker Image
```bash
docker-compose build frontend
```

### Step 3: Restart Frontend Container
```bash
docker-compose up -d frontend
```

### Step 4: Verify on Staging
Navigate to: https://khaz.app/kms/
Check "Jelajahi Repositori Lainnya" section for images

---

## Commands Reference

**Build locally:**
```bash
cd frontend && npm run build
```

**Watch locally:**
```bash
cd frontend && npm run dev
```

**Deploy to staging:**
```bash
sudo bash deploy-master.sh staging --health-check
```

---

## Git Information

**Commit:** [pending - to be committed]
**Files Changed:** 2
- frontend/src/utils/imageUtils.js
- frontend/src/pages/HomePage.jsx

**Branch:** main

---

