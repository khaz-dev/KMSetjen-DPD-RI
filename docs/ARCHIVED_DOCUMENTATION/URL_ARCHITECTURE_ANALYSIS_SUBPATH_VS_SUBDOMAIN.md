# URL Architecture Analysis: Subpath vs Subdomain Routing

## Current State vs Desired State

### 🔴 CURRENT - Subpath-based Routing

```
LOCAL DEVELOPMENT
├── Frontend: http://localhost:5175/
├── Backend: http://localhost:8002/
├── API calls: http://localhost:8002/api/
└── NO subpath (root level)

STAGING SERVER
├── Domain: khaz.app
├── Frontend: https://khaz.app/kms/
├── Backend API: https://khaz.app/kms/api/
├── Nginx routes /kms/* → localhost:5175
├── VITE_APP_SUBPATH=/kms
└── All behind single domain with subpath prefix

PRODUCTION SERVER
├── Domain: kms.dpd.go.id
├── Frontend: https://kms.dpd.go.id/
├── Backend: https://kms-be.dpd.go.id/
├── Separate domains per service
└── DIFFERENT architecture than staging (inconsistent!)
```

### 🟢 DESIRED - Subdomain-based Routing

```
LOCAL DEVELOPMENT
├── Frontend: http://localhost:5175/         ✅ SAME (no change)
├── Backend: http://localhost:8002/          ✅ SAME (no change)
├── API calls: http://localhost:8002/api/    ✅ SAME (no change)
└── NO subpath (root level)

STAGING SERVER
├── Frontend: https://kms.khaz.app/          🔄 CHANGE from /kms
├── Backend API: https://kms-be.khaz.app/    🔄 NEW - separate domain
├── Nginx: Separate server blocks per subdomain
├── VITE_APP_SUBPATH=/                       🔄 CHANGE from /kms
└── Consistent with production

PRODUCTION SERVER
├── Frontend: https://kms.dpd.go.id/         ✅ SAME (already correct)
├── Backend: https://kms-be.dpd.go.id/       ✅ SAME (already correct)
├── Separate domains per service
└── SAME architecture as staging (consistent!)
```

---

## Why This Matters

### Problem with Subpath-based (/kms) Approach

1. **Inconsistent between environments**
   - Staging: `/kms` subpath (single domain)
   - Production: separate domains (NO subpath)
   - → Bugs found in staging may not appear in production

2. **Complex nginx configuration**
   - Must handle subpath stripping/prepending
   - Must tell backend about subpath via X-Script-Name header
   - More prone to misconfiguration

3. **Complex frontend configuration**
   - VITE_APP_SUBPATH changes between environments
   - Assets built with different base paths: `/assets/` vs `/kms/assets/`
   - React Router basename must match

4. **Complex backend configuration**
   - Must parse X-Script-Name header
   - URL generation aware of subpath
   - ScriptNameMiddleware required

5. **What we've been debugging**
   - 404 image errors (subpath not in paths)
   - Blank white page (subpath not in Vite build)
   - OAuth redirect URI (subpath in URL)
   - Asset paths (subpath in Vite)

### Benefits of Subdomain-based Approach

1. **Consistent across all environments**
   - Same architecture: separate frontend/backend domains
   - Staging and production use same pattern
   - Easier to troubleshoot

2. **Simpler nginx configuration**
   - Standard web server pattern
   - No subpath stripping
   - Clear domain-to-service mapping

3. **Simpler frontend configuration**
   - VITE_APP_SUBPATH=/ (root) everywhere
   - Assets always at root: `/assets/`
   - React Router basename always `/`

4. **Simpler backend configuration**
   - No subpath handling needed
   - Standard Django URL patterns
   - No middleware complexity

5. **Better for static assets**
   - CDN can cache per domain
   - No subpath complexity with CORS
   - Standard HTTP/2 push for domains

---

## Code Changes Required

### 1️⃣ Environment Configuration Files

**`.env` (Local)**
```env
# FRONTEND
VITE_APP_SUBPATH=/
VITE_API_BASE_URL=http://localhost:8002/api
VITE_API_URL=http://localhost:8002
FRONTEND_URL=http://localhost:5175
VITE_GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback/

# BACKEND
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,django,kms_django
```

**`.env.staging` (Staging)**
```env
# FRONTEND
VITE_APP_SUBPATH=/
VITE_API_BASE_URL=https://kms-be.khaz.app/api
VITE_API_URL=https://kms-be.khaz.app
FRONTEND_URL=https://kms.khaz.app
VITE_GOOGLE_REDIRECT_URI=https://kms.khaz.app/google/callback/

# BACKEND
ALLOWED_HOSTS=kms-be.khaz.app,kms.khaz.app,localhost,127.0.0.1
GOOGLE_REDIRECT_URI=https://kms.khaz.app/google/callback/
```

**`.env.production` (Production)**
```env
# FRONTEND
VITE_APP_SUBPATH=/
VITE_API_BASE_URL=https://kms-be.dpd.go.id/api
VITE_API_URL=https://kms-be.dpd.go.id
FRONTEND_URL=https://kms.dpd.go.id
VITE_GOOGLE_REDIRECT_URI=https://kms.dpd.go.id/google/callback/

# BACKEND
ALLOWED_HOSTS=kms-be.dpd.go.id,kms.dpd.go.id
GOOGLE_REDIRECT_URI=https://kms.dpd.go.id/google/callback/
```

### 2️⃣ docker-compose.yml Changes

**FROM:**
```yaml
frontend:
  ports:
    - "5175:5175"
  environment:
    # ... build args with VITE_APP_SUBPATH: ${VITE_APP_SUBPATH:-/kms}

django:
  ports:
    - "8002:8002"
  # Single port, subpath handled by nginx
```

**TO:**
```yaml
frontend:
  ports:
    - "5175:5175"
  environment:
    # ... build args with VITE_APP_SUBPATH: ${VITE_APP_SUBPATH:-/}

backend:
  ports:
    - "8003:8002"  # Internal port 8003, exposed on container network
  # Separate port, no nginx subpath handling
```

### 3️⃣ Nginx Configuration Changes

**FROM (Current - Subpath):**
```nginx
# One domain, one server block, multiple locations
server {
  server_name khaz.app www.khaz.app;
  
  location /kms/ {
    proxy_pass http://127.0.0.1:5175/;
    proxy_set_header X-Script-Name /kms;
  }
  
  location /kms/api/ {
    proxy_pass http://127.0.0.1:8002/api/;
  }
}
```

**TO (Desired - Subdomain):**
```nginx
# Separate server blocks for frontend and backend
server {
  server_name kms.khaz.app;
  
  location / {
    proxy_pass http://127.0.0.1:5175/;
  }
}

server {
  server_name kms-be.khaz.app;
  
  location / {
    proxy_pass http://127.0.0.1:8003/;  # or 8002
  }
}
```

### 4️⃣ Backend Middleware Changes

**REMOVE from django/config/settings.py:**
```python
MIDDLEWARE = [
    'shared.middleware.proxy_middleware.ScriptNameMiddleware',  # ❌ DELETE
    # ... rest of middleware
]
```

**Reason:** No longer need subpath handling - backend is accessed directly by domain

### 5️⃣ Frontend Vite Configuration

**FROM:**
```javascript
// frontend/vite.config.js
base: process.env.VITE_APP_SUBPATH || '/',  // Could be /kms for staging
```

**TO:**
```javascript
// frontend/vite.config.js
base: '/',  // Always root - no subpath routing
```

### 6️⃣ Frontend App Component

**FROM:**
```javascript
// frontend/src/App.jsx
const appSubpath = import.meta.env.VITE_APP_SUBPATH || '/';
<Router basename={appSubpath}>  // Could be /kms
```

**TO:**
```javascript
// frontend/src/App.jsx
<Router basename="/">  // Always root
```

### 7️⃣ Frontend API Service

**FROM:**
```javascript
// frontend/src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api';
// For staging: https://khaz.app/kms/api
```

**TO:**
```javascript
// frontend/src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api';
// For staging: https://kms-be.khaz.app/api
// (No change needed - already uses env var!)
```

### 8️⃣ Django Settings

**FROM:**
```python
# backend/config/settings.py
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', 
  default=['localhost', '127.0.0.1', 'testserver'])  # May include /kms references
```

**TO:**
```python
# backend/config/settings.py
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', 
  default=['localhost', '127.0.0.1', 'testserver'])  # Only domain names
# For staging: ['kms-be.khaz.app', 'kms.khaz.app', 'localhost']
# For production: ['kms-be.dpd.go.id', 'kms.dpd.go.id']
```

---

## Files to Modify

| File | Current | Change | Reason |
|------|---------|--------|--------|
| `.env.staging` | `/kms` subpath | `/` subdomain | Consistent with production |
| `docker-compose.yml` | `VITE_APP_SUBPATH=-/kms` | `-/` | Always root |
| `docker-compose.yml` | Frontend port `5175:5175` | Keep same | No change |
| `docker-compose.yml` | Backend port `8002:8002` | Keep same | No change |
| `nginx-kms-docker.conf` | Single domain + subpath | Separate domains | Subdomain routing |
| `backend/config/settings.py` | MIDDLEWARE with ScriptNameMiddleware | Remove middleware | No subpath needed |
| `backend/config/settings.py` | ALLOWED_HOSTS | Update for subdomains | For staging/production |
| `frontend/vite.config.js` | `base: process.env.VITE_APP_SUBPATH` | `base: '/'` | Always root |
| `frontend/src/App.jsx` | `basename={appSubpath}` | `basename="/"` | Always root |
| DNS/Domain Setup | Single domain khaz.app | Two subdomains: kms.khaz.app, kms-be.khaz.app | New subdomains |

---

## Migration Strategy

### Phase 1: Update Configuration (Local Testing)
1. Update `.env.staging` to use subdomains
2. Update `docker-compose.yml` defaults
3. Remove `ScriptNameMiddleware` from backend settings

### Phase 2: Update Nginx Configuration
1. Create new nginx config file for subdomains
2. Test locally with /etc/hosts entries
3. Deploy to staging server

### Phase 3: Update DNS
1. Add DNS records for `kms.khaz.app` and `kms-be.khaz.app`
2. Wait for DNS propagation (might take time)

### Phase 4: Update Frontend
1. Remove `VITE_APP_SUBPATH` logic from vite.config.js
2. Remove `appSubpath` from App.jsx
3. Rebuild frontend

### Phase 5: Test
1. Update production `.env` if needed
2. Verify URLs work correctly
3. Test OAuth redirects

---

## Key Insight: Why Current System is Confusing

**Current inconsistency:**
- Development (localhost): No subpath, separate ports === Easy ✅
- Staging: One domain + subpath (`/kms`) === Complex 🔴
- Production: Separate domains === Standard 🟢

**Result:** Bugs appear in staging but not production (or vice versa)

**Solution:** Make staging match production architecture (separate domains, no subpath)

---

## Zero-Downtime Transition Plan

Since you want this working, here's how to minimize disruption:

1. Keep old subpath-based URLs working during transition
2. Nginx can serve both `/kms` (old) and `kms.khaz.app` (new) simultaneously
3. Gradually migrate users to new subdomain URLs
4. Once traffic is on subdomain, remove subpath support

This way:
- Old bookmarks still work: `khaz.app/kms` → redirects to `kms.khaz.app`
- Existing OAuth users unaffected
- No service downtime

---

## DNS Records Needed

**For khaz.app domain registrar:**

```
Type    Name           Value              Purpose
A       kms            165.245.191.216    Frontend subdomain
A       kms-be         165.245.191.216    Backend subdomain
CNAME   www.kms        kms.khaz.app       WWW alias for frontend
CNAME   www.kms-be     kms-be.khaz.app    WWW alias for backend
```

---

## Summary

| Aspect | Current (Subpath) | Desired (Subdomain) | Impact |
|--------|-------------------|-------------------|--------|
| Staging Frontend | `khaz.app/kms` | `kms.khaz.app` | Simpler URLs |
| Staging Backend | `khaz.app/kms/api` | `kms-be.khaz.app/api` | Separate service |
| Consistency | ❌ Different from production | ✅ Identical to production | Eliminates bugs |
| Nginx Config | Complex (subpath routing) | Simple (domain routing) | Easier debugging |
| Frontend Code | Complex (VITE_APP_SUBPATH) | Simple (always root) | Less configuration |
| Backend Code | Complex (ScriptNameMiddleware) | Simple (standard Django) | Fewer bugs |
