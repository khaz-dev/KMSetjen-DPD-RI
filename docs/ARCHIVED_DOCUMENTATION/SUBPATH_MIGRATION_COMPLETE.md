# Subpath Migration Complete: /kmsetjendpdri → /kms

**Migration Date**: April 8, 2026
**Status**: ✅ COMPLETE AND VERIFIED

---

## Changes Made

### 1. Configuration Files Updated

#### `.env` (Local & Server)
- Changed: `APP_SUBPATH=/kmsetjendpdri` → `APP_SUBPATH=/kms`
- Also updated: `VITE_APP_SUBPATH=/kms`

#### `frontend/vite.config.js`
- Updated comment documentation
- Updated proxy rule: `/kms/api` → strips `/kms` when proxying to backend

#### `deploy-docker.sh`
- Build command: `VITE_APP_SUBPATH=/kms npm run build`
- Updated production URL references in output messages

#### Nginx Configuration
- **Old file**: `nginx-kmsetjendpdri-docker.conf` (deprecated)
- **New file**: `nginx-kms-docker.conf` (now active)
- **Nginx vhost**: `/etc/nginx/sites-available/kms` (on server)
- Updated all proxy locations and headers for `/kms` path

### 2. Backend Compatibility

The backend (`backend/config/settings.py`) already supports dynamic subpath configuration:
```python
app_subpath = env('APP_SUBPATH', default='')
STATIC_URL = f'{app_subpath}/static/' if app_subpath else '/static/'
MEDIA_URL = f'{app_subpath}/media/' if app_subpath else '/media/'
```

**No backend code changes needed** - it automatically adapts to the new subpath!

---

## Deployment Steps Performed

1. ✅ Updated local configuration files
2. ✅ Committed to git and pushed to main branch
3. ✅ Pulled changes on server
4. ✅ Updated server .env file with new subpath
5. ✅ Stopped old Docker containers
6. ✅ Deployed new nginx configuration
7. ✅ Removed old nginx vhost configuration
8. ✅ Rebuilt Docker images (frontend with new subpath)
9. ✅ Started new containers
10. ✅ Restarted nginx with new configuration
11. ✅ Verified all endpoints

---

## Verification Results

### ✅ New URLs (Working)

| Endpoint | Status | Response |
|----------|--------|----------|
| `https://khaz.app/kms/` | **200 OK** | React HTML application |
| `https://khaz.app/kms/api/` | **200 OK** | API version info JSON |
| `https://khaz.app/kms/admin/` | **302 Redirect** | Redirects to login (expected) |
| `https://khaz.app/kms/static/` | **200 OK** | Static files from Django |
| `https://khaz.app/kms/media/` | **200/404** | Media files (varies) |
| `https://khaz.app/kms/health/` | **200 OK** | Health check endpoint |

### ✅ Deprecated URLs (No Longer Available)

| Endpoint | Status |
|----------|--------|
| `https://khaz.app/kmsetjendpdri/` | **404 Not Found** |
| `https://khaz.app/kmsetjendpdri/api/` | **404 Not Found** |
| `https://khaz.app/kmsetjendpdri/static/` | **404 Not Found** |

---

## Docker Containers Status

All containers rebuilt and running with new configuration:

```
NAME              Status           Ports
kms_django        Up (healthy)     0.0.0.0:8002->8002/tcp
kms_frontend      Up (healthy)     0.0.0.0:5175->5175/tcp
kms_redis         Up (healthy)     0.0.0.0:6382->6382/tcp
```

---

## Files Modified in Git

```
.env
frontend/vite.config.js
deploy-docker.sh
nginx-kms-docker.conf (new file)
```

Git Commit: `"Change subpath from /kmsetjendpdri to /kms - updated all configurations"`

---

## Nginx Configuration Details

**File Location**: `/etc/nginx/sites-available/kms`

**Key Proxy Locations**:
- `/kms/` → localhost:5175 (React Frontend)
- `/kms/api/` → localhost:8002/api/ (Django REST API)
- `/kms/admin/` → localhost:8002/admin/ (Django Admin Panel)
- `/kms/static/` → localhost:8002/static/ (Static Files)
- `/kms/media/` → localhost:8002/media/ (Media Uploads)

**Root Redirect**: `/` → `/kms/` (automatic redirect)

---

## Environment Variable References

### On Server (`/var/www/html/kmsetjendpdri/.env`)
```env
APP_SUBPATH=/kms
VITE_APP_SUBPATH=/kms
```

### In Frontend Build
- Used by Vite as `base` configuration
- Frontend assets built with correct base path

### In Django Backend
- Used for `STATIC_URL = /kms/static/`
- Used for `MEDIA_URL = /kms/media/`
- Passed to templates via `base` context variable (if used)

---

## Quick Test Commands

To verify the migration from your local machine:

```bash
# Frontend - should return 200 OK
curl -I https://khaz.app/kms/

# API - should return 200 OK with JSON
curl https://khaz.app/kms/api/

# Old path - should return 404 Not Found
curl -I https://khaz.app/kmsetjendpdri/
```

---

## Browser Access

**New URL**: https://khaz.app/kms/

1. Frontend loads at `https://khaz.app/kms/`
2. API calls go to `https://khaz.app/kms/api/`
3. Static files served from `https://khaz.app/kms/static/`
4. Media uploads uploaded to `https://khaz.app/kms/media/`

---

## Rollback Instructions (If Needed)

To revert to `/kmsetjendpdri/` subpath:

```bash
# 1. On server, modify .env
sed -i 's/APP_SUBPATH=\/kms/APP_SUBPATH=\/kmsetjendpdri/g' /var/www/html/kmsetjendpdri/.env

# 2. Switch nginx configuration
sudo rm -f /etc/nginx/sites-enabled/kms
sudo ln -s /etc/nginx/sites-available/kmsetjendpdri /etc/nginx/sites-enabled/kmsetjendpdri

# 3. Rebuild and restart
cd /var/www/html/kmsetjendpdri
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 4. Restart nginx
sudo systemctl restart nginx
```

---

## Summary

✅ **Subpath successfully migrated from `/kmsetjendpdri/` to `/kms/`**

- All configuration files updated
- Docker containers rebuilt and running
- Nginx serving new path correctly
- Old path returns 404 (nginx no longer configured for it)
- All endpoints verified working
- Environment variables dynamically applied to both frontend and backend

**Application now accessible at**: **https://khaz.app/kms/**

