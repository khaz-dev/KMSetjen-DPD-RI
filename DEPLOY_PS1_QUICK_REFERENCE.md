# ⚡ Deploy.ps1 - Quick Reference & Cheat Sheet

**Quick Version:** Use this to deploy quickly  
**Full Guide:** See DEPLOY_PS1_COMPLETE_USAGE_GUIDE.md for details  
**Testing:** See DEPLOY_PS1_TESTING_VERIFICATION_GUIDE.md for verification  

---

## 🚀 30-Second Quick Start

```powershell
cd "d:\Project\KMSetjen DPD RI"
.\deploy.ps1 -Environment staging
# Wait 2-5 minutes
# Access: http://localhost:5175
```

---

## 📂 All Commands

### Development (Local)
```powershell
.\deploy.ps1 -Environment development
# → Best for: Coding, testing locally, quick iterations
# → Time: 2-5 minutes (first run), 1-2 minutes (subsequent)
```

### Staging (Pre-Production Testing)
```powershell
.\deploy.ps1 -Environment staging
# → Best for: QA testing, UAT, integration testing
# → Time: 2-5 minutes
# → Note: Keep DEBUG=False for production-like testing
```

### Production (Live Environment)
```powershell
.\deploy.ps1 -Environment production
# → Best for: Deploying to live production
# → Time: 5-10 minutes
# → Note: Requires confirmation, creates backup
# → Safety: DEBUG=False REQUIRED, backs up database
```

### Build Only (No Startup)
```powershell
.\deploy.ps1 -Environment staging -BuildOnly
# → Best for: Pre-building images for later use
# → Time: 1-2 minutes
# → Note: Containers NOT started, use docker-compose up -d to start
```

### Skip Code Update (Offline)
```powershell
.\deploy.ps1 -Environment staging -NoPull
# → Best for: Offline deployment, when git unavailable
# → Time: 1-2 minutes
# → Note: Uses code already on disk
```

### Combined Options
```powershell
# Build only without git pull
.\deploy.ps1 -Environment staging -BuildOnly -NoPull

# Deploy without health checks (risky)
.\deploy.ps1 -Environment development -NoHealthCheck

# Deploy without backup (not recommended for prod)
.\deploy.ps1 -Environment staging -SkipBackup
```

---

## ✅ Pre-Deployment Checklist

### Required Before ANY Deployment
- [ ] Docker running: `docker --version`
- [ ] docker-compose installed: `docker-compose --version`
- [ ] `.env` file exists: `ls .env`
- [ ] PostgreSQL running (if using local): `pg_isready`
- [ ] No uncommitted changes: `git status`

### Before STAGING
- [ ] Code changes committed
- [ ] Local tests passed
- [ ] Reasonable SECRET_KEY in .env

### Before PRODUCTION
- [ ] DEBUG=False in `.env` ✅ CRITICAL
- [ ] ENVIRONMENT=production in `.env`
- [ ] Backup procedure ready
- [ ] Team notified
- [ ] Rollback plan prepared

---

## 🐳 Common Docker Commands

```powershell
# View running services
docker-compose ps

# View logs
docker-compose logs -f                    # All services
docker-compose logs -f django             # Just Django
docker-compose logs -f frontend           # Just Frontend
docker-compose logs -f redis              # Just Redis

# Access container shell
docker-compose exec django bash           # Django shell
docker-compose exec django python manage.py shell

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild single service
docker-compose build django

# Access PostgreSQL
docker-compose exec django python manage.py dbshell
```

---

## 🔍 Verification Commands

### Immediate Verification (Right After Deployment)
```powershell
# 1. Containers running?
docker-compose ps
# All should be UP / HEALTHY

# 2. Services responding?
curl http://localhost:8002/api/          # Django API
curl http://localhost:5175/              # Frontend

# 3. Database connected?
docker-compose exec django python manage.py check
# Should show: [  OK  ]

# 4. Any errors?
docker-compose logs | Select-String ERROR
# Should find none or only expected ones
```

### Functional Verification (First 30 minutes)
```powershell
# 1. Frontend loads?
# Browser: http://localhost:5175

# 2. Can log in?
# Try default credentials

# 3. Can create article?
# (If editor role)

# 4. Language switching?
# (If bilingual enabled)

# 5. Search works?
# Try searching for something
```

---

## 🆘 Troubleshooting Quick Fixes

### Problem: "Port 8002 already in use"
```powershell
# Kill existing process
docker-compose down

# Or find what's using it
Get-NetTcpConnection -LocalPort 8002 | Select-Object OwningProcess
taskkill /PID [PID] /F
```

### Problem: "Docker not found"
```powershell
# Install Docker Desktop
# https://www.docker.com/products/docker-desktop
# Restart PowerShell after installing
```

### Problem: Services won't start
```powershell
# Check logs
docker-compose logs

# Clean up and retry
docker system prune -a -f
.\deploy.ps1 -Environment staging
```

### Problem: Database migration fails
```powershell
# Check migration status
docker-compose exec django python manage.py showmigrations

# Run migrations explicitly
docker-compose exec django python manage.py migrate

# Check database connection
docker-compose exec django python manage.py dbshell
```

### Problem: Static files not serving
```powershell
# Collect static files
docker-compose exec django python manage.py collectstatic --noinput

# Verify collected
docker-compose exec django ls -la staticfiles/ | head -20
```

### Problem: "Confirm production deployment" doesn't accept input
```powershell
# Make sure PowerShell window is active
# Type exactly: yes
# Press Enter

# Or use echo pipe:
echo "yes" | .\deploy.ps1 -Environment production
```

---

## 📊 Deployment Workflow Shortcuts

### Quick Development Loop
```powershell
# Start fresh
.\deploy.ps1 -Environment development

# Make changes to code
# (With hot reload, changes appear automatically)

# Need to rebuild after requirements.txt change?
.\deploy.ps1 -Environment development -NoPull

# Stop at end of day
docker-compose down
```

### Feature Branch Workflow
```powershell
# Create branch
git checkout -b feature/my-feature

# Make changes & test
.\deploy.ps1 -Environment development

# Push & create PR
git push origin feature/my-feature

# After approval, merge & deploy staging
git checkout main
git merge feature/my-feature
.\deploy.ps1 -Environment staging

# QA tests, then deploy production
.\deploy.ps1 -Environment production
```

### CI/CD Automated Deployment
```powershell
# (In GitHub Actions or similar)

# Build images
.\deploy.ps1 -Environment staging -BuildOnly

# Run tests
docker-compose exec django pytest

# If tests pass, deploy production
if ($?) { 
    .\deploy.ps1 -Environment production -NoPull
}
```

### Emergency Hotfix
```powershell
# Fix bug
git checkout -b hotfix/critical
# ... make fix ...
git add .
git commit -m "Hotfix: critical bug"

# Merge to main
git checkout main
git merge hotfix/critical

# Deploy immediately
.\deploy.ps1 -Environment production
```

---

## 🔐 Security Checklist (Production Only)

```powershell
# 1. Verify production settings
Get-Content .env | Select-String "DEBUG"
# MUST be: DEBUG=False

Get-Content .env | Select-String "ENVIRONMENT"
# MUST be: ENVIRONMENT=production

# 2. Verify Secret Key is strong
Get-Content .env | Select-String "SECRET_KEY"
# Should be: 50+ characters, random

# 3. Verify no credentials in code
git log --all -p | Select-String "password\|secret\|token" -i
# Should find none in recent commits

# 4. Verify SSL configured
Get-Content docker-compose.yml | Select-String "ssl\|https"

# 5. Deploy with backup
.\deploy.ps1 -Environment production
# Should create: ./backups/backup_TIMESTAMP.sql
```

---

## 📈 Performance Tips

### Faster Development
```powershell
# Deploy with cached images (faster)
.\deploy.ps1 -Environment development -NoPull

# Or skip git pull if not needed
.\deploy.ps1 -Environment development -NoPull
```

### Faster Initial Setup
```powershell
# Pre-build images
.\deploy.ps1 -Environment development -BuildOnly

# Then deploy without rebuild
docker-compose up -d
```

### Monitor Performance
```powershell
# Watch resource usage
docker stats

# Check slow operations
docker-compose logs django | Select-String "SLOW\|Duration\|timing" -i

# Monitor in real-time
docker-compose logs -f --tail=50
```

---

## 📚 Directory Structure

```
project-root/
├── deploy.ps1                  # ← Main deployment script
├── .env                        # ← Configuration (keep secret!)
├── .env.example                # ← Configuration template
├── docker-compose.yml          # ← Docker services definition
├── backend/
│   ├── Dockerfile              # ← Django Docker image
│   ├── requirements.txt         # ← Python dependencies
│   └── manage.py
├── frontend/
│   ├── Dockerfile              # ← React/Vite Docker image
│   ├── package.json            # ← Node dependencies
│   └── ... (React files)
├── deployment_logs/            # ← Created by deploy.ps1
│   └── deploy_TIMESTAMP.log    # ← One file per deployment
└── backups/                    # ← Created by deploy.ps1
    └── backup_TIMESTAMP.sql    # ← Production backup
```

---

## 🔄 Parameter Reference Table

| Parameter | Type | Default | Use When |
|-----------|------|---------|----------|
| `-Environment` | value | staging | Choosing dev/stage/prod |
| `-NoPull` | flag | off | No git access, offline deploy |
| `-BuildOnly` | flag | off | Pre-build images, CI/CD |
| `-NoHealthCheck` | flag | off | Services start slow |
| `-SkipBackup` | flag | off | Backup done separately |
| `-SkipTests` | flag | off | (Not implemented) |

---

## ⏱️ Timing Guide

| Task | Time |
|------|------|
| First ever deploy | 3-5 min |
| Subsequent deploy | 1-2 min |
| Build only | 1-2 min |
| Production deploywith backup | 5-10 min |
| Health checks | 30-60 sec |
| Database migrations | 10-30 sec |

---

## 🎯 Quick Decision Tree

```
Need to deploy?
│
├─ Local development?
│  └─ .\deploy.ps1 -Environment development
│
├─ QA/UAT testing?
│  └─ .\deploy.ps1 -Environment staging
│
├─ Production (live)?
│  └─ .\deploy.ps1 -Environment production
│     (Then type "yes" when prompted)
│
├─ Pre-build images?
│  └─ .\deploy.ps1 -Environment staging -BuildOnly
│
├─ No internet/git?
│  └─ .\deploy.ps1 -Environment staging -NoPull
│
└─ Services starting slow?
   └─ .\deploy.ps1 -Environment staging -NoHealthCheck
```

---

## 💾 Backup & Restore (Production Only)

```powershell
# Where backup is created
./backups/backup_20260211_123456.sql

# Restore backup
psql kmsdb < ./backups/backup_20260211_123456.sql

# Test backup validity (without restoring)
pg_restore --list ./backups/backup_*.sql | head -20
```

---

## 📞 Help Commands

```powershell
# View deployment script help (comments at top)
Get-Content deploy.ps1 | Select-String "USAGE" -A 10

# View deployment logs
Get-Content ./deployment_logs/deploy_*.log | tail -50

# View Docker logs
docker-compose logs | tail -100

# View service status
docker-compose ps

# View resource usage
docker stats
```

---

## ✨ Pro Tips

1. **Keep .env.example updated** - Others use it as template
2. **Commit deploy.ps1 to git** - Don't run local-only version
3. **Always test in staging first** - Before production
4. **Monitor for 24 hours after prod deploy** - Catch issues early
5. **Keep backup files safe** - Store separately from production server
6. **Log deployment activities** - Keep audit trail
7. **Use NoPull for offline safety** - Prevents accidental code changes
8. **Pre-build images in CI** - Faster deployment in production
9. **Set DEBUG=False for staging** - Test production config
10. **Have rollback plan ready** - Use backup to recover if needed

---

## 🆘 Emergency Contacts

For issues not covered here:
1. Check full guide: `DEPLOY_PS1_COMPLETE_USAGE_GUIDE.md`
2. See troubleshooting: `DEPLOY_PS1_TECHNICAL_AUDIT.md`
3. Review testing: `DEPLOY_PS1_TESTING_VERIFICATION_GUIDE.md`
4. Check Docker logs: `docker-compose logs`

---

**Last Updated:** February 11, 2026  
**Status:** ✅ All modes verified working  
**Version:** 2.0
