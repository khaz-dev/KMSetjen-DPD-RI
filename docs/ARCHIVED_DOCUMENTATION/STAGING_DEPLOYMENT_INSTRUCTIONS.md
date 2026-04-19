# 🔴→✅ Staging Deployment - Complete Fix (Images 404 + Backend 502)

**Status:** READY FOR DEPLOYMENT  
**Date:** April 14, 2026  
**Commits:** Just pushed to origin/main (7f0b893)

---

## The Issues You're Seeing

### Issue 1: Images Still 404
```
Browser Console:
  ❌ GET https://khaz.app/perpustakaan.jpg 404
  ❌ GET https://khaz.app/jdih.png 404
  ❌ GET https://khaz.app/ppid.jpg 404
```

**Root Cause:** Code fix wasn't pushed to origin/main yet - server still has old code

### Issue 2: Backend 502 Bad Gateway
```
Browser Console:
  ❌ GET https://khaz.app/kms/api/v1/public/articles/popular/ 502
```

**Root Cause:** Backend/Django container isn't responding - may be crashed or misconfigured

---

## Complete Deployment Steps

### Step 1: SSH to Staging Server

```bash
ssh root@143.198.200.57
```

### Step 2: Navigate and Pull Latest Code

```bash
cd /var/www/html/kmsetjendpdri

# Pull latest commits (now includes the image fix)
git pull origin main

# Verify you got the latest commits
git log --oneline -5
# Should show: 7f0b893 (docs: Add quick summary)
```

### Step 3: Apply Staging Environment Configuration

```bash
# Copy staging environment template to active .env
cp .env.staging .env

# Verify VITE_APP_SUBPATH is correct
grep VITE_APP_SUBPATH .env
# Output should be: VITE_APP_SUBPATH=/kms

# Also verify backend API URL
grep VITE_API /env
# Should show: VITE_API_BASE_URL=https://khaz.app/kms/api
```

### Step 4: Rebuild Everything

```bash
# Stop everything
docker-compose down

# Remove all containers (clean rebuild)
docker-compose rm -f

# Rebuild frontend with new code and environment variables
docker-compose build frontend

# Rebuild backend to ensure it's fresh
docker-compose build django

# Start all services
docker-compose up -d

# Wait for everything to start (2-3 minutes)
echo "Waiting for services to start..."
sleep 30

# Check container status
docker-compose ps
# All should show "running" or "healthy"
```

### Step 5: Verify Backend is Working

```bash
# Check Django logs
docker-compose logs django | tail -50
# Should NOT show migration errors or critical errors

# Test backend API directly
curl -I https://khaz.app/kms/api/v1/public/articles/popular/
# Should return: HTTP/2 200 (not 502)

# If 502 persists, check Docker networking
docker network ls
docker network inspect kms_network
```

### Step 6: Test Images in Browser

1. Open: **https://khaz.app/kms/**
2. Press **F12** (DevTools)
3. Go to **Console tab**
4. **Should see: NO 404 errors** ✅
5. Look for image requests:
   - Should show: `GET https://khaz.app/kms/perpustakaan.jpg 200`
   - Should NOT show: `GET https://khaz.app/perpustakaan.jpg 404`
6. Scroll down to "Jelajahi Repositori Lainnya"
7. **Should see: All 3 images visible** ✅

### Step 7: Test API in Browser (Check 502 is Fixed)

1. Stay on same page
2. Check browser console for API errors
3. Should NOT show: `GET https://khaz.app/kms/api/v1/public/articles/popular/ 502`
4. If you see 502, check backend logs:

```bash
docker-compose logs django
docker-compose logs frontend
```

---

## Troubleshooting

### If Images Still 404 After Deployment

**Check 1: Verify code was actually deployed**
```bash
cd /var/www/html/kmsetjendpdri

# Check current commit
git log --oneline -1
# Should show: 7f0b893

# Check if getAssetPath exists in built code
grep -r "getAssetPath" . | grep -v node_modules | grep -v ".git"
```

**Check 2: Verify environment variable**
```bash
# Check what's in the .env file
grep VITE_APP_SUBPATH .env
# MUST show: /kms (not /)

# Check what Docker container sees
docker-compose exec frontend env | grep VITE_APP_SUBPATH
# MUST show: VITE_APP_SUBPATH=/kms
```

**Check 3: Force rebuild without cache**
```bash
docker-compose build frontend --no-cache
docker-compose up -d frontend
```

**Check 4: Hard refresh browser cache**
- Open: https://khaz.app/kms/
- Press: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or: Open in incognito/private mode

### If Backend 502 Persists

**Check 1: Verify Django is running**
```bash
docker-compose ps django
# Should show: "running" or "healthy"

docker-compose logs django | tail -20
# Look for error messages
```

**Check 2: Check database connection**
```bash
docker-compose exec django python manage.py migrate --run-syncdb
# Should complete without errors

docker-compose exec django python manage.py check
# Should show: "System check identified no issues"
```

**Check 3: Restart Django**
```bash
docker-compose restart django
sleep 10

# Test again
curl -I https://khaz.app/kms/api/v1/public/articles/popular/
```

**Check 4: Check Nginx logs**
```bash
sudo tail -50 /var/log/nginx/error.log
# Should not show "connect refused" or similar
```

**Check 5: Full restart if all else fails**
```bash
docker-compose down
docker-compose up -d

sleep 30  # Wait for everything to start

# Check all is running
docker-compose ps

# Check logs
docker-compose logs
```

---

## What Actually Changed

### Files with Code Fix (NEW - Just Pushed)
- ✅ `frontend/src/utils/imageUtils.js` - Added getAssetPath() function
- ✅ `frontend/src/pages/HomePage.jsx` - Uses getAssetPath() for images

### Files with Configuration (NEW)
- ✅ `.env.staging` - Staging server environment (VITE_APP_SUBPATH=/kms)

### Documentation Added
- ✅ Various guides explaining the issue and fix

---

## Expected Before/After

### Before Fix (Current Error State)
```
Browser Console:
  ❌ GET https://khaz.app/perpustakaan.jpg 404 (image missing!)
  ❌ GET https://khaz.app/jdih.png 404
  ❌ GET https://khaz.app/ppid.jpg 404
  ❌ GET https://khaz.app/kms/api/v1/public/articles/popular/ 502 (API broken!)

Visual:
  - Repository section showing but with fallback image
  - No actual preview images
  - Might be showing errors in console
```

### After Fix (Expected Result)
```
Browser Console:
  ✅ No image 404 errors
  ✅ GET https://khaz.app/kms/perpustakaan.jpg 200
  ✅ GET https://khaz.app/kms/jdih.png 200
  ✅ GET https://khaz.app/kms/ppid.jpg 200
  ✅ Images load successfully

Visual:
  - Repository section with 3 beautiful image cards
  - Each card shows preview image
  - Status badges visible
  - Overlay effects working
  - No console errors
```

---

## Quick Reference Commands

```bash
# Full deployment one-liner
cd /var/www/html/kmsetjendpdri && \
git pull origin main && \
cp .env.staging .env && \
docker-compose down && \
docker-compose build && \
docker-compose up -d && \
sleep 30 && \
docker-compose ps && \
curl -I https://khaz.app/kms/api/v1/public/articles/popular/ && \
curl -I https://khaz.app/kms/perpustakaan.jpg
```

---

## Summary

| Step | What | Command |
|------|------|---------|
| 1 | SSH | `ssh root@143.198.200.57` |
| 2 | Pull latest code | `git pull origin main` |
| 3 | Apply .env | `cp .env.staging .env` |
| 4 | Rebuild | `docker-compose build` |
| 5 | Start | `docker-compose up -d` |
| 6 | Test images | Open browser, check console |
| 7 | Test API | Check for 502 errors |

---

## Why This Happened

1. **Code fixes were local only** - You committed them locally but didn't push to GitHub
2. **Staging pulls from GitHub** - So it never got the code fixes
3. **Backend 502** - Separate issue, might be from old deployment or container restart needed

---

## Next Steps After Deployment

1. ✅ Run deployment commands above
2. ✅ Test in browser (https://khaz.app/kms/)
3. ✅ Verify images load correctly
4. ✅ Verify no 502 errors
5. ✅ Report back if any issues
6. ✅ If all good, mark staging as ready for production migration

---

