# Staging Server Setup - Environment Configuration

## Problem
`.env.staging` doesn't exist on staging server → environment variables not sourced → blank white page

## Solution (3 Steps)

### Option 1: Copy from Local (Recommended)

**On your LOCAL machine (Windows):**
```powershell
# Navigate to project
cd "d:\Project\KMSetjen DPD RI"

# Copy .env.staging to staging server
scp .env.staging root@khaz-server:/var/www/html/kmsetjendpdri/.env
```

### Option 2: Create Directly on Server

**On staging server:**
```bash
# Navigate to project
cd /var/www/html/kmsetjendpdri

# Create .env file with staging values
cat > .env << 'EOF'
ENVIRONMENT=staging
DEBUG=False
SECRET_KEY=kms-staging-2026-khaz-app-kms-change-to-50-char-random-string
ALLOWED_HOSTS=khaz.app,www.khaz.app,143.198.200.57,localhost,127.0.0.1
DJANGO_SETTINGS_MODULE=config.settings
DOMAIN_NAME=khaz.app
APP_SUBPATH=/kms

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kmsdb
DB_USER=postgres
DB_PASSWORD=Okkdpdri@2026
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_PASSWORD=YxUVAk0raKzBKunD
REDIS_HOST=redis
REDIS_PORT=6382
REDIS_URL=redis://:YxUVAk0raKzBKunD@redis:6382/0
CACHE_BACKEND=django_redis.cache.RedisCache
CACHE_LOCATION=redis://:YxUVAk0raKzBKunD@redis:6382/0
CELERY_BROKER_URL=redis://:YxUVAk0raKzBKunD@redis:6382/1
CELERY_RESULT_BACKEND=redis://:YxUVAk0raKzBKunD@redis:6382/2

# Frontend - CRITICAL!
VITE_API_BASE_URL=https://khaz.app/kms/api
VITE_API_URL=https://khaz.app/kms
VITE_API_TIMEOUT=30000
VITE_APP_SUBPATH=/kms
FRONTEND_URL=https://khaz.app/kms

# CORS & Security
CORS_ALLOWED_ORIGINS=https://khaz.app,https://www.khaz.app,http://localhost:5175
CSRF_TRUSTED_ORIGINS=https://khaz.app,https://www.khaz.app,http://localhost:5175
SECURE_SSL_REDIRECT=True
DISABLE_SSL_REDIRECT=False

# Google OAuth
GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/
VITE_GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/

# reCAPTCHA
RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
ENABLE_CAPTCHA=True

# Email
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EOF

# Verify it was created
cat .env | grep VITE_APP_SUBPATH
# Must output: VITE_APP_SUBPATH=/kms
```

---

## Then Run Deployment (On Staging Server)

```bash
# Navigate to project
cd /var/www/html/kmsetjendpdri

# Source environment variables
set -a
source .env
set +a

# Verify VITE_APP_SUBPATH is set
echo "VITE_APP_SUBPATH: $VITE_APP_SUBPATH"
# Must show: /kms

# Clean and rebuild
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d

# Wait and verify
sleep 20
docker-compose ps
# All should be "Up (healthy)"

# Test
docker inspect kmsetjendpdri_frontend:latest | grep VITE_APP_SUBPATH
# Must show: "VITE_APP_SUBPATH": "/kms"
```

---

## ✅ Verify in Browser

```
1. Open: https://khaz.app/kms/
2. Expected: Full page with content
3. NOT expected: Blank white page
```

---

## Key Points

- `.env.staging` is NOT committed to git (security practice)
- On staging server, it should be named `.env` in the project directory
- Must be sourced BEFORE any docker-compose commands
- VITE_APP_SUBPATH=/kms is CRITICAL for blank page fix
