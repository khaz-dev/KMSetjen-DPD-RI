# Google OAuth Redirect URI Mismatch on Staging - Root Cause Analysis

## 🎯 ERROR SUMMARY

**Error:** `Error 400: redirect_uri_mismatch` on staging server
**URL:** Google redirects to error page with:
- Expected redirect: `https://khaz.app/kms/google/callback/`
- Actual being used: `http://localhost:5175/callback/google` (WRONG PATH ORDER)
- Status: Access blocked

---

## 🔍 ROOT CAUSE - FOUND 3 CRITICAL ISSUES

### ❌ ISSUE #1: docker-compose.yml Has WRONG Default Values

**Location:** `docker-compose.yml` lines 98 and 119

**Problem:**
```yaml
# WRONG ❌ (lines 98, 119)
VITE_GOOGLE_REDIRECT_URI: ${VITE_GOOGLE_REDIRECT_URI:-http://localhost:5175/callback/google}
                                                      ^^^^^^^^^^^^^ WRONG PATH ORDER
# Should be:
VITE_GOOGLE_REDIRECT_URI: ${VITE_GOOGLE_REDIRECT_URI:-http://localhost:5175/google/callback/}
                                                      ^^^^^^^^^^^^ CORRECT PATH ORDER
```

**Why This Breaks Staging:**
- When .env doesn't get loaded or is overridden, the default value is used
- Default has `/callback/google` (wrong order) instead of `/google/callback/` (correct)
- Frontend is built with this wrong URI hardcoded
- User tries to login → gets redirected to wrong URI → Google rejects it

### ✅ ISSUE #2: .env.staging Has CORRECT Value (But Not Being Used in Build)

**Location:** `.env.staging` lines 81-85

```env
GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/        ✅ CORRECT
VITE_GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/  ✅ CORRECT
```

**Problem:** 
- Config is CORRECT in .env.staging
- BUT docker-compose.yml doesn't pass these to build args correctly
- Frontend Dockerfile receives args from build section (line 91-99 of docker-compose.yml)
- If .env isn't applied during `docker-compose build`, the ARG defaults are used (which are WRONG)

### ❌ ISSUE #3: Frontend Build Args Don't Include VITE_GOOGLE_REDIRECT_URI Properly

**Location:** `docker-compose.yml` lines 91-99

```yaml
build:
  context: ./frontend
  dockerfile: Dockerfile
  args:
    # ... other args ...
    VITE_GOOGLE_REDIRECT_URI: ${VITE_GOOGLE_REDIRECT_URI:-http://localhost:5175/callback/google}  ❌
    # This tries to read VITE_GOOGLE_REDIRECT_URI from environment
    # But if docker-compose doesn't have access to .env, it uses the default (which is WRONG)
```

**The Issue:**
- `${VITE_GOOGLE_REDIRECT_URI:-...}` tries to read from Docker's environment
- If the .env file isn't sourced by Docker before running `docker-compose build`, it's not available
- Falls back to default: `http://localhost:5175/callback/google` ❌
- Frontend gets built with WRONG URI hardcoded in dist/

---

## 📋 DEPLOYMENT FLOW FAILURE

```
1. Administrator runs: docker-compose build on staging
   ↓
2. docker-compose reads docker-compose.yml
   ↓
3. For frontend build args, it tries to get VITE_GOOGLE_REDIRECT_URI from environment
   ↓
4. If .env file wasn't sourced before docker-compose command, it's not available
   ↓
5. Falls back to default: http://localhost:5175/callback/google ❌
   ↓
6. Frontend Dockerfile builds with env vars, sets VITE_GOOGLE_REDIRECT_URI to the DEFAULT
   ↓
7. npm run build bakes this into the dist/ HTML/JS
   ↓
8. Frontend starts, user clicks "masuk dengan Google"
   ↓
9. JavaScript tries to redirect to: http://localhost:5175/callback/google
   ↓
10. Google console has: https://khaz.app/kms/google/callback/ registered
    ↓
11. URI mismatch → 400 error ❌
```

---

## 🔧 THE FIX (Complete)

### Step 1: Fix docker-compose.yml Default Values

**Change BOTH occurrences** (lines 98 and 119):

**FROM:**
```yaml
VITE_GOOGLE_REDIRECT_URI: ${VITE_GOOGLE_REDIRECT_URI:-http://localhost:5175/callback/google}
```

**TO:**
```yaml
VITE_GOOGLE_REDIRECT_URI: ${VITE_GOOGLE_REDIRECT_URI:-http://localhost:5175/google/callback/}
```

Also check line 119 (environment section) - same fix needed.

### Step 2: Ensure .env File is Sourced Before Build

On staging server:
```bash
cd /var/www/html/kmsetjendpdri

# Verify .env exists and has correct values
cat .env | grep VITE_GOOGLE_REDIRECT_URI
# Should output: VITE_GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/

# Export environment variables from .env to shell
set -a
source .env
set +a

# Now run docker-compose build (will have access to .env variables)
docker-compose build --no-cache
```

### Step 3: Rebuild Frontend with Correct Values

```bash
cd /var/www/html/kmsetjendpdri

# Stop containers
docker-compose down

# Clean everything
docker system prune -f

# Source .env and rebuild
set -a
source .env
set +a
docker-compose build --no-cache

# Start services
docker-compose up -d

# Verify
sleep 15
docker-compose ps
```

### Step 4: Verify Frontend Has Correct URI

```bash
# Check the built image's environment
docker inspect kmsetjendpdri_frontend:latest | grep -A5 "VITE_GOOGLE"

# Should show: "VITE_GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/"
```

---

## ✅ VERIFICATION CHECKLIST

After applying the fix:

```bash
# 1. All containers healthy
docker-compose ps
# Expected: All "Up (healthy)"

# 2. Check backend configuration
docker-compose exec django bash -c 'python manage.py shell -c "from django.conf import settings; print(settings.GOOGLE_REDIRECT_URI)"'
# Expected: https://khaz.app/kms/google/callback/

# 3. Check frontend image
docker inspect kmsetjendpdri_frontend:latest | grep VITE_GOOGLE

# 4. Browser test
# Open: https://khaz.app/kms/login
# Click: masuk dengan Google
# Check DevTools Network tab: 
#   - First request should go to: accounts.google.com with redirect_uri=https://khaz.app/kms/google/callback/
#   - NOT: redirect_uri=http://localhost:5175/callback/google
```

---

## 🌐 SUCCESSFUL LOGIN FLOW (After Fix)

```
1. User clicks "masuk dengan Google" on https://khaz.app/kms/login
   ↓
2. Frontend constructs: https://accounts.google.com/o/oauth2/v2/auth?
                         redirect_uri=https://khaz.app/kms/google/callback/
   ↓
3. User authenticates with Google
   ↓
4. Google redirects back to: https://khaz.app/kms/google/callback/?code=...&state=...
   ↓
5. Frontend receives code, sends to backend: POST /api/auth/google/callback/
   ↓
6. Backend exchanges code for token (with matching redirect_uri)
   ↓
7. Backend returns JWT tokens
   ↓
8. Frontend stores tokens, redirects to dashboard
   ↓
✅ LOGIN SUCCESSFUL
```

---

## 📝 WHY LOCALHOST Works But Staging Doesn't

**Localhost (Works ✅):**
- In `.env` (dev): `VITE_GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback/`
- Frontend built with correct URI
- User login works

**Staging (Fails ❌):**
- In `.env.staging`: `VITE_GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/` ✅
- BUT docker-compose default is used: `http://localhost:5175/callback/google` ❌
- Frontend built with WRONG URI
- User login fails

**The Fix:**
- Make sure docker-compose build uses .env values
- OR update docker-compose.yml defaults to match localhost format

---

## 🚨 WHY THIS WASN'T CAUGHT EARLIER

1. **Docker Compose Limitation**: Only reads environment variables if explicitly sourced
   - `docker-compose build` doesn't automatically load .env
   - Must use: `set -a && source .env && set +a` first
   - OR: `export $(cat .env | xargs)` before docker-compose

2. **Inconsistent Defaults**: 
   - docker-compose.yml has `/callback/google` (WRONG)
   - .env.staging has `/google/callback/` (CORRECT)
   - Code normally uses `/google/callback/` (CORRECT)
   - Inconsistency causes confusion

3. **Path Order Issue**:
   - Typo in docker-compose default: `/callback/google`
   - Should be: `/google/callback/`
   - Swapped order breaks Google OAuth

---

## 📚 RELATED FILES TO VERIFY

- ✅ `.env.staging` line 85: Has correct URI
- ✅ `backend/config/settings.py` line 356: Backend default
- ✅ `frontend/src/services/googleService.js` line 7: Frontend reads from env
- ❌ `docker-compose.yml` lines 98, 119: WRONG defaults (TO FIX)
- ✅ `frontend/src/App.jsx` line 67: Router path `/google/callback`
- ✅ `backend/apps/auth/urls.py` line 23: API endpoint
- ✅ Google Cloud Console: Has correct URIs registered

---

## 🎯 COMPLETE FIX PROCEDURE

Run this on staging server:

```bash
# 1. Navigate to project
cd /var/www/html/kmsetjendpdri

# 2. Pull latest code (if fixes are pushed)
git pull origin main

# 3. Verify .env is correct
grep VITE_GOOGLE_REDIRECT_URI .env

# 4. Stop everything
docker-compose down

# 5. Clean Docker
docker system prune -f

# 6. Source .env and rebuild
set -a
source .env
set +a
docker-compose build --no-cache

# 7. Start services
docker-compose up -d

# 8. Wait
sleep 20

# 9. Verify
docker-compose ps
docker-compose logs frontend | tail -20

# 10. Test in browser
# https://khaz.app/kms/login → Click "masuk dengan Google" → Should work now!
```

