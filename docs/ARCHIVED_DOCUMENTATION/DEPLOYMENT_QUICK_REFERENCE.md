# 🚀 Deployment Quick Reference Card

**KMSetjen DPD RI - Version 3.0**

---

## 📋 One-Liner Commands

### 🟢 Most Common (Safe - Use This!)
```powershell
# Staging - Update code only (no data changes)
.\deploy-staging-enhanced.ps1 -Mode update-only

# Production - Update code only (no data changes)  
sudo bash deploy-master-enhanced.sh production --mode=update-only
```

### 🟡 Data Migration
```powershell
# Staging - Sync local DB and media to remote
.\deploy-staging-enhanced.ps1 -Mode update-with-data

# Production - Import data from backup
sudo bash deploy-master-enhanced.sh production --mode=update-with-data
```

### 🔴 Fresh Build (Use with Caution!)
```powershell
# Staging - Clean fresh build
.\deploy-staging-enhanced.ps1 -Mode clean

# Production - Clean fresh build
sudo bash deploy-master-enhanced.sh production --mode=clean
```

---

## 📊 Mode Selection Guide

| Scenario | Mode | Risk | Command |
|----------|------|------|---------|
| Regular code update | `update-only` | 🟢 Low | `./deploy-*enhanced.ps1 -Mode update-only` |
| Sync data to staging | `update-with-data` | 🟡 Medium | `./deploy-*enhanced.ps1 -Mode update-with-data` |
| Fresh environment | `clean` | 🔴 High | `./deploy-*enhanced.ps1 -Mode clean` |
| Testing only | Add `-DryRun` | None | `./deploy-*enhanced.ps1 -Mode clean -DryRun` |

---

## 🎯 Typical Deployment Workflow

### Step 1: Develop Locally
```bash
# Local development
npm run dev              # Frontend
python manage.py runserver  # Backend
```

### Step 2: Deploy to Staging
```powershell
cd d:\Project\KMSetjen\ DPD\ RI\

# Sync your changes to staging
.\deploy-staging-enhanced.ps1 -Mode update-with-data

# Test on staging
# Visit: https://kms.khaz.app/
```

### Step 3: Verify on Staging
```powershell
# Check logs
ssh -i c:\Users\khair\khaz root@165.245.191.216
docker-compose logs -f

# Ctrl+C to exit logs
exit  # Exit SSH
```

### Step 4: Deploy to Production
```bash
# SSH to production server
ssh -i ~/.ssh/production_key root@PROD_IP

# Update code only (safest)
sudo bash deploy-master-enhanced.sh production --mode=update-only

# Verify
docker-compose ps
curl https://kms-be.dpd.go.id/health/
```

---

## 🛠️ Useful Commands During Deployment

### Monitor Logs
```powershell
# Watch deployment in progress
Get-Content deployment_logs/deploy_*.log -Tail 50 -Wait

# On server
ssh root@165.245.191.216
docker-compose logs -f
```

### Check Container Status
```bash
# List containers
docker-compose ps

# View specific service logs
docker-compose logs django
docker-compose logs frontend

# Execute command in container
docker-compose exec django python manage.py shell
```

### Database Debugging
```bash
# Access Django shell
docker-compose exec django python manage.py shell

# Check migrations
docker-compose exec django python manage.py showmigrations

# Run manual migration
docker-compose exec django python manage.py migrate
```

---

## ✅ Pre-Deployment Checklist

### Before Every Deployment
- [ ] Code committed and pushed to Git
- [ ] No uncommitted changes: `git status`
- [ ] Latest version pulled: `git pull`
- [ ] Database backed up automatically (scripts do this)
- [ ] .env file exists and is correct

### For Staging
- [ ] `.env.staging` configured
- [ ] SSH key at `c:\Users\khair\khaz`
- [ ] Local database has test data
- [ ] No active SSH sessions (else deployment hangs)

### For Production
- [ ] Deployment tested on staging first
- [ ] Team notified
- [ ] Low-traffic time (if possible)
- [ ] Rollback plan ready

---

## 🆘 Emergency Procedures

### Deployment Stuck?
```powershell
# Kill hanging SSH sessions
taskkill /F /IM ssh.exe

# Or find and terminate
Get-Process ssh | Stop-Process -Force
```

### Need to Rollback?
```bash
# SSH to server
ssh root@PROD_IP
cd /var/www/html/production

# Restore from backup
export PGPASSWORD='Okkdpdri@2026'
psql -h localhost -U postgres kmsdb < backups/db_backup_latest.sql

# Restart
docker-compose down
docker-compose up -d
```

### Check What's Wrong
```bash
# View error logs
docker-compose logs --tail=100 django

# Check database
docker-compose exec django python manage.py dbshell
SELECT COUNT(*) FROM auth_user;

# Check migrations
docker-compose exec django python manage.py showmigrations

# Check disk space
df -h
```

---

## 📍 File Locations

```
Project Root:
├── deploy-staging-enhanced.ps1      # Windows → Staging
├── deploy-master-enhanced.sh        # Server-side (all environments)
├── DEPLOYMENT_MODES_GUIDE.md        # This guide
├── DEPLOYMENT.md                    # Main documentation
├── .env.staging                     # Staging config
├── .env                             # Local config
├── docker-compose.yml               # Docker setup
├── backend/                         # Django backend
├── frontend/                        # React frontend
├── media/                           # User uploaded files
└── deployment_logs/                 # Deployment records
    └── deploy_YYYYMMDD_HHMMSS.log  # Log files
```

---

## 🔑 Key Environment Variables

| Variable | Local | Staging | Production |
|----------|-------|---------|------------|
| ENVIRONMENT | development | staging | production |
| DEBUG | True | False | False |
| DB_HOST | localhost | localhost | localhost |
| REDIS_HOST | localhost | redis | redis |
| VITE_API_BASE_URL | http://localhost:8002/api | https://kms-be.khaz.app/api | https://kms-be.dpd.go.id/api |

---

## 📞 Quick Help

### "How do I update code?"
→ `.\deploy-staging-enhanced.ps1 -Mode update-only`

### "How do I sync database to staging?"
→ `.\deploy-staging-enhanced.ps1 -Mode update-with-data`

### "How do I see what would happen?"
→ Add `-DryRun` flag to any command

### "Deployment is hanging!"
→ Kill SSH: `taskkill /F /IM ssh.exe`

### "Need to rollback?"
→ See "Emergency Procedures" section above

### "Where are deployment logs?"
→ `deployment_logs/deploy_*.log`

### "How do I check if deployment worked?"
→ Visit the URL and test, or check logs

---

## 🚀 Pro Tips

1. **Always use `-Mode update-only` for production** (safest)
2. **Test on staging first** before production
3. **Add `-DryRun` to see what would happen** before actually doing it
4. **Keep backups** in `backups/` folder
5. **Monitor logs** during deployment
6. **Save the log file** for troubleshooting later
7. **Commit code before deploying** (scripts require clean Git)
8. **Test the feature** after deployment succeeds

---

## 📊 Mode Comparison Table

```
┌─────────────────┬──────────┬────────────────┬────────────────┐
│ Aspect          │ CLEAN    │ UPDATE+DATA    │ UPDATE-ONLY    │
├─────────────────┼──────────┼────────────────┼────────────────┤
│ Use Case        │ Fresh    │ Migration      │ Regular        │
│ Database        │ Reset ❌ │ Import ✓       │ Keep ✓         │
│ Media Files     │ Remove   │ Sync ✓         │ Keep ✓         │
│ Docker Images   │ No cache │ With cache     │ With cache     │
│ Speed           │ Slow     │ Medium         │ Fast ⚡        │
│ Risk Level      │ 🔴 High  │ 🟡 Medium      │ 🟢 Low         │
│ When to Use     │ Testing  │ Staging        │ Production     │
└─────────────────┴──────────┴────────────────┴────────────────┘
```

---

**Version:** 3.0  
**Last Updated:** April 19, 2026  
**Status:** ✅ Production Ready
