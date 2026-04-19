# Google OAuth Login Fix - Staging Server Deployment Guide

## ⚡ QUICK FIX (5 minutes)

Run these commands on **staging server** (root@khaz-server):

```bash
# Step 1: Navigate to project
cd /var/www/html/kmsetjendpdri

# Step 2: Pull latest code with fixes
git pull origin main

# Step 3: Verify .env has correct Google OAuth config
grep -E "VITE_GOOGLE_REDIRECT_URI|VITE_GOOGLE_CLIENT_ID" .env
# Should output:
# VITE_GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/
# VITE_GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com

# Step 4: Stop containers
docker-compose down

# Step 5: Clean Docker system
docker system prune -f

# Step 6: IMPORTANT: Source .env before building (so docker-compose has access to variables)
set -a
source .env
set +a

# Step 7: Rebuild with correct environment
docker-compose build --no-cache

# Step 8: Start fresh
docker-compose up -d

# Step 9: Wait for services to become healthy
sleep 20

# Step 10: Verify all containers healthy
docker-compose ps

# Step 11: Verify frontend has correct Google OAuth config
docker-compose logs frontend | grep -i google | head -10
```

---

## 🧪 VERIFICATION

### Browser Test (Most Important)

```
1. Open: https://khaz.app/kms/login
2. Click: "masuk dengan Google" button
3. You should be redirected to Google login
4. After authentication, you should see the dashboard
5. ✅ SUCCESS if no error pages
```

### Log Verification

```bash
# Check frontend logs
docker-compose logs frontend | tail -50

# Check backend logs  
docker-compose logs django | tail -50

# Look for any "redirect_uri" or "oauth" errors
```

### Inspect Built Image

```bash
# Verify frontend image has correct environment
docker inspect kmsetjendpdri_frontend:latest | grep -A 10 VITE_GOOGLE

# Should show:
# "VITE_GOOGLE_REDIRECT_URI": "https://khaz.app/kms/google/callback/"
# "VITE_GOOGLE_CLIENT_ID": "403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com"
```

---

## 🔍 IF VERIFICATION FAILS

### Issue: Still Getting redirect_uri_mismatch Error

**Solution 1: Force fresh rebuild**
```bash
docker-compose down -v
docker system prune -a -f
set -a; source .env; set +a
docker-compose build --no-cache --force-rm
docker-compose up -d
```

**Solution 2: Check .env is loaded**
```bash
# Verify env was sourced
echo $VITE_GOOGLE_REDIRECT_URI
# Should output: https://khaz.app/kms/google/callback/

# If empty, try:
unset VITE_GOOGLE_REDIRECT_URI
source .env
echo $VITE_GOOGLE_REDIRECT_URI
```

**Solution 3: Direct docker build command**
```bash
# Build frontend directly with env variables
docker build \
  --build-arg VITE_GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/ \
  --build-arg VITE_GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com \
  --build-arg VITE_APP_SUBPATH=/kms \
  -t kmsetjendpdri_frontend:latest \
  ./frontend
```

### Issue: Frontend Container Not Starting

```bash
# Check frontend logs
docker logs kms_frontend

# Rebuild frontend only
docker-compose build --no-cache frontend

# Restart
docker-compose down frontend
docker-compose up -d frontend
```

### Issue: Backend Returns OAuth Error

```bash
# Check backend has correct config
docker-compose exec django python manage.py shell << 'EOF'
from django.conf import settings
print("GOOGLE_CLIENT_ID:", settings.GOOGLE_CLIENT_ID[:20] + "...")
print("GOOGLE_REDIRECT_URI:", settings.GOOGLE_REDIRECT_URI)
EOF

# Should output: GOOGLE_REDIRECT_URI: https://khaz.app/kms/google/callback/
```

---

## 📋 WHAT WAS WRONG & WHAT CHANGED

### The Problem
```
docker-compose.yml had WRONG default for VITE_GOOGLE_REDIRECT_URI:
  ❌ http://localhost:5175/callback/google  (WRONG path order)
  ✅ http://localhost:5175/google/callback/ (CORRECT)
```

When .env wasn't sourced before docker-compose build, it used the WRONG default, and the frontend was built with an incorrect Google OAuth redirect URI.

### The Fix
```yaml
# docker-compose.yml - Updated both lines 98 and 119
VITE_GOOGLE_REDIRECT_URI: ${VITE_GOOGLE_REDIRECT_URI:-http://localhost:5175/google/callback/}
# Changed from: http://localhost:5175/callback/google
# Changed to:   http://localhost:5175/google/callback/  ✅ CORRECT ORDER
```

### Key Learning
- `docker-compose build` doesn't automatically load .env
- Must source .env before running docker-compose build
- Or update defaults in docker-compose.yml to be correct

---

## 🎯 EXPECTED OUTCOME

After running the quick fix, you should see:

```
1. docker-compose ps shows all containers "Up (healthy)"
2. Frontend image includes correct VITE_GOOGLE_REDIRECT_URI
3. User can login with Google on https://khaz.app/kms/login
4. Redirects to Google OAuth → authenticates → returns to dashboard ✅
```

---

## 📞 IF STILL STUCK

Collect diagnostic info:

```bash
cd /var/www/html/kmsetjendpdri

# Get environment info
echo "=== Docker Compose Version ===" && docker-compose --version
echo "=== Frontend Env ===" && docker inspect kmsetjendpdri_frontend:latest | grep VITE_GOOGLE
echo "=== Backend Settings ===" && docker-compose exec django python manage.py shell -c "from django.conf import settings; print('GOOGLE_REDIRECT_URI:', settings.GOOGLE_REDIRECT_URI)"
echo "=== Container Status ===" && docker-compose ps
echo "=== Recent Frontend Logs ===" && docker-compose logs frontend --tail=30
```

Share the output and mention if the issue remains.

