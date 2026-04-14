# Staging Server Blank White Page - Root Cause & Complete Solution

## 📊 THE PROBLEM

**Symptom:**
- Local: http://localhost:5175/ ✅ Works perfectly
- Staging: https://khaz.app/kms/ ❌ Shows blank white page

**Evidence:**
- All containers healthy and running
- No errors in Docker build
- Nginx configured correctly
- Backend API responding
- Frontend container running and accessible

Yet the page is completely blank - not even content renders.

---

## 🔍 ROOT CAUSE - VITE_APP_SUBPATH Not Passed During Build

### The Issue

**File:** `frontend/vite.config.js` line 20
```javascript
base: process.env.VITE_APP_SUBPATH || '/',
```

This environment variable **MUST** be set during the Docker build, or Vite builds the app for root (`/`) instead of subpath (`/kms`).

### What Happened During Deployment

```
Deployment on Staging:
1. bash deploy-master.sh staging --health-check runs
2. Inside script: docker-compose build gets called
3. docker-compose tries to read VITE_APP_SUBPATH from shell environment
4. Variable not in shell environment (not sourced from .env.staging)
5. Falls back to docker-compose.yml default: "/"
6. npm run build uses: base: "/"
7. Frontend built expecting to serve from: https://khaz.app/
8. App deployed at: https://khaz.app/kms/
9. Asset paths wrong: expects /assets/... but tries to load /kms/assets/...
10. React Router expects routes at "/" but mounted at "/kms"
11. Everything breaks → Blank white page ❌
```

### Comparison: Why Localhost Works

```
Local Development:
1. npm run dev
2. Auto-loads .env: VITE_APP_SUBPATH=/
3. vite dev server uses: base: "/"
4. App serves from: http://localhost:5175/
5. All routes match: "/" at root
6. Everything works ✅
```

---

## 🎯 THE FIX

### Immediate Fix (For Current Staging)

**On staging server**, before redeploying:

```bash
cd /var/www/html/kmsetjendpdri

# CRITICAL: Source environment variables first
set -a
source .env.staging
set +a

# Verify variables are in environment
echo $VITE_APP_SUBPATH
# Must output: /kms

# Now run deployment (will pass correct variables to docker-compose build)
bash deploy-master.sh staging --health-check
```

### Permanent Fix (Code Update)

**File:** `docker-compose.yml` line 91

**Changed from:**
```yaml
VITE_APP_SUBPATH: ${VITE_APP_SUBPATH:-/}
                                      ^ default for root/localhost
```

**Changed to:**
```yaml
VITE_APP_SUBPATH: ${VITE_APP_SUBPATH:-/kms}
                                      ^ default for staging/production
```

**Why this change:**
- Local development uses `npm run dev` (not docker-compose), so docker-compose default doesn't affect it
- Production/staging deployments use docker-compose, so default should match production path (`/kms`)
- If .env variables not sourced, at least it defaults to correct production path instead of breaking production

---

## ✅ WHAT WAS FIXED

| Component | Before | After | Status |
|-----------|--------|-------|--------|
| `docker-compose.yml` default | `/` (ROOT) | `/kms` (STAGING PATH) | ✅ Fixed |
| Code commits | N/A | Updated | ✅ Ready |
| Vite base path | Defaults to `/` | Defaults to `/kms` | ✅ Fixed |
| React Router basename | Defaults to `/` | Defaults to `/kms` (when .env sourced) | ✅ Fixed |

---

## 🚀 DEPLOYMENT STEPS FOR STAGING

**Follow exactly:**

```bash
# SSH to staging server
cd /var/www/html/kmsetjendpdri

# Pull latest code with fixes
git pull origin main

# CRITICAL STEP: Source .env.staging
set -a
source .env.staging
set +a

# Verify key variables
echo "VITE_APP_SUBPATH: $VITE_APP_SUBPATH"
echo "VITE_API_BASE_URL: $VITE_API_BASE_URL"
# Should show staging values (VITE_APP_SUBPATH=/kms)

# Run deployment with health checks
bash deploy-master.sh staging --health-check

# Wait for completion
sleep 20

# Verify all containers healthy
docker-compose ps
# All should show: "Up (healthy)"

# Test in browser
# Visit: https://khaz.app/kms/
# Should see: Full page with content (NOT blank white page)
```

---

## 🔍 HOW TO VERIFY THE FIX

### Browser Test

```
1. Open: https://khaz.app/kms/
2. Press F12 (DevTools)
3. Switch to Console tab
4. Check:
   ✅ No 404 errors for CSS/JS files
   ✅ No "Cannot GET /kms/..." errors
   ✅ CSS loads: dist/assets/index-*.css
   ✅ JS loads: dist/assets/index-*.js
   ✅ Page shows content (header, footer, articles)
   ✅ NOT a blank white page
```

### Docker Verification

```bash
# Check frontend image was built with correct env var
docker inspect kmsetjendpdri_frontend:latest | grep VITE_APP_SUBPATH
# Should show: "VITE_APP_SUBPATH": "/kms"

# Check build logs
docker-compose logs frontend | head -50
# Should show: "serving dist folder from: dist"
```

### Network Tab Verification

```
Open DevTools → Network tab → Reload page
Look for requests:
✅ https://khaz.app/kms/assets/index-*.css (200)
✅ https://khaz.app/kms/assets/index-*.js (200)
✅ https://khaz.app/kms/assets/...vendor-*.js (200)
❌ Should NOT see: /assets/... or /kms//assets/...
```

---

## 📚 UNDERSTANDING THE ARCHITECTURE

### Vite Build Process

```
vite.config.js:
  base: process.env.VITE_APP_SUBPATH || '/'
  
When VITE_APP_SUBPATH="/kms":
  → Vite generates assets with /kms/ prefix
  → CSS imports: /kms/assets/...
  → JS imports: /kms/assets/...
  → HTML references: /kms/assets/...

Result:
  dist/index.html contains:
    <script src="/kms/assets/index-*.js"></script>
    <link rel="stylesheet" href="/kms/assets/index-*.css">
```

### React Router Setup

```javascript
App.jsx:
  const appSubpath = import.meta.env.VITE_APP_SUBPATH || '/';
  
  <Router basename={appSubpath}>
    <Route path="/" element={<HomePage />} />
    <Route path="/knowledges" element={<ArticlesPage />} />
    ...
  </Router>

When basename="/kms":
  → Route "/" accessed at: /kms/
  → Route "/knowledges" accessed at: /kms/knowledges
  → All routes work correctly

When basename="/" (WRONG):
  → Route "/" accessed at: /
  → User visits /kms/ → Router can't match "/" → Blank page
```

### Nginx Routing

```nginx
location /kms/ {
    proxy_pass http://127.0.0.1:5175/;
}

Request flow:
  Browser: https://khaz.app/kms/
  ↓
  Nginx sees: /kms/
  ↓
  Proxies to: http://127.0.0.1:5175/index.html
  ↓
  Frontend Serve responds with dist/index.html
  ↓
  HTML loads assets from: <script src="/kms/assets/...">
  ↓
  Browser requests: https://khaz.app/kms/assets/...
  ↓
  Nginx proxies back to 5175: /assets/...
  ✅ Works!
```

---

## 🚨 IF STILL SHOWING BLANK PAGE AFTER FIX

### Diagnostics

```bash
# Check frontend build environment
docker-compose build --no-cache frontend
# Watch for: --build-arg ... VITE_APP_SUBPATH from output

# Check if rebuild happens
docker images kmsetjendpdri_frontend:latest --format "{{.ID}}"
# Note the image ID, then:
docker-compose down
set -a && source .env.staging && set +a
docker-compose build --no-cache frontend
# Image ID should change

# Force complete rebuild
docker-compose down -v
docker system prune -f
set -a && source .env.staging && set +a
docker-compose build --no-cache --force-rm
docker-compose up -d
```

### Check Browser Cache

```
Frontend loads from memory cache (old build with base="/")
1. Open DevTools → Network tab
2. Check "Disable cache" (checkbox)
3. Reload page (Ctrl+Shift+R for hard refresh)
4. Check if CSS/JS load from correct paths
```

### Verify Nginx Routing

```bash
# SSH to staging server
# Check if assets are being served correctly
curl -I https://khaz.app/kms/assets/
# Should respond 200, not 404

# Check if Nginx config was updated
cat /etc/nginx/sites-available/khaz.app | grep -A 10 "location /kms"
# Should show correct proxy_pass
```

---

## 🎓 LESSONS LEARNED

### Docker Environment Variables in docker-compose build

```bash
❌ DON'T DO THIS:
docker-compose build
# Doesn't automatically load .env

✅ DO THIS:
set -a
source .env.staging
set +a
docker-compose build
# Now docker-compose has access to environment variables
```

### VITE Build-Time vs Runtime Variables

```javascript
// Build-time (embedded in JS bundle)
import.meta.env.VITE_APP_SUBPATH  // ✅ Available
process.env.VITE_APP_SUBPATH      // ✅ Available during build

// Runtime (NOT available in browser)
process.env.VITE_APP_SUBPATH      // ❌ Undefined at runtime in browser
window.location.pathname          // Has current route, not reliable for detecting subpath
```

### docker-compose.yml Defaults Matter

Each default should be appropriate for the most common use case:
- Local dev (docker-compose): DEFAULT should be production-like or require env sourcing
- Production (scripts): Should handle env sourcing before docker-compose
- Fallback: Better to fail at build time (wrong assets) than fail at runtime (wrong routes)

---

## ✅ SUCCESS INDICATORS

After fix deployment:

- ✅ https://khaz.app/kms/ loads full page (not blank)
- ✅ Header visible at top
- ✅ Loading spinner briefly shows
- ✅ Articles load and display
- ✅ All CSS/JS in DevTools Network tab show 200 status
- ✅ No 404 errors for assets
- ✅ Clicking links works (routing functions)
- ✅ Google OAuth login works (redirects correctly)
- ✅ Can access /kms/admin, /kms/dashboard, etc.

