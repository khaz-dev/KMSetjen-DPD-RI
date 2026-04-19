# Logo Path Bug - Executive Summary & Technical Explanation

## The Problem You Reported

**Local Dev:** `http://localhost:5175/knowledges` → `/knowledges/logo.png` ❌ **BROKEN**
**Staging:** `https://khaz.app/kms/knowledges` → `/kms/logo.png` ✅ **WORKING**

---

## Root Cause: The Culprit

**Location:** `frontend/src/utils/imageUtils.js` → `getAppSubpath()` function

### The Bug Explained Simply

The function was trying to **figure out the app's base path by looking at the current URL**.

```
On local dev:
URL: http://localhost:5175/knowledges
↓
Function sees: "/knowledges" (first URL segment)
↓
"That must be the app subpath!" (WRONG - it's a page route)
↓
Logo path becomes: /knowledges/logo.png
↓
Browser looks for: /knowledges/logo.png (relative to /knowledges route = BROKEN)

On staging:
URL: https://khaz.app/kms/knowledges
↓
Function sees: "/kms" (first URL segment)
↓
"That must be the app subpath!" (HAPPENS TO BE RIGHT BY COINCIDENCE)
↓
Logo path becomes: /kms/logo.png
↓
Browser looks for: /kms/logo.png (works correctly on staging)
```

### Why This Approach Was Wrong

The function was using this regex:
```javascript
const match = path.match(/^(\/[a-z_]+)/);  // Gets first segment
```

**Problem:** Can't distinguish between:
- App subpath: `/kms` (deployment configuration)
- Page routes: `/knowledges`, `/category`, `/dashboard` (application routes)

Both look like URL segments, so the function gets confused.

---

## The Solution: Two Changes

### Change 1: Fix the Detection Method

**REMOVE:** Runtime URL detection (unreliable)
**USE:** Environment variable only (reliable, build-time constant)

```javascript
// OLD - Gets confused about what's a subpath vs route
export const getAppSubpath = () => {
  const path = window.location.pathname;
  const match = path.match(/^(\/[a-z_]+)/);
  if (match && match[1] && match[1] !== '/') {
    return match[1];  // Could return a route instead of subpath!
  }
  return import.meta.env.VITE_APP_SUBPATH || '/';
};

// NEW - Uses truth source: environment variable
export const getAppSubpath = () => {
  return import.meta.env.VITE_APP_SUBPATH || '/';
};
```

### Change 2: Fix Environment Variables

**`.env` file (Local Development):**
```
BEFORE: VITE_APP_SUBPATH=/kms    ← Wrong! This is for production
AFTER:  VITE_APP_SUBPATH=/       ← Correct for local dev
```

**`.env.production` file (Staging):**
```
ALREADY CORRECT: VITE_APP_SUBPATH=/kms    ← No change needed
```

---

## Why This Works Now

### Local Development (`VITE_APP_SUBPATH=/`)

```
URL: http://localhost:5175/knowledges
↓
getAppSubpath() returns: /  (from environment)
↓
basePath = "" (empty string, because basePath = appSubpath === '/' ? '' : appSubpath)
↓
Logo path: "" + "/logo.png" = /logo.png
↓
Browser requests: GET http://localhost:5175/logo.png ✅
```

### Staging (`VITE_APP_SUBPATH=/kms`)

```
URL: https://khaz.app/kms/knowledges
↓
getAppSubpath() returns: /kms  (from environment)
↓
basePath = "/kms"
↓
Logo path: "/kms" + "/logo.png" = /kms/logo.png
↓
Browser requests: GET https://khaz.app/kms/logo.png ✅
```

---

## Key Concept: Build-Time vs Runtime

### App Subpath is a **BUILD-TIME CONSTANT**

It's decided when you build the application, not at runtime:
- **Local Dev:** `VITE_APP_SUBPATH=/` (set in `.env`)
- **Staging:** `VITE_APP_SUBPATH=/kms` (set in `.env.production`)

### Why NOT Detect at Runtime?

1. **Unreliable:** Can't distinguish routes from subpaths
2. **Fragile:** Breaks when routes happen to match subpath pattern
3. **Unnecessary:** Already compiled into the app at build time
4. **Performance:** Avoids runtime regex matching

---

## Impact Analysis

### What This Fixes

| Issue | Before | After |
|-------|--------|-------|
| Logo on `/knowledges` route | Broken `/knowledges/logo.png` | Fixed `/logo.png` |
| Logo on other routes | Broken (route-specific) | Fixed (consistent) |
| Default article images | Broken | Fixed |
| Default category images | Broken | Fixed |
| SSO logo (logo_nusa.png) | Broken on local dev | Fixed |

### Performance Impact

- ✅ **Faster:** Removed runtime regex matching
- ✅ **Cleaner:** Uses environment variable directly
- ✅ **More Reliable:** No ambiguity in detection

### Affected Components

All components using `getAppSubpath()` or `getDefaultImages()`:
- LoginPage (uses logo_nusa)
- ArticlesPage (article image fallback)
- CategoryDetailPage (category image fallback)
- Header/Footer (if using logo)
- Any custom components with fallback images

---

## Technical Details

### How Vite's `base` Works

Vite's `base` configuration in `vite.config.js`:
```javascript
base: process.env.VITE_APP_SUBPATH || '/',
```

This tells Vite to:
1. **In Development:** Serve from specified base path
2. **In Production:** Prefix all routes with base path

Combined with the `<base href="%BASE_URL%" />` tag in HTML, this ensures:
- Relative URLs resolve correctly
- Assets load from correct path
- React Router works with subpaths

### The HTML Base Tag

Added in previous fix:
```html
<base href="/" />  <!-- For local dev -->
<!-- Changes to -->
<base href="/kms" />  <!-- For staging (via Vite's %BASE_URL% substitution) -->
```

This ensures the browser knows the base URL for all relative paths.

---

## Configuration Reference

### Local Development (.env)
```
VITE_APP_SUBPATH=/              ← App serves from root
VITE_API_BASE_URL=...           ← Points to http://localhost:8002
```

### Staging (.env.production)
```
VITE_APP_SUBPATH=/kms           ← App serves from /kms subpath
VITE_API_BASE_URL=...           ← Points to https://khaz.app/kms/api
```

---

## Verification Steps

1. **Local dev on `/knowledges`:**
   - Open DevTools Network tab
   - Check logo request: should be `GET /logo.png`
   - NOT `GET /knowledges/logo.png`

2. **Production build:**
   - Build command: `npm run build`
   - Should use `.env.production` automatically
   - Logo path in bundle: `/kms/logo.png`

3. **Test across routes:**
   - Home: `/`
   - Articles: `/knowledges`
   - Article detail: `/knowledges/any-slug`
   - Categories: `/category/123`
   - Logo should load on all routes

---

## Summary

| Aspect | Details |
|--------|---------|
| **Root Cause** | getAppSubpath() used unreliable URL detection |
| **Why It Failed** | Confused page routes with app subpath |
| **Solution** | Use only environment variables, remove runtime detection |
| **Files Changed** | imageUtils.js, .env |
| **Dev Impact** | None - same usage patterns |
| **Performance** | Improved - removed regex matching |
| **Breaking Changes** | None |
| **Deployment Risk** | Very Low - isolated change |

---

## Next Steps

1. ✅ **Committed:** Changes pushed to GitHub
2. ✅ **Built:** Production build tested and working
3. ⏭️ **To Deploy:** Build staging server with `.env.production`
4. ⏭️ **To Verify:** Test logo loads on `/knowledges` route locally
5. ⏭️ **Monitor:** Check CloudFlare logs for any path-related issues

---

## Questions?

### "Will this affect production?"
No. Staging uses `.env.production` which already had the correct `VITE_APP_SUBPATH=/kms`.

### "Will this affect other images?"
Yes, positively. Default article, category, and SSO logos all use the same function, so they're all fixed.

### "Do I need to redeploy?"
Only if you want to fix local development. The fix must be built in (not runtime configurable).
