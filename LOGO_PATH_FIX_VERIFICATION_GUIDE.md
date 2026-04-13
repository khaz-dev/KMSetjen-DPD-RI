# Logo Path Fix - Verification & Testing Guide

## Summary of Changes

### 1. **Root Cause**
The `getAppSubpath()` function in `frontend/src/utils/imageUtils.js` was using an unreliable method to detect the app subpath by examining `window.location.pathname`. This couldn't distinguish between the app subpath and page routes:

- On local dev at `/knowledges` → incorrectly detected `/knowledges` as the subpath
- Logo path became `/knowledges/logo.png` **✗ BROKEN**

- On staging at `/kms/knowledges` → correctly detected `/kms` as the subpath
- Logo path was `/kms/logo.png` **✓ WORKING (by luck)**

### 2. **Files Modified**

#### a) `frontend/src/utils/imageUtils.js`
**Changed:** Removed unreliable `window.location.pathname` detection
**From:** Tried to detect subpath from URL first, then fallback to env var
**To:** Use ONLY `import.meta.env.VITE_APP_SUBPATH` (build-time constant)

```javascript
// BEFORE (Problematic)
export const getAppSubpath = () => {
  const path = window.location.pathname;
  const match = path.match(/^(\/[a-z_]+)/);  // Could match routes!
  if (match && match[1] && match[1] !== '/') {
    return match[1];  // Returns route as subpath
  }
  return import.meta.env.VITE_APP_SUBPATH || '/';
};

// AFTER (Correct)
export const getAppSubpath = () => {
  return import.meta.env.VITE_APP_SUBPATH || '/';
};
```

#### b) `.env` (Local Development Configuration)
**Changed:** `VITE_APP_SUBPATH` for local dev
**From:** `/kms` (production value)
**To:** `/` (local development)

```
# BEFORE
VITE_APP_SUBPATH=/kms

# AFTER
VITE_APP_SUBPATH=/
```

## Testing Procedures

### Test 1: Local Development - Logo on Articles Page

**Prerequisites:**
- Backend running on `http://localhost:8002`
- `.env` file has `VITE_APP_SUBPATH=/`

**Steps:**
1. Start dev server:
   ```powershell
   cd frontend
   npm run dev
   ```

2. Navigate to articles page:
   ```
   http://localhost:5175/knowledges
   ```

3. Open browser DevTools (F12) → Network tab

4. Look for `logo.png` request:
   - **Expected URL:** `GET http://localhost:5175/logo.png`
   - **Status:** `200` (loaded successfully)
   - **NOT:** `/knowledges/logo.png` ❌

**Pass Criteria:**
- ✅ Logo image is visible on the page
- ✅ Network shows `logo.png` requested from root path `/logo.png`
- ✅ Status code is 200

### Test 2: Local Development - Logo on Different Routes

**Steps:**
1. Navigate to different pages:
   ```
   http://localhost:5175/
   http://localhost:5175/knowledges
   http://localhost:5175/knowledges/any-article-slug
   http://localhost:5175/category/any-category-id
   http://localhost:5175/login
   ```

2. For each page, verify in DevTools:
   - Logo request path is `/logo.png` (not `/{current-route}/logo.png`)
   - Logo visible on page

**Pass Criteria:**
- ✅ All logo requests go to `/logo.png` regardless of current route
- ✅ Logo displays on all pages

### Test 3: Production Build - Staging Deployment Simulation

**Setup .env for staging build:**
```powershell
# Temporarily set staging config
$env:VITE_APP_SUBPATH = "/kms"
```

**Steps:**
1. Clean build:
   ```powershell
   cd frontend
   Remove-Item dist, .vite -Recurse -Force -ErrorAction SilentlyContinue
   npm run build
   ```

2. Check built `dist/index.html`:
   ```bash
   cat dist/index.html | findstr base
   # Should show: <base href="/" />
   # (The /kms prefix is added differently in production)
   ```

3. Verify bundle contains correct logo path:
   ```bash
   Add-Content dist/test-paths.txt "Logo path test"
   findstr /i "logo" dist/assets/*.js
   # Should find: `/kms/logo.png` in the output
   ```

**Pass Criteria:**
- ✅ Build succeeds without errors
- ✅ Bundle contains correct logo path references

### Test 4: Image Fallback (Edge Case)

**Steps:**
1. In DevTools, simulate logo missing:
   - Right-click logo → Inspect
   - Edit HTML to remove src attribute
   - Should fallback to `DEFAULT_IMAGES.LOGO`

2. Verify fallback logic in console:
   ```javascript
   // In browser console:
   import { getDefaultImage } from './utils/imageUtils.js'
   console.log(getDefaultImage('logo'))
   // Should output: /logo.png (or /kms/logo.png on staging)
   ```

**Pass Criteria:**
- ✅ Fallback mechanism works
- ✅ Logo path is constructed correctly from environment

## Verification Checklist

- [ ] Local dev server starts on `http://localhost:5175`
- [ ] `.env` shows `VITE_APP_SUBPATH=/` for local
- [ ] `.env.production` shows `VITE_APP_SUBPATH=/kms` for staging
- [ ] `getAppSubpath()` in imageUtils.js uses ONLY env variable
- [ ] Logo visible on `/knowledges` route
- [ ] Network tab shows `GET /logo.png` (not `/knowledges/logo.png`)
- [ ] Logo visible on all routes (home, articles, detail, etc.)
- [ ] Production build succeeds
- [ ] No console errors related to image loading

## Deployment Instructions

### For Local Development
No action needed. `.env` already configured with `VITE_APP_SUBPATH=/`

```powershell
cd frontend
npm run dev
```

### For Staging (khaz.app/kms)
Uses `.env.production`:
```powershell
cd frontend
npm run build  # Uses .env.production automatically
```

Build output will have `base: /kms` configured via Vite.

## Troubleshooting

### Issue: Logo still showing as broken on local
1. Clear Vite cache:
   ```powershell
   Remove-Item frontend/.vite -Recurse -Force
   ```
2. Verify `.env` has `VITE_APP_SUBPATH=/`
3. Restart dev server

### Issue: Logo broken on staging after fix
1. Ensure `.env.production` has `VITE_APP_SUBPATH=/kms`
2. Rebuild with production env:
   ```bash
   npm run build  # Or NODE_ENV=production npm run build
   ```
3. Check CloudFlare/proxy isn't modifying paths

### Issue: Other images (article, category) broken
These use the same `getAppSubpath()` function, so should be fixed by this change.

## Environment Variables Reference

| Variable | Local Dev | Staging | Purpose |
|----------|-----------|---------|---------|
| `VITE_APP_SUBPATH` | `/` | `/kms` | App subpath for assets |
| `VITE_API_BASE_URL` | `http://localhost:8002/api` | `https://khaz.app/kms/api` | Backend API URL |
| `VITE_API_URL` | `http://localhost:8002` | `https://khaz.app/kms` | Backend base URL |

## Performance Impact
- ✅ No performance impact - removed unnecessary regex matching
- ✅ Faster initialization - no runtime path detection
- ✅ More reliable - uses compile-time configuration

## Related Issues Fixed
- Logo broken on `/knowledges` route (local dev)
- Default article image path inconsistency
- Default category image path inconsistency
- SSO logo (logo_nusa.png) loading issues

## Files Changed Summary
- `frontend/src/utils/imageUtils.js` - Fixed getAppSubpath() function
- `.env` - Corrected VITE_APP_SUBPATH for local dev
- `frontend/dist/` - Rebuilt with fixes
