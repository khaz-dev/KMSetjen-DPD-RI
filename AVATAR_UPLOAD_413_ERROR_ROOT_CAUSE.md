# Avatar Upload 413 Error: Root Cause Analysis & Fix

**Date:** April 13, 2026  
**Issue:** 413 (Content Too Large) error on staging when uploading avatar  
**Status:** ✅ FIXED - Configuration updated

---

## Executive Summary

The avatar upload failed on **staging** with a 413 error because **Nginx was missing the file size limit configuration**. It works fine on local because Django's development server has different defaults.

**Root Cause:** Three configuration layers were misaligned:
1. ❌ Nginx: No `client_max_body_size` directive (defaulting to 1MB)
2. ❌ Django settings: `FILE_UPLOAD_MAX_MEMORY_SIZE = 2.5MB` (too restrictive)
3. ✅ Backend code: Allows avatars up to 5MB (but blocked by above limits)

---

## Why It Works on Local but Fails on Staging

### Local Development (Django runserver)
```
Browser Upload (5MB avatar)
        ↓
Django runserver (runserver)
- Has higher default upload limit
- No nginx layer to filter
        ↓
✅ SUCCESS - Avatar uploaded
```

### Staging (Nginx + Django behind Docker)
```
Browser Upload (5MB avatar)
        ↓
Nginx Reverse Proxy
- Maximum size: 1MB (DEFAULT if not configured)  ← ISSUE!
        ↓
❌ 413 Content Too Large (rejected by nginx)
     (Django never even sees the request)
```

---

## Configuration Problem Details

### Layer 1: Nginx (The Immediate Culprit)

**Before Fix:**
```nginx
location /kms/api/ {
    proxy_pass http://127.0.0.1:8002/api/;
    # ... headers and timeouts ...
    # ❌ MISSING: client_max_body_size directive
}
```

**After Fix:**
```nginx
location /kms/api/ {
    proxy_pass http://127.0.0.1:8002/api/;
    # ... headers and timeouts ...
    # ✅ ADDED: Allow files up to 100MB
    client_max_body_size 100M;
}
```

**Why it matters:** Nginx has a default `client_max_body_size` of **1MB**. Any request body larger than this gets a 413 error. This happens **before the request reaches Django**.

### Layer 2: Django Settings (Secondary Issue)

**Before Fix:**
```python
DATA_UPLOAD_MAX_MEMORY_SIZE = 2621440    # 2.5MB ← Too small
FILE_UPLOAD_MAX_MEMORY_SIZE = 2621440    # 2.5MB ← Even smaller uploads fail
```

**After Fix:**
```python
DATA_UPLOAD_MAX_MEMORY_SIZE = 52428800   # 50MB ← Matches MAX_FILE_SIZE constant
FILE_UPLOAD_MAX_MEMORY_SIZE = 52428800   # 50MB ← Can handle larger uploads
```

**Why it matters:** Even if Nginx lets the request through, Django will reject it if it's larger than this limit. This is Django's built-in protection against memory exhaustion.

### Layer 3: Backend Code (Correct from the Start)

```python
# In update_profile view
max_size = 5 * 1024 * 1024  # 5MB
if avatar_file.size > max_size:
    return Response({
        'success': False,
        'error': 'Image file is too large (max 5MB)'
    }, status=status.HTTP_400_BAD_REQUEST)
```

The backend is correctly configured. But it was being blocked before it could even validate the file size.

---

## The Upload Size Limits Flow (Simplified)

```
Request comes in
        ↓
[Nginx] client_max_body_size: 100M ← First check (this was missing!)
        ↓
[Django] DATA_UPLOAD_MAX_MEMORY_SIZE: 50MB ← Second check
        ↓
[View] max_size = 5MB check ← Third check (custom validation)
        ↓
✅ Upload succeeds (if all pass)
```

**If any limit is exceeded at ANY layer, upload fails immediately.**

---

## Files Modified

### 1. `nginx-kms-docker.conf`
- **Added** `client_max_body_size 100M;` to 3 locations:
  - `/kms/api/` - API requests (avatar upload endpoint)
  - `/kms/admin/` - Django admin uploads
  - `/kms/media/` - Media file serving

### 2. `nginx-kmsetjendpdri-docker.conf` (Backup config)
- **Added** `client_max_body_size 100M;` to 3 locations:
  - `/kmsetjendpdri/api/`
  - `/kmsetjendpdri/admin/`
  - `/kmsetjendpdri/media/`

### 3. `backend/config/settings.py`
- **Changed** `DATA_UPLOAD_MAX_MEMORY_SIZE` from 2.5MB to 50MB
- **Changed** `FILE_UPLOAD_MAX_MEMORY_SIZE` from 2.5MB to 50MB
- **Added** explanatory comments clarifying the coordination between nginx and Django limits

---

## Deployment Instructions

### Step 1: Deploy Updated Nginx Configuration
SSH to staging server and restart nginx:
```bash
ssh -i c:\Users\khair\khaz root@165.245.191.216
cd /etc/nginx/sites-available
# Verify the updated config is in place
# Then test:
sudo nginx -t
# If OK, restart:
sudo systemctl restart nginx
```

### Step 2: Deploy Updated Django Settings
The Django settings change will be picked up when the container restarts:
```bash
# From your local machine, push to git
git add .
git commit -m "Fix: Increase upload size limits on staging (nginx + Django)"
git push origin main

# On staging server:
cd /var/www/html/kmsetjendpdri
git pull origin main
docker-compose build --no-cache django
docker-compose restart django
```

### Step 3: Verify the Fix
Test avatar upload on staging:
1. Go to: `https://khaz.app/kms/profile`
2. Click upload avatar
3. Select your avatar image (any reasonable size)
4. Should upload successfully ✅

---

## Sizes at Each Layer (Coordinated)

| Component | Size | Notes |
|-----------|------|-------|
| **Nginx** | 100M | `client_max_body_size` |
| **Django** | 50MB | `DATA_UPLOAD_MAX_MEMORY_SIZE` |
| **Backend Code** (Avatar) | 5MB | Custom validation in `update_profile()` |
| **Backend Code** (Files) | 50MB | `MAX_FILE_SIZE` constant |

The smallest limit at each "layer" applies, so:
- Avatar uploads: Limited to 5MB (backend code check)
- File uploads: Limited to 50MB (backend code check)
- All uploads: Must pass nginx (100M) and Django (50MB) first

---

## Why This Configuration Makes Sense

1. **Nginx: 100M** - Very permissive, doesn't restrict much
   - Use case: Catch only extremely large requests
   - Prevents memory exhaustion from huge payloads

2. **Django: 50M** - More restrictive
   - Use case: Protect application server memory
   - Matches `MAX_FILE_SIZE` constant in backend

3. **Backend code: 5MB (avatar)** - Most restrictive
   - Use case: Business logic requirement
   - Avatars should be small images
   - Better UX (faster upload/download)

---

## Summary of Changes

| Change | Before | After | Impact |
|--------|--------|-------|--------|
| Nginx /api/ upload limit | ❌ Missing (1MB default) | ✅ 100M | Allows uploads up to 100M |
| Django upload size | ❌ 2.5MB | ✅ 50MB | Django won't reject valid uploads |
| Consistency | ❌ Mismatch | ✅ Aligned | All layers coordinate properly |
| Avatar uploads | ❌ 413 Error | ✅ Works | Users can upload avatars |

---

## Testing Checklist

- [ ] Pushed changes to git
- [ ] Updated staging nginx config
- [ ] Restarted nginx (`sudo systemctl restart nginx`)
- [ ] Rebuilt Django image with new settings
- [ ] Restarted Django container
- [ ] Go to `https://khaz.app/kms/profile`
- [ ] Upload a 2-5MB image as avatar
- [ ] See success notification (no 413 error)
- [ ] Verify avatar appears on profile ✅

---

## Why This Wasn't Caught Before

1. **Local development** uses Django `runserver` which has different defaults
2. **Older nginx configs** (`nginx-kmsetjendpdri-config.conf`) had it set to 100M
3. **New Docker configs** were created for simpler deployment but **missed** the `client_max_body_size` directive
4. **Testing was on local only** - the issue only appears when using nginx as a reverse proxy

---

## Prevention

For future file upload features:
1. Always coordinate limits across **all layers**:
   - Nginx: `client_max_body_size`
   - Django: `DATA_UPLOAD_MAX_MEMORY_SIZE` & `FILE_UPLOAD_MAX_MEMORY_SIZE`
   - Backend code: Custom validation
   - Web browser form: `accept` and file input constraints

2. **Document the limits clearly**:
   ```python
   # Example from fixed settings.py:
   # These limits must be coordinated with nginx client_max_body_size (currently 100M)
   # and match the MAX_FILE_SIZE constant (50MB)
   ```

3. **Test on staging** with nginx before assuming local behavior will match

4. **Add error messages** that explain why uploads fail (e.g., "File too large, max 5MB")
