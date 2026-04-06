# Docker Deployment - Complete Action Plan

**Current Status**: Staging server has 403 Forbidden error
**Fix Time**: 5-30 minutes depending on approach
**Deployment Method**: Docker Compose + Nginx reverse proxy

---

## What's Ready

✓ Frontend (React/Vite) - Code complete
✓ Backend (Django) - Code complete
✓ Docker images configured - Dockerfiles present
✓ Nginx configuration ready
✓ SSL certificate infrastructure ready
✓ Git repository cloned on server
⚠️ PostgreSQL - **NEEDS INSTALLATION** (see below)

---

## What's Needed

### Prerequisites Check (DO THIS FIRST!)

Before starting deployment, verify these are installed on the server:

```bash
# SSH into server
ssh -i c:\Users\khair\khaz root@165.245.191.216

# Check Docker
docker --version
# If not found: sudo apt install docker.io docker-compose -y

# Check PostgreSQL
sudo systemctl status postgresql
# If not running or not installed: SEE SECTION BELOW
```

### ⚠️ CRITICAL: Install PostgreSQL If Missing

**Run these commands if PostgreSQL is NOT installed:**

```bash
# Install PostgreSQL and utilities
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start the service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify it's running
sudo systemctl status postgresql
# Should show: active (running)

# Create the database and user
sudo -u postgres psql -c "CREATE DATABASE kmsdb;"
sudo -u postgres psql -c "ALTER DATABASE kmsdb OWNER TO postgres;"

# Verify database was created
sudo -u postgres psql -l | grep kmsdb
# Should show: kmsdb | postgres

# Test connection
psql -U postgres -d kmsdb -c "SELECT 1;"
# Should return: (1)
```

**If any step fails**, run: `sudo systemctl restart postgresql` and try again.

---

## Immediate Deployment Options

### Option A: Quick Fix - Build Frontend Statically (5 minutes)

**Use this if you just want to fix the 403 error quickly - no Docker needed**

```bash
ssh -i c:\Users\khair\khaz root@165.245.191.216

cd /var/www/html/kmsetjendpdri/frontend

# Build frontend
VITE_APP_SUBPATH=/kmsetjendpdri npm run build

# Fix permissions
sudo chown -R www-data:www-data dist/
sudo chmod -R 755 dist/

# Reload nginx
sudo systemctl reload nginx

# Test
curl -I https://khaz.app/kmsetjendpdri/
# Should return: HTTP/2 200 OK (not 403)
```

**Done!** Application should be accessible at https://khaz.app/kmsetjendpdri/

---

### Option B: Full Docker Deployment (45 minutes - Recommended)

**Use this for production-grade setup with Docker containers**

See "Phase 1-5" steps below.

---

## Recommended Path: Docker Compose Deployment

### Phase 0: Prerequisites (MUST DO FIRST!)

Do NOT skip this section. Install Docker and PostgreSQL before proceeding.

**1. SSH into Server**
```bash
ssh -i c:\Users\khair\khaz root@165.245.191.216
```

**2. Install Docker & Docker Compose**
```bash
# Update package lists
sudo apt update

# Install Docker
sudo apt install docker.io docker-compose -y

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
docker --version      # Should show: Docker version 28+
docker-compose --version  # Should show: docker-compose version 1.29+
```

**3. Install & Setup PostgreSQL**

**IMPORTANT**: PostgreSQL must be installed on the host (not in Docker)

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify it's running
sudo systemctl status postgresql
# Should show: active (running)

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE kmsdb;"
sudo -u postgres psql -c "ALTER DATABASE kmsdb OWNER TO postgres;"

# Verify database exists
sudo -u postgres psql -l | grep kmsdb
# Should show: kmsdb | postgres

# Test connection
psql -U postgres -d kmsdb -c "SELECT 1;"
# Should return: (1)
```

If any errors occur, restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Phase 1: Server Preparation (5 minutes)

1. **Go to Project Directory**
   ```bash
   cd /var/www/html/kmsetjendpdri/

   # Verify structure
   ls -la
   # Should show: backend/, frontend/, docker-compose.yml, .env
   ```

2. **Update Git Repository**
   ```bash
   git pull origin main
   ```

3. **Verify Prerequisites are Ready**
   ```bash
   # Check Docker
   docker --version
   docker-compose --version

   # Check PostgreSQL
   sudo systemctl status postgresql
   psql -U postgres -d kmsdb -c "SELECT 1;"
   # Should return: (1)
   ```

### Phase 2: Configure Environment (5 minutes)

1. **Create/Update .env for Staging**
   ```bash
   nano .env
   ```

   Key changes from development .env:
   ```env
   ENVIRONMENT=production
   DEBUG=False

   SECRET_KEY=<generate 50-char random string>
   # Generate with: python3 -c "import secrets; print(secrets.token_urlsafe(50))"

   # For Docker to access local PostgreSQL
   DB_HOST=host.docker.internal

   # Frontend API URLs
   VITE_API_BASE_URL=https://khaz.app/kmsetjendpdri/api
   CORS_ALLOWED_ORIGINS=https://khaz.app,https://www.khaz.app

   # Docker Redis (not localhost)
   REDIS_HOST=redis
   REDIS_PORT=6382
   ```

### Phase 3: Build & Deploy (15 minutes)

1. **Build Docker Images**
   ```bash
   # From project root
   cd /var/www/html/kmsetjendpdri/

   docker-compose build
   # This will build Django and Frontend images
   ```

2. **Start Containers**
   ```bash
   docker-compose up -d

   # Verify they started
   docker-compose ps
   # All should show "Up" and "healthy"
   ```

3. **Run Migrations**
   ```bash
   docker-compose exec kms_django python manage.py migrate
   docker-compose exec kms_django python manage.py createsuperuser
   docker-compose exec kms_django python manage.py collectstatic --noinput
   ```

4. **Verify Containers**
   ```bash
   # Test Django
   curl -I http://localhost:8002/health/
   # Should return 200

   # Test Frontend
   curl -I http://localhost:5175/
   # Should return 200
   ```

### Phase 4: Nginx & SSL (10 minutes)

1. **Configure Nginx**
   ```bash
   sudo cp /var/www/html/kmsetjendpdri/nginx-kmsetjendpdri-config.conf \
           /etc/nginx/sites-available/kmsetjendpdri

   sudo ln -s /etc/nginx/sites-available/kmsetjendpdri \
             /etc/nginx/sites-enabled/kmsetjendpdri

   sudo rm -f /etc/nginx/sites-enabled/default

   sudo nginx -t
   # Should say "successful"
   ```

2. **Setup SSL Certificate**
   ```bash
   sudo certbot certonly --standalone \
     -d khaz.app \
     -d www.khaz.app \
     --email admin@khaz.app \
     --non-interactive \
     --agree-tos

   # Verify certificate
   sudo ls -la /etc/letsencrypt/live/khaz.app/
   ```

3. **Start Nginx**
   ```bash
   sudo systemctl start nginx
   sudo systemctl enable nginx

   # Reload with new config
   sudo systemctl reload nginx
   ```

### Phase 5: Verify Deployment (10 minutes)

1. **Local Tests**
   ```bash
   # Test API is accessible
   curl -I http://localhost:8002/api/

   # Test frontend container
   curl -I http://localhost:5175/
   ```

2. **External Tests**
   ```bash
   # Test HTTP redirect
   curl -I http://khaz.app/kmsetjendpdri/

   # Test HTTPS
   curl -I https://khaz.app/kmsetjendpdri/
   # Should return 200 OK (not 403!)

   # Test API
   curl -I https://khaz.app/kmsetjendpdri/api/
   ```

3. **Browser Test**
   - Open: https://khaz.app/kmsetjendpdri/
   - Should see React frontend
   - Green lock icon (SSL valid)
   - No console errors

---

## Which Path to Choose?

### Choose Option A (Static Frontend) if:
- You want **quickest fix** for 403 error
- You only have frontend + API backend
- You don't need container orchestration
- You want to avoid Docker setup
- PostgreSQL doesn't need to be installed (nginx serves static files directly)

**Time**: 5 minutes
**Prerequisites**: None (just needs npm and nginx working)
**Files**: Just build to dist/ folder

### Choose Option B (Docker Compose) if:
- You want **production-grade** containerized deployment
- You plan to scale services later
- You need easy service management
- You have multiple services (Redis, etc.)
- You want **consistent environment** across development and production

**Time**: 45 minutes first time
**Prerequisites**: Docker, Docker Compose, and PostgreSQL installed
**Files**: All containers managed in docker-compose.yml

---

## Automation: Deployment Script

Instead of doing everything manually, use the provided script:

```bash
cd /var/www/html/kmsetjendpdri/

# Make script executable
chmod +x deploy-docker.sh

# Run deployment
./deploy-docker.sh
```

This automates:
- Frontend build
- Docker image building
- Container startup
- Database migrations
- Health checks

---

## What Each Component Does

| Component | Role | Port | Docker | Status |
|-----------|------|------|--------|--------|
| React Frontend | User interface | 5175 | Yes | Build needed |
| Django Backend | REST API | 8002 | Yes | Ready |
| Postgres | Database | 5432 | No | Running locally |
| Redis | Cache/Sessions | 6382 | Yes | Ready |
| Nginx | Reverse proxy | 80/443 | No | Ready |

**Note**: PostgreSQL not containerized - runs on host machine to persist data

---

## Troubleshooting

### 403 Forbidden Still Appears
```bash
# Check frontend exists
ls /var/www/html/kmsetjendpdri/dist/index.html

# If missing: rebuild frontend (Option A steps)
cd frontend && VITE_APP_SUBPATH=/kmsetjendpdri npm run build

# Check permissions
sudo chown -R www-data:www-data /var/www/html/kmsetjendpdri/
sudo chmod -R 755 /var/www/html/kmsetjendpdri/dist/

# Reload nginx
sudo systemctl reload nginx
```

### Containers Won't Start
```bash
docker-compose logs kms_django    # Check Django logs
docker-compose logs kms_redis     # Check Redis logs

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### API Returns 502 Bad Gateway
```bash
# Check Django is running
docker-compose ps kms_django

# Restart Django
docker-compose restart kms_django

# Check Django health
curl -I http://localhost:8002/health/
```

### Database Connection Error
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# From inside Docker
docker-compose exec kms_django python manage.py shell
# IN SHELL:
from django.db import connection
connection.ensure_connection()  # Should succeed
```

---

## Files Created for Deployment

1. **DOCKER_DEPLOYMENT_GUIDE_COMPLETE.md** - Detailed 9-part guide
2. **DEPLOYMENT_CHECKLIST.md** - Complete pre/during/post checklist
3. **FIX_403_FORBIDDEN_NOW.md** - Quick fix for current issue
4. **deploy-docker.sh** - Automated deployment script
5. **nginx-kmsetjendpdri-config.conf** - Nginx configuration (already in project)
6. **.env** - Environment configuration (edit with your values)

---

## Next Steps

### ⚠️ MUST DO FIRST: Install Prerequisites

Run this on the server BEFORE choosing Option A or B:

```bash
ssh -i c:\Users\khair\khaz root@165.245.191.216

# Install Docker (if not present)
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker

# Install PostgreSQL (if not present)
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql -c "CREATE DATABASE kmsdb;"
sudo -u postgres psql -c "ALTER DATABASE kmsdb OWNER TO postgres;"

# Verify
psql -U postgres -d kmsdb -c "SELECT 1;"
# Should return: (1)
```

### Then Choose Your Path:

**Option A (Quick - 5 min):**
```bash
cd /var/www/html/kmsetjendpdri/frontend
VITE_APP_SUBPATH=/kmsetjendpdri npm run build
sudo chown -R www-data:www-data dist/
sudo chmod -R 755 dist/
sudo systemctl reload nginx
curl -I https://khaz.app/kmsetjendpdri/
```

**Option B (Full - 45 min):**
- Follow Phase 0-5 steps above
- Or run: `./deploy-docker.sh`

### Run Verification

- Follow checklist in DEPLOYMENT_CHECKLIST.md
- Test in browser

---

## Support Resources

- **Quick Fix Guide**: FIX_403_FORBIDDEN_NOW.md
- **Full Deployment**: DOCKER_DEPLOYMENT_GUIDE_COMPLETE.md
- **Checklist**: DEPLOYMENT_CHECKLIST.md
- **Automated Script**: deploy-docker.sh
- **Helpful Commands**:
  ```bash
  docker-compose ps              # View container status
  docker-compose logs -f         # Follow all logs
  docker-compose restart         # Restart all services
  sudo systemctl status postgresql    # Check PostgreSQL
  sudo systemctl status nginx    # Check nginx
  sudo tail /var/log/nginx/kmsetjendpdri_error.log  # Nginx errors
  ```

---

## Success Indicators

You're done when:

✓ https://khaz.app/kmsetjendpdri/ loads (no 403)
✓ React frontend displays
✓ API endpoints respond
✓ SSL certificate valid (green lock)
✓ Admin panel accessible
✓ Containers all healthy
✓ No errors in logs

---

**Deployment Ready**: YES ✓
**Recommended Method**: Docker Compose (Option B)
**Quick Fix Available**: YES ✓ (Option A)

Choose your path above and get started!
