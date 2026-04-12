# 🚨 Google OAuth Fix - URGENT DEPLOYMENT REQUIRED

**Status:** Root cause found and fixed  
**Error:** `redirect_uri_mismatch` from Google  
**Solution:** Rebuild frontend container with trailing slash in callback URL  
**Deployment Time:** 5-10 minutes  

---

## Problem Summary

When user tries to login with Google:
- Frontend sends: `https://khaz.app/google/callback` ❌
- Google expects: `https://khaz.app/kms/google/callback/` ✅
- Result: Error 400 - redirect_uri_mismatch

**Why?**
1. Old frontend code doesn't have `/kms` OR trailing slash
2. .env files didn't have trailing slash either
3. Production frontend container was never rebuilt

---

## Root Causes Identified & Fixed ✅

### Issue 1: Frontend Not Rebuilt
- ✅ **FIXED**: Frontend code now includes `/kms` subpath AND trailing slash
- ✅ **FIXED**: All .env files updated with trailing slash
- ✅ **FIXED**: Backend settings.py updated with trailing slash
- ⏳ **PENDING**: Production container must be rebuilt

### Issue 2: Missing Trailing Slash (CRITICAL)
- Google registered URI: `https://khaz.app/kms/google/callback/` (WITH slash)
- Code now generates: `https://khaz.app/kms/google/callback/` (WITH slash) ✅
- They now match exactly

---

## Deployment Steps (4 Commands) 🚀

### Step 1: SSH into Production Server
```bash
ssh -i c:\Users\khair\khaz root@165.245.191.216
```

### Step 2: Pull Latest Code with Fixes
```bash
cd /var/www/html/kmsetjendpdri
git pull origin main
```

**What you'll see:**
```
remote: Counting objects: 3, done.
Receiving objects: 100% (3/3), done.
From github.com:YourRepo/kmsetjen-app
   55446bd...abc1234 main -> origin/main
Updating 55446bd..abc1234
 GOOGLE_OAUTH_REDIRECT_URI_MISMATCH_FIX.md | +150 -.
 frontend/src/services/googleService.js   | +2 -,
 .env                                      | +1 -,
 backend/config/settings.py               | +1 -,

Successfully updated working directory
```

### Step 3: Rebuild Frontend Container (THIS IS KEY!)
```bash
docker-compose build --no-cache frontend
```

**What to expect:**
- Vite will rebuild with `VITE_APP_SUBPATH=/kms`
- Build will take 2-3 minutes
- Should see: `Successfully tagged kmsetjendpdri_frontend:latest`

### Step 4: Rebuild Backend & Restart Everything
```bash
docker-compose build --no-cache django
docker-compose down
docker-compose up -d
docker-compose ps
```

**After restart, all should show "Up":**
```
NAME              STATUS
kmsetjendpdri_frontend_1   Up 5 seconds
kmsetjendpdri_django_1     Up 4 seconds
kmsetjendpdri_nginx_1      Up 3 seconds
kmsetjendpdri_postgres_1   Up 2 seconds
```

---

## Verification Tests (5 Tests) ✓

### Test 1: Check Frontend Built with Correct Subpath
```bash
# SSH into frontend container
docker exec -it kmsetjendpdri_frontend_1 sh

# Check environment variable
echo $VITE_APP_SUBPATH
# Expected output: /kms

# Exit
exit
```

### Test 2: Verify Backend Configuration
```bash
# Check Django settings
docker exec -it kmsetjendpdri_django_1 python manage.py shell

# In Django shell:
>>> from django.conf import settings
>>> print(settings.GOOGLE_REDIRECT_URI)
# Expected: https://khaz.app/kms/google/callback/

>>> exit()
```

### Test 3: Check Frontend Logs for Errors
```bash
docker logs kmsetjendpdri_frontend_1 | tail -50
# Should see: "App is running at http://localhost:5173" or similar
# Should NOT see build errors
```

### Test 4: Test Login Page
1. Open browser: `https://khaz.app/`
2. Click "Login" button
3. Should see "Login with Google" option
4. **Expected:** No errors on page

### Test 5: Test Google OAuth Flow (CRITICAL) ⭐
1. Navigate to: `https://khaz.app/kms/login`
2. Click "Login with Google"
3. **Should see:** Google consent screen (NOT the error page)
4. Grant permissions
5. **Should see:** Redirected to callback handler (NOT 404, NOT redirect_uri_mismatch error)
6. **Should see:** Either dashboard or processing message
7. **Result:** Successfully logged in with Google

---

## If Tests Fail

### If Still Going to Error Page
```bash
# Check what URL frontend is sending to Google
docker logs kmsetjendpdri_frontend_1 | grep -i "redirect_uri\|callback"

# Should show: redirect_uri=https%3A%2F%2Fkhaz.app%2Fkms%2Fgoogle%2Fcallback%2F
```

### If 404 After Clicking Google Permission Button
```bash
# This means backend callback route isn't working
# Check Django logs
docker logs kmsetjendpdri_django_1 | grep -i "google\|callback" | tail -20

# Should see: [GoogleCallback] Request received
```

### If Still Getting redirect_uri_mismatch
```bash
# Frontend might not have rebuilt properly
# Force clean rebuild
docker-compose down -v
docker system prune -a
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

---

## What Was Actually Fixed

### ✅ Frontend (frontend/src/services/googleService.js)
```javascript
// BEFORE (broken):
const redirectUri = `${window.location.origin}/google/callback`;
// Result: https://khaz.app/google/callback ❌

// AFTER (fixed):
const appSubpath = getAppSubpath();  // Gets VITE_APP_SUBPATH=/kms
const redirectUri = `${window.location.origin}${appSubpath}/google/callback/`;
// Result: https://khaz.app/kms/google/callback/ ✅
```

### ✅ Environment Files (all .env files)
```bash
# BEFORE (broken):
GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback

# AFTER (fixed):
GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/
# ↑ Added trailing slash
```

### ✅ Backend (backend/config/settings.py)
```python
# BEFORE (broken):
GOOGLE_REDIRECT_URI = env('GOOGLE_REDIRECT_URI', default='http://localhost:5175/kms/google/callback')

# AFTER (fixed):
GOOGLE_REDIRECT_URI = env('GOOGLE_REDIRECT_URI', default='http://localhost:5175/kms/google/callback/')
# ↑ Added trailing slash
```

---

## Why This Matters

Google's OAuth 2.0 validation:
- ✅ Exact URL matching is required
- ✅ Protocol, domain, path, AND trailing slash must match
- ❌ Even one character difference causes `redirect_uri_mismatch` error

```
Registered in Google Cloud:     https://khaz.app/kms/google/callback/
Frontend must send exactly:     https://khaz.app/kms/google/callback/
                                                                      ↑ Required
```

---

## Expected Timeline

| Step | Time |
|------|------|
| SSH in | 30 sec |
| Git pull | 10 sec |
| Frontend build | 2-3 min |
| Backend rebuild | 1-2 min |
| Restart containers | 30 sec |
| Test login | 1 min |
| **TOTAL** | **~5-10 min** |

---

## Success Indicators

After completion, you should:
1. ✅ See Google consent screen when clicking "Login with Google"
2. ✅ See callback processing (not error)
3. ✅ Get redirected to dashboard
4. ✅ Be logged in as the Google user
5. ✅ No error 400 or redirect_uri_mismatch messages

---

## Files Changed in This Fix

- [GOOGLE_OAUTH_REDIRECT_URI_MISMATCH_FIX.md](./GOOGLE_OAUTH_REDIRECT_URI_MISMATCH_FIX.md) - Detailed analysis
- `frontend/src/services/googleService.js` - Added trailing slash
- `.env` - Added trailing slash
- `.env.example` - Added trailing slash  
- `.env.production` - Added trailing slash
- `backend/config/settings.py` - Added trailing slash
- `backend/apps/auth/views.py` - Updated docs and fallbacks

---

## Next Issue (If Occurs)

After successful Google login, if user can't see dashboard, check:
1. JWT token generation is working
2. User was created in database
3. Frontend role/permission checks

But first, get Google OAuth working - this is the blocker.

---

**Status: READY FOR DEPLOYMENT** ✅  
**All fixes committed to Git** ✅  
**Just need to rebuild frontend on production** ⏳

