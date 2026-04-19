# 🔍 ROOT CAUSE ANALYSIS: Django Admin jsi18n 404 Errors

## Problem Summary

When accessing Django admin pages at `https://khaz.app/kms-be/admin/...`, the browser console shows:
```
GET https://khaz.app/admin/jsi18n/ 404 (Not Found)
```

The request is going to `/admin/jsi18n/` (root level) instead of `/kms-be/admin/jsi18n/`.

---

## Root Cause Identified

### The Issue:
1. **Nginx routes** `/kms-be/admin/` → Django at `http://127.0.0.1:8002/admin/`
2. **Nginx sets header** `X-Script-Name: /kms-be` ✅
3. **Django middleware** receives the header and sets `SCRIPT_NAME = /kms-be` ✅
4. **Django admin templates** generate HTML with hardcoded paths like:
   ```html
   <script src="/admin/jsi18n/"></script>
   ```
5. **Browser sees** the HTML with `/admin/jsi18n/` and makes request to root domain
6. **Result**: `GET https://khaz.app/admin/jsi18n/ 404` ❌

### Why The Middleware Didn't Fix It:

The `ScriptNameMiddleware` in `proxy_middleware.py` has these URL rewriting patterns:
- ✅ `action="/admin/..."`  
- ✅ `href="/admin/..."`
- ✅ `src="/static/..."`
- ❌ **MISSING**: Generic pattern for `/jsi18n/` and other Django admin URLs

The regex patterns are **too specific** - they only match HTML attributes like `action="`, `href="`, `src=" `. But Django admin might generate:
- Inline JavaScript with unprefixed URLs
- Data attributes
- Template directives that create URLs
- JSON data containing admin paths

### Example Missing Patterns:
```html
<!-- Pattern NOT caught ❌ -->
<script src="/admin/jsi18n/"></script>

<!-- Pattern caught ✅ -->
<a href="/admin/something">link</a>

<!-- Pattern NOT caught ❌ -->
<script>
   var adminPath = "/admin/jsi18n/";
</script>

<!-- Pattern caught ✅ (partially) -->
<div data-action="/admin/something"></div>
```

---

## Solution

### Fix: Enhanced URL Rewriting Patterns

We need to add more comprehensive patterns to `ScriptNameMiddleware._rewrite_static_urls()` that catch:

1. **Script tags with absolute paths**: `<script src="/admin/..."></script>`
2. **Any JavaScript or string containing admin paths**: `"/admin/..."`
3. **Inline JavaScript assignments**: `= "/admin/..."`
4. **URL patterns in any context**: `"/jsi18n/"`, `"/admin/jsi18n/"` etc.

### New Patterns to Add:

```python
# Match any /admin/... in quotes (catches inline JS, data attributes, etc)
(r'(["\'])(/admin[^"\']*?)\1', rf'\1{script_name}\2\1'),

# Same for /jsi18n/ (Django i18n JavaScript endpoint)
(r'(["\'])(/jsi18n/[^"\']*?)\1', rf'\1{script_name}\2\1'),

# Match paths in assignment: = '/admin/...', : '/admin/...'
(r'([=:]\s*)(["\'])(/admin[^"\']*?)\2', rf'\1\2{script_name}\3\2'),
(r'([=:]\s*)(["\'])(/jsi18n/[^"\']*?)\2', rf'\1\2{script_name}\3\2'),
```

---

## Deployment Impact

- ✅ Backward compatible - adds patterns, doesn't remove existing ones
- ✅ Fixes jsi18n 404 errors
- ✅ Catches other unintended root-level admin path references
- ✅ Requires Django container restart to pick up new middleware code
- ✅ No Nginx changes needed

---

## Files to Modify

1. **backend/shared/middleware/proxy_middleware.py**
   - Add new regex patterns to `_rewrite_static_urls()` method
   - These patterns will catch `/admin/` and `/jsi18n/` in more contexts

---

## Verification

After fix is deployed, accessing Django admin should:
- ✅ Load pages without 404 errors
- ✅ Show NO browser console errors for jsi18n
- ✅ All admin pages functional
- ✅ Forms work correctly
- ✅ Internationalization features work

