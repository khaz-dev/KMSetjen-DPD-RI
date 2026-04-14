# Complete URL Architecture Fix: Subpath → Subdomain Routing

## The Problem Explained

### Why the Current System is Confusing

Your system has **3 different URL patterns** for 3 environments:

```
LOCAL (working fine):        http://localhost:5175/        and     http://localhost:8002/
                            ↑ SINGLE PORT, NO SUBPATH ✅

STAGING (confusing):         https://khaz.app/kms/         and     https://khaz.app/kms/api/
                            ↑↑ SINGLE DOMAIN, /kms SUBPATH ⚠️

PRODUCTION (different):      https://kms.dpd.go.id/        and     https://kms-be.dpd.go.id/
                            ↑↑↑ SEPARATE SUBDOMAINS ✅✅✅
```

**Result:** Staging architecture is COMPLETELY DIFFERENT from production!

### Why This Caused All Your Recent Issues

1. **404 Image Errors**: Paths needed `/kms` prefix on staging but not locally
   - Solution: `getAssetPath()` utility to add prefix
   - Root cause: Inconsistent subpath handling

2. **Blank White Page**: VITE_APP_SUBPATH not set during Docker build
   - Result: Frontend built with `/` base instead of `/kms`
   - Root cause: Environment variable sourcing

3. **OAuth Redirect URI Mismatch**: Paths changed between environments
   - Staging: `khaz.app/callback/google` vs Production: `kms.dpd.go.id/google/callback`
   - Root cause: Different URL structures per environment

**All these issues exist because staging/production have DIFFERENT architectures!**

### The Solution: Make Staging Match Production

Change staging FROM:
```
Single domain + subpath:  https://khaz.app/kms/ + https://khaz.app/kms/api/
```

Change staging TO:
```
Separate subdomains:      https://kms.khaz.app/ + https://kms-be.khaz.app/
```

Now all 3 environments use the SAME pattern:
- **Local**: `localhost:5175` (frontend) + `localhost:8002` (backend)
- **Staging**: `kms.khaz.app` (frontend) + `kms-be.khaz.app` (backend)
- **Production**: `kms.dpd.go.id` (frontend) + `kms-be.dpd.go.id` (backend)

**Pattern: Separate frontend/backend domains or ports in all environments**

---

## Implementation Plan (Copy-Paste Ready)

### Step 1: DNS Configuration

**Add these DNS records to your khaz.app domain registrar:**

```
Type    Name      Value              TTL
A       kms       165.245.191.216    3600
A       kms-be    165.245.191.216    3600
```

Both point to same IP because nginx will route based on domain name.

---

### Step 2: Update .env.staging

Replace the entire `.env.staging` file with subdomain-based URLs:

```env
# ============================================================================
# ENVIRONMENT MODE - STAGING
# ============================================================================
ENVIRONMENT=staging
DEBUG=False

# ============================================================================
# DJANGO APPLICATION SETTINGS
# ============================================================================
SECRET_KEY=kms-staging-2026-khaz-app-kms-change-to-50-char-random-string
ALLOWED_HOSTS=kms-be.khaz.app,kms.khaz.app,localhost,127.0.0.1
DJANGO_SETTINGS_MODULE=config.settings

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kmsdb
DB_USER=postgres
DB_PASSWORD=Okkdpdri@2026
DB_HOST=localhost
DB_PORT=5432

# ============================================================================
# REDIS CONFIGURATION
# ============================================================================
REDIS_PASSWORD=YxUVAk0raKzBKunD
REDIS_HOST=redis
REDIS_PORT=6382
REDIS_URL=redis://:YxUVAk0raKzBKunD@redis:6382/0
CACHE_BACKEND=django_redis.cache.RedisCache
CACHE_LOCATION=redis://:YxUVAk0raKzBKunD@redis:6382/0
CELERY_BROKER_URL=redis://:YxUVAk0raKzBKunD@redis:6382/1
CELERY_RESULT_BACKEND=redis://:YxUVAk0raKzBKunD@redis:6382/2

# ============================================================================
# FRONTEND CONFIGURATION - CHANGED TO SUBDOMAINS!
# ============================================================================
# CRITICAL CHANGE: API calls now go to SEPARATE BACKEND DOMAIN
VITE_API_BASE_URL=https://kms-be.khaz.app/api
VITE_API_URL=https://kms-be.khaz.app
VITE_API_TIMEOUT=30000
VITE_APP_SUBPATH=/
FRONTEND_URL=https://kms.khaz.app

# ============================================================================
# CORS & SECURITY SETTINGS
# ============================================================================
CORS_ALLOWED_ORIGINS=https://kms.khaz.app,https://www.khaz.app,http://localhost:5175
CSRF_TRUSTED_ORIGINS=https://kms.khaz.app,https://www.khaz.app,http://localhost
SECURE_SSL_REDIRECT=True
DISABLE_SSL_REDIRECT=False

# ============================================================================
# GOOGLE OAUTH 2.0 CONFIGURATION - CHANGED!
# ============================================================================
GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://kms.khaz.app/google/callback/
VITE_GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://kms.khaz.app/google/callback/

# ============================================================================
# RECAPTCHA CONFIGURATION
# ============================================================================
RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
ENABLE_CAPTCHA=True

# ============================================================================
# EMAIL CONFIGURATION
# ============================================================================
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

**Key changes:**
- `VITE_APP_SUBPATH=/` (changed from `/kms`)
- `VITE_API_BASE_URL=https://kms-be.khaz.app/api` (changed from `khaz.app/kms/api`)
- `VITE_API_URL=https://kms-be.khaz.app` (separate domain)
- `GOOGLE_REDIRECT_URI=https://kms.khaz.app/google/callback/` (keeps subpath, removes domain)
- `ALLOWED_HOSTS` includes both `kms.khaz.app` and `kms-be.khaz.app`

---

### Step 3: Update docker-compose.yml

Change line 91 in docker-compose.yml:

**FROM:**
```yaml
VITE_APP_SUBPATH: ${VITE_APP_SUBPATH:-/kms}
```

**TO:**
```yaml
VITE_APP_SUBPATH: ${VITE_APP_SUBPATH:-/}
```

**Reason:** Frontend should always build for root access, not subpath.

---

### Step 4: Update Nginx Configuration

Create new file: `/etc/nginx/sites-available/kmsetjendpdri-subdomains`

```nginx
# ============================================================================
# Nginx Configuration for KMSetjen DPD RI - Subdomain Routing
# ============================================================================
# File Location: /etc/nginx/sites-available/kmsetjendpdri-subdomains
# 
# Setup:
# 1. sudo cp nginx-kms-subdomains.conf /etc/nginx/sites-available/kmsetjendpdri-subdomains
# 2. sudo ln -s /etc/nginx/sites-available/kmsetjendpdri-subdomains /etc/nginx/sites-enabled/kmsetjendpdri-subdomains
# 3. sudo rm -f /etc/nginx/sites-enabled/kmsetjendpdri /etc/nginx/sites-enabled/kmsetjendpdri-docker
# 4. sudo nginx -t
# 5. sudo systemctl restart nginx
# ============================================================================

# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name kms.khaz.app kms-be.khaz.app www.khaz.app;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# ============================================================================
# FRONTEND: kms.khaz.app
# ============================================================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name kms.khaz.app;
    
    # SSL Configuration (certbot will update these)
    ssl_certificate /etc/letsencrypt/live/khaz.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/khaz.app/privkey.pem;
    
    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Proxy to frontend container
    location / {
        proxy_pass http://127.0.0.1:5175/;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Cache headers for SPA
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
        add_header Vary "Accept-Encoding";
    }
    
    # Favicon
    location = /favicon.ico {
        proxy_pass http://127.0.0.1:5175/favicon.ico;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000" always;
        access_log off;
    }
    
    location = /favicon.svg {
        proxy_pass http://127.0.0.1:5175/favicon.svg;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000" always;
        access_log off;
    }
}

# ============================================================================
# BACKEND: kms-be.khaz.app
# ============================================================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name kms-be.khaz.app;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/khaz.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/khaz.app/privkey.pem;
    
    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Proxy to backend Django container
    location / {
        proxy_pass http://127.0.0.1:8002/;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeouts for long requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# ============================================================================
# Redirect www.khaz.app to kms.khaz.app (optional)
# ============================================================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.khaz.app;
    
    ssl_certificate /etc/letsencrypt/live/khaz.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/khaz.app/privkey.pem;
    
    return 301 https://kms.khaz.app$request_uri;
}
```

---

### Step 5: Backend Middleware Simplification (Optional)

Since you're moving to subdomains, you can REMOVE the `ScriptNameMiddleware` from the backend because there's no more subpath handling needed:

**In `backend/config/settings.py`, find this line:**
```python
'shared.middleware.proxy_middleware.ScriptNameMiddleware',
```

**And remove it (or comment out):**
```python
# 'shared.middleware.proxy_middleware.ScriptNameMiddleware',  # No longer needed - using subdomains
```

**Reason:** This middleware was only needed when the backend was accessed via `/kms/` subpath. Now it's accessed directly via `kms-be.khaz.app`.

---

### Step 6: Deployment on Staging Server

**On your staging server:**

```bash
# 1. SSH into server
ssh -i c:\Users\khair\khaz root@165.245.191.216

# 2. Navigate to project
cd /var/www/html/kmsetjendpdri

# 3. Pull latest changes
git pull origin main

# 4. Copy new nginx config
sudo cp nginx-kms-subdomains.conf /etc/nginx/sites-available/kmsetjendpdri-subdomains

# 5. Enable new config, disable old ones
sudo rm -f /etc/nginx/sites-enabled/kmsetjendpdri
sudo ln -s /etc/nginx/sites-available/kmsetjendpdri-subdomains /etc/nginx/sites-enabled/kmsetjendpdri-subdomains

# 6. Test nginx
sudo nginx -t

# 7. Reload nginx
sudo systemctl reload nginx

# 8. Source environment and rebuild
set -a
source .env
set +a

# 9. Rebuild containers with new environment
docker-compose down
docker system prune -f --volumes
docker-compose build --no-cache
docker-compose up -d

# 10. Wait for startup
sleep 20

# 11. Check status
docker-compose ps
docker logs kms_django

# 12. Verify VITE_APP_SUBPATH is now /
docker inspect kmsetjendpdri_frontend:latest | grep VITE_APP_SUBPATH
# Should show: "VITE_APP_SUBPATH": "/"
```

---

### Step 7: Test in Browser

```
Frontend (NEW):        https://kms.khaz.app/
Backend API (NEW):     https://kms-be.khaz.app/api/v1/
Health Check (NEW):    https://kms-be.khaz.app/health/
Google OAuth (NEW):    https://kms.khaz.app/google/callback/
```

**Expected results:**
- ✅ Page loads at `kms.khaz.app` (NOT blank)
- ✅ CSS/JS assets load from root `/assets/` 
- ✅ Images load from `/public/images/`
- ✅ API calls go to `kms-be.khaz.app`
- ✅ Google OAuth redirects to `kms.khaz.app`

---

## Summary of Changes

| Component | Before | After | Why |
|-----------|--------|-------|-----|
| Staging Frontend URL | `khaz.app/kms/` | `kms.khaz.app/` | Match production style |
| Staging Backend URL | `khaz.app/kms/api/` | `kms-be.khaz.app/api/` | Separate backend |
| VITE_APP_SUBPATH | `/kms` | `/` | Always root, no subpath |
| Nginx Config | 1 domain + subpath | 2 subdomains | Cleaner routing |
| Backend Middleware | ScriptNameMiddleware required | Not needed | No subpath handling |
| Django ALLOWED_HOSTS | Single domain | Multiple subdomains | Multi-domain support |
| Environment Consistency | ❌ Different per env | ✅ Same pattern everywhere | Eliminates bugs |

---

## Why This Fixes Everything

1. **Consistent across all environments**
   - Local, staging, production all use: `separate frontend/backend`
   - No environment-specific URL logic

2. **No more /kms subpath confusion**
   - Frontend: `VITE_APP_SUBPATH=/` (always)
   - Routes: React Router always at root
   - Assets: Always at `/assets/` (not `/kms/assets/`)

3. **Simpler configuration**
   - No ScriptNameMiddleware
   - No subpath stripping in nginx
   - Standard Django setup

4. **No more image 404 errors**
   - Images access directly: `/perpustakaan.jpg` (not `/kms/perpustakaan.jpg`)
   - No `getAssetPath()` workaround needed
   - Can now remove that utility

5. **No more blank white page issues**
   - VITE_APP_SUBPATH always `/`
   - Doesn't matter if env not sourced - defaults are correct

6. **No more OAuth redirect issues**
   - Redirects to: `kms.khaz.app/google/callback/`
   - Works same as production structure

---

## Rollback Plan (If Something Goes Wrong)

```bash
# Restore old nginx config
sudo rm -f /etc/nginx/sites-enabled/kmsetjendpdri-subdomains
sudo ln -s /etc/nginx/sites-available/kmsetjendpdri-docker /etc/nginx/sites-enabled/kmsetjendpdri-docker
sudo systemctl reload nginx

# Restore old environment
cd /var/www/html/kmsetjendpdri
git checkout .env
docker-compose down
docker-compose up -d
```

Everything reverts to `/kms` subpath approach.
