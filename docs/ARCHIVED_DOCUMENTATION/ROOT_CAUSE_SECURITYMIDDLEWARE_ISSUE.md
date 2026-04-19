# Root Cause Analysis: CORS + 301 Redirect Loop Issues

## Summary

After deep investigation, I found **THREE LAYERS OF ISSUES**:

### Layer 1: SecurityMiddleware (🔴 ROOT CULPRIT)

**The Problem:**
```python
# In settings.py line 108:
if not DEBUG:
    MIDDLEWARE.insert(0, 'django.middleware.security.SecurityMiddleware')
```

In staging, `DEBUG=False`, so `SecurityMiddleware` is added first to the middleware chain.

**What SecurityMiddleware Does:**
- Checks if incoming request is secure (HTTPS)
- If not secure (HTTP), it **ALWAYS redirects to HTTPS with 301**
- This happens **BEFORE CORS middleware** can process the request
- So CORS headers are never sent

**Why Setting SECURE_SSL_REDIRECT=False Didn't Work:**
- `SECURE_SSL_REDIRECT` only controls Django's request/response cycle middleware
- `SecurityMiddleware` is a separate Django middleware that has its OWN redirect logic
- They both cause redirects but are independent of each other

**Why X-Forwarded-Proto Headers Didn't Fix It:**
- Nginx sends X-Forwarded-Proto header correctly
- But SecurityMiddleware checks `request.is_secure()` 
- The request object only gets the proxy headers AFTER middleware has processed them
- So SecurityMiddleware sees HTTP (internal proxy) and redirects, before any headers are trusted

**The Real Flow:**
```
Request comes in: GET /api/...
  ↓
Django processes request
  ↓
Issue 1: SecurityMiddleware is first in chain
  - Checks: is this HTTPS? No (it's HTTP from proxy)
  - Action: Sends 301 redirect to HTTPS
  ↓
Request never reaches CORS middleware
  ↓
Browser gets 301, no CORS headers
```

### Layer 2: CORS Origins Spacing (High Priority)

**The Problem:**
```env
CORS_ALLOWED_ORIGINS=https://kms.khaz.app, https://kms-be.khaz.app,https://www.khaz.app
                                          ^ space!
```

The origin header from the browser is: `https://kms-be.khaz.app` (no space)
But the config has: ` https://kms-be.khaz.app` (with leading space)

They won't match, causing CORS rejection even if the 301 issue is fixed.

### Layer 3: Outdated CORS Defaults (Medium Priority)

```python
# settings.py has old domain in defaults:
default=[
    'https://kms.dpd.go.id',      # ❌ OLD
    'https://kms-be.dpd.go.id',   # ❌ OLD  
]
```

If `.env` doesn't configure CORS_ALLOWED_ORIGINS, Django falls back to these wrong defaults.

---

## Why This Happens

### Environment Differences

**Local Development (http://localhost:5175):**
- NO Nginx reverse proxy
- NO SSL/TLS
- NO SecurityMiddleware (DEBUG=True)
- `CORS_ALLOWED_ORIGINS` includes `http://localhost:5175`
- Result: ✅ Works fine

**Staging (https://kms.khaz.app):**
- Nginx reverse proxy WITH SSL/TLS termination
- `DEBUG=False` (so SecurityMiddleware IS added)
- SecurityMiddleware doesn't trust X-Forwarded-Proto
- SecurityMiddleware redirects HTTP→HTTPS (but request is already proxied as HTTPS)
- Result: ❌ 301 redirect loop before CORS can work

---

## The Fix

### Fix 1: Make SecurityMiddleware Optional (🔴 CRITICAL)

**Change in settings.py:**
```python
# BEFORE:
if not DEBUG:
    MIDDLEWARE.insert(0, 'django.middleware.security.SecurityMiddleware')

# AFTER:
ENABLE_SECURITY_MIDDLEWARE = env.bool('ENABLE_SECURITY_MIDDLEWARE', default=False)
if ENABLE_SECURITY_MIDDLEWARE:
    MIDDLEWARE.insert(0, 'django.middleware.security.SecurityMiddleware')
```

**In .env.staging:**
```env
ENABLE_SECURITY_MIDDLEWARE=False
```

**Why This Works:**
- Nginx already handles all SSL/TLS termination
- SecurityMiddleware isn't needed in staging
- Without it, requests reach CORS middleware
- CORS middleware can set proper headers
- Requests return 200 + CORS headers ✅

### Fix 2: Fix CORS Origins Spacing (🟡 HIGH)

**In .env.staging:**
```env
# BEFORE:
CORS_ALLOWED_ORIGINS=https://kms.khaz.app, https://kms-be.khaz.app

# AFTER:
CORS_ALLOWED_ORIGINS=https://kms.khaz.app,https://kms-be.khaz.app
```

### Fix 3: Update CORS Defaults (🟡 MEDIUM)

**In settings.py:**
```python
# BEFORE:
default=[
    'https://kms.dpd.go.id',      # Old domain
]

# AFTER:
default=[
    'https://kms.khaz.app',       # New domain
    'https://kms-be.khaz.app',    # Backend subdomain
]
```

---

## Deployment Changes

**Git Commit:** `c7cd404`
```
Fix: Disable SecurityMiddleware in staging - real culprit for 301 redirects

- Make ENABLE_SECURITY_MIDDLEWARE configurable via environment
- Set ENABLE_SECURITY_MIDDLEWARE=False in .env.staging  
- Fix CORS_ALLOWED_ORIGINS spacing (remove spaces after commas)
- This prevents 301 loops in staging and allows APIs to return CORS headers
```

**Files Changed:**
1. `backend/config/settings.py`: Made SecurityMiddleware configurable
2. `.env.staging`: Set ENABLE_SECURITY_MIDDLEWARE=False

---

## Expected Behavior After Fix

### Request Flow (After Fix)

```
Browser: GET /api/.../ from https://kms.khaz.app
  ↓
Nginx (kms-be.khaz.app listener)
  - SSL/TLS terminated at Nginx
  - Validates certificate
  - Headers added: X-Forwarded-Proto: https
  ↓
Proxy to Django (internal HTTP, but headers trusted)
  ↓
SecurityMiddleware: SKIP (disabled for staging)
  ↓
CorsMiddleware:
  - Parse Origin header: "https://kms.khaz.app"
  - Check against CORS_ALLOWED_ORIGINS
  - Match found!
  - Add header: Access-Control-Allow-Origin: https://kms.khaz.app
  ↓
View processes request normally
  ↓
Response includes CORS headers ✅
Browser receives HTTP 200 + CORS headers ✅
```

### Test Commands

```bash
# Test 1: Check HTTP status
curl -k https://kms-be.khaz.app/api/v1/public/articles/popular/
# Expected: HTTP 200 (not 301)

# Test 2: Check CORS headers present
curl -H "Origin: https://kms.khaz.app" \
     https://kms-be.khaz.app/api/v1/public/articles/popular/
# Expected: Header "Access-Control-Allow-Origin: https://kms.khaz.app"

# Test 3: Browser test
# Visit: https://kms.khaz.app/
# Browser console: Should show NO CORS errors
# Featured articles: Should load successfully
```

---

## Why This Design Issue Existed

The codebase was developed with this assumption:
- **Local**: DEBUG=True, no proxy, no SecurityMiddleware ✓
- **Production**: DEBUG=False, Nginx proxy, SecurityMiddleware adds security ✓

But staging broke that assumption:
- **Staging**: DEBUG=False (production-like), Nginx proxy (like production)
- BUT: SecurityMiddleware + proxy headers = conflict ✗

The comment in the code even hints at this:
```python
# SecurityMiddleware causes unwanted HTTPS redirect even with SECURE_SSL_REDIRECT=False
# Only enable in production
```

This comment suggested the developers knew about the issue but didn't fully solve it.

---

## Lesson Learned

When using reverse proxies (Nginx, Load Balancers, etc.):
1. ✅ DO: Disable SSL redirect middleware in Django
2. ✅ DO: Let proxy handle SSL/TLS termination
3. ✅ DO: Trust proxy headers (X-Forwarded-Proto, X-Forwarded-For)
4. ❌ DON'T: Have both proxy AND Django handling SSL redirects
5. ❌ DON'T: Add SecurityMiddleware when behind a proxy with SSL termination
