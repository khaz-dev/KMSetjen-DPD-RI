# Docker Deployment Guide for KMSetjen DPD RI

## Overview
This guide covers deploying the KMSetjen DPD RI application on a staging server using Docker Compose. The application is a full-stack web app with:
- Frontend: React/Vite
- Backend: Django/Gunicorn
- Database: PostgreSQL
- Cache: Redis
- Reverse Proxy: Nginx

**Current Issue**: 403 Forbidden accessing `https://khaz.app/kmsetjendpdri/`

---

## Part 0: Install Prerequisites (MUST DO FIRST!)

### 0.1 Install Docker & Docker Compose

```bash
ssh -i c:\Users\khair\khaz root@165.245.191.216

# Update packages
sudo apt update

# Install Docker
sudo apt install docker.io docker-compose -y

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify
docker --version
docker-compose --version
```

### 0.2 Install PostgreSQL (CRITICAL!)

PostgreSQL must be installed on the **host machine** (not in Docker), as it persists your application data.

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify it's running
sudo systemctl status postgresql
# Should show: active (running)

# Create database
sudo -u postgres psql -c "CREATE DATABASE kmsdb;"
sudo -u postgres psql -c "ALTER DATABASE kmsdb OWNER TO postgres;"

# Verify database
sudo -u postgres psql -l | grep kmsdb
# Should show: kmsdb | postgres

# Test connection
psql -U postgres -d kmsdb -c "SELECT 1;"
# Should return: (1)
```

**If you encounter errors**, restart PostgreSQL:
```bash
sudo systemctl restart postgresql
sleep 5
sudo systemctl status postgresql
```

**Common issues:**
- "command not found" → Run `sudo apt update && sudo apt install postgresql postgresql-contrib -y`
- "Connection refused" → Run `sudo systemctl restart postgresql`
- "database does not exist" → Run the CREATE DATABASE command above

---

## Part 1: Fix the 403 Forbidden Error (Immediate)

### 1.1 SSH into Server
```bash
ssh -i c:\Users\khair\khaz root@165.245.191.216
```

### 1.2 Check Current State
```bash
# Check if dist directory exists
ls -la /var/www/html/kmsetjendpdri/

# Check nginx error log
tail -50 /var/log/nginx/kmsetjendpdri_error.log

# Check nginx access log
tail -50 /var/log/nginx/kmsetjendpdri_access.log

# Test nginx configuration
sudo nginx -t
```

### 1.3 Build Frontend for Production

Since the frontend needs to be built, execute on the server:

```bash
cd /var/www/html/kmsetjendpdri/frontend

# Clear old build
rm -rf dist/

# Install dependencies (if not already done)
npm ci --legacy-peer-deps

# Build for production
VITE_APP_SUBPATH=/kmsetjendpdri npm run build

# Verify dist was created with index.html
ls -la dist/
# Should show: index.html, assets/ directory
```

### 1.4 Fix Permissions

```bash
# Set correct ownership
sudo chown -R www-data:www-data /var/www/html/kmsetjendpdri/

# Set correct permissions
sudo chmod -R 755 /var/www/html/kmsetjendpdri/dist/
sudo chmod -R 644 /var/www/html/kmsetjendpdri/dist/*

# Make sure index.html is readable
sudo chmod 644 /var/www/html/kmsetjendpdri/dist/index.html
```

### 1.5 Reload Nginx

```bash
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

### 1.6 Test Access

```bash
# Test locally on server
curl -I https://khaz.app/kmsetjendpdri/

# Should return 200 OK (not 403)
```

---

## Part 2: Docker Deployment Setup

### 2.1 Prerequisites Check (Should Already Be Done)

Verify these are completed from **Part 0**:

```bash
# Check Docker is installed
docker --version          # Should show: Docker version 28+
docker-compose --version  # Should show: docker-compose 1.29+

# Check PostgreSQL is running
sudo systemctl status postgresql
# Should show: active (running)

# Check database exists
psql -U postgres -d kmsdb -c "SELECT 1;"
# Should return: (1)
```

If ANY of above fail, **go back to Part 0** and complete PostgreSQL/Docker installation.

### 2.2 Verify PostgreSQL is Running and Database Exists

### 2.3 Setup Environment File

Edit/create `.env` in `/var/www/html/kmsetjendpdri/`:

```bash
cd /var/www/html/kmsetjendpdri/
sudo nano .env
```

**For Staging** - Use this configuration:

```env
# ============================================================================
# STAGING ENVIRONMENT - KMSetjen DPD RI
# ============================================================================
ENVIRONMENT=production
DEBUG=False

# ============================================================================
# DJANGO SETTINGS
# ============================================================================
SECRET_KEY=generate-50-char-random-string-here-min-50-characters
ALLOWED_HOSTS=khaz.app,www.khaz.app,165.245.191.216,localhost,127.0.0.1
DJANGO_SETTINGS_MODULE=config.settings
DOMAIN_NAME=khaz.app
APP_SUBPATH=/kmsetjendpdri

# ============================================================================
# DATABASE (PostgreSQL on host machine)
# ============================================================================
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kmsdb
DB_USER=postgres
DB_PASSWORD=Okkdpdri@2026
DB_HOST=host.docker.internal
DB_PORT=5432

# ============================================================================
# REDIS (Docker container or local)
# ============================================================================
REDIS_PASSWORD=YxUVAk0raKzBKunD
REDIS_HOST=redis
REDIS_PORT=6382
REDIS_URL=redis://:YxUVAk0raKzBKunD@redis:6382/0
CACHE_BACKEND=django_redis.cache.RedisCache
CACHE_LOCATION=redis://:YxUVAk0raKzBKunD@redis:6382/1
CELERY_BROKER_URL=redis://:YxUVAk0raKzBKunD@redis:6382/1
CELERY_RESULT_BACKEND=redis://:YxUVAk0raKzBKunD@redis:6382/2

# ============================================================================
# FRONTEND - PRODUCTION URLS
# ============================================================================
VITE_API_BASE_URL=https://khaz.app/kmsetjendpdri/api
VITE_API_URL=https://khaz.app/kmsetjendpdri/api
VITE_API_TIMEOUT=30000
VITE_APP_SUBPATH=/kmsetjendpdri
FRONTEND_URL=https://khaz.app/kmsetjendpdri

# ============================================================================
# CORS & SECURITY
# ============================================================================
CORS_ALLOWED_ORIGINS=https://khaz.app,https://www.khaz.app
CSRF_TRUSTED_ORIGINS=https://khaz.app,https://www.khaz.app
SECURE_SSL_REDIRECT=True
DISABLE_SSL_REDIRECT=False

# ============================================================================
# GOOGLE OAUTH (if used)
# ============================================================================
GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://khaz.app/kmsetjendpdri/google/callback
VITE_GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com

# ============================================================================
# RECAPTCHA (Test keys - update in production)
# ============================================================================
RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
ENABLE_CAPTCHA=True
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI

# ============================================================================
# EMAIL (Console for staging)
# ============================================================================
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

# ============================================================================
# FILE UPLOAD
# ============================================================================
MAX_UPLOAD_SIZE=52428800
ALLOWED_FILE_EXTENSIONS=pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif

# ============================================================================
# LOGGING
# ============================================================================
LOG_LEVEL=INFO
LOG_FILE_PATH=/app/logs/django.log
```

Save with: `Ctrl+X`, then `Y`, then `Enter`

### 2.4 Generate Secure SECRET_KEY

---

## Part 3: Start Docker Compose

### 3.1 Pull Latest Changes

```bash
cd /var/www/html/kmsetjendpdri/
git pull origin main
```

### 3.2 Build & Start Containers

```bash
# Build images
docker-compose -f docker-compose.yml build

# Start services (detached mode)
docker-compose -f docker-compose.yml up -d

# Check status
docker-compose ps

# Expected output:
# NAME             STATUS
# kms_redis        Up (healthy)
# kms_django       Up (healthy)
# kms_frontend     Up (healthy)
```

### 3.3 Verify Containers

```bash
# Check logs
docker-compose logs -f kms_django    # Django logs
docker-compose logs -f kms_frontend  # Frontend logs
docker-compose logs -f kms_redis     # Redis logs

# Exit log view: Ctrl+C

# Test Django API
curl -I http://localhost:8002/health/

# Test Frontend (from server)
curl -I http://localhost:5175/
```

### 3.4 Run Django Migrations

```bash
# Run migrations
docker-compose exec kms_django python manage.py migrate

# Create superuser (if needed)
docker-compose exec kms_django python manage.py createsuperuser

# Collect static files
docker-compose exec kms_django python manage.py collectstatic --noinput
```

---

## Part 4: Nginx Configuration & SSL

### 4.1 Install Nginx (if not already)

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4.2 Copy Nginx Configuration

```bash
# Copy from project to nginx sites-available
sudo cp /var/www/html/kmsetjendpdri/nginx-kmsetjendpdri-config.conf /etc/nginx/sites-available/kmsetjendpdri

# Enable the site
sudo ln -s /etc/nginx/sites-available/kmsetjendpdri /etc/nginx/sites-enabled/kmsetjendpdri

# Disable default
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# If errors about SSL certificates, that's normal (we'll fix below)
```

### 4.3 Setup SSL Certificate with Let's Encrypt

```bash
# Request certificate
sudo certbot certonly --standalone \
  -d khaz.app \
  -d www.khaz.app \
  --email your-email@example.com \
  --non-interactive \
  --agree-tos

# Verify
sudo ls -la /etc/letsencrypt/live/khaz.app/

# Should show: fullchain.pem, privkey.pem
```

### 4.4 Test Nginx Configuration & Reload

```bash
# Test
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

---

## Part 5: Verification & Testing

### 5.1 Test Application Access

```bash
# Test HTTP redirect to HTTPS
curl -I http://khaz.app/kmsetjendpdri/

# Test HTTPS (should return 200)
curl -I https://khaz.app/kmsetjendpdri/

# Test API endpoint
curl -I https://khaz.app/kmsetjendpdri/api/

# Test admin panel
curl -I https://khaz.app/kmsetjendpdri/admin/
```

### 5.2 Browser Testing

1. Open: `https://khaz.app/kmsetjendpdri/`
2. Should load React frontend (not 403)
3. Check browser console for errors
4. Login and test functionality

### 5.3 Check Logs

```bash
# nginx access log
tail -50 /var/log/nginx/kmsetjendpdri_access.log

# nginx error log
tail -50 /var/log/nginx/kmsetjendpdri_error.log

# Django logs inside container
docker-compose logs kms_django

# Redis logs
docker-compose logs kms_redis

# Frontend logs
docker-compose logs kms_frontend
```

---

## Part 6: Maintenance & Monitoring

### 6.1 View Running Containers

```bash
docker-compose ps

# Get detailed info
docker ps -a

# Check resource usage
docker stats
```

### 6.2 Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart kms_django

# Stop all services
docker-compose stop

# Start all services
docker-compose start
```

### 6.3 View Application Logs

```bash
# Follow logs in real-time
docker-compose logs -f

# Follow specific service
docker-compose logs -f kms_django

# Show last 100 lines
docker-compose logs --tail=100
```

### 6.4 Database Management

```bash
# Connect to PostgreSQL locally
psql -U postgres -d kmsdb

# Common commands (inside psql):
# \dt                    - List tables
# \du                    - List users
# SELECT * FROM auth_user;  - List users
# \q                     - Quit
```

---

## Part 7: Troubleshooting

### Issue: 403 Forbidden Still Persists

**Solution:**
```bash
# 1. Check if dist directory exists
ls -la /var/www/html/kmsetjendpdri/dist/

# 2. If missing, rebuild frontend
cd /var/www/html/kmsetjendpdri/frontend
rm -rf dist/
npm ci --legacy-peer-deps
VITE_APP_SUBPATH=/kmsetjendpdri npm run build

# 3. Set permissions
sudo chown -R www-data:www-data /var/www/html/kmsetjendpdri/
sudo chmod -R 755 /var/www/html/kmsetjendpdri/dist/

# 4. Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

### Issue: Container fails to start

```bash
# Check logs
docker-compose logs kms_django

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Issue: API returns 502 Bad Gateway

```bash
# Check if Django is running
docker-compose ps kms_django

# Check Django health
curl -I http://localhost:8002/health/

# Restart Django
docker-compose restart kms_django
```

### Issue: Database connection refused

```bash
# Check PostgreSQL is running locally
sudo systemctl status postgresql

# Test connection
psql -U postgres -d kmsdb -c "SELECT 1;"

# From inside container
docker-compose exec kms_django python manage.py shell
# In shell: from django.db import connection; connection.ensure_connection()
```

### Issue: Redis connection errors

```bash
# Check Redis container
docker-compose logs kms_redis

# Test Redis connection
docker-compose exec kms_redis redis-cli -a YxUVAk0raKzBKunD ping
# Should return: PONG
```

---

## Part 8: Environment Variables Reference

| Variable | Location | Purpose |
|----------|----------|---------|
| `ENVIRONMENT` | .env | Set to 'production' for staging/prod |
| `DEBUG` | .env | Must be False in production |
| `SECRET_KEY` | .env | Django secret key (50+ chars) |
| `DB_HOST` | .env | host.docker.internal for Docker |
| `VITE_API_BASE_URL` | .env | Frontend API endpoint |
| `CORS_ALLOWED_ORIGINS` | .env | Frontend domain URLs |
| `REDIS_HOST` | .env | Service name 'redis' in Docker |

---

## Part 9: Deployment Checklist

- [ ] SSH access verified (`ssh -i khaz root@165.245.191.216`)
- [ ] Clone location: `/var/www/html/kmsetjendpdri`
- [ ] Docker & Docker Compose installed
- [ ] PostgreSQL running locally with kmsdb created
- [ ] .env file created with proper values
- [ ] SECRET_KEY is 50+ characters
- [ ] Frontend built: `dist/` directory exists
- [ ] Docker images built successfully
- [ ] Containers running and healthy
- [ ] Nginx configuration in place
- [ ] SSL certificate configured
- [ ] Application accessible at https://khaz.app/kmsetjendpdri/
- [ ] API endpoints responding
- [ ] Admin panel accessible
- [ ] Logs checked for errors

---

## Next Steps After Deployment

1. **Backup database**: `pg_dump kmsdb > kmsdb_backup.sql`
2. **Monitor uptime**: Set up monitoring (cron job or service)
3. **SSL auto-renewal**: Certbot auto-renewal is enabled by default
4. **Update credentials**: Change default passwords in production
5. **Enable monitoring**: Check status of containers regularly

---

**Last Updated**: April 6, 2026
**Status**: Staging Deployment Ready
