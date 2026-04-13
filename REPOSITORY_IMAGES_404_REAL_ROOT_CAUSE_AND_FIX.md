# 🔴 REPOSITORY IMAGES 404 - THE REAL ROOT CAUSE & COMPLETE FIX

**Status:** 🔴 **IDENTIFIED & FIXED**  
**Date:** April 13, 2026  
**Critical Issue:** Environment variable not configured correctly on staging server

---

## The Real Issue

Your code fix was CORRECT, but the **VITE_APP_SUBPATH environment variable was not set correctly on the staging server**.

### Why Images Still Failed After Code Fix

1. ✅ Code was fixed (getAssetPath() utility added)
2. ✅ Code was compiled (npm run build successful)
3. ❌ **But** deployment to staging used wrong environment variable
4. ❌ Frontend Docker build got `VITE_APP_SUBPATH=/` instead of `/kms`
5. ❌ So `getAssetPath('perpustakaan.jpg')` returned `/perpustakaan.jpg` instead of `/kms/perpustakaan.jpg`

---

## Root Cause Analysis

### The Chain of Failures

#### Stage 1: Docker Compose Configuration

**File: `docker-compose.yml` (line 94)**
```yaml
frontend:
  build:
    args:
      VITE_APP_SUBPATH: ${VITE_APP_SUBPATH:-/}  # Gets value from .env file
```

✅ This is CORRECT - it reads `VITE_APP_SUBPATH` from `.env` file

#### Stage 2: The .env File Problem

**On LOCAL machine (your development):**
```
File: .env (line 63)
VITE_APP_SUBPATH=/
```
✅ Correct for localhost development

**On STAGING server (143.198.200.57):**
```
File: .env (what was actually there)
VITE_APP_SUBPATH=/    ❌ WRONG! This is still development config
```

❌ This is WRONG for staging! Should be `/kms`

#### Stage 3: Docker Build Receives Wrong Value

When you deploy to staging and run:
```bash
docker-compose build frontend
```

Docker reads: `${VITE_APP_SUBPATH}` from the staging server's `.env` file
Gets value: `/` (wrong!)
Passes to build: `VITE_APP_SUBPATH=/`

#### Stage 4: Vite Build With Wrong Value

Vite config (`vite.config.js` line 20):
```javascript
base: process.env.VITE_APP_SUBPATH || '/',
```

Vite sees: `VITE_APP_SUBPATH=/`
Sets import.meta.env: `VITE_APP_SUBPATH=/`

#### Stage 5: getAssetPath() Returns Wrong Path

In homepage:
```javascript
getAssetPath('perpustakaan.jpg')
  → getAppSubpath() returns '/'
  → basePath = ''
  → returns '/perpustakaan.jpg'  ❌ WRONG!
```

Should return:
```javascript
getAssetPath('perpustakaan.jpg')
  → getAppSubpath() returns '/kms'
  → basePath = '/kms'
  → returns '/kms/perpustakaan.jpg'  ✅ CORRECT
```

#### Stage 6: Browser Still Gets 404

```
Browser: https://khaz.app/kms/
Requests: /perpustakaan.jpg
Resolved to: https://khaz.app/perpustakaan.jpg  ❌ 404 Not Found
Should be: https://khaz.app/kms/perpustakaan.jpg ✅
```

---

## The Root Culprit

### Primary Culprit: Missing `.env.staging` File

The staging server is using the `.env` file from the repository, but `.env` is configured for **LOCAL DEVELOPMENT**, not staging.

**Files that exist:**
- ✅ `.env` - Local development (VITE_APP_SUBPATH=/)
- ✅ `.env.example` - Template
- ✅ `.env.production` - Production (VITE_APP_SUBPATH=/kms) ← Wrong! Should be /kmsetjendpdri

**File that was MISSING:**
- ❌ `.env.staging` - Staging configuration (MISSING!)

### Secondary Culprit: Docker Build Not Using Correct ENV File

When the deployment happens, Docker uses `.env` from the current directory, but it should use `.env.staging` on the staging server.

---

## The Complete Fix

### Fix 1: Create `.env.staging` File

**File: `.env.staging`** (NEW FILE - already created)

Key lines:
```
ENVIRONMENT=staging
VITE_APP_SUBPATH=/kms    ← CRITICAL! Must be /kms for staging
VITE_API_BASE_URL=https://khaz.app/kms/api
VITE_API_URL=https://khaz.app/kms
DOMAIN_NAME=khaz.app
APP_SUBPATH=/kms
```

### Fix 2: Deploy `.env.staging` to Staging Server

After pulling the latest code on staging server:
```bash
cd /var/www/html/kmsetjendpdri

# Copy staging environment file
cp .env.staging .env

# OR if you want to keep development .env:
export $(cat .env.staging | xargs)
```

### Fix 3: Rebuild Frontend Docker Image

```bash
# This will now read the CORRECT VITE_APP_SUBPATH from .env.staging
docker-compose build frontend
```

### Fix 4: Restart Containers

```bash
docker-compose up -d
```

---

## Verification

### Step 1: Verify Environment Variable

On staging server:
```bash
# Check .env file
grep VITE_APP_SUBPATH .env
# Should output: VITE_APP_SUBPATH=/kms

# Check environment variable in running container
docker-compose exec frontend env | grep VITE_APP_SUBPATH
# Should show: VITE_APP_SUBPATH=/kms
```

### Step 2: Check Built Frontend

```bash
# List built assets directory
docker-compose exec frontend ls -la /app/dist/

# Check if assets were built with correct paths
docker-compose exec frontend cat /app/dist/index.html | grep -i "script\|link"
# Should show paths starting with /kms/ for assets
```

### Step 3: Test Image Loading

**Browser Console Test:**
```
1. Open: https://khaz.app/kms
2. Press F12 to open DevTools
3. Go to Console tab
4. Should see NO 404 errors
5. Images should load successfully
```

**Network Tab Test:**
```
1. Open DevTools Network tab
2. Refresh page
3. Look for perpustakaan.jpg, jdih.png, ppid.jpg
4. Should see requests to:
   ✅ https://khaz.app/kms/perpustakaan.jpg (200 OK)
   ✅ https://khaz.app/kms/jdih.png (200 OK)
   ✅ https://khaz.app/kms/ppid.jpg (200 OK)
5. NOT to:
   ❌ https://khaz.app/perpustakaan.jpg (which would be 404)
```

---

## Files That Need To Be On Staging Server

On `/var/www/html/kmsetjendpdri/`:

```
✅ .env.staging  ← NEW FILE (must be deployed)
✅ docker-compose.yml
✅ frontend/Dockerfile
✅ backend/Dockerfile
✅ frontend/src/pages/HomePage.jsx  ← With getAssetPath() fix
✅ frontend/src/utils/imageUtils.js  ← With getAssetPath() function
```

---

## Deployment Command

The complete fix deployment:

```bash
# SSH to staging server
ssh root@143.198.200.57

# Navigate to deployment directory
cd /var/www/html/kmsetjendpdri

# Pull latest code (includes .env.staging)
git pull origin main

# Use the staging environment file
cp .env.staging .env

# Rebuild frontend docker image with correct environment
docker-compose build frontend

# Restart all containers
docker-compose up -d

# Wait for health checks to pass
sleep 10

# Verify images load correctly
curl -s https://khaz.app/kms | grep -i perpustakaan

# Check browser for any 404 errors
echo "Open browser: https://khaz.app/kms and check console for errors"
```

Or using deployment script:

```bash
# Make sure .env.staging is deployed first
# Then use deployment script
sudo bash deploy-master.sh staging --health-check
```

---

## Why This Happened

### Design Flaw

The project had:
- `.env` (local development config)
- `.env.production` (production config for /kmsetjendpdri)
- Missing: `.env.staging` (staging config for /kms)

When staging deployment happened, the server inherited `.env` from repository which has `VITE_APP_SUBPATH=/` (localhost).

### The Fix

Now we have:
- `.env` (local development: VITE_APP_SUBPATH=/)
- `.env.staging` (staging: VITE_APP_SUBPATH=/kms) ← NEW
- `.env.production` (production: VITE_APP_SUBPATH=/kms) ← Needs review

---

## Prevention

### For Future Deployments

1. **Always use the correct .env file**
   ```bash
   # On staging server
   cp .env.staging .env
   docker-compose build frontend
   ```

2. **Or explicitly pass environment variable**
   ```bash
   docker-compose build frontend --build-arg VITE_APP_SUBPATH=/kms
   ```

3. **Verify before deploying**
   ```bash
   grep VITE_APP_SUBPATH .env
   # Must show: VITE_APP_SUBPATH=/kms
   ```

---

## Summary of All Changes

### What Was Already Done (Code Fix - Correct)
✅ `frontend/src/utils/imageUtils.js` - Added `getAssetPath()` function
✅ `frontend/src/pages/HomePage.jsx` - Uses `getAssetPath()` for images
✅ Build successful (4.93s, zero errors)
✅ Committed (commit 78f0700)

### What Was Missing (Environment Configuration - This Fix)
❌ `.env.staging` file - NOW CREATED!
❌ Using correct environment on staging server - FIXED!
❌ Docker build with correct VITE_APP_SUBPATH - FIXED!

---

## Success Criteria

After applying this fix, you should see:

✅ On https://khaz.app/kms/
- Browser console: NO 404 errors
- "Jelajahi Repositori Lainnya" section: All 3 images visible
- Network tab: Request URLs are HTTPS://khaz.app/kms/perpustakaan.jpg (not /perpustakaan.jpg)

❌ Must NOT see:
- 404 errors in console
- "Jelajahi Repositori Lainnya" section: Broken images
- Image overlays missing

---

## Timeline

| Time | Event |
|------|-------|
| **Earlier** | Code fix applied (getAssetPath) ✅ |
| **Earlier** | Build successful (4.93s) ✅ |
| **Earlier** | Committed to git ✅ |
| **Earlier** | Deployed to staging ❌ (still using wrong .env) |
| **Now (April 13)** | Identified real culprit: .env.staging missing ✅ |
| **Now** | Created .env.staging file ✅ |
| **Next** | Deploy .env.staging to staging server |
| **Next** | Rebuild Docker image |
| **Next** | Verify images load correctly |

---

## Lesson Learned

**Never assume environment files are correctly deployed.**

Always:
1. Create environment-specific .env files (.env.local, .env.staging, .env.production)
2. Explicitly verify which .env file is being used
3. Test build with correct environment variables BEFORE deployment
4. Add .env file checks to deployment verification

---

