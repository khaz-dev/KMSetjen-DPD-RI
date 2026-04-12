# Google OAuth Redirect URI Mismatch - Root Cause & Critical Fix

**Current Error:** `Error 400: redirect_uri_mismatch` - Frontend sending `https://khaz.app/google/callback` to Google

## Root Cause Analysis

### Part 1: Frontend Not Rebuilt (PRIMARY BLOCKER)
```
Status:
- Source code: ✅ Fixed (includes /kms subpath)
- Local .env: ✅ Set to /kms
- Production Container: ❌ STILL HAS OLD CODE (hardcoded without /kms)

What Happened:
1. I fixed the code to use getAppSubpath() helper
2. Updated production .env with VITE_APP_SUBPATH=/kms
3. BUT: Production frontend container was never rebuilt
4. Old container still has hardcoded callback URL logic
5. Frontend sends: https://khaz.app/google/callback (WRONG)
```

### Part 2: Trailing Slash Mismatch (CRITICAL)
```
Google Cloud Console Registered:
- https://khaz.app/kms/google/callback/  ← WITH trailing slash

My Code Generates:
- https://khaz.app/kms/google/callback   ← NO trailing slash

Result: Even when frontend is rebuilt, URLs won't match because of slash
```

### Part 3: Environment Files Missing Slash
```
.env:
- Current: GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback
- Should be: GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/

.env.production:
- Current: GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback
- Should be: GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/

backend/config/settings.py:
- Current: default='http://localhost:5175/kms/google/callback'
- Should be: default='http://localhost:5175/kms/google/callback/'
```

## Fix Strategy

### FIX 1: Add Trailing Slash to Frontend Code (✅ DONE BELOW)
Update all callback URL constructions to include trailing slash

### FIX 2: Add Trailing Slash to .env Files (✅ DONE BELOW)
Update GOOGLE_REDIRECT_URI in all environment files

### FIX 3: Update Backend Settings (✅ DONE BELOW)
Update default GOOGLE_REDIRECT_URI in settings.py

### FIX 4: Rebuild Frontend on Production (⏳ INSTRUCTIONS PROVIDED)
Rebuild container with new code and trailing slash

---

## IMMEDIATE ACTIONS REQUIRED

### ACTION 1: CRITICAL - Rebuild Frontend on Production Server
```bash
# SSH into production server
ssh -i c:\Users\khair\khaz root@165.245.191.216

# Navigate to project
cd /var/www/html/kmsetjendpdri

# Pull latest code with fixes
git pull origin main

# Rebuild FRONTEND - this is what was missed before!
docker-compose build --no-cache frontend

# Rebuild backend just to be sure
docker-compose build --no-cache django

# Restart containers
docker-compose down
docker-compose up -d

# Verify
docker-compose ps

# Check frontend logs for build success
docker logs kmsetjendpdri_frontend_1

# Check backend environment
docker exec kmsetjendpdri_django_1 env | grep GOOGLE
```

### ACTION 2: Verify the Fix
Test in production:
1. Go to https://khaz.app/kms/login
2. Click "Login with Google"
3. Should redirect to Google consent screen (NOT get redirect_uri_mismatch error)
4. After granting permission, should redirect to callback handler

---

## Files Being Updated

1. ✅ **frontend/src/services/googleService.js** - Add trailing slash to URLs
2. ✅ **.env** - Add trailing slash to GOOGLE_REDIRECT_URI
3. ✅ **.env.example** - Add trailing slash to GOOGLE_REDIRECT_URI
4. ✅ **.env.production** - Add trailing slash to GOOGLE_REDIRECT_URI
5. ✅ **backend/config/settings.py** - Add trailing slash to default

---

## Why Trailing Slash Matters

Google's OAuth validation is STRICT:
- Registered: `https://khaz.app/kms/google/callback/`
- Sent by Frontend: `https://khaz.app/kms/google/callback`
- Result: REJECT - Exact match required

The trailing slash is part of the URI and must match character-for-character.

---

## Prevention for Future

All callback URLs must:
1. Include the app subpath: `/kms`
2. Include the trailing slash: `/`
3. Match Google Cloud Console registration exactly
4. Be applied to BOTH frontend and backend

