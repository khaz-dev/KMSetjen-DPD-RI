# REPOSITORY IMAGES 404 FIX - DEPLOYMENT TO STAGING

**Status:** 🔴→✅ **ROOT CAUSE IDENTIFIED & FIXED**  
**Commit:** 849648b  
**Critical Discovery:** Missing VITE_APP_SUBPATH environment variable on staging server

---

## Understanding The Real Issue

### The Root Cause (Not Code, But Environment)

The code fix (getAssetPath) was CORRECT, but it wasn't working because:

1. **Your local machine:**
   - `.env` file has: `VITE_APP_SUBPATH=/`
   - This is correct for localhost ✅
   - Images load from: `/perpustakaan.jpg`

2. **Staging server:**
   - `.env` file has: `VITE_APP_SUBPATH=/` (WRONG!)
   - Copied from repository's `.env` (development config)
   - Images should load from: `/kms/perpustakaan.jpg`
   - But use: `/perpustakaan.jpg` instead ❌

3. **How it breaks:**
   ```
   Docker builds frontend:
     reads: VITE_APP_SUBPATH=/ from .env
     passes to Vite: base: '/'
     getAssetPath('perpustakaan.jpg') → '/perpustakaan.jpg'
     Browser requests: https://khaz.app/perpustakaan.jpg ❌ 404
   
   Should be:
     getAssetPath('perpustakaan.jpg') → '/kms/perpustakaan.jpg'
     Browser requests: https://khaz.app/kms/perpustakaan.jpg ✅ 200 OK
   ```

---

## The Fix: Deploy Correct Environment to Staging

### Option 1: Using .env.staging Template (RECOMMENDED)

**Note:** `.env` files are ignored by git for security, so `.env.staging` won't automatically sync.

#### Step-by-Step for Staging Server:

```bash
# 1. SSH to staging server
ssh root@143.198.200.57

# 2. Navigate to project
cd /var/www/html/kmsetjendpdri

# 3. Pull latest code (gets the .env.staging template)
git pull origin main

# 4. CRITICAL: Copy .env.staging to .env on staging server
# This is a ONE-TIME setup command
cp .env.staging .env

# 5. Verify it has correct VITE_APP_SUBPATH
grep VITE_APP_SUBPATH .env
# Should show: VITE_APP_SUBPATH=/kms

# 6. Rebuild frontend with new environment
docker-compose build frontend

# 7. Restart containers
docker-compose up -d

# 8. Check health
docker-compose ps
# All should show "healthy" or "running"

# 9. Verify images load (wait ~2 minutes for rebuild)
curl -s https://khaz.app/kms | grep -c perpustakaan
# Should output: 1 or higher (meaning HTML includes image reference)
```

### Option 2: Use Deployment Script

If you've already updated the code:

```bash
# On staging server, before deployment:
cp .env.staging .env

# Then use deployment script
sudo bash deploy-master.sh staging --health-check
```

### Option 3: Manual Configuration (If No .env.staging Available)

If you don't have access to `.env.staging`, manually edit `.env` on staging:

```bash
ssh root@143.198.200.57
cd /var/www/html/kmsetjendpdri
nano .env

# Find line: VITE_APP_SUBPATH=/
# Change to: VITE_APP_SUBPATH=/kms

# Save and exit (Ctrl+X, Y, Enter)

# Then rebuild
docker-compose build frontend
docker-compose up -d
```

---

## Verification Checklist

### ✅ Step 1: Check Environment Variable

```bash
# On staging server:
grep VITE_APP_SUBPATH .env
# Should output: VITE_APP_SUBPATH=/kms

# Check what Docker container sees:
docker-compose exec frontend env | grep VITE_APP_SUBPATH
# Should show: VITE_APP_SUBPATH=/kms
```

### ✅ Step 2: Check Browser Console

1. Open: https://khaz.app/kms/
2. Press F12 (or right-click → Inspect)
3. Go to Console tab
4. **Should see NO errors** (or minimal unrelated errors)
5. **Most importantly NO 404 for perpustakaan.jpg, jdih.png, ppid.jpg**

### ✅ Step 3: Check Network Requests

1. Stay on https://khaz.app/kms/
2. Press F12 → Network tab
3. Refresh page (Ctrl+R or Cmd+R)
4. Filter by filename: type "perpustakaan" in filter
5. **Should see:**
   ```
   Status: 200
   URL: https://khaz.app/kms/perpustakaan.jpg
   ```
6. **Should NOT see:**
   ```
   Status: 404
   URL: https://khaz.app/perpustakaan.jpg
   ```

### ✅ Step 4: Visual Verification

1. On https://khaz.app/kms/
2. Scroll to "Jelajahi Repositori Lainnya" section
3. **Should see:**
   - 3 image cards: Perpustakaan, JDIH, PPID
   - Each with visible background image
   - Overlay gradient effect
   - Status badges (if applicable)
4. **Should NOT see:**
   - Broken image placeholders
   - "Jelajahi Repositori Lainnya" section looking empty

---

## Critical Points

### ⚠️ Important: Environment Files

- `.env` file is in `.gitignore` (for security)
- `.env.staging` template is provided for reference
- **On staging server, you must manually create/update `.env` from template**
- Never commit sensitive .env files to git

### ⚠️ Important: Docker Build

When you run:
```bash
docker-compose build frontend
```

Docker reads `${VITE_APP_SUBPATH}` from the `.env` file in current directory. If this value is wrong, the entire build will have the wrong configuration.

### ⚠️ Important: This is Environment, Not Code

The code changes were correct and committed. This fix is about ensuring the staging server uses the correct environment configuration.

---

## If Problems Persist

### Issue: Images still 404 after fix

**Check 1: Verify .env file has correct value**
```bash
grep VITE_APP_SUBPATH .env
# MUST show: VITE_APP_SUBPATH=/kms (not /)
```

**Check 2: Rebuild truly happened with new env**
```bash
# Check build time
ls -l docker-compose.yml
docker images | grep frontend
# Compare timestamps

# Force rebuild without cache
docker-compose build frontend --no-cache
docker-compose up -d
```

**Check 3: Browser cache**
```
Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
Or open in incognito/private mode
```

**Check 4: Container health**
```bash
docker-compose ps
# All containers should show "healthy" or "running"

docker-compose logs frontend | tail -20
# Should not show errors from image loading
```

### Issue: Other things broke after fix

Make sure you only changed the VITE_APP_SUBPATH value, not other environment variables that are set correctly.

---

## Prevention for Future

### Single Source of Truth

1. **Local development:** Use `.env` (has VITE_APP_SUBPATH=/)
2. **Staging:** Use `.env.staging` (has VITE_APP_SUBPATH=/kms)
3. **Production:** Use appropriate env config (VITE_APP_SUBPATH=/kmsetjendpdri or whatever)

### Automated Verification

Add to deployment script:
```bash
echo "Checking VITE_APP_SUBPATH..."
EXPECTED_SUBPATH="/kms"
ACTUAL_SUBPATH=$(grep VITE_APP_SUBPATH .env | cut -d'=' -f2)

if [ "$ACTUAL_SUBPATH" != "$EXPECTED_SUBPATH" ]; then
  echo "ERROR: VITE_APP_SUBPATH is $ACTUAL_SUBPATH, expected $EXPECTED_SUBPATH"
  exit 1
fi
echo "✅ VITE_APP_SUBPATH correct: $ACTUAL_SUBPATH"
```

---

## Files Involved

### Local Machine (for reference)
- ✅ `.env` - Development config (VITE_APP_SUBPATH=/)
- ✅ `.env.staging` - Staging template (VITE_APP_SUBPATH=/kms)
- ✅ `.env.production` - Production reference
- ✅ `.gitignore` - Ignores these files (security)

### Staging Server (143.198.200.57)
- Must create: `/var/www/html/kmsetjendpdri/.env` from template
- Content: VITE_APP_SUBPATH=/kms (critical!)

### Code Files (Already Fixed)
- ✅ `frontend/src/utils/imageUtils.js` - getAssetPath() function
- ✅ `frontend/src/pages/HomePage.jsx` - Uses getAssetPath()

---

## Success Looks Like

### Before Fix
```
Console errors: ❌
- GET https://khaz.app/perpustakaan.jpg 404
- GET https://khaz.app/jdih.png 404
- GET https://khaz.app/ppid.jpg 404

Visual: ❌
- Repository section showing but no images
- Cards look empty
```

### After Fix
```
Console: ✅
- No image-related 404 errors
- Images load successfully

Network: ✅
- GET https://khaz.app/kms/perpustakaan.jpg 200
- GET https://khaz.app/kms/jdih.png 200
- GET https://khaz.app/kms/ppid.jpg 200

Visual: ✅
- Repository section with 3 image cards
- Each card shows preview image
- Status badges visible
- Overlay effects working
```

---

## Next Actions

1. ✅ Verify staging server has latest code (`git pull origin main`)
2. ✅ Copy environment template (`cp .env.staging .env`)
3. ✅ Verify configuration (`grep VITE_APP_SUBPATH .env`)
4. ✅ Rebuild frontend (`docker-compose build frontend`)
5. ✅ Restart containers (`docker-compose up -d`)
6. ✅ Wait 2-3 minutes for full startup
7. ✅ Test in browser (https://khaz.app/kms/)
8. ✅ Check console for 404 errors (F12)
9. ✅ Confirm "Jelajahi Repositori Lainnya" shows images

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Code** | ✅ Fixed | ✅ Still Fixed |
| **Environment** | ❌ Wrong (VITE_APP_SUBPATH=/) | ✅ Correct (VITE_APP_SUBPATH=/kms) |
| **Image Paths** | ❌ /perpustakaan.jpg | ✅ /kms/perpustakaan.jpg |
| **Browser Load** | ❌ 404 Not Found | ✅ 200 OK |
| **Visual** | ❌ Broken images | ✅ Working perfectly |

