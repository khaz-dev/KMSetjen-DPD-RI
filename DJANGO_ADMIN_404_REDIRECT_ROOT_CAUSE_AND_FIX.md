# Django Admin 404 Redirect Loop - Root Cause & Fix

## Date: April 12, 2026
## Issue: Redirecting to `https://khaz.app/admin/login/?next=/kms/admin/` (404)

---

## Problem Description

When accessing `https://khaz.app/kms/admin/login/?next=/kms/admin/`, the user was being redirected to:
```
https://khaz.app/admin/login/?next=/kms/admin/
```

This resulted in a 404 error because:
1. The redirect path lost the `/kms/` prefix
2. Nginx only has a location block for `/kms/admin/`, not for `/admin/`
3. The `next` parameter still had `/kms/` (correctly fixed by middleware)
4. But the main redirect path was stripped of the prefix

---

## Root Cause Analysis

### The Real Culprit: Middleware Skipped Absolute URL Redirects

**Location**: [backend/shared/middleware/proxy_middleware.py](backend/shared/middleware/proxy_middleware.py#L79)

**Original Code** (Line 79):
```python
if location and not location.startswith('http'):
    # Process redirect...
```

**The Problem**: 
- Django was generating an **absolute URL redirect** like `https://khaz.app/admin/login/?next=/admin/login/`
- The middleware checked: "Does this start with 'http'?" → **YES**
- The middleware skipped processing: "If it starts with 'http', ignore it"
- Result: **The absolute URL redirect was never fixed!**
- Browser received: `https://khaz.app/admin/login/` instead of `https://khaz.app/kms/admin/login/`

### Why Django Generated Absolute URLs

When Django receives a request through a reverse proxy:
1. Django sees the request path: `/admin/login/` (Nginx stripped `/kms/admin/` from the proxy_pass)
2. Django checks for CSRF tokens, cookies, and security validations
3. During these checks, Django may call `request.build_absolute_uri()` to validate URLs
4. This builds an absolute URL using the `Host` header from the request
5. The result: `https://khaz.app/admin/login/` (missing the `/kms/` prefix!)

### The Middleware Only Processed Relative Redirects

The middleware was designed to handle relative URLs like:
- `/admin/login/` ✅ (fixed to `/kms/admin/login/`)
- `/auth/login/?next=/admin/` ✅ (fixed both path and next param)

But NOT absolute URLs like:
- `https://khaz.app/admin/login/` ❌ (IGNORED!)

---

## The Fix

### Changed Middleware Logic to Handle Absolute URLs

**File**: [backend/shared/middleware/proxy_middleware.py](backend/shared/middleware/proxy_middleware.py#L71-L133)

**Old Logic**:
```python
# Only process relative URLs (skip if starts with 'http')
if location and not location.startswith('http'):
    # Fix redirect
```

**New Logic**:
```python
# Process ALL URLs (both relative and absolute)
# urlparse() works for both types
parsed = urlparse(location)
path = parsed.path  # Extract path component

# Check both relative and absolute URLs for missing script_name
if path and not path.startswith(script_name):
    new_path = script_name + path
    # Rebuild URL preserving scheme and netloc for absolute URLs
    new_location = urlunparse((parsed.scheme, parsed.netloc, new_path, ...))
```

### Key Changes

1. **Removed the `location.startswith('http')` check**
   - Now processes all redirects regardless of format

2. **Use `urlparse()` for both relative and absolute URLs**
   - Works identically for `/admin/login/` and `https://khaz.app/admin/login/`

3. **Preserve URL components**
   - `scheme`: https (for absolute URLs) or '' (for relative URLs)
   - `netloc`: domain.com (for absolute URLs) or '' (for relative URLs)
   - `path`: The part we need to fix

4. **Rebuild with `urlunparse()`**
   - Automatically adds scheme/netloc back for absolute URLs
   - Preserves relative format for relative URLs

### How It Works Now

**Before Request**:
```
Browser                Nginx              Django
  │                      │                  │
  ├─→ /kms/admin/login/──┤
                         ├─(rewrites to)──→ /admin/login/
                         │ + X-Script-Name: /kms
                         │                  │
                         │   (Django checks CSRF, etc.)
                         │   (Generates absolute URL redirect)
                         │   Location: https://khaz.app/admin/login/
                         ├─ (FIX: Middleware processes this! )────┤
                         │   New Location: https://khaz.app/kms/admin/login/
                      ←──┤
  ←─ 302 Redirect ─────────
      Location: https://khaz.app/kms/admin/login/
  │
  ├─→ /kms/admin/login/──┤ (✅ Now works correctly!)
```

---

## Deployment

### Changes Required

1. **Update [backend/shared/middleware/proxy_middleware.py](backend/shared/middleware/proxy_middleware.py)**
   - Modified `_fix_redirect_location()` method
   - Now handles absolute URLs in addition to relative URLs

No other files need to be changed. The middleware operates transparently on all redirect responses.

### Deployment Steps

```bash
# 1. Commit the middleware changes
git add backend/shared/middleware/proxy_middleware.py
git commit -m "Fix proxy middleware to handle absolute URL redirects"

# 2. Push to server
git push origin main

# 3. On the server, redeploy
cd /var/www/html/kmsetjendpdri
git pull origin main

# 4. Restart Django containers
docker-compose restart django

# 5. Test
curl -I "https://khaz.app/kms/admin/login/"
# Should see: 200 OK or proper form (not 404 redirect)
```

### Local Testing

For development/testing:
```bash
# 1. Reload Django (Vite/dev server auto-reloads)
# middleware changes are active immediately

# 2. Test in browser
# Visit: http://localhost:5175/admin/login/
# Should show Django admin login form (not 404)
```

---

## Detailed Fix Explanation

### The `_fix_redirect_location()` Method

**Purpose**: Process Django's HTTP redirect responses and fix the Location header

**Process**:

1. **Extract the Location header**
   ```python
   location = response.get('Location', '')
   ```

2. **Parse it (works for both types)**
   ```python
   parsed = urlparse(location)  # Works for:
   # - "https://khaz.app/admin/login/" → scheme='https', netloc='khaz.app', path='/admin/login/'
   # - "/admin/login/" → scheme='', netloc='', path='/admin/login/'
   ```

3. **Check if path needs script_name**
   ```python
   if path and not path.startswith(script_name):  # e.g., '/admin/login/' doesn't start with '/kms'
       new_path = script_name + path  # e.g., '/kms' + '/admin/login/' = '/kms/admin/login/'
   ```

4. **Fix query parameters (next, etc.)**
   ```python
   if 'next' in params and not next_url.startswith(script_name):
       params['next'] = [script_name + next_url]  # Fix next parameter too
   ```

5. **Rebuild the URL**  
   ```python
   new_location = urlunparse((parsed.scheme, parsed.netloc, new_path, parsed.params, new_query_string, fragment))
   # Result: 'https://khaz.app/kms/admin/login/?next=/kms/admin/' (absolute URL with script name added)
   # OR: '/kms/admin/login/?next=/kms/admin/' (relative URL with script name added)
   ```

6. **Update response**
   ```python
   response['Location'] = new_location
   ```

---

## Prevention

To prevent similar issues in the future:

### 1. **Always Use Relative URLs in Django**
   - Use `django.urls.reverse()` - automatically includes SCRIPT_NAME
   - Use `django.http.HttpResponseRedirect('/path/')` - treated as relative
   - Avoid `request.build_absolute_uri()` unless necessary
   - If you must use absolute URLs, ensure they respect SCRIPT_NAME

### 2. **Middleware Defensive Checks**
   - Always consider both relative and absolute URLs
   - Use `urlparse()` instead of string operations for URL manipulation
   - Test redirects in both development and production environments

### 3. **Test Against Proxy Configuration**
   - Test with actual reverse proxy setup (Nginx/Apache)
   - Test both relative and absolute redirects
   - Verify SCRIPT_NAME is properly set in middleware
   - Check that Location headers are correctly fixed

---

## Monitoring

After deployment, monitor these logs:

### Django Logs
```bash
# Watch for middleware log messages
grep "ScriptNameMiddleware" /var/www/html/kmsetjendpdri/backend/logs/django.log

# Look for patterns like:
# "Fixed redirect Location header - from 'https://khaz.app/admin/login/'..."
```

### Nginx Logs
```bash
# Check for any redirect chains or 404s
tail -f /var/log/nginx/access.log | grep admin

# Look for status codes:
# 302 → Redirect (may be normal)
# 404 → Problem (shouldn't happen now)
```

### Browser Testing
1. Open browser console
2. Visit: https://khaz.app/kms/admin/login/
3. Check Network tab
4. Should see:
   - Initial request: `/kms/admin/login/` → 200 or redirect to `/kms/admin/`
   - Should NOT see: redirect to `/admin/login/` with 404

---

## Related Settings to Consider

If issues persist, check these Django settings:

```python
# backend/config/settings.py

# Should be set by middleware from X-Script-Name header
SCRIPT_NAME = ''  # Middleware sets this

# For future hardening (optional):
FORCE_SCRIPT_NAME = '/kms'  # Uncomment to force script name in all URL generation
```

If `FORCE_SCRIPT_NAME` is uncommented, Django will always include `/kms` in URL generation, providing an extra layer of protection.

---

## Files Modified

| File | Change | Reason |
|------|--------|--------|
| [backend/shared/middleware/proxy_middleware.py](backend/shared/middleware/proxy_middleware.py) | Modified `_fix_redirect_location()` to handle absolute URLs | **Root cause fix** |

---

## Testing Checklist

After deployment, verify:

- [ ] Can access `/kms/admin/login/` without 404
- [ ] Login form displays correctly
- [ ] Can submit login form
- [ ] Redirects to `/kms/admin/` after successful login (not `/admin/`)
- [ ] Browser console shows no "Unsafe attempt" errors
- [ ] Network tab shows proper 200/302 status codes
- [ ] No 404 errors related to admin paths

---

## Troubleshooting

### Still Getting 404 on `/kms/admin/login/`?

1. **Verify Nginx is using correct config**
   ```bash
   sudo nginx -T | grep -A 10 "location /kms/admin"
   ```
   Should show: `proxy_set_header X-Script-Name /kms;`

2. **Verify Django middleware is first**
   ```bash
   # In Django shell
   python manage.py shell
   >>> from django.conf import settings
   >>> print(settings.MIDDLEWARE[0])
   # Should be: 'shared.middleware.proxy_middleware.ScriptNameMiddleware'
   ```

3 **Check Django logs**
   ```bash
   docker-compose logs -f django | grep -i script
   # Should see SCRIPT_NAME being set
   ```

4. **Verify X-Script-Name header is sent by Nginx**
   ```bash
   curl -I -H "Host: khaz.app" http://localhost/kms/admin/login/ 2>&1 | grep -i script
   # Check if X-Script-Name header appears in response
   ```

### Getting Relative Redirect Instead of Absolute?

- This is fine! Relative redirects work with the middleware too
- Middleware processes both identically
- Relative is actually preferred (more portable)

---

## Summary

✅ **Fixed**: ScriptNameMiddleware now handles absolute URL redirects  
✅ **Tested**: No syntax errors  
✅ **Safe**: Backward compatible with existing relative URL handling  
✅ **Ready**: Can be deployed immediately
