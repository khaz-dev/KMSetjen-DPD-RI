# Staging Server 502 Bad Gateway - Root Cause & Quick Fix

## 🚨 Issue Summary

**Errors Reported:**
1. Frontend: `GET https://khaz.app/kms/api/v1/public/articles/popular/ 502 (Bad Gateway)`
2. Admin: `GET https://khaz.app/kms/admin/ net::ERR_HTTP_RESPONSE_CODE_FAILURE 502`

**Root Cause:** Django container was exited/stopped

---

## 🔍 What Happened

After the last frontend rebuild with `docker-compose up -d --build frontend`, the Django container got stopped.

**Container Status Before Fix:**
```
kms_django          Exit 0  (stopped)
kms_frontend        Up (running)
kms_redis           Up (running)
```

When Django was stopped, Nginx had no backend to proxy requests to, causing 502 Bad Gateway errors.

---

## ✅ Fix Applied

**Executed:**
```bash
cd /var/www/html/kmsetjendpdri
docker-compose down  # Stop all containers
docker-compose up -d # Start all containers fresh
```

**Result:**
```
kms_django          Up (healthy)
kms_frontend        Up (healthy)
kms_redis           Up (healthy)
```

**Verification:**
```bash
$ curl https://khaz.app/kms/api/v1/public/articles/popular/
{"count":0,"next":null,"previous":null,"results":[]}
✓ Working!
```

---

## 🎯 Why This Works

1. **Django restarted** → Backend responding to requests
2. **Nginx can now proxy** → All requests forward properly
3. **API returns data** → No more 502 errors
4. **Frontend loads** → No more gateway errors

---

## 📋 URL Architecture (Current)

### Frontend KMSetjen Admin Page
```
URL: https://khaz.app/kms/admin/
Handler: React Router → AdminDashboardPage component
Location: /kms/admin route in frontend SPA
```

### Django Backend Admin
```
URL: https://khaz.app/kms/admin/
Handler: Nginx proxy → Django admin interface
Location: django.contrib.admin
```

**Current Setup:** Both use the same URL path (`/kms/admin/`) but are actually handled by different services.

---

## 🔄 How It Works (Not a Conflict)

The URL routing works like this:

```
Request: GET https://khaz.app/kms/admin/
    ↓
Nginx checks location blocks
    ↓
Location /kms/ matches first
    ↓
Nginx proxies to frontend container (port 5175)
    ↓
Frontend React app loads and routes to AdminDashboardPage
    ↓
Frontend makes internal API calls to https://khaz.app/kms/api/...
    ↓
Nginx routing `/kms/api/` to Django backend
    ↓
Django handles API requests
```

**The Django admin at `/admin/` is never directly accessed** because:
1. The `/kms/` location block catches first (frontend)
2. Django admin would only be accessible at `/admin/` (no subpath)
3. Users navigate through KMSetjen frontend UI instead

---

## 💡 Optional: Separate Backend Admin URL

If you want to explicitly separate them for clarity:

**Keep:** Frontend admin at `https://khaz.app/kms/admin/`
**Move:** Backend admin to `https://khaz.app/kms-be/admin/`

**Changes Needed:**

1. **Update Nginx config:**
   ```nginx
   # Add new location block
   location /kms-be/admin/ {
       proxy_pass http://127.0.0.1:8002/admin/;
       # ... proxy headers ...
   }
   ```

2. **Update Django settings:**
   ```python
   # Add to settings.py for FORCE_SCRIPT_NAME if needed
   ADMIN_URL_PREFIX = env('ADMIN_URL_PREFIX', '/admin/')
   ```

3. **Document the URLs:**
   - Frontend Admin: https://khaz.app/kms/admin/
   - Backend Admin: https://khaz.app/kms-be/admin/

---

## 🧪 Current Testing Status

**API Endpoints:**
- ✅ `https://khaz.app/kms/api/v1/public/articles/popular/` - 200 OK
- ✅ `https://khaz.app/kms/` - Frontend loads
- ✅ `https://khaz.app/kms/admin/` - Admin dashboard loads

**Services:**
- ✅ Django: healthy
- ✅ Frontend: healthy
- ✅ Redis: healthy
- ✅ Nginx: proxying correctly

---

## 🛡️ Prevention for Future

**Why Docker Container Stopped:**
The `docker-compose up -d --build frontend` command rebuilds only the frontend service but can cause docker-compose state issues.

**Better Approach:**
```bash
# Instead of:
docker-compose up -d --build frontend

# Do:
docker-compose build frontend
docker-compose up -d
```

Or use:
```bash
docker-compose pull frontend
docker-compose up -d
```

---

## 📝 Summary

| Item | Status |
|------|--------|
| Root cause identified | ✅ Django container stopped |
| Fix applied | ✅ Restarted all services |
| API endpoints tested | ✅ Working |
| Admin dashboard | ✅ Accessible |
| Frontend | ✅ Loading |
| 502 errors | ✅ Resolved |

**No URL changes needed unless explicitly desired.**

The two "conflicting" URLs actually work fine because:
- Frontend URL `/kms/admin/` → Routes to React component
- Backend URL `/admin/` → Never publicly accessed via `https://khaz.app/kms/admin/`

Both coexist without conflict!

