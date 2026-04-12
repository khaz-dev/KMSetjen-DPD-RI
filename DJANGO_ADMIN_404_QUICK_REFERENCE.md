# Django Admin 404 Redirect - Quick Fix Summary

## Problem
**Redirect Loop**: `/kms/admin/login/?next=/kms/admin/` → `https://khaz.app/admin/login/` → 404

The redirect was stripping the `/kms/` prefix from the path.

---

## Root Cause
The `ScriptNameMiddleware` had a bug:

```python
# OLD CODE - BUGGY
if location and not location.startswith('http'):  # ❌ Skips absolute URLs!
    # Fix redirect...
```

When Django generated absolute URL redirects like `https://khaz.app/admin/login/`, the middleware would **skip them** because they start with `https://`. Result: The path never got fixed!

---

## Solution
**Modified** [backend/shared/middleware/proxy_middleware.py](backend/shared/middleware/proxy_middleware.py)

```python
# NEW CODE - FIXED
parsed = urlparse(location)  # ✅ Works for ALL URLs (relative & absolute)
if path and not path.startswith(script_name):
    new_path = script_name + path
    new_location = urlunparse((parsed.scheme, parsed.netloc, new_path, ...))
    response['Location'] = new_location
```

Now the middleware handles:
- ✅ Relative URLs: `/admin/login/` → `/kms/admin/login/`
- ✅ Absolute URLs: `https://khaz.app/admin/login/` → `https://khaz.app/kms/admin/login/`

---

## Deploy

```bash
# 1. Commit
git add backend/shared/middleware/proxy_middleware.py
git commit -m "Fix proxy middleware to handle absolute URL redirects"
git push origin main

# 2. On server
cd /var/www/html/kmsetjendpdri && git pull origin main

# 3. Restart Django
docker-compose restart django

# 4. Test
curl -I "https://khaz.app/kms/admin/login/"
# Should see: 200 OK (not 404)
```

---

## What Was Wrong (Technical)

| Layer | Issue |
|-------|-------|
| **Nginx** | Proxies `/kms/admin/login/` → `http://backend:8002/admin/login/` |
| **Django** | Receives `/admin/login/` + `X-Script-Name: /kms` header |
| **Django's CSRF Check** | Calls `request.build_absolute_uri()` → `https://khaz.app/admin/login/` |
| **Middleware (OLD)** | Sees `https://` prefix → Ignores it ❌ |
| **Result** | Browser sent to `https://khaz.app/admin/login/` → 404 ❌ |

---

## What's Fixed (Technical)

| Layer | After Fix |
|-------|-----------|
| **Middleware (NEW)** | `urlparse()` processes the path → Adds `/kms` prefix ✅ |
| **Result** | Sends to `https://khaz.app/kms/admin/login/` → 200 OK ✅ |

---

## One-Liner Explanation

**The middleware was only fixing relative URL redirects. It ignored absolute URL redirects, which caused the script name to be stripped. Fixed by using `urlparse()` to handle both types.**

---

## Test It

After deployment:

```bash
# Should see the Django admin login form (not 404)
curl "https://khaz.app/kms/admin/login/" | head -20

# Should see proper redirect (not to /admin/)
curl -I "https://khaz.app/kms/admin/"
```

Or in browser: `https://khaz.app/kms/admin/login/` - should work!

---

## Files Changed
- ✅ [backend/shared/middleware/proxy_middleware.py](backend/shared/middleware/proxy_middleware.py) - `_fix_redirect_location()` method only

See [DJANGO_ADMIN_404_REDIRECT_ROOT_CAUSE_AND_FIX.md](DJANGO_ADMIN_404_REDIRECT_ROOT_CAUSE_AND_FIX.md) for detailed analysis.
