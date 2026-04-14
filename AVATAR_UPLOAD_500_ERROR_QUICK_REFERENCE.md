# Avatar Upload 500 Error - Quick Fix Summary

## The Problem
Avatar upload returns **500 error on staging** but works on local.

```
POST https://kms-be.khaz.app/api/auth/update-profile/ 500 (Internal Server Error)
```

---

## Root Causes

### 1. **Missing Pillow System Dependencies** ⚠️ PRIMARY ISSUE
**Why:** ImageField validation requires image processing libraries (libjpeg, libpng, libwebp)  
**Where:** Docker container lacks these libraries  
**Effect:** Image validation fails → 500 error

### 2. **No Error Handling in Update Profile**
**Why:** Exception during save isn't caught or logged  
**Where:** `update_profile()` function in `backend/apps/auth/views.py`  
**Effect:** Generic 500 error instead of helpful message

---

## The Fixes

### Fix 1: Dockerfile - Add Image Libraries

**File:** `backend/Dockerfile`

**Builder Stage (Line 12-18):**
```dockerfile
RUN apt-get install -y \
    libjpeg62-turbo-dev \
    libpng-dev \
    libwebp-dev \
    zlib1g-dev
```

**Runtime Stage (Line 30-37):**
```dockerfile
RUN apt-get install -y \
    libjpeg62-turbo \
    libpng16-16 \
    libwebp7 \
    libzlib1
```

---

### Fix 2: Error Handling - Add Try-Except Blocks

**File:** `backend/apps/auth/views.py` (lines 223-318)

**Added:**
- Try-except around `user.save()`
- Try-except around `user.avatar.url`
- Comprehensive logging with stack traces
- Return helpful error messages to user

---

## Deployment

```bash
# 1. Pull changes
git pull origin main

# 2. Rebuild Docker (IMPORTANT - must rebuild for Dockerfile changes)
docker-compose build --no-cache django

# 3. Deploy with new image
docker-compose down
docker-compose up -d

# 4. Or use script
\deploy-staging.ps1
```

---

## Verify It Works

```bash
# Test avatar upload
curl -X POST https://kms-be.khaz.app/api/auth/update-profile/ \
  -H "Authorization: Bearer <TOKEN>" \
  -F "avatar=@/path/to/image.jpg"

# Check libraries installed
docker exec kms_django ldd /usr/lib/x86_64-linux-gnu/libjpeg.so.62 2>/dev/null && echo "✅ OK" || echo "❌ Missing"
```

**Browser Test:**
1. Go to https://kms.khaz.app/profile
2. Upload avatar
3. Should succeed (no 500 error)
4. No errors in console

---

## What Changed

| File | Changes |
|------|---------|
| `backend/Dockerfile` | Added libjpeg, libpng, libwebp, zlib |
| `backend/apps/auth/views.py` | Added comprehensive error handling & logging |

---

**Time to Deploy:** 5-10 minutes  
**Risk Level:** Very Low  
**Testing Time:** 5 minutes
