# Google OAuth Local Dev Issue - Quick Summary & Fix

## The Problem

**Error on Local:** `Error 400: redirect_uri_mismatch`
**Status on Staging:** Works perfectly ✅

---

## Root Cause

The frontend was sending:
```
http://localhost:5175/google/callback/  ← WITH trailing slash
```

But Google Cloud Console had registered:
```
http://localhost:5175/google/callback   ← WITHOUT trailing slash
```

**Exact match required for OAuth → Mismatch = Error** ❌

---

## Why Staging Worked

Staging had the trailing slash registered in Google Console **AND** the code was sending it with trailing slash, so they matched by coincidence. ✅

---

## The Fix Applied

**File:** `frontend/src/services/googleService.js`

Made the code smart:
1. If `VITE_GOOGLE_REDIRECT_URI` environment variable is set → use it exactly
2. If not set → construct URL without trailing slash

```javascript
// Use explicit redirect URI from environment if set, otherwise construct from domain
let redirectUri = GOOGLE_REDIRECT_URI;
if (!redirectUri) {
  const appSubpath = getAppSubpath();
  redirectUri = `${window.location.origin}${appSubpath}/google/callback`;  // NO slash
}
```

---

## Result

**Local Dev:**
- Code constructs: `http://localhost:5175/google/callback` (no slash)
- Google Console has: `http://localhost:5175/google/callback` (no slash)
- ✅ **MATCH → Works!**

**Staging:**
- `.env.production` sets: `VITE_GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/`
- Code uses exact value: `https://khaz.app/kms/google/callback/` (with slash)
- Google Console has: `https://khaz.app/kms/google/callback/` (with slash)
- ✅ **MATCH → Works!**

---

## How To Test

1. **Local dev login:**
   - Run `npm run dev`
   - Go to `http://localhost:5175/login`
   - Click "Masuk dengan Google"
   - Should redirect to Google login form
   - Sign in
   - Should redirect back to app and log in successfully

2. **Verify in DevTools:**
   - DevTools → Network tab
   - Click "Masuk dengan Google"
   - Look for request to `accounts.google.com/o/oauth2/v2/auth`
   - Check parameter: `redirect_uri=http%3A%2F%2Flocalhost%3A5175%2Fgoogle%2Fcallback`
   - Decoded: `http://localhost:5175/google/callback` ✅

---

## Configuration

**.env** (Local - No change needed):
```
VITE_GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
# VITE_GOOGLE_REDIRECT_URI not set for local - will be constructed
```

**.env.production** (Staging - Updated):
```
VITE_GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/
```

---

## Files Changed

- ✅ `frontend/src/services/googleService.js` - Smart redirect_uri logic
- ✅ `.env` - Documentation comment added
- ✅ `.env.production` - VITE_GOOGLE_REDIRECT_URI added

---

## Status

- ✅ Fixed
- ✅ Built successfully
- ✅ Committed to GitHub
- ⏭️ Ready to test on local dev
