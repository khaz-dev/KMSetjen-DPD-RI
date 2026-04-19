# Deep Scan Results: URL Architecture Confusion Root Cause & Complete Fix

## Executive Summary

**The Root Problem:**
Your project has **3 different URL architectures**:
- **Local**: `localhost:5175/` (frontend) + `localhost:8002/` (backend) ✅ Simple, clean
- **Staging**: `khaz.app/kms/` (frontend) + `khaz.app/kms/api/` (backend) 🔴 Confusing, uses subpath
- **Production**: `kms.dpd.go.id/` (frontend) + `kms-be.dpd.go.id/` (backend) ✅ Clean, uses subdomains

**Result:** Staging is COMPLETELY DIFFERENT from production architecture!

This inconsistency is **why all recent bugs happened**:
1. Images 404 because paths needed `/kms` prefix only on staging
2. Blank white page because VITE_APP_SUBPATH not set (environment-specific)
3. OAuth redirect errors because URLs different per environment
4. `getAssetPath()` workaround needed (shouldn't be needed if architecture consistent)

---

## Why This Happened

All the recent issues traced to **one root cause**: environment variables not passed during Docker build.

But the REAL root cause is deeper: staging uses subpath routing while production uses subdomain routing.

### How Subpath Routing Works

```
1. Browser: GET https://khaz.app/kms/
2. Nginx: Sees /kms/ → strips it → forwards to http://localhost:5175/
3. Frontend: Builds with VITE_APP_SUBPATH=/kms → assets at /kms/assets/
4. Nginx: PUT /kms/ prefix back on assets
5. Browser: GET https://khaz.app/kms/assets/index.js
```

**Problem:** If VITE_APP_SUBPATH not set during build, frontend builds with `/` → assets at `/assets/` → 404!

### How Subdomain Routing Works (Production)

```
1. Browser: GET https://kms.dpd.go.id/
2. Nginx: Sees domain → no stripping needed → forwards to http://localhost:5175/
3. Frontend: Builds with VITE_APP_SUBPATH=/ → assets at /assets/
4. Browser: GET https://kms.dpd.go.id/assets/index.js
```

**Advantage:** No environment variables needed! Assets always build the same way.

---

## Architecture Comparison

### Current (❌ Problematic)

| Environment | Frontend URL | Backend URL | Architecture | Consistency |
|-------------|-------------|---------|-------------|---------|
| Local | `localhost:5175/` | `localhost:8002/` | Root-level | ✅ |
| Staging | `khaz.app/kms/` | `khaz.app/kms/api/` | Subpath-based | ⚠️ Different |
| Production | `kms.dpd.go.id/` | `kms-be.dpd.go.id/` | Subdomain-based | ✅ |

### Desired (✅ Fixed)

| Environment | Frontend URL | Backend URL | Architecture | Consistency |
|-------------|-------------|---------|-------------|---------|
| Local | `localhost:5175/` | `localhost:8002/` | Root-level | ✅ Same |
| Staging | `kms.khaz.app/` | `kms-be.khaz.app/` | Subdomain-based | ✅ Same as production |
| Production | `kms.dpd.go.id/` | `kms-be.dpd.go.id/` | Subdomain-based | ✅ Same as staging |

Now **all three environments use the same pattern!**

---

## Deep Code Scan Results

### Files That Currently Depend on Subpath

1. **docker-compose.yml (line 91)**
   - `VITE_APP_SUBPATH: ${VITE_APP_SUBPATH:-/kms}`
   - If env var not set, defaults to `/kms` (problematic!)
   - **Fix:** Change default to `/`

2. **frontend/vite.config.js (line 20)**
   - `base: process.env.VITE_APP_SUBPATH || '/'`
   - Reads environment variable during build
   - **Fix:** Change to always `'/'`

3. **frontend/src/App.jsx (line 217)**
   - `basename={appSubpath}` where `appSubpath = import.meta.env.VITE_APP_SUBPATH`
   - React Router uses subpath as base
   - **Fix:** Change to always `'/'`

4. **backend/config/settings.py**
   - `MIDDLEWARE` includes `ScriptNameMiddleware` (line ~55)
   - Handles subpath prefix from nginx X-Script-Name header
   - **Fix:** Remove this middleware (not needed with subdomains)

5. **nginx-kms-docker.conf**
   - Uses single domain with `/kms/` location block
   - Strips subpath before proxying to frontend
   - Sets `X-Script-Name` header for backend
   - **Fix:** Create new config with separate server blocks for subdomains

6. **`.env.staging`**
   - `VITE_APP_SUBPATH=/kms`
   - `VITE_API_BASE_URL=https://khaz.app/kms/api`
   - `VITE_GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/`
   - **Fix:** Updated to subdomain-based URLs

### Files That Don't Need Changes

1. **frontend/src/services/api.js** ✅ Already uses environment variable!
   ```javascript
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
   ```
   - Reads from environment config
   - Works with both subpath and subdomain approaches
   - Will automatically use new kms-be.khaz.app URLs

2. **frontend/src/utils/imageUtils.js** ✅ Can be removed after fix!
   ```javascript
   export const getAssetPath = (assetName) => {
       const appSubpath = getAppSubpath();
       return `${basePath}/${assetName}`;
   };
   ```
   - This utility only existed because of subpath routing
   - Can be removed once all environments are consistent
   - Just use direct image paths instead

---

## Complete Fix Implementation

### ✅ DONE - Configuration Files Created

1. **URL_ARCHITECTURE_ANALYSIS_SUBPATH_VS_SUBDOMAIN.md** (200 lines)
   - Complete analysis of problem
   - Comparison of approaches
   - Code changes required

2. **COMPLETE_URL_ARCHITECTURE_FIX_IMPLEMENTATION.md** (400+ lines)
   - Step-by-step implementation guide
   - Copy-paste ready commands
   - All code changes with explanations
   - Testing procedures
   - Rollback plan

3. **nginx-kms-subdomains.conf** (production-ready)
   - New nginx configuration for subdomain routing
   - Separate server blocks for kms.khaz.app and kms-be.khaz.app
   - Ready to deploy to `/etc/nginx/sites-available/`

4. **.env.staging** (updated)
   - All URLs changed to subdomains
   - VITE_APP_SUBPATH changed to `/`
   - ALLOWED_HOSTS updated
   - CORS settings updated

### 📋 Files to Modify for Complete Fix (Manual)

1. **docker-compose.yml** (line 91)
   ```yaml
   # FROM:
   VITE_APP_SUBPATH: ${VITE_APP_SUBPATH:-/kms}
   
   # TO:
   VITE_APP_SUBPATH: ${VITE_APP_SUBPATH:-/}
   ```

2. **frontend/vite.config.js** (line 20)
   ```javascript
   // FROM:
   base: process.env.VITE_APP_SUBPATH || '/',
   
   // TO:
   base: '/',
   ```

3. **frontend/src/App.jsx** (line 217)
   ```javascript
   // FROM:
   const appSubpath = import.meta.env.VITE_APP_SUBPATH || '/';
   <Router basename={appSubpath}>
   
   // TO:
   <Router basename="/">
   ```

4. **backend/config/settings.py** (MIDDLEWARE list)
   ```python
   # REMOVE or comment out:
   'shared.middleware.proxy_middleware.ScriptNameMiddleware',
   ```

5. **Remove utility (optional but recommended)**
   ```bash
   # After deployment, can remove this file as it's no longer needed:
   rm frontend/src/utils/imageUtils.js
   # And update HomePage.jsx to use direct image paths
   ```

---

## Deployment Checklist

### Pre-Deployment (Local)

- [ ] Read [COMPLETE_URL_ARCHITECTURE_FIX_IMPLEMENTATION.md](COMPLETE_URL_ARCHITECTURE_FIX_IMPLEMENTATION.md)
- [ ] Understand subdomain routing advantages
- [ ] Review new nginx config: [nginx-kms-subdomains.conf](nginx-kms-subdomains.conf)
- [ ] Check updated `.env.staging`

### DNS Setup (Registrar)

- [ ] Add DNS record: `kms.khaz.app` A record → `165.245.191.216`
- [ ] Add DNS record: `kms-be.khaz.app` A record → `165.245.191.216`
- [ ] Wait for propagation (5-30 minutes)
- [ ] Test: `nslookup kms.khaz.app` and `nslookup kms-be.khaz.app`

### Staging Server Deployment

1. Pull latest code
2. Copy nginx config to `/etc/nginx/sites-available/`
3. Enable new config, disable old ones
4. Test and reload nginx
5. Source `.env.staging`
6. Rebuild Docker containers
7. Verify both domains accessible

### Testing

- [ ] `https://kms.khaz.app/` - Frontend loads
- [ ] `https://kms-be.khaz.app/health/` - Backend responds
- [ ] API calls work between domains (CORS should allow both)
- [ ] Images load (no 404 errors)
- [ ] Login with Google works
- [ ] Routes work (navigate around app)
- [ ] Admin dashboard accessible

---

## Benefits of This Fix

1. **✅ Consistency**
   - Same architecture in local, staging, production
   - No environment-specific logic
   - Easier debugging

2. **✅ Simplicity**
   - No subpath routing complexity
   - No ScriptNameMiddleware needed
   - Cleaner nginx configuration
   - Standard web server pattern

3. **✅ Reliability**
   - No environment variable defaults required
   - VITE_APP_SUBPATH always `/`
   - Assets always build correctly

4. **✅ Eliminates Past Issues**
   - No more image 404 errors
   - No more blank white page
   - No more OAuth redirect confusion
   - Can remove `getAssetPath()` utility

5. **✅ Better Performance**
   - CDN can cache per domain
   - Cleaner HTTP/2 push
   - Standard domain-based configuration

---

## Summary of What Was Wrong

**Before (Confusing):**
- Local + Staging + Production = 3 different architectures
- Environment-specific URL logic everywhere
- Defaults wrong for production (subpath instead of subdomain)
- When env vars not sourced, breaks in ways specific to staging
- Required workarounds like `getAssetPath()` utility

**After (Clear):**
- Local + Staging + Production = 1 consistent architecture
- URLs simple and obvious
- No environment-specific logic
- Works same way everywhere
- No workarounds needed

---

## Questions?

See comprehensive documentation:
1. **Analysis**: [URL_ARCHITECTURE_ANALYSIS_SUBPATH_VS_SUBDOMAIN.md](URL_ARCHITECTURE_ANALYSIS_SUBPATH_VS_SUBDOMAIN.md)
2. **Implementation**: [COMPLETE_URL_ARCHITECTURE_FIX_IMPLEMENTATION.md](COMPLETE_URL_ARCHITECTURE_FIX_IMPLEMENTATION.md)
3. **Nginx Config**: [nginx-kms-subdomains.conf](nginx-kms-subdomains.conf)

All committed to GitHub at: commit 9be9399
