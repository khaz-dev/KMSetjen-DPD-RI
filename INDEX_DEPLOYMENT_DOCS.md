# Deployment Documentation Index

## 🚀 Start Here

**→ [START_HERE_DEPLOYMENT_ACTION_PLAN.md](START_HERE_DEPLOYMENT_ACTION_PLAN.md)** - Complete action plan with two options (Quick Fix or Docker)

---

## 📋 Quick Reference

### For Immediate 403 Error Fix (5 minutes)
→ [FIX_403_FORBIDDEN_NOW.md](FIX_403_FORBIDDEN_NOW.md)

**Quick command:**
```bash
ssh -i c:\Users\khair\khaz root@165.245.191.216
cd /var/www/html/kmsetjendpdri/frontend
VITE_APP_SUBPATH=/kmsetjendpdri npm run build
sudo chown -R www-data:www-data dist/
sudo chmod -R 755 dist/
sudo systemctl reload nginx
```

---

### For Full Docker Deployment (45 minutes)
→ [DOCKER_DEPLOYMENT_GUIDE_COMPLETE.md](DOCKER_DEPLOYMENT_GUIDE_COMPLETE.md)

**Sections:**
1. Fix 403 Forbidden (Part 1)
2. Docker setup (Part 2)
3. Environment configuration (Part 3)
4. Docker Compose startup (Part 3)
5. Nginx & SSL (Part 4)
6. Verification (Part 5)
7. Monitoring (Part 6)
8. Troubleshooting (Part 7)

---

### For Deployment Checklist
→ [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

**Includes:**
- Pre-deployment checks
- Server preparation
- Deployment steps
- Post-deployment verification
- Success criteria
- Troubleshooting quick reference

---

## 🔧 Deployment Tools

### Automated Deployment Script
→ [deploy-docker.sh](deploy-docker.sh)

**Usage:**
```bash
cd /var/www/html/kmsetjendpdri/
chmod +x deploy-docker.sh
./deploy-docker.sh
```

**Does:**
- Checks prerequisites
- Configures environment
- Builds frontend
- Builds Docker images
- Starts containers
- Runs migrations
- Verifies health

---

## 📁 Configuration Files

### Nginx Configuration
**Location in project:** `nginx-kmsetjendpdri-config.conf`
**Deploy to:** `/etc/nginx/sites-available/kmsetjendpdri`

Handles:
- HTTPS/SSL setup
- Reverse proxy to Django (port 8002)
- Frontend SPA routing
- Static & media files
- Admin panel

### Docker Compose File
**Location:** `docker-compose.yml`

Services:
- **kms_django** - Django/Gunicorn API server (8002)
- **kms_frontend** - React frontend via serve (5175)
- **kms_redis** - Cache & session store (6382)
- **host.docker.internal** - PostgreSQL on host (5432)

### Environment Configuration
**Files:**
- `.env` - Development config (already on server)
- `.env.example` - Template for new configs
- `.env.production` - Production template
- Copy and edit for staging

---

## 🗂️ Project Structure

```
/var/www/html/kmsetjendpdri/
├── frontend/              # React/Vite app
│   ├── src/              # Source code
│   ├── dist/             # Built production files
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── backend/              # Django REST API
│   ├── apps/             # Django apps
│   ├── config/           # Django settings
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml    # Docker orchestration
├── nginx-kmsetjendpdri-config.conf
├── .env                  # Environment variables
└── deploy-docker.sh      # Deployment script
```

---

## 🔌 Port Mapping

| Service | Port | Purpose | Access |
|---------|------|---------|--------|
| Frontend (dev) | 5175 | React app (vite dev server) | http://localhost:5175 |
| Frontend (prod) | 80/443 | Nginx serves static files | https://khaz.app/kmsetjendpdri/ |
| Django API | 8002 | REST API backend | http://localhost:8002/api |
| Redis | 6382 | Cache/sessions | Internal only |
| PostgreSQL | 5432 | Database | Local only |

---

## 🔐 Security & SSL

### SSL Certificate
- **Provider**: Let's Encrypt
- **Domain**: khaz.app, www.khaz.app
- **Setup**: `sudo certbot certonly --standalone -d khaz.app -d www.khaz.app`
- **Auto-renewal**: Enabled by default
- **Location**: `/etc/letsencrypt/live/khaz.app/`

### Security Headers (Nginx)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection

---

## 📊 Deployment Options

### Option A: Static Frontend (Quick)
- **Time**: 5 minutes
- **Process**: Build frontend to `/var/www/html/kmsetjendpdri/dist/`
- **Serving**: Nginx serves static files directly
- **Best for**: Simple deployment, quick fix

```bash
cd frontend
VITE_APP_SUBPATH=/kmsetjendpdri npm run build
```

### Option B: Docker Compose (Recommended)
- **Time**: 45 minutes first time
- **Process**: Containerize all services
- **Serving**: Docker containers via docker-compose
- **Best for**: Scalability, consistency, easy management

```bash
docker-compose build
docker-compose up -d
```

---

## 🐛 Common Issues & Quick Fixes

| Problem | Cause | Fix |
|---------|-------|-----|
| 403 Forbidden | Missing dist/ or permission denied | Build frontend and fix permissions |
| 502 Bad Gateway | Django not running | `docker-compose restart kms_django` |
| Container exits | Error in code or config | `docker-compose logs kms_django` |
| Database error | PostgreSQL not running | `sudo systemctl start postgresql` |
| Redis error | Wrong password or not running | Check .env REDIS_PASSWORD |
| Nginx error | Config syntax wrong | `sudo nginx -t` to validate |

---

## 📈 Monitoring & Logs

### View Container Status
```bash
docker-compose ps
```

### Follow Live Logs
```bash
docker-compose logs -f              # All services
docker-compose logs -f kms_django   # Django only
```

### Nginx Logs
```bash
tail -50 /var/log/nginx/kmsetjendpdri_access.log
tail -50 /var/log/nginx/kmsetjendpdri_error.log
```

### Django Status
```bash
curl -I http://localhost:8002/health/
```

---

## ✅ Deployment Checklist Summary

Pre-deployment:
- [ ] Code committed to main branch
- [ ] Docker images configured
- [ ] Environment variables documented

Deployment:
- [ ] SSH access verified
- [ ] PostgreSQL running
- [ ] Docker installed and running
- [ ] .env file created
- [ ] Frontend built
- [ ] Docker images built
- [ ] Containers running and healthy
- [ ] Nginx configured
- [ ] SSL certificate created
- [ ] Application accessible and working

Post-deployment:
- [ ] HTTPS working
- [ ] No 403/502/500 errors
- [ ] Frontend loads
- [ ] API responds
- [ ] Admin panel accessible
- [ ] Logs checked for errors

---

## 📞 Help & Support

### For 403 Forbidden Error
→ See: [FIX_403_FORBIDDEN_NOW.md](FIX_403_FORBIDDEN_NOW.md)

### For Docker Issues
→ See: [DOCKER_DEPLOYMENT_GUIDE_COMPLETE.md](DOCKER_DEPLOYMENT_GUIDE_COMPLETE.md) - Part 7

### For Setup Questions
→ See: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

### For Complete Details
→ See: [START_HERE_DEPLOYMENT_ACTION_PLAN.md](START_HERE_DEPLOYMENT_ACTION_PLAN.md)

---

## 📝 Server Information

**Domain**: https://khaz.app/kmsetjendpdri/
**Server IP**: 165.245.191.216
**OS**: Ubuntu (20.04+ LTS)
**SSH Key**: `c:\Users\khair\khaz`
**SSH Command**: `ssh -i c:\Users\khair\khaz root@165.245.191.216`
**Project Path**: `/var/www/html/kmsetjendpdri/`

---

## 🎯 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Code | ✅ Ready | Cloned on server |
| Frontend | ⚠️ Needs Build | dist/ folder needed |
| Backend | ✅ Ready | Docker image ready |
| Database | ⚠️ NEEDS INSTALL | PostgreSQL not installed yet |
| Docker | ⚠️ NEEDS INSTALL | Just installed on server |
| Nginx | ✅ Ready | Config exists |
| SSL | ⚠️ Needed | Certbot required |
| Overall | 🚀 Ready | Can deploy after installing PostgreSQL & Docker |

---

## 🚀 Recommended Path

1. **Read**: [START_HERE_DEPLOYMENT_ACTION_PLAN.md](START_HERE_DEPLOYMENT_ACTION_PLAN.md)
2. **Quick Check**: [FIX_403_FORBIDDEN_NOW.md](FIX_403_FORBIDDEN_NOW.md) (5 min fix)
3. **Or Full Deploy**: [DOCKER_DEPLOYMENT_GUIDE_COMPLETE.md](DOCKER_DEPLOYMENT_GUIDE_COMPLETE.md) (45 min)
4. **Run Checks**: [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
5. **Automate**: Use `deploy-docker.sh` for repeat deployments

---

**Last Updated**: April 6, 2026
**Project**: KMSetjen DPD RI
**Status**: 🟢 Ready for Deployment
