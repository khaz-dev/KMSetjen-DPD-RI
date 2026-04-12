# Google OAuth Callback 404 Fix - Complete Analysis & Resolution

## Problem Statement
User reported "This khaz.app page can't be found" error when trying to login with Google OAuth. Browser redirected to `https://khaz.app/google/callback?state=...` resulting in 404, with console showing "Unsafe attempt to load URL" domain/protocol mismatch error.

## Root Cause Analysis

### Symptom Chain
1. User clicks "Login with Google" button
2. Browser redirected to Google OAuth consent screen
3. User grants permission
4. Google redirects to callback URL: `https://khaz.app/google/callback?state=XXX&code=YYY`
5. Result: **404 Page Not Found** + CORS/domain mismatch warning

### Technical Root Cause

**The Problem:** Frontend and backend callback URLs were missing the `/kms` subpath prefix

```
Frontend generates:     https://khaz.app/google/callback (WRONG - missing /kms)
↓ (Sends to Google)
Google OAuth redirects to: https://khaz.app/google/callback (WRONG)
↓ (Browser requests)
Nginx reverse proxy at `/kms/`: Cannot find route `/google/callback`
↓ (Routes app requests to /kms path only)
Actual React Router route: /kms/google/callback (Where it exists)
↓ (Result)
404 Error - Route doesn't exist at root level
```

**Why This Happened:**
1. Application deployed at `https://khaz.app/kms/` (subpath root)
2. Frontend `googleService.js` hardcoded `/google/callback` without reading `VITE_APP_SUBPATH` environment variable
3. Environment files had inconsistent values (`/kmsetjendpdri` vs `/kms`, some missing altogether)
4. Backend `settings.py` default `GOOGLE_REDIRECT_URI` also didn't include subpath
5. Google registered redirect_uri was `https://khaz.app/kms/google/callback` but frontend sent request to bare `/google/callback`

### Configuration Inconsistencies Found
```
.env file issues:
- Line 63: VITE_APP_SUBPATH=/kmsetjendpdri (WRONG - should be /kms)
- Line 82: GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback (missing /kms)

.env.production issues:
- Lines 53-54: API URLs using /kmsetjendpdri (OLD subpath)
- Line 95: GOOGLE_REDIRECT_URI using /kmsetjendpdri (WRONG subpath)
- Line 82: VITE_APP_SUBPATH=/kmsetjendpdri (WRONG)

.env.example issues:
- Missing VITE_APP_SUBPATH entirely (developers wouldn't know to set it)
- GOOGLE_REDIRECT_URI example didn't include subpath

Backend settings.py:
- Default GOOGLE_REDIRECT_URI: http://localhost:5175/google/callback (missing /kms)
```

## Solution Implemented

### 1. Frontend - googleService.js Updates

**Added helper function to dynamically read subpath:**
```javascript
const getAppSubpath = () => {
  const subpath = import.meta.env.VITE_APP_SUBPATH || '/';
  return subpath.replace(/\/$/, '');
};
```

**Updated callback URL construction to use subpath:**
```javascript
// In getGoogleAuthorizationUrl():
const appSubpath = getAppSubpath();
const redirectUri = `${window.location.origin}${appSubpath}/google/callback`;
// Result: https://khaz.app/kms/google/callback ✓

// In handleGoogleCallback():
const appSubpath = getAppSubpath();
const url = `${window.location.origin}${appSubpath}/google/callback?...`;
// Same correct result
```

**Impact:** Frontend now dynamically builds callback URL that matches the deployed route

### 2. Environment Configuration Updates

**.env (Development/Production Environment)**
```diff
- VITE_APP_SUBPATH=/kmsetjendpdri
+ VITE_APP_SUBPATH=/kms

- GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback
+ GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback
```

**.env.example (Developer Template)**
```diff
+ VITE_APP_SUBPATH=/kms

- GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback
+ GOOGLE_REDIRECT_URI=http://localhost:5175/kms/google/callback
```

**.env.production (Staging Server Configuration)**
```diff
- VITE_APP_SUBPATH=/kmsetjendpdri
+ VITE_APP_SUBPATH=/kms

- VITE_API_BASE_URL=https://khaz.app/kmsetjendpdri/api/
- VITE_API_URL=... (was missing)
+ VITE_API_BASE_URL=https://khaz.app/kms/api/
+ VITE_API_URL=https://khaz.app/kms/api/

- GOOGLE_REDIRECT_URI=https://khaz.app/kmsetjendpdri/google/callback
+ GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback
```

**Impact:** All environments now use consistent `/kms` subpath throughout

### 3. Backend - Django Settings Update

**backend/config/settings.py (Line 353)**
```diff
- GOOGLE_REDIRECT_URI = env('GOOGLE_REDIRECT_URI', default='http://localhost:5175/google/callback')
+ GOOGLE_REDIRECT_URI = env('GOOGLE_REDIRECT_URI', default='http://localhost:5175/kms/google/callback')
```

**Impact:** Backend now expects callback at correct subpath-qualified URL

## Expected OAuth Flow After Fix

### Correct Flow (AFTER FIX)
```
1. User clicks "Login with Google"
   ↓
2. Frontend builds URL: https://khaz.app/kms/google/callback (with /kms subpath)
   ↓
3. Frontend redirects to Google OAuth with correct redirect_uri
   ↓
4. Google shows consent screen
   ↓
5. User grants permission
   ↓
6. Google redirects to: https://khaz.app/kms/google/callback?state=XXX&code=YYY
   ↓
7. Nginx routes request to frontend app at /kms/
   ↓
8. React Router matches route: /google/callback ✓
   ↓
9. GoogleCallbackPage component processes callback
   ↓
10. Backend exchanges code for token at /api/auth/google/ ✓
    ↓
11. User logged in successfully ✓
```

## Files Changed

### Modified Files
1. **frontend/src/services/googleService.js**
   - Added `getAppSubpath()` helper function
   - Updated callback URL construction in multiple functions to include subpath
   
2. **.env** (Development/Production)
   - Fixed `VITE_APP_SUBPATH` from `/kmsetjendpdri` to `/kms`
   - Fixed `GOOGLE_REDIRECT_URI` to include `/kms` subpath

3. **.env.example** (Developer Template)
   - Added missing `VITE_APP_SUBPATH=/kms`
   - Updated `GOOGLE_REDIRECT_URI` to include subpath

4. **.env.production** (Staging Server)
   - Updated all paths from `/kmsetjendpdri` to `/kms`
   - Fixed `GOOGLE_REDIRECT_URI` with correct subpath
   - Added missing `VITE_API_URL`

5. **backend/config/settings.py**
   - Updated default `GOOGLE_REDIRECT_URI` to include `/kms` subpath

## Deployment Steps Required

### Step 1: Rebuild Frontend
```bash
# Pull latest code
git pull origin main

# Rebuild frontend with new environment variables
docker build -f frontend/Dockerfile -t your-registry/kmsetjen-frontend:latest ./frontend

# Tag for deployment
docker push your-registry/kmsetjen-frontend:latest
```

### Step 2: Rebuild Backend
```bash
# Build backend with updated settings
docker build -f backend/Dockerfile -t your-registry/kmsetjen-backend:latest ./backend

# Tag for deployment
docker push your-registry/kmsetjen-backend:latest
```

### Step 3: Deploy Updated Containers
```bash
# Stop current containers
docker-compose down

# Pull latest images and start
docker-compose up -d

# Verify services running
docker-compose ps
```

### Step 4: Verify Fix
1. Open browser to `https://khaz.app/`
2. Click "Login with Google"
3. Grant permissions on Google consent screen
4. Should redirect to callback page (not 404)
5. Should process callback and complete login

## Validation Checklist

- [x] Frontend generates callback URL with `/kms` subpath
- [x] Backend expects callback at `/kms/google/callback`
- [x] All environment files updated consistently
- [x] Code committed to Git
- [ ] Docker images rebuilt (pending deployment)
- [ ] Frontend container restarted with new env vars
- [ ] OAuth flow tested end-to-end
- [ ] No 404 errors on callback
- [ ] User successfully logged in via Google

## Debugging if Issues Persist

### If Still Getting 404
1. **Check frontend environment variable:**
   ```bash
   # SSH into frontend container
   docker exec -it <frontend-container> env | grep VITE_APP_SUBPATH
   # Should output: VITE_APP_SUBPATH=/kms
   ```

2. **Check generated callback URL in browser console:**
   - Open DevTools → Console
   - Look for logs showing redirect_uri being sent to Google
   - Should include `/kms` prefix

3. **Verify Nginx routing:**
   ```bash
   # Check nginx config routes `/kms` correctly
   docker exec -it <nginx-container> nginx -T | grep location
   ```

### If Token Exchange Fails
1. Check backend logs for token exchange errors:
   ```bash
   docker logs <backend-container> | grep -i google
   ```

2. Verify Google OAuth credentials still valid:
   - Login to Google Cloud Console
   - Check OAuth 2.0 credentials
   - Verify registered redirect_uri matches exactly

### If CORS/Domain Errors
1. These should be resolved once callback URL is correct
2. If still occurring, check:
   - Browser DevTools → Network tab → Google redirect request
   - Response headers from backend for CORS settings
   - ALLOWED_HOSTS in settings.py includes `khaz.app`

## Related Previous Issues

This fix is part of the comprehensive authentication overhaul:
1. **Admin Login Fix** (Messages 1-6): Created admin user, fixed Docker image
2. **Google OAuth Callback Fix** (Message 7+): Fixed callback URL routing with subpath

## Technical Notes

- **VITE_APP_SUBPATH**: Set during frontend build time, affects routing base
- **GOOGLE_REDIRECT_URI**: Must match exactly between frontend request and Google OAuth registration
- **Subpath Architecture**: All app routes must include `/kms` prefix in generated URLs
- **Environment Variable Propagation**: Frontend uses Vite's `import.meta.env`, backend uses Django's `env()` helper

## Git Commit Reference
- Commit: Fix Google OAuth callback URL to use /kms subpath
- Changes: 12 files modified, environment configurations aligned, frontend service updated

---

**Last Updated:** After Google OAuth callback fix implementation
**Status:** Ready for Docker rebuild and deployment testing
