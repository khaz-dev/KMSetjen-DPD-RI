# 🚀 KMSetjen DPD RI - Enhanced Deployment Guide v3.0

**Last Updated:** April 19, 2026  
**Version:** 3.0  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Deployment Modes Explained](#deployment-modes-explained)
3. [Environment Setup](#environment-setup)
4. [Staging Deployment (Windows → Linux)](#staging-deployment)
5. [Production Deployment (Server-Side)](#production-deployment)
6. [Troubleshooting](#troubleshooting)
7. [Architecture Overview](#architecture-overview)

---

## 🎯 Quick Start

### For Staging Deployment (from Windows)

```powershell
# Clean build (fresh database, no data)
.\deploy-staging-enhanced.ps1 -Mode clean

# Update with data migration (sync local DB to staging)
.\deploy-staging-enhanced.ps1 -Mode update-with-data

# Update code only (keep existing data)
.\deploy-staging-enhanced.ps1 -Mode update-only

# Verbose output with dry-run
.\deploy-staging-enhanced.ps1 -Mode update-with-data -Verbose -DryRun
```

### For Production Deployment (on server)

```bash
# Clean build (fresh database, no data)
sudo bash deploy-master-enhanced.sh production --mode=clean

# Update with data (from staging dump)
sudo bash deploy-master-enhanced.sh production --mode=update-with-data

# Update code only (keep existing data)
sudo bash deploy-master-enhanced.sh production --mode=update-only

# Verbose with health checks
sudo bash deploy-master-enhanced.sh production --mode=update-only --verbose
```

---

## 📚 Deployment Modes Explained

### Mode 1: CLEAN

**What it does:**
- ✓ Fresh Docker build (no cache)
- ✓ Resets database completely
- ✓ Removes all old containers
- ✓ Starts with empty media directory
- ✓ Runs all migrations from scratch

**When to use:**
- Testing fresh environments
- Development/sandbox deployments
- Cleaning up corrupted data
- Starting a new deployment environment

**Risk Level:** ⚠️ Medium (data loss)

**Example:**
```powershell
.\deploy-staging-enhanced.ps1 -Mode clean
```

---

### Mode 2: UPDATE-WITH-DATA

**What it does (Staging):**
1. ✓ Exports local PostgreSQL database
2. ✓ Uploads database dump to staging server
3. ✓ Syncs media files from local to remote
4. ✓ Imports database on remote
5. ✓ Builds new Docker images
6. ✓ Restarts containers with new code
7. ✓ Runs any pending migrations

**What it does (Production):**
1. ✓ Backs up current production database
2. ✓ Pulls latest code from Git
3. ✓ Builds new Docker images
4. ✓ Stops containers
5. ✓ Imports backup data
6. ✓ Starts new containers
7. ✓ Runs migrations

**When to use:**
- Syncing development data to staging
- Promoting staging to production
- Restoring from backups
- Migration after environment setup

**Risk Level:** 🟡 Low (backup created first)

**Example:**
```powershell
# From Windows to staging
.\deploy-staging-enhanced.ps1 -Mode update-with-data -Verbose

# On production server
sudo bash deploy-master-enhanced.sh production --mode=update-with-data --verbose
```

---

### Mode 3: UPDATE-ONLY

**What it does:**
1. ✓ Pulls latest code from Git
2. ✓ Builds new Docker images (uses cache for speed)
3. ✓ Restarts containers with new images
4. ✓ Runs pending migrations
5. ✗ Does NOT touch database data
6. ✗ Does NOT modify media files

**When to use:**
- Regular code updates (most common)
- Production deployments (safest)
- Hotfixes and patches
- Maintaining data integrity

**Risk Level:** 🟢 Very Low (data not touched)

**Example:**
```powershell
# Staging
.\deploy-staging-enhanced.ps1 -Mode update-only

# Production
sudo bash deploy-master-enhanced.sh production --mode=update-only
```

---

## 🔧 Environment Setup

### Prerequisites for Staging (Windows)

**Required Files:**
```
d:\Project\KMSetjen DPD RI\
├── .env.staging                      # Staging configuration
├── deploy-staging-enhanced.ps1       # Staging deployment script
├── backend/                          # Backend source code
├── frontend/                         # Frontend source code
└── media/                            # Media files to sync
```

**Required Tools:**
```powershell
# Check Python and PostgreSQL
psql --version     # Should be PostgreSQL 13+
python --version   # Should be Python 3.11+
```

**Setup:**
```powershell
# 1. Ensure SSH key exists
if (-not (Test-Path "c:\Users\khair\khaz")) {
    Write-Host "SSH key not found! Configure SSH first."
}

# 2. Verify .env.staging exists
if (-not (Test-Path ".\.env.staging")) {
    Write-Host ".env.staging not found!"
}

# 3. Run deployment
.\deploy-staging-enhanced.ps1 -Mode update-only
```

### Prerequisites for Production (Server)

**Required on Server:**
```bash
# Check requirements
docker --version           # Should be 20.10+
docker-compose --version   # Should be 1.29+
git --version             # Should be 2.0+
psql --version            # Should be PostgreSQL 13+
```

**Setup:**
```bash
# 1. SSH into server
ssh -i /path/to/ssh/key root@165.245.191.216

# 2. Navigate to project
cd /var/www/html/kms

# 3. Verify files
ls -la docker-compose.yml
ls -la deploy-master-enhanced.sh

# 4. Run deployment
sudo bash deploy-master-enhanced.sh production --mode=update-only
```

---

## 🌐 Staging Deployment (Windows → Linux)

### Scenario 1: Fresh Staging Setup

```powershell
# Step 1: Clean build on staging
.\deploy-staging-enhanced.ps1 -Mode clean -Verbose

# Step 2: Verify it's working
# Visit: https://kms.khaz.app/

# Step 3: Populate with local data
.\deploy-staging-enhanced.ps1 -Mode update-with-data -Verbose
```

### Scenario 2: Sync Development to Staging

```powershell
# Local development complete, ready to test on staging
.\deploy-staging-enhanced.ps1 -Mode update-with-data

# Optional: Verify before committing to production
# - Test at https://kms.khaz.app/
# - Run manual tests
# - Check backend logs: ssh -i "c:\Users\khair\khaz" root@165.245.191.216
#   Then: docker-compose logs -f
```

### Scenario 3: Regular Code Update

```powershell
# Updated code, no data changes needed
.\deploy-staging-enhanced.ps1 -Mode update-only

# This is fastest and safest for regular deployments
```

### Dry-Run Test

```powershell
# See what would happen without making changes
.\deploy-staging-enhanced.ps1 -Mode update-with-data -DryRun -Verbose

# Output shows:
# [DRY RUN] Would copy: .env.staging to remote
# [DRY RUN] Would export: pg_dump database
# [DRY RUN] Would sync media files
# etc.
```

### Monitoring Deployment

```powershell
# During deployment, logs are written to:
# d:\Project\KMSetjen DPD RI\deployment_logs\deploy_YYYYMMDD_HHMMSS.log

# Monitor in real-time:
tail -f deployment_logs/deploy_*.log

# After deployment, check server:
ssh -i c:\Users\khair\khaz root@165.245.191.216
cd /var/www/html/kms
docker-compose ps          # Check container status
docker-compose logs -f     # Monitor logs
```

---

## 🔐 Production Deployment (Server-Side)

### Access Production Server

```bash
# SSH into production server
ssh -i c:\Users\khair\.ssh\production_key root@PRODUCTION_IP

# Navigate to project
cd /var/www/html/production

# Verify structure
ls -la
# Should see: docker-compose.yml, deploy-master-enhanced.sh, .env, etc.
```

### Scenario 1: First-Time Production Setup

```bash
# On production server
cd /var/www/html/production

# Step 1: Clean build
sudo bash deploy-master-enhanced.sh production --mode=clean --verbose

# Step 2: Verify
docker-compose ps
curl https://kms-be.dpd.go.id/health/

# Step 3: Load initial data (if needed)
# - SSH into Django container
# - Load fixture data or run scripts
```

### Scenario 2: Promote from Staging

```bash
# On production server
cd /var/www/html/production

# Backup current database first
sudo bash deploy-master-enhanced.sh production --mode=update-with-data --skip-backup=false --verbose

# This will:
# 1. Back up current production database
# 2. Import data from backup location
# 3. Deploy new code
# 4. Run migrations
```

### Scenario 3: Regular Updates (Recommended)

```bash
# On production server (SAFEST METHOD)
cd /var/www/html/production

# Update code only, keep all data
sudo bash deploy-master-enhanced.sh production --mode=update-only --verbose

# This is the recommended approach for production:
# - Minimal downtime
# - Data always safe
# - Easy to rollback if needed
```

### Rollback Procedure

```bash
# If deployment fails or issues occur:

# 1. Check backup files
ls -la backups/
ls -la backups/db_backup_*.sql

# 2. Stop current containers
docker-compose down

# 3. Restore database from backup
export PGPASSWORD='Okkdpdri@2026'
psql -h localhost -U postgres kmsdb < backups/db_backup_YYYYMMDD_HHMMSS.sql
unset PGPASSWORD

# 4. Restore media from backup
cp -r backups/media_backup_YYYYMMDD/* media/

# 5. Restart with previous code
git reset --hard origin/previous-stable-tag
docker-compose up -d
```

---

## 📊 Environment Comparison

| Factor | Local | Staging | Production |
|--------|-------|---------|------------|
| **Access** | localhost | SSH tunnel | SSH tunnel |
| **Frontend** | http://localhost:5175/ | https://kms.khaz.app/ | https://kms.dpd.go.id/ |
| **Backend** | http://localhost:8002/ | https://kms-be.khaz.app/ | https://kms-be.dpd.go.id/ |
| **Database** | localhost:5432 | host Docker | host Docker |
| **Deployment** | Docker Compose | SSH script | On-server script |
| **Data Risk** | Low | Medium | High |
| **Update Frequency** | Frequent (dev) | Regular | Limited (weekly/monthly) |
| **SSL** | None | Let's Encrypt | Let's Encrypt |

---

## 🐛 Troubleshooting

### Issue 1: SSH Connection Fails

```powershell
# Check SSH key
if (-not (Test-Path "c:\Users\khair\khaz")) {
    Write-Host "SSH key missing!"
    exit 1
}

# Test connection manually
ssh -i "c:\Users\khair\khaz" -o ConnectTimeout=5 root@165.245.191.216 "echo OK"

# If still fails:
# 1. Check server IP is correct
# 2. Verify SSH key permissions
# 3. Ensure firewall allows port 22
# 4. Check server status with: ping 165.245.191.216
```

### Issue 2: Database Export Fails

```powershell
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Verify database exists
psql -U postgres -l | grep kmsdb

# Check database password
$env:PGPASSWORD = "Okkdpdri@2026"
psql -U postgres -h localhost -d kmsdb -c "SELECT 1;"
$env:PGPASSWORD = ""
```

### Issue 3: Docker Build Fails on Server

```bash
# SSH to server and check Docker
docker ps
docker images

# Check disk space
df -h

# Check Docker logs
docker-compose logs --tail=50 django
docker-compose logs --tail=50 frontend

# Try manual build to see errors
docker-compose build --no-cache --verbose 2>&1 | tail -100
```

### Issue 4: Deployment Hangs

```powershell
# Check deployment log in real-time
Get-Content -Path "deployment_logs\deploy_*.log" -Tail 50 -Wait

# On server, check if migrations are stuck
docker-compose exec django python manage.py showmigrations

# Kill stuck processes
docker-compose restart django

# Try deployment again
.\deploy-staging-enhanced.ps1 -Mode update-only -Verbose
```

---

## 🏗️ Architecture Overview

### Local Development Setup
```
Windows Machine
├── PostgreSQL (localhost:5432)
├── Docker Desktop
│   ├── Redis (localhost:6382)
│   ├── Django Backend (localhost:8002)
│   └── React Frontend (localhost:5175)
└── Media Files (D:\Project\...\media\)
```

### Staging Deployment (SSH Tunnel)
```
Windows Machine                    Linux Server (165.245.191.216)
├── deploy-staging-enhanced.ps1 ──→ SSH ──→ /var/www/html/kms
├── PostgreSQL dump        ──→ SCP ──→ PostgreSQL (localhost:5432)
├── Media files            ──→ SCP ──→ /var/www/html/kms/media
└── .env.staging           ──→ SCP ──→ /var/www/html/kms/.env

Server-Side Docker:
├── Redis:6382
├── Django:8002
└── Frontend:5175
    ↓ (via Nginx reverse proxy)
    └── https://kms.khaz.app/ (frontend)
    └── https://kms-be.khaz.app/ (backend)
```

### Production Deployment (On-Server)
```
Linux Server (Production IP)
├── /var/www/html/production/
│   ├── deploy-master-enhanced.sh
│   ├── docker-compose.yml
│   ├── .env
│   ├── backend/
│   ├── frontend/
│   └── media/
└── Docker Compose:
    ├── PostgreSQL (localhost:5432)
    ├── Redis
    ├── Django Backend (port 8002)
    └── React Frontend (port 5175)
        ↓ (via Nginx)
        └── https://kms.dpd.go.id/ (frontend)
        └── https://kms-be.dpd.go.id/ (backend)
```

---

## 📝 Deployment Checklist

### Before Staging Deployment
- [ ] `.env.staging` file exists and is configured
- [ ] SSH key configured at `c:\Users\khair\khaz`
- [ ] Local database has recent data
- [ ] All code committed to Git
- [ ] No uncommitted changes in working directory

### During Staging Deployment
- [ ] Watch deployment logs
- [ ] Verify backend starts: check logs
- [ ] Verify frontend loads: visit https://kms.khaz.app/
- [ ] Check database migration output
- [ ] Verify media files synced

### After Staging Deployment
- [ ] Test main features
- [ ] Check API responses
- [ ] Verify database data is correct
- [ ] Test authentication flow
- [ ] Review logs for errors

### Before Production Deployment
- [ ] Deployment tested on staging first
- [ ] Production backup created
- [ ] Team notified
- [ ] Maintenance window scheduled (if needed)
- [ ] Rollback plan documented

### After Production Deployment
- [ ] Monitor error logs closely
- [ ] Test key features
- [ ] Verify API responses
- [ ] Check database performance
- [ ] Monitor memory/CPU usage
- [ ] Have rollback ready

---

## 🚨 Emergency Procedures

### Immediate Rollback

```bash
# If production is down after deployment:

# 1. Stop containers
docker-compose down

# 2. Restore latest backup
export PGPASSWORD='Okkdpdri@2026'
psql -h localhost -U postgres kmsdb < backups/db_backup_latest.sql

# 3. Revert code
git revert HEAD
git push origin main

# 4. Restart
docker-compose up -d

# 5. Verify
curl https://kms.dpd.go.id/health/
```

### Database Connection Issues

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Check database
psql -U postgres -d kmsdb -c "SELECT COUNT(*) FROM auth_user;"

# Check Docker networking
docker network ls
docker network inspect kms_network
```

### Disk Space Issues

```bash
# Check available space
df -h

# Clear Docker cache
docker system prune -a

# Remove old backups
rm -f backups/db_backup_*.sql

# Check log size
du -h deployment_logs/
```

---

## 📞 Support & Documentation

- **Main Docs:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Cleanup Summary:** [CLEANUP_SUMMARY_2026-04-19.md](./CLEANUP_SUMMARY_2026-04-19.md)
- **Configuration:** [.env.staging](./.env.staging) | [.env.example](./.env.example)
- **Scripts:** [deploy-staging-enhanced.ps1](./deploy-staging-enhanced.ps1) | [deploy-master-enhanced.sh](./deploy-master-enhanced.sh)

---

**Last Updated:** April 19, 2026  
**Status:** ✅ Production Ready  
**Version:** 3.0
