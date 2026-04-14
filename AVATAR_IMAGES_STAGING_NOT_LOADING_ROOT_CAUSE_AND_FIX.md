# 🔴 Avatar Images Not Loading on Staging - Root Cause & Fix

## 🎯 The Problem

**Staging (`https://kms.khaz.app/profile`)**: Avatar images don't load ❌
**Local (`http://localhost:5175/profile`)**: Avatar images load fine ✅

---

## 🔍 Root Cause Analysis

### What's Happening Step-by-Step

#### 1. Frontend Code (Works Identically on Both)
```javascript
// frontend/src/services/api.js - Line 20
export const getAbsoluteMediaUrl = (mediaUrl) => {
  // Converts relative path to absolute URL
  // Input: /media/avatars/user_1.jpg
  // Output: {BACKEND_BASE_URL}/media/avatars/user_1.jpg
  return BACKEND_BASE_URL + mediaUrl;
};
```

**On different environments:**
- **Local**: `BACKEND_BASE_URL` = `http://localhost:8002`
  - Avatar URL: `http://localhost:8002/media/avatars/user_1.jpg` ✅
  
- **Staging**: `BACKEND_BASE_URL` = `https://kms-be.khaz.app`
  - Avatar URL: `https://kms-be.khaz.app/media/avatars/user_1.jpg` ✅ (URL looks correct)

#### 2. Backend Configuration (Django Settings)
```python
# backend/config/settings.py - Line 224
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

#### 3. URL Routing - THE CULPRIT!
```python
# backend/config/urls.py - Line 70
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
```

**This is the problem:**
- **LOCAL (DEBUG=True)**: Django serves `/media/` URLs ✅
- **STAGING (DEBUG=False)**: Django does NOT serve `/media/` URLs ❌

#### 4. What Happens on Staging

```
Browser:  GET https://kms-be.khaz.app/media/avatars/user_1.jpg
    ↓
Nginx:    Routes to backend (no /media/ location configured)
    ↓
Django:   Receives request for /media/avatars/user_1.jpg
    ↓
Django:   Checks if DEBUG=True → NO, it's False
    ↓
Django:   "/media/" pattern not in urlpatterns (because DEBUG=False)
    ↓
Django:   Returns 404 Not Found
    ↓
Browser:  Shows broken image
```

#### 5. Why Media Files Exist But Aren't Served

```bash
# On staging server - Files are there!
docker exec kms_django ls -la /app/media/avatars/
# Result:
# drwxr-xr-x  2 django django 4096 Apr 14 14:02 avatars
# -rw-r--r--  1 django django 45K Apr 14 14:02 user_1.jpg  ← File exists!
```

But there's **no way to access them** because:
1. Django doesn't serve them in production mode
2. Nginx isn't configured to serve them either

---

## 🎯 Why Local Works But Staging Doesn't

| Component | Local (DEBUG=True) | Staging (DEBUG=False) |
|-----------|---|---|
| Django URL Pattern | `/media/` added ✅ | `/media/` NOT added ❌ |
| Nginx `/media/` location | Not needed | Missing ❌ |
| Avatar URL | `http://localhost:8002/media/avatars/user_1.jpg` | `https://kms-be.khaz.app/media/avatars/user_1.jpg` |
| Django serves it? | YES | NO |
| Nginx serves it? | Not configured | Not configured |
| **Result** | ✅ Works | ❌ 404 Error |

---

## ✅ The Fix

### Solution 1: Add `/media/` Location to Nginx (RECOMMENDED)

Add this block to the `kms-be.khaz.app` server section in nginx config:

**File**: `/etc/nginx/sites-available/kms`

**Add this after the backend `location /` block:**

```nginx
# ========================================================================
# Media Files (User-uploaded content like avatars)
# ========================================================================
location /media/ {
    alias /app/media/;
    
    # Allow caching of media files
    expires 30d;
    add_header Cache-Control "public, max-age=2592000" always;
    add_header Access-Control-Allow-Origin "*" always;
    access_log off;
}

# ========================================================================
# Static Files (CSS, JS, from Django collectstatic)
# ========================================================================
location /static/ {
    alias /app/staticfiles/;
    
    # Long cache for static assets
    expires 1y;
    add_header Cache-Control "public, immutable" always;
    access_log off;
}
```

**Why this works:**
- Nginx serves media files directly from disk (fast! ⚡)
- Bypasses Django entirely for `/media/` requests
- Django stays focused on API logic
- No more 404 errors

---

### Solution 2: Enable Media Serving in Django Production (Alternative)

If you don't want to modify nginx, modify Django settings:

**File**: `backend/config/settings.py` - Line 70

**Change from:**
```python
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
```

**Change to:**
```python
# Serve media files in all environments (local, staging, production)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
```

**⚠️ Not recommended for production** because:
- Django wastes resources serving files instead of API requests
- Slower response times
- Not scalable

---

## 🚀 Implementation Steps

### Step 1: Get Current Nginx Config (Local)

```bash
ssh -i ~/.ssh/khaz root@165.245.191.216 "cat /etc/nginx/sites-available/kms" > current-nginx-kms.conf
```

### Step 2: Update Local File

Edit `current-nginx-kms.conf`:

Find this section in the `kms-be.khaz.app` server block:
```nginx
# ========================================================================
# Proxy to Backend (Django on port 8002)
# ========================================================================
location / {
    proxy_pass http://127.0.0.1:8002/;
    ...
}
```

**Add this right after that location block:**
```nginx
# ========================================================================
# Media Files (User-uploaded content like avatars)
# ========================================================================
location /media/ {
    alias /app/media/;
    
    # Allow caching of media files
    expires 30d;
    add_header Cache-Control "public, max-age=2592000" always;
    add_header Access-Control-Allow-Origin "*" always;
    access_log off;
}

# ========================================================================
# Static Files (CSS, JS, from Django collectstatic)
# ========================================================================
location /static/ {
    alias /app/staticfiles/;
    
    # Long cache for static assets
    expires 1y;
    add_header Cache-Control "public, immutable" always;
    access_log off;
}
```

### Step 3: Upload & Deploy

```bash
# Copy updated config to server
scp -i ~/.ssh/khaz current-nginx-kms.conf root@165.245.191.216:/etc/nginx/sites-available/kms

# SSH into server
ssh -i ~/.ssh/khaz root@165.245.191.216

# Test nginx configuration
sudo nginx -t
# Should output: nginx: configuration file test is successful

# Reload nginx
sudo systemctl reload nginx

# Verify it's running
sudo systemctl status nginx
```

### Step 4: Test Avatar Loading

1. Go to `https://kms.khaz.app/profile`
2. Avatar image should now load ✅
3. Go to navbar and check avatar - should load ✅

---

## 🔍 Verification Checklist

After making changes:

- [ ] Ngimx configuration test passes (`nginx -t`)
- [ ] Nginx reloaded (`systemctl reload nginx`)
- [ ] Avatar shows on profile page
- [ ] Navbar avatar shows
- [ ] Avatar in any other place loads
- [ ] No console errors
- [ ] Can hit media URL directly: `https://kms-be.khaz.app/media/avatars/user_1.jpg` returns image

---

## 📊 Before & After

### BEFORE (Broken ❌)
```
Browser → GET https://kms-be.khaz.app/media/avatars/user_1.jpg
Nginx → Routes to Django (no /media/ location)
Django → Returns 404 (DEBUG=False, so /media/ not served)
Result → Broken image
```

### AFTER (Fixed ✅)
```
Browser → GET https://kms-be.khaz.app/media/avatars/user_1.jpg
Nginx → Matches /media/ location, serves from /app/media/ directly
Result → Image loads successfully! 🎉
```

---

## 🎯 Why This Happens on Staging But Not Local

| Aspect | Local | Staging |
|--------|-------|---------|
| **Django DEBUG** | `True` | `False` |
| **Django serves /media/** | YES | NO |
| **Nginx /media/ configured** | Not needed | Missing ❌ |
| **Result** | Works by accident (DEBUG=True) | Broken (DEBUG=False) |

**Key insight**: Local works only because Django is in DEBUG mode. The proper solution for both environments is to have Nginx serve media files.

---

## 📋 Files to Modify

1. **Primary**: `/etc/nginx/sites-available/kms` - Add /media/ and /static/ locations

---

## 🆘 Troubleshooting

### If nginx reload fails:
```bash
# Check for syntax errors
sudo nginx -t

# See detailed error
sudo nginx -t -c /etc/nginx/nginx.conf

# Reload with verbose output
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log
```

### If avatars still don't load:
1. Verify the media directory exists: `docker exec kms_django ls -la /app/media/`
2. Check file permissions: `docker exec kms_django stat /app/media/avatars/user_1.jpg`
3. Test direct access: `curl https://kms-be.khaz.app/media/avatars/user_1.jpg`

### If only some avatars load:
- Check if user directory exists in media folder
- Verify file ownership and permissions

---

## 📝 Complete Fixed Nginx Section

Here's exactly what the `kms-be.khaz.app` server block should look like after the fix:

```nginx
# ============================================================================
# BACKEND: kms-be.khaz.app
# ============================================================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name kms-be.khaz.app;
    
    # SSL Configuration (etc...)
    
    # ========================================================================
    # Proxy to Backend (Django on port 8002)
    # ========================================================================
    location / {
        proxy_pass http://127.0.0.1:8002/;
        # ... proxy settings ...
    }
    
    # ========================================================================
    # Media Files (User-uploaded content like avatars) ← NEW!
    # ========================================================================
    location /media/ {
        alias /app/media/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000" always;
        add_header Access-Control-Allow-Origin "*" always;
        access_log off;
    }
    
    # ========================================================================
    # Static Files (CSS, JS, from Django collectstatic) ← NEW!
    # ========================================================================
    location /static/ {
        alias /app/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        access_log off;
    }
    
    # ========================================================================
    # Health Check Endpoint (for monitoring)
    # ========================================================================
    location /health/ {
        proxy_pass http://127.0.0.1:8002/health/;
        # ... proxy settings ...
    }
    
    # Logs...
}
```

That's it! This configuration will serve media files perfectly on staging!
