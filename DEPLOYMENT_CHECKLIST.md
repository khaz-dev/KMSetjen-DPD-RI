# Docker Deployment Checklist - KMSetjen DPD RI

## Pre-Deployment (Local Development)

### Code Quality
- [ ] Latest code committed and pushed to main branch
- [ ] No uncommitted changes: `git status` is clean
- [ ] Run tests locally: `npm test` (frontend) and `pytest` (backend) pass
- [ ] No console.log or debug statements in production code
- [ ] Environment variables documented in `.env.example`

### Docker Images
- [ ] Dockerfiles for both frontend and backend present and reviewed
- [ ] `docker-compose.yml` is up-to-date
- [ ] `.dockerignore` files exclude unnecessary files (node_modules, venv, etc.)
- [ ] Docker build succeeds locally: `docker-compose build`

### Environment Configuration
- [ ] `.env` file exists with all required variables
- [ ] `.env.production` template exists for reference
- [ ] SECRET_KEY is at least 50 characters (generate with: `python3 -c "import secrets; print(secrets.token_urlsafe(50))"`)
- [ ] Database credentials are correctly set
- [ ] CORS origins match production domain (https://khaz.app)

---

## Server Preparation (Staging Server)

### Access & Security
- [ ] SSH access verified: `ssh -i path/to/key root@165.245.191.216` works
- [ ] SSH key is properly secured (600 permissions)
- [ ] Server firewall allows ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- [ ] Server OS is Ubuntu 20.04+ or comparable

### System Software (PREREQUISITES - MUST HAVE BEFORE DEPLOYING)
- [ ] Docker installed: `docker --version` (v20.0+)
  - If missing: `sudo apt install docker.io docker-compose -y`
- [ ] Docker Compose installed: `docker-compose --version` (v1.29+)
  - Installed with Docker above
- [ ] Docker service running: `sudo systemctl status docker`
  - If not running: `sudo systemctl start docker && sudo systemctl enable docker`
- [ ] **PostgreSQL installed**: `sudo systemctl status postgresql` (CRITICAL!)
  - If missing: `sudo apt install postgresql postgresql-contrib -y`
- [ ] PostgreSQL service running: `sudo systemctl status postgresql`
  - If not running: `sudo systemctl start postgresql && sudo systemctl enable postgresql`
- [ ] Git installed: `git --version`
- [ ] Node.js installed (for frontend builds): `node --version` (v18+)
- [ ] Python/pip available: `python3 --version`
- [ ] nginx installed: `sudo systemctl status nginx`

### Database Preparation (MUST DO - PostgreSQL must be ready)
- [ ] PostgreSQL is installed and running: `sudo systemctl status postgresql`
  - Shows: `active (running)`
- [ ] Database exists: `sudo -u postgres psql -l | grep kmsdb`
  - If missing:
    ```bash
    sudo -u postgres psql -c "CREATE DATABASE kmsdb;"
    sudo -u postgres psql -c "ALTER DATABASE kmsdb OWNER TO postgres;"
    ```
- [ ] Database accessible: `psql -U postgres -d kmsdb -c 'SELECT 1;'`
  - Should return: `(1)` on one line
- [ ] Database user is 'postgres' with password: `Okkdpdri@2026`
- [ ] Port 5432 is accessible and listening

### Directory Structure
- [ ] Application cloned to: `/var/www/html/kmsetjendpdri/`
- [ ] Directory is owned by correct user
- [ ] Directory has correct permissions (755)
- [ ] Subdirectories exist:
  - [ ] `backend/`
  - [ ] `frontend/`
  - [ ] `docker-compose.yml`
  - [ ] `nginx-kmsetjendpdri-config.conf`

---

## Deployment (On Server)

### Environment Setup
- [ ] SSH into server
- [ ] Navigate to project: `cd /var/www/html/kmsetjendpdri/`
- [ ] Pull latest code: `git pull origin main`
- [ ] `.env` file created with staging configuration:
  - [ ] `ENVIRONMENT=production`
  - [ ] `DEBUG=False`
  - [ ] `SECRET_KEY` is set to a random 50+ char string
  - [ ] `DB_HOST=host.docker.internal` (for Docker to access local PostgreSQL)
  - [ ] `ALLOWED_HOSTS` includes khaz.app, www.khaz.app, and server IP
  - [ ] `VITE_API_BASE_URL=https://khaz.app/kmsetjendpdri/api`
  - [ ] `CORS_ALLOWED_ORIGINS=https://khaz.app,https://www.khaz.app`

### Frontend Build
- [ ] Navigate to frontend: `cd frontend`
- [ ] Install dependencies: `npm ci --legacy-peer-deps`
- [ ] Build for production: `VITE_APP_SUBPATH=/kmsetjendpdri npm run build`
- [ ] Verify output: `ls dist/index.html` returns the file
- [ ] Set permissions:
  ```bash
  sudo chown -R www-data:www-data dist/
  sudo chmod -R 755 dist/
  ```

### Docker Build & Start
- [ ] Build images: `docker-compose build`
- [ ] Start services: `docker-compose up -d`
- [ ] Verify containers running: `docker-compose ps`
  - [ ] `kms_django` - Should be Up
  - [ ] `kms_frontend` - Should be Up
  - [ ] `kms_redis` - Should be Up
- [ ] Check no containers restarting or exiting

### Database Migrations
- [ ] Run migrations: `docker-compose exec kms_django python manage.py migrate`
- [ ] Create superuser if first deployment: `docker-compose exec kms_django python manage.py createsuperuser`
- [ ] Collect static files: `docker-compose exec kms_django python manage.py collectstatic --noinput`

### Nginx & SSL
- [ ] Nginx configuration copied: `sudo cp nginx-kmsetjendpdri-config.conf /etc/nginx/sites-available/kmsetjendpdri`
- [ ] Site enabled: `sudo ln -s /etc/nginx/sites-available/kmsetjendpdri /etc/nginx/sites-enabled/kmsetjendpdri`
- [ ] Default site disabled: `sudo rm -f /etc/nginx/sites-enabled/default`
- [ ] Nginx config valid: `sudo nginx -t` returns "test successful"
- [ ] SSL certificate exists for khaz.app:
  ```bash
  ls /etc/letsencrypt/live/khaz.app/fullchain.pem
  ls /etc/letsencrypt/live/khaz.app/privkey.pem
  ```
  - [ ] If not, request with: `sudo certbot certonly --standalone -d khaz.app -d www.khaz.app`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`

---

## Post-Deployment Verification

### Container Health
- [ ] All containers healthy: `docker-compose ps`
- [ ] No containers in "restarting" state
- [ ] Django health check: `curl -I http://localhost:8002/health/` returns 200
- [ ] Redis responds: `docker-compose exec kms_redis redis-cli ping` returns PONG
- [ ] Check logs for errors:
  ```bash
  docker-compose logs kms_django | tail -20
  docker-compose logs kms_redis | tail -20
  ```

### API Endpoints (Local Server Tests)
- [ ] Django admin API: `curl -I http://localhost:8002/admin/` returns 200
- [ ] API health: `curl -I http://localhost:8002/health/` returns 200
- [ ] Test API endpoint: `curl -I http://localhost:8002/api/articles/` should not error

### Public HTTPS Access
- [ ] Application loads: `https://khaz.app/kmsetjendpdri/` (check in browser)
- [ ] Not 403 Forbidden (fixed!)
- [ ] Not 502 Bad Gateway
- [ ] Page shows React app (check "View Page Source" - has <div id="root">)
- [ ] Browser console shows no critical errors
- [ ] API requests work from frontend
- [ ] Admin panel accessible: `https://khaz.app/kmsetjendpdri/admin/`
- [ ] Can login with superuser credentials
- [ ] SSL certificate valid (check browser security icon)

### Nginx Logs
- [ ] Check access log: `tail -20 /var/log/nginx/kmsetjendpdri_access.log`
- [ ] Check error log: `tail -20 /var/log/nginx/kmsetjendpdri_error.log`
- [ ] No major errors in error log

### Database Verification
- [ ] Can connect: `psql -U postgres -d kmsdb -c "SELECT 1;"`
- [ ] Tables exist: `psql -U postgres -d kmsdb -c "\dt"`
- [ ] Users table has data: `psql -U postgres -d kmsdb -c "SELECT COUNT(*) FROM auth_user;"`

### Functionality Tests
- [ ] [ ] Frontend loads and displays content
- [ ] [ ] Can view articles/knowledge base
- [ ] [ ] Can perform search (if implemented)
- [ ] [ ] Can login with superuser
- [ ] [ ] Can access admin panel
- [ ] [ ] File upload works (if applicable)
- [ ] [ ] Images load correctly
- [ ] [ ] Responsive design works on mobile (check with browser dev tools)
- [ ] [ ] Navigation works
- [ ] [ ] Translations/i18n work if applicable

---

## Fix: 403 Forbidden Errors

If you're still seeing 403 Forbidden at `https://khaz.app/kmsetjendpdri/`:

### Immediate Fixes
1. [ ] Rebuild frontend:
   ```bash
   cd /var/www/html/kmsetjendpdri/frontend
   rm -rf dist/
   npm ci --legacy-peer-deps
   VITE_APP_SUBPATH=/kmsetjendpdri npm run build
   ```

2. [ ] Fix permissions:
   ```bash
   sudo chown -R www-data:www-data /var/www/html/kmsetjendpdri/dist/
   sudo chmod -R 755 /var/www/html/kmsetjendpdri/dist/
   sudo chmod 644 /var/www/html/kmsetjendpdri/dist/index.html
   ```

3. [ ] Reload nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. [ ] Check nginx error log:
   ```bash
   tail -50 /var/log/nginx/kmsetjendpdri_error.log
   ```

5. [ ] Verify file exists:
   ```bash
   ls -la /var/www/html/kmsetjendpdri/dist/index.html
   ```

---

## Monitoring & Maintenance

### Daily Checks
- [ ] All containers running: `docker-compose ps`
- [ ] No disk space issues: `df -h`
- [ ] Application accessible: `curl -I https://khaz.app/kmsetjendpdri/`
- [ ] Nginx error log clean: `sudo tail /var/log/nginx/kmsetjendpdri_error.log`

### Weekly Checks
- [ ] Database backup created: `pg_dump kmsdb > backup_$(date +%Y%m%d).sql`
- [ ] Review combined logs for patterns: `docker-compose logs | grep -i error`
- [ ] Check disk usage: `du -sh /var/www/html/kmsetjendpdri/`

### Monthly Checks
- [ ] SSL certificate expiry: `sudo certbot renew --dry-run` (should be automatic)
- [ ] Database maintenance: `vacuum full;` in psql
- [ ] Update system packages: `sudo apt update && sudo apt upgrade -y`
- [ ] Review application logs for security issues

### Restart Procedures
```bash
# Restart all services
docker-compose restart

# Restart just Django
docker-compose restart kms_django

# Full restart (stop and start)
docker-compose down
docker-compose up -d

# Restart nginx
sudo systemctl restart nginx
```

---

## Backup & Recovery

### Backup Database
```bash
# Create backup
sudo -u postgres pg_dump kmsdb > /backup/kmsdb_$(date +%Y%m%d_%H%M%S).sql

# Backup size
du -sh /backup/
```

### Backup Application Files
```bash
tar -czf /backup/kmsetjendpdri_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/html/kmsetjendpdri/
```

### Recovery: Restore Database
```bash
# Connect as postgres user
sudo -u postgres psql kmsdb < /backup/kmsdb_YYYYMMDD_HHMMSS.sql
```

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| 403 Forbidden | Rebuild frontend, fix permissions, reload nginx |
| 502 Bad Gateway | Check if Django container is running, check logs |
| Database connection refused | Verify PostgreSQL is running, check credentials |
| Redis connection errors | Verify Redis container is healthy, check password |
| Page not loading | Check nginx logs, verify DNS resolution |
| Images not loading | Check media path permissions, verify nginx config |
| API calls failing | Check CORS settings in .env, verify backend is running |
| High memory usage | Check container logs for leaks, restart containers |

---

## Success Criteria

Application is successfully deployed when:

1. ✓ `https://khaz.app/kmsetjendpdri/` loads without errors
2. ✓ React frontend displays properly
3. ✓ API calls work (can see in Network tab in browser dev tools)
4. ✓ Admin panel is accessible at `/admin/`
5. ✓ SSL certificate is valid (green lock in browser)
6. ✓ All containers show as "Up" and healthy
7. ✓ No 403, 502, or 500 errors in logs
8. ✓ Can perform main functionality (login, view content, etc.)

---

**Document Version**: 1.0
**Last Updated**: April 6, 2026
**Status**: Deployment Ready
