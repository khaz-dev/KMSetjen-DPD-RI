# Google OAuth Staging Login Failure - Complete Analysis & Solution

## 📊 THE PROBLEM

**Symptom:** User can login with Google on localhost but NOT on staging server
- **Local (works ✅):** http://localhost:5175/login → "masuk dengan Google" → Success
- **Staging (fails ❌):** https://khaz.app/kms/login → "masuk dengan Google" → Google error page

**Error Message:**
```
Error 400: redirect_uri_mismatch

The redirect_uri in the request, http://localhost:5175/callback/google,
does not match the ones configured in Google Cloud Console.

Expected: https://khaz.app/kms/google/callback/
```

---

## 🔧 ROOT CAUSE - THREE INTERCONNECTED ISSUES

### Issue 1: Wrong Path Order in docker-compose.yml Default

**File:** `docker-compose.yml` lines 98 and 119

**What Was Wrong:**
```yaml
VITE_GOOGLE_REDIRECT_URI: ${VITE_GOOGLE_REDIRECT_URI:-http://localhost:5175/callback/google}
                                                      ^^^^^^^^^^^^^ WRONG: /callback/google
```

**Correct Format:**
```yaml
VITE_GOOGLE_REDIRECT_URI: ${VITE_GOOGLE_REDIRECT_URI:-http://localhost:5175/google/callback/}
                                                      ^^^^^^^^^^^^ CORRECT: /google/callback/
```

**Why It Matters:**
- Path must be exactly: `/google/callback/`
- Wrong order `/callback/google` doesn't match Google Cloud Console registration
- Google rejects it as invalid

### Issue 2: docker-compose Doesn't Auto-Load .env During Build

**What Happened:**
1. .env.staging has CORRECT value: `VITE_GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/`
2. But `docker-compose build` doesn't automatically read .env
3. So it falls back to docker-compose.yml default (which is WRONG)
4. Frontend gets built with WRONG URI hardcoded in dist/

**The Flow:**
```
docker-compose build
  ↓
Reads: VITE_GOOGLE_REDIRECT_URI=${...:-DEFAULT}
  ↓
.env not in environment → uses DEFAULT
  ↓
DEFAULT is WRONG: http://localhost:5175/callback/google
  ↓
Frontend built with WRONG URI  ❌
```

### Issue 3: Frontend Code Depends on Environment Variable

**File:** `frontend/src/services/googleService.js` line 7

```javascript
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || '';

// If VITE_GOOGLE_REDIRECT_URI is not set, constructs fallback:
redirectUri = `${window.location.origin}${appSubpath}/google/callback/`;
// For staging: https://khaz.app/kms/google/callback/  ✅ CORRECT
```

**The Problem:**
- If env var is set from wrong docker-compose default → uses WRONG value
- If env var not set → constructs correct value from URL
- But because docker-compose passes the WRONG default as an environment variable, it overrides the fallback

---

## 🎯 THE FIX (COMPLETE)

### Step 1: Fixed docker-compose.yml

**Change Made:**
- Line 98 (build args): Updated default from `/callback/google` to `/google/callback/`
- Line 119 (environment): Updated default from `/callback/google` to `/google/callback/`

**Actual Change:**
```diff
- VITE_GOOGLE_REDIRECT_URI: ${VITE_GOOGLE_REDIRECT_URI:-http://localhost:5175/callback/google}
+ VITE_GOOGLE_REDIRECT_URI: ${VITE_GOOGLE_REDIRECT_URI:-http://localhost:5175/google/callback/}
```

### Step 2: Deploy on Staging Server

**On staging server, run:**

```bash
cd /var/www/html/kmsetjendpdri

# Pull latest code with fixes
git pull origin main

# Verify .env has correct config
grep VITE_GOOGLE_REDIRECT_URI .env
# Expected: VITE_GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/

# Stop containers
docker-compose down

# Clean Docker
docker system prune -f

# Source environment variables BEFORE building
set -a
source .env
set +a

# Build with correct environment
docker-compose build --no-cache

# Start
docker-compose up -d

# Wait for services
sleep 20

# Verify
docker-compose ps
```

### Step 3: Test

**Browser test:**
```
1. Open: https://khaz.app/kms/login
2. Click: "masuk dengan Google"
3. Sign in with Google account
4. ✅ Should redirect to dashboard (no error)
```

---

## ✅ WHAT WAS FIXED

| Component | Before | After | Status |
|-----------|--------|-------|--------|
| docker-compose.yml line 98 | `/callback/google` | `/google/callback/` | ✅ Fixed |
| docker-compose.yml line 119 | `/callback/google` | `/google/callback/` | ✅ Fixed |
| .env.staging | (already correct) | `https://khaz.app/kms/google/callback/` | ✅ OK |
| Google Cloud Console | (already correct) | Has all 9 redirect URIs | ✅ OK |
| Frontend code | (no change) | Uses env var correctly | ✅ OK |
| Backend code | (no change) | Exchanges code correctly | ✅ OK |

---

## 🔍 WHY LOCALHOST WORKED BUT STAGING DIDN'T

### Localhost Flow (✅ Works)

```
1. .env (dev) has: VITE_GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback/
2. npm run dev reads .env
3. Frontend built with CORRECT URI
4. User clicks login → redirects to Google
5. Google redirects to: http://localhost:5175/google/callback/
6. Google Cloud Console has this registered ✅
7. Login succeeds ✅
```

### Staging Flow Before Fix (❌ Failed)

```
1. .env.staging has: VITE_GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/ ✅
2. docker-compose build runs
3. docker-compose doesn't load .env → uses DEFAULT
4. DEFAULT was: http://localhost:5175/callback/google ❌ (WRONG ORDER)
5. Frontend built with WRONG URI
6. User clicks login → redirects to Google
7. Google tries to redirect to: http://localhost:5175/callback/google ❌
8. Google Cloud Console has: https://khaz.app/kms/google/callback/ (different)
9. Mismatch error ❌ Login fails
```

### Staging Flow After Fix (✅ Works)

```
1. .env.staging has: VITE_GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/ ✅
2. docker-compose build runs
3. If .env sourced: Uses CORRECT value from .env
4. If .env not sourced: Uses NEW CORRECT default
5. Frontend built with CORRECT URI ✅
6. User clicks login → redirects to Google
7. Google redirects to: https://khaz.app/kms/google/callback/ ✅
8. Google Cloud Console has: https://khaz.app/kms/google/callback/ ✅
9. URI matches → Login succeeds ✅
```

---

## 📚 FILES CREATED/MODIFIED

### Created Documentation (in GitHub):
- ✅ `GOOGLE_OAUTH_REDIRECT_URI_MISMATCH_ROOT_CAUSE.md` - Deep technical analysis
- ✅ `GOOGLE_OAUTH_FIX_STAGING_DEPLOYMENT.md` - Step-by-step deployment guide

### Modified Files:
- ✅ `docker-compose.yml` - Fixed lines 98 and 119

### Configuration Files (Already Correct):
- ✅ `.env.staging` - Has correct redirect URIs
- ✅ `backend/config/settings.py` - Backend configuration
- ✅ `frontend/src/services/googleService.js` - Frontend code
- ✅ Google Cloud Console - All 9 redirect URIs registered

---

## 🎓 LESSONS LEARNED

### Docker Compose Limitation
```bash
# ❌ This doesn't auto-load .env
docker-compose build

# ✅ Do this instead
set -a && source .env && set +a
docker-compose build
```

### Environment Variable Precedence
```
1. Variables passed as ARG to docker build
2. Variables in docker-compose.yml build section
3. Default value if variable not set
```

If .env is not loaded, it falls to step 3 (default), which was WRONG.

### Path Format Matters
```
/google/callback/   ✅ CORRECT
/callback/google    ❌ WRONG
callback/google/    ❌ WRONG (no leading slash)
/google/callback    ❌ WRONG (no trailing slash for some systems)
```

Google OAuth requires exact match including slashes.

---

## 🚀 DEPLOYMENT COMMANDS (Copy-Paste)

```bash
# On staging server
cd /var/www/html/kmsetjendpdri

# 1. Pull changes
git pull origin main

# 2. Verify config
grep VITE_GOOGLE_REDIRECT_URI .env

# 3. Clean and rebuild
docker-compose down
docker system prune -f
set -a && source .env && set +a && docker-compose build --no-cache

# 4. Start
docker-compose up -d

# 5. Wait
sleep 20

# 6. Test
docker-compose ps
curl http://localhost:8002/health/
```

---

## ✅ SUCCESS INDICATORS

After deployment, verify:

```bash
# 1. All containers healthy
docker-compose ps
# Look for: All services with "Up (healthy)"

# 2. Frontend has correct environment
docker inspect kmsetjendpdri_frontend:latest | grep VITE_GOOGLE_REDIRECT_URI
# Should show: https://khaz.app/kms/google/callback/

# 3. Browser test
# https://khaz.app/kms/login → masuk dengan Google → Dashboard ✅

# 4. No errors in logs
docker-compose logs frontend | grep -i "oauth\|error\|redirect"
docker-compose logs django | grep -i "oauth\|error\|redirect"
```

---

## 📞 TROUBLESHOOTING

### Issue: Still Getting Mismatch Error

**Check 1: Is .env sourced?**
```bash
echo $VITE_GOOGLE_REDIRECT_URI
# If empty, .env wasn't sourced before docker-compose build
```

**Check 2: Did frontend rebuild?**
```bash
docker inspect kmsetjendpdri_frontend:latest | grep VITE_GOOGLE_REDIRECT_URI
# Should show the staging URL, not localhost
```

**Check 3: Full rebuild**
```bash
docker-compose down -v
docker system prune -a -f
set -a && source .env && set +a
docker-compose build --no-cache --force-rm
docker-compose up -d
```

### Issue: Backend Returning Error

```bash
# Check backend config
docker-compose exec django python -c "from django.conf import settings; print(settings.GOOGLE_REDIRECT_URI)"
# Should output: https://khaz.app/kms/google/callback/
```

---

## 🎯 SUMMARY

**What Was Wrong:**
- Docker-compose.yml had wrong default path order: `/callback/google`
- Should be: `/google/callback/`

**Why It Failed:**
- .env not loaded during docker-compose build
- Frontend built with wrong URI
- Google rejected it as mismatch

**How It's Fixed:**
- Updated docker-compose.yml default to correct path
- Staging server now needs to rebuild with fix
- Or source .env before build

**Expected Result:**
- Google OAuth login works on staging
- User can authenticate with Google account
- Redirect matches Google Console registration

