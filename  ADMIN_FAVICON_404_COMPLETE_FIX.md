# Admin Favicon 404 Fix - Complete Solution

## Problem Description

Both browser consoles on local and staging showed favicon 404 errors:
```
GET https://khaz.app/favicon.ico 404 (Not Found)
GET http://localhost:8002/favicon.ico 404 (Not Found)
```

This occurred when visiting:
- Staging: `https://khaz.app/kms/admin/`
- Local: `http://localhost:8002/admin/`

## Root Cause Analysis

### The Issue

Django's default admin template includes favicon references:
```html
<link rel="shortcut icon" href="/favicon.ico">
```

This makes the browser request `/favicon.ico` from the **root** of the domain:
- ✗ Staging: Browser requests `https://khaz.app/favicon.ico` (from root, not /kms!)
- ✗ Local: Browser requests `http://localhost:8002/favicon.ico` (from root)

### Why It Was Failing

1. **Frontend favicon** is at:
   - Staging: `https://khaz.app/kms/favicon.ico` (in /kms subpath)
   - Local frontend: Not directly at `/favicon.ico`

2. **Django doesn't serve favicon** - only API and admin pages

3. **No nginx routing** for `/favicon.ico` at root domain

Result: Browser gets 404 when looking for favicon at root.

---

## Solution Implemented (3-Part)

### Part 1: Custom Django Admin Template ✅
**File:** `backend/templates/admin/base_site.html`

Override Django's default admin template to use subpath-aware favicon links:
```html
{% extends "admin/base.html" %}

{% block extrahead %}
  {{ block.super }}
  {% if APP_SUBPATH %}
    <!-- Staging/Production: Use subpath -->
    <link rel="icon" href="{{ APP_SUBPATH }}/favicon.svg" />
    <link rel="icon" href="{{ APP_SUBPATH }}/favicon.ico" />
  {% else %}
    <!-- Local: Use root endpoint -->
    <link rel="icon" href="/favicon.ico" />
    <link rel="icon" href="/favicon.svg" />
  {% endif %}
{% endblock %}
```

### Part 2: Django Context Processor ✅
**File:** `backend/config/context_processors.py`

Pass `APP_SUBPATH` to all templates:
```python
def app_context(request):
    return {
        'APP_SUBPATH': settings.APP_SUBPATH or '',
    }
```

Added to `settings.py`:
```python
'context_processors': [
    ...
    'config.context_processors.app_context',
],
```

### Part 3: Nginx Favicon Serving ✅
**File:** `nginx-kms-docker.conf`

Add location blocks to serve favicon from frontend container at root:
```nginx
# Serve /favicon.ico from frontend
location = /favicon.ico {
    proxy_pass http://127.0.0.1:5175/favicon.ico;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000" always;
}

# Serve /favicon.svg from frontend
location = /favicon.svg {
    proxy_pass http://127.0.0.1:5175/favicon.svg;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000" always;
}
```

---

## How It Works Now

### On Staging

1. Browser visits: `https://khaz.app/kms/admin/`
2. Django renders admin template with custom favicon template
3. Template uses `{{ APP_SUBPATH }}/favicon.ico` → `/kms/favicon.ico`
4. Browser requests: `https://khaz.app/kms/favicon.ico` ✅
5. Nginx proxies to frontend's `/kms/favicon.ico` ✅
6. Frontend serves favicon ✅

**Fallback** (if browser requests root):
1. Browser requests: `https://khaz.app/favicon.ico`
2. Nginx location block catches it
3. Proxies to frontend: `http://127.0.0.1:5175/favicon.ico` ✅
4. Frontend serves favicon ✅

### On Local

1. Browser visits: `http://localhost:8002/admin/`
2. Django renders admin template
3. Template uses default favicon path (no APP_SUBPATH set)
4. Template renders: `<link rel="icon" href="/favicon.ico" />`
5. Browser requests: `http://localhost:8002/favicon.ico`
6. Django view serves favicon from frontend's public folder ✅

---

## Test Results

### Staging Server ✅
```bash
$ curl -I https://khaz.app/favicon.ico
HTTP/2 200 
Content-Type: image/x-icon
Content-Length: 862

$ curl -I https://khaz.app/favicon.svg  
HTTP/2 200
Content-Type: image/svg+xml
Content-Length: 60470
```

**Browser Console:** ✅ No favicon 404 errors

### Local Development ✅
```bash
$ curl -I http://localhost:8002/favicon.ico
HTTP/1.1 200 
Content-Type: image/x-icon
```

---

## Files Modified

1. **backend/templates/admin/base_site.html** - NEW
   - Custom Django admin base template
   - Overrides favicon paths based on APP_SUBPATH

2. **backend/config/context_processors.py** - NEW
   - Provides APP_SUBPATH to all templates

3. **backend/config/settings.py** - MODIFIED
   - Added context_processors.app_context to TEMPLATES

4. **backend/config/urls.py** - MODIFIED
   - Added favicon view imports (not actually used with nginx, but kept for completeness)

5. **backend/config/favicon_views.py** - NEW
   - Django views to serve favicon (not needed with nginx routing, but serves as backup)

6. **nginx-kms-docker.conf** - MODIFIED
   - Added /favicon.ico and /favicon.svg location blocks
   - Routes to frontend container

7. **nginx-kmsetjendpdri-docker.conf** - MODIFIED
   - Same favicon blocks added (for alternate config)

---

## Commits

```
29f23c8 - Add favicon location blocks to nginx-kms-docker.conf
fb064dc - Add favicon serving in nginx config  
77c33be - Fix admin favicon 404 errors: add custom template and favicon views
```

---

## Key Outcomes

✅ **Favicon 404 errors eliminated** from browser console
✅ **Works on staging** at `https://khaz.app/kms/admin/`
✅ **Works on local** at `http://localhost:8002/admin/`
✅ **Works for all admin pages** that request favicon
✅ **Proper caching** - 30 day cache headers set
✅ **Clean solution** - uses multiple layers (Django template, nginx routing)

---

## Monitoring

To verify favicon is served correctly:

```bash
# Check staging
curl -I https://khaz.app/favicon.ico
curl -I https://khaz.app/favicon.svg

# Check that admin pages don't show console errors
# Visit: https://khaz.app/kms/admin/
# Open browser developer console → No 404 favicon errors

# Check nginx is correctly routing
docker exec kms_frontend ls /app/dist/favicon.*
```

---

## Technical Details

### Why Multiple Solutions?

1. **Django Template Fix**: Handles cases where Django might render favicon reference
2. **Context Processor**: Makes APP_SUBPATH available for any template logic
3. **Django Views**: Backup for serving favicon from Django if needed
4. **Nginx Routing**: Most reliable - handles any client requesting favicon from root

The layered approach ensures:
- Admin pages render correct favicon paths
- Nginx catches any direct `/favicon.ico` requests
- Frontend serves actual favicon files
- Everything is cached appropriately

### Why Not Just One Solution?

Different clients request favicon in different ways:
- Some request `/favicon.ico` (root)
- Some request relative to current page
- Some are cached from bookmarks

Having multiple solutions ensures all cases are covered.

---

## Status: ✅ RESOLVED

Admin favicon 404 errors are completely fixed on both local and staging servers.

**Date Fixed:** April 12, 2026
**Deployment:** Staged → Live
**Verified:** Yes - HTTP 200 responses confirmed
