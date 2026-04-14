# Staging Blank White Page - Quick Fix (5 Minutes)

## 🚀 Fix on Staging Server (Copy-Paste)

```bash
# Navigate to project
cd /var/www/html/kmsetjendpdri

# Pull latest code with fixes
git pull origin main

# ⭐ CRITICAL: Source environment variables
set -a
source .env.staging
set +a

# Verify variables loaded
echo "VITE_APP_SUBPATH: $VITE_APP_SUBPATH"
# Must show: /kms

# Remove old containers
docker-compose down

# Clean Docker
docker system prune -f

# Rebuild (with correct environment)
docker-compose build --no-cache

# Start
docker-compose up -d

# Wait
sleep 20

# Verify
docker-compose ps
# All should be "Up (healthy)"

# Test
docker inspect kmsetjendpdri_frontend:latest | grep VITE_APP_SUBPATH
# Should show: "VITE_APP_SUBPATH": "/kms"
```

---

## ✅ Browser Test

```
1. Open: https://khaz.app/kms/
2. Expected: Full page with content
3. NOT expected: Blank white page

If blank page still appears:
→ Press F12 (DevTools)
→ Network tab
→ Hard refresh: Ctrl+Shift+R
→ Check if CSS/JS load with 200 status
```

---

## 🔧 What Was Fixed

1. **docker-compose.yml line 91**: Changed default from `/` to `/kms`
   - Local: `npm run dev` (unaffected - doesn't use docker-compose)
   - Staging: `docker-compose build` (now defaults to correct `/kms`)

2. **Deployment process**: Must source .env.staging before docker-compose build

---

## 📌 Key Points

- **VITE_APP_SUBPATH** must be set during Docker build
- If not set, Vite builds app for root `/` instead of `/kms`
- Frontend serves wrong asset paths → Blank page
- Solution: Source .env before any deployment commands

