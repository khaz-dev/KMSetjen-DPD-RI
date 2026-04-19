# Google OAuth Fix - Deployment Checklist ✓

## Pre-Deployment Verification

### Code Changes Verified ✓
- [x] **frontend/src/services/googleService.js**
  - Line 12-17: `getAppSubpath()` helper function added
  - Line 32: `getGoogleAuthorizationUrl()` uses subpath-aware redirect_uri
  - Line 130: `handleGoogleCallback()` uses subpath-aware redirect_uri
  
- [x] **.env file updated**
  - Line 63: `VITE_APP_SUBPATH=/kms` ✓
  - Line 82: `GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback` ✓

- [x] **.env.example updated** 
  - Line 50: `VITE_APP_SUBPATH=/kms` ✓
  - Line 67: `GOOGLE_REDIRECT_URI=http://localhost:5175/kms/google/callback` ✓

- [x] **.env.production updated**
  - Line 55: `VITE_APP_SUBPATH=/kms` ✓
  - Line 96: `GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback` ✓

- [x] **backend/config/settings.py updated**
  - Line 353: Default `GOOGLE_REDIRECT_URI='http://localhost:5175/kms/google/callback'` ✓

### Git Commit Verified ✓
- [x] All changes committed to main branch
- [x] Commit message: "Fix Google OAuth callback URL to use /kms subpath"
- [x] 12 files changed across multiple environments

---

## Deployment Steps

### Phase 1: Docker Image Rebuild
```bash
# Step 1: Pull latest code from repository
cd /production/kmsetjen-app  # or your deployment directory
git pull origin main

# Step 2: Rebuild frontend image with new environment variables
# The VITE_APP_SUBPATH=/kms will be picked up during build
docker build \
  --build-arg VITE_APP_SUBPATH=/kms \
  -f frontend/Dockerfile \
  -t kmsetjen-kms/frontend:v1.0.0 \
  ./frontend

# Step 3: Rebuild backend image (if needed for settings.py changes)
docker build \
  -f backend/Dockerfile \
  -t kmsetjen-kms/backend:v1.0.0 \
  ./backend

# Step 4: Tag final versions for registry
docker tag kmsetjen-kms/frontend:v1.0.0 your-registry/kmsetjen-frontend:latest
docker tag kmsetjen-kms/backend:v1.0.0 your-registry/kmsetjen-backend:latest

# Step 5: Push to registry (if using remote registry)
docker push your-registry/kmsetjen-frontend:latest
docker push your-registry/kmsetjen-backend:latest
```

### Phase 2: Deploy Updated Containers
```bash
# Step 1: Navigate to deployment directory
cd /production/kmsetjen-app

# Step 2: Stop current containers
docker-compose down

# Step 3: Pull latest images
docker-compose pull

# Step 4: Start updated containers
docker-compose up -d

# Step 5: Verify all services running
docker-compose ps

# Expected output:
# frontend    Up 2 seconds
# backend     Up 2 seconds
# nginx       Up 2 seconds
# postgres    Up 2 seconds
```

### Phase 3: Quick Health Check
```bash
# Step 1: Check frontend logs for any build-time errors
docker logs kmsetjen-frontend 2>&1 | head -50

# Step 2: Check backend logs for configuration errors
docker logs kmsetjen-backend 2>&1 | head -50

# Step 3: Verify Nginx is routing correctly
docker logs nginx 2>&1 | grep -i "google\|callback" | tail -20

# Step 4: Check environment variables in running container
docker exec kmsetjen-frontend env | grep -E "VITE_APP_SUBPATH|VITE_GOOGLE"
```

---

## Manual Verification Tests

### Test 1: Verify Frontend Environment Variable
```bash
# SSH into frontend container
docker exec -it kmsetjen-frontend sh

# Inside container, verify the env var
echo $VITE_APP_SUBPATH
# Expected output: /kms

# Exit container
exit
```

### Test 2: Check Built Frontend Assets
```bash
# Verify Vite built with correct subpath
docker exec kmsetjen-frontend ls -la /app/dist/

# Check if index.html references correct paths
docker exec kmsetjen-frontend grep -o 'href="[^"]*"' /app/dist/index.html | head -5

# Should show references with /kms prefix if subpath was applied
```

### Test 3: Verify Backend Configuration
```bash
# Connect to backend
docker exec -it kmsetjen-backend python manage.py shell

# Inside Django shell, check Google settings
>>> from django.conf import settings
>>> print(settings.GOOGLE_REDIRECT_URI)
# Expected output: https://khaz.app/kms/google/callback

>>> print(settings.GOOGLE_CLIENT_ID)
# Should show your actual client ID

# Exit shell
>>> exit()
```

---

## User-Facing Tests

### Test 4: Home Page Access ✓
1. Open browser to `https://khaz.app/`
2. Should see home page normally
3. Check console (F12) for no errors
4. **Expected Result:** Page loads correctly

### Test 5: Login Page Access ✓
1. Click "Login" or navigate to `https://khaz.app/kms/login`
2. Should see login form with "Login with Google" button
3. Inspect button with element inspector
4. **Expected Result:** Login form appears, button is clickable

### Test 6: Google OAuth Flow - CRITICAL TEST
**Steps:**
1. Navigate to `https://khaz.app/kms/login`
2. Click "Login with Google"
3. A new window/tab opens to Google consent screen
4. In DevTools (F12) → Console, check for any errors
5. Look for log showing redirect_uri being sent to Google
6. It should show: `...redirect_uri=https%3A%2F%2Fkhaz.app%2Fkms%2Fgoogle%2Fcallback...`
7. Grant permissions on Google consent screen
8. Browser redirects back to app

**Expected Result:** 
- ✅ Redirected to callback handler (not 404)
- ✅ URL shows `https://khaz.app/kms/google/callback?code=XXX&state=YYY`
- ✅ Page briefly shows "Processing login..."
- ✅ Redirects to dashboard after successful login
- ✅ User is logged in with Google account

**If You See 404:**
1. Open DevTools → Network tab
2. Look at the request to `/google/callback`
3. Check response status code (should be 2xx, not 404)
4. Check response body for error message
5. See troubleshooting section below

### Test 7: Admin Login (Existing User) ✓
1. Navigate to `https://khaz.app/kms/admin/login/`
2. Login with admin credentials created earlier
3. Should successfully authenticate
4. **Expected Result:** Admin dashboard accessible

---

## Rollback Plan

If Google OAuth still doesn't work after deployment:

### Quick Rollback
```bash
# Option 1: Revert to previous Git commit
cd /production/kmsetjen-app
git revert HEAD
git pull origin main
docker-compose down
docker-compose up -d

# Option 2: Check .env file manually
# Verify VITE_APP_SUBPATH=/kms is actually set
cat .env | grep VITE_APP_SUBPATH

# Option 3: Force rebuild without Docker cache
docker-compose down
docker system prune -a  # WARNING: Removes all images
docker-compose build --no-cache
docker-compose up -d
```

### Troubleshooting If Still Broken
See troubleshooting section in GOOGLE_OAUTH_CALLBACK_FIX_COMPLETE.md

---

## Monitoring After Deployment

### Watch for These Errors (First 24 Hours)
```bash
# Terminal 1: Watch frontend logs
docker logs -f kmsetjen-frontend 2>&1 | grep -i "error\|warn"

# Terminal 2: Watch backend logs
docker logs -f kmsetjen-backend 2>&1 | grep -i "error\|warn|google"

# Terminal 3: Watch nginx logs
docker logs -f nginx 2>&1 | grep -i "error\|404"
```

### Expected Logs After Successful Login
**Frontend logs:**
```
[GoogleService] Exchanging authorization code for tokens
[GoogleService] Code exchange successful
[Login] User logged in successfully
```

**Backend logs:**
```
[auth] Processing Google callback with code: ...
[auth] Token exchange successful with Google
[auth] User authenticated: user@example.com
```

---

## Success Criteria

All of the following should be true after deployment:

- [ ] Frontend builds with VITE_APP_SUBPATH=/kms
- [ ] Backend has GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback
- [ ] Google OAuth redirect_uri matches backend expectation
- [ ] User can click "Login with Google" button
- [ ] Redirected to Google consent screen (no errors)
- [ ] After granting permission, redirected back to callback page
- [ ] Callback page processes authorization code
- [ ] Backend exchanges code for tokens successfully
- [ ] User logged in and redirected to dashboard
- [ ] No 404 errors in browser console
- [ ] No CORS/domain mismatch errors

---

## Documentation References

- **Full Analysis:** [GOOGLE_OAUTH_CALLBACK_FIX_COMPLETE.md](./GOOGLE_OAUTH_CALLBACK_FIX_COMPLETE.md)
- **Admin Login Fix:** [ADMIN_LOGIN_FIXED_COMPLETE.md](./ADMIN_LOGIN_FIXED_COMPLETE.md)
- **Deploy Guide:** [DEPLOY_PS1_COMPLETE_USAGE_GUIDE.md](./DEPLOY_PS1_COMPLETE_USAGE_GUIDE.md)

---

## Related Previous Fixes

This deployment completes authentication implementation:

1. ✅ **Admin User Creation** - Database admin user created with auto-generated password
2. ✅ **Docker Image Fix** - Updated Dockerfile entrypoint for proper startup
3. ✅ **Google OAuth Callback** - Fixed callback URL routing with /kms subpath (TODAY)

---

**Status:** Ready for Production Deployment
**Priority:** HIGH - Required for users to login via Google
**Estimated Deployment Time:** 15-20 minutes
**Risk Level:** LOW - Only affects OAuth flow, admin login still works
**Rollback Time:** 5 minutes if needed

