# CORS & SSL Redirect Fix - Complete Analysis

## Problem Statement

After deployment, the frontend at `https://kms.khaz.app/` could not reach the backend API at `https://kms-be.khaz.app/`. Browser console showed two errors:

```
1. Access to XMLHttpRequest at 'https://kms-be.khaz.app/api/v1/public/articles/popular/' 
   from origin 'https://kms.khaz.app' has been blocked by CORS policy: 
   No 'Access-Control-Allow-Origin' header is present on the requested resource.

2. GET https://kms-be.khaz.app/api/v1/public/articles/popular/ net::ERR_FAILED 301 (Moved Permanently)
```

## Root Cause Analysis

After deep investigation, **FOUR distinct issues** were found:

### Issue 1: Django 301 HTTPS Redirect Loop ⚠️ CRITICAL

**Problem:**
- ALL requests to the backend were being redirected with HTTP 301
- Even `/health/` endpoint was redirecting
- This happens BEFORE CORS headers can be sent

**Root Cause:**
- Django middleware `SecurityMiddleware` was configured with `SECURE_SSL_REDIRECT=True` (in production mode)
- Nginx proxies requests internally as `HTTP/1.0` (not HTTPS)
- Django didn't trust the proxy headers, so it thought all requests were insecure HTTP
- Django's redirect caught the request BEFORE CORS middleware could process it

**Why SECURE_PROXY_HEADER Alone Wasn't Enough:**
```
Django Setting: SECURE_PROXY_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
Expected Behavior: Trust X-Forwarded-Proto header from Nginx
```
- The setting WAS deployed correctly on the server
- Nginx IS sending the header: `proxy_set_header X-Forwarded-Proto $scheme`
- BUT: In staging, Nginx handles all SSL/TLS termination and redirects
- Django doesn't need to redirect because Nginx already redirected HTTP→HTTPS
- Having Django ALSO redirect creates unnecessary 301 loops

**Solution:**
Set `SECURE_SSL_REDIRECT=False` in `.env.staging` because:
- Nginx already handles HTTP→HTTPS redirects on port 80
- All requests reaching Django are already HTTPS (proxied by Nginx)
- Django doesn't need to redirect again
- In production, this can be set back to `True` if needed

### Issue 2: CORS Origins Formatting Error

**Problem:**
```
CORS_ALLOWED_ORIGINS=https://kms.khaz.app, https://kms-be.khaz.app,https://www.khaz.app
                                          ^ space!              ^ no space!
```

**Root Cause:**
- Inconsistent spacing around commas in `.env.staging`
- Python's `env.list()` parses by comma but may preserve whitespace
- Results in origins like: ` https://kms-be.khaz.app` (with leading space)
- Browser's `Origin: https://kms-be.khaz.app` header won't match the configured value

**Solution:**
- Remove all spaces: `CORS_ALLOWED_ORIGINS=https://kms.khaz.app,https://kms-be.khaz.app,https://www.khaz.app`

### Issue 3: Outdated CORS Defaults in Django Settings

**Problem:**
In `backend/config/settings.py`, the default CORS origins pointed to old domain:
```python
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=[
        'https://kms.dpd.go.id',        # ❌ WRONG - old domain
        'https://kms-be.dpd.go.id',     # ❌ WRONG - old domain
        'https:khaz.app',               # ❌ Missing subdomain
        'https://www.khaz.app',         # ✓ Correct
    ]
)
```

**Root Cause:**
- Old defaults were never updated when organization changed domain from `dpd.go.id` to `khaz.app`
- These old defaults serve as fallback if `.env` doesn't specify values

**Solution:**
Updated defaults to match current architecture:
```python
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=[
        'http://localhost:5175',       # Local dev
        'http://127.0.0.1:5175',       # Local dev
        'https://kms.khaz.app',        # ✓ New domain
        'https://kms-be.khaz.app',     # ✓ Backend subdomain
        'https://www.khaz.app',        # ✓ WWW variant
        'https://khaz.app',            # ✓ Root domain
    ]
)
```

### Issue 4: SECURE_SSL_REDIRECT Configuration Rigidity

**Problem:**
```python
# In settings.py:
SECURE_SSL_REDIRECT = not DEBUG  # Sets it to True for DEBUG=False

# Later (redundantly):
if not DEBUG:
    SECURE_SSL_REDIRECT = True
```

This hard-coded the behavior. For staging (where DEBUG=False), it ALWAYS redirects.

**Solution:**
Made it environment-configurable:
```python
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=not DEBUG)
```

Now can be controlled per-environment:
- **Staging** (`SECURE_SSL_REDIRECT=False`): Nginx handles redirects
- **Production** (`SECURE_SSL_REDIRECT=True`): Django enforces HTTPS

---

## Deployment Log - Issues Found

### Django Access Logs During Testing

```
127.0.0.1 - - [14/Apr/2026:14:23:44 +0700] "GET /health/ HTTP/1.1" 301 0
172.19.0.1 - - [14/Apr/2026:14:24:14 +0700] "GET /api/v1/public/articles/popular/ HTTP/1.0" 301 0
127.0.0.1 - - [14/Apr/2026:14:24:14 +0700] "GET /health/ HTTP/1.1" 301 0
```

Notice: Every single request returns `301` with `HTTP/1.0` or `HTTP/1.1` protocol

### Django Settings Middleware Warnings

```
WARNING 2026-04-14 14:23:44,759 debug_middleware MIDDLEWARE INIT: 
SECURE_SSL_REDIRECT=True, DEBUG=False
```

Shows `SECURE_SSL_REDIRECT=True` was active, causing all requests to redirect

---

## Fixes Applied

### File 1: `.env.staging`
```diff
# Before:
CORS_ALLOWED_ORIGINS=https://kms.khaz.app, https://kms-be.khaz.app,https://www.khaz.app,http://localhost:5175
CSRF_TRUSTED_ORIGINS=https://kms.khaz.app, https://kms-be.khaz.app,https://www.khaz.app,http://localhost
SECURE_SSL_REDIRECT=True

# After:
CORS_ALLOWED_ORIGINS=https://kms.khaz.app,https://kms-be.khaz.app,https://www.khaz.app,http://localhost:5175
CSRF_TRUSTED_ORIGINS=https://kms.khaz.app,https://kms-be.khaz.app,https://www.khaz.app
SECURE_SSL_REDIRECT=False
DISABLE_SSL_REDIRECT=True
```

### File 2: `backend/config/settings.py`

**Change 1: Make SECURE_SSL_REDIRECT configurable**
```python
# Before:
SECURE_SSL_REDIRECT = not DEBUG

# After:
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=not DEBUG)
```

**Change 2: Fix CORS default origins**
```python
# Before had dpd.go.id (old domain) with wrong format
# After: Uses khaz.app domains correctly
```

**Change 3: Remove redundant production-only settings**
```python
# Before:
if not DEBUG:
    SECURE_SSL_REDIRECT = True

# After: Removed (SECURE_SSL_REDIRECT now comes from env)
```

---

## Git Commit

```bash
commit 5abe1af
Author: ...
Date: April 14, 2026

    Fix: Disable SECURE_SSL_REDIRECT for staging, fix CORS origins spacing and defaults
    
    - Disable SECURE_SSL_REDIRECT in staging (.env.staging) because Nginx handles HTTP→HTTPS
    - Fix CORS_ALLOWED_ORIGINS spacing (remove spaces after commas)
    - Update CORS default origins from dpd.go.id to khaz.app domains
    - Make SECURE_SSL_REDIRECT configurable via environment variable
    - This prevents 301 redirect loops in staging and allows APIs to return CORS headers
```

---

## Why This Happened

The SSL redirect loop was a **deployment architecture mismatch**:

1. **Initial Setup**: Django was configured assuming direct internet access (needs its own HTTPS redirects)
2. **Production Deployment**: Added Nginx reverse proxy that terminates SSL...
   - But Django kept its `SECURE_SSL_REDIRECT=True`
   - Result: Nginx redirects HTTP→HTTPS, then Django redirects again (unnecessary)
3. **Staging Testing**: SSL + subdomain routing revealed the problem
   - 301 errors prevented CORS headers from being sent
   - Nginx headers couldn't fix Django's overzealous redirects

---

## Expected Behavior After Fix

###  Request Flow (After Fix)

```
Browser (https://kms.khaz.app)
  ↓
  GET https://kms-be.khaz.app/api/v1/public/articles/popular/ 
  Headers: Host: kms-be.khaz.app, Origin: https://kms.khaz.app
  ↓
Nginx @ kms-be.khaz.app:443 (SSL Ingress)
  ↓ proxy_pass http://127.0.0.1:8002/
  ← proxy_set_header X-Forwarded-Proto https
  ← proxy_set_header X-Forwarded-For ...
  ↓
Django (now with SECURE_SSL_REDIRECT=False)
  ↓
  Checks request: "Is this HTTPS?" 
  Nginx header: "X-Forwarded-Proto: https"
  Decision: "Yes, it's HTTPS. No redirect needed."
  ↓
  CorsMiddleware processes request
  ↓
  Compares: Origin "https://kms.khaz.app" against CORS_ALLOWED_ORIGINS
  Decision: "Match found!"
  ↓
  Returns: HTTP 200 + "Access-Control-Allow-Origin: https://kms.khaz.app"
  ↓
Browser receives response with CORS headers ✅
```

### Expected Test Results

After deployment, these should work:

```bash
# Test 1: API returns 200 (not 301)
curl -I https://kms-be.khaz.app/api/v1/public/articles/popular/
# Expected: HTTP/2 200

# Test 2: Includes CORS headers
curl -H "Origin: https://kms.khaz.app" \
     https://kms-be.khaz.app/api/v1/public/articles/popular/
# Expected: "Access-Control-Allow-Origin: https://kms.khaz.app" in response

# Test 3: Frontend can load data
# Visit: https://kms.khaz.app/
# Browser console: No CORS errors, no 301 errors
# Featured articles should load
```

---

## Deployment Timeline

- **Before**: 301 loop + CORS errors
- **After Fix Commits**: Code changed ✓
- **After Deployment**: Docker rebuilt with new settings
- **After Containers Restart**: New containers running with SECURE_SSL_REDIRECT=False
- **Expected Result**: All endpoints return 200 + CORS headers

Deployment in progress as of April 14, 2026 14:35 UTC+7...
