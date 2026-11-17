# 🧪 Deployment Scripts - Testing & Verification Guide

**Status:** ✅ Ready for Testing  
**Version:** 3.0  
**Date:** April 19, 2026

---

## 📋 Pre-Deployment Testing Checklist

### 1. Environment Verification

**Windows Local Machine:**
```powershell
# Check PostgreSQL
psql --version
# Expected: psql (PostgreSQL) 13.0 or higher

# Check Git
git --version
# Expected: git version 2.0 or higher

# Check SSH key
Test-Path "c:\Users\khair\khaz"
# Expected: True

# Check .env.staging
Test-Path ".\.env.staging"
# Expected: True

# Check deployment script
Test-Path ".\deploy-staging-enhanced.ps1"
# Expected: True
```

**Staging Server (SSH):**
```bash
ssh -i c:\Users\khair\khaz root@165.245.191.216

# Check Docker
docker --version
# Expected: Docker version 20.10 or higher

# Check Docker Compose
docker-compose --version
# Expected: docker-compose version 1.29 or higher

# Check Git
git --version
# Expected: git version 2.0 or higher

# Check PostgreSQL client
psql --version
# Expected: psql (PostgreSQL) 13.0 or higher

# Check deployment script
ls -la /var/www/html/kms/deploy-master-enhanced.sh
# Expected: Script exists and is executable
```

---

## 🧪 Test 1: Dry-Run Mode (No Changes)

### For Staging Deployment

```powershell
# Navigate to project
cd d:\Project\KMSetjen\ DPD\ RI\

# Test clean mode (dry-run)
.\deploy-staging-enhanced.ps1 -Mode clean -DryRun -Verbose

# Expected output:
# [DRY RUN] Would copy: .env.staging to remote
# [DRY RUN] Would pull: git pull origin main
# [DRY RUN] Would build: docker-compose build --no-cache
# ... no actual changes made

# Test update-with-data mode (dry-run)
.\deploy-staging-enhanced.ps1 -Mode update-with-data -DryRun -Verbose

# Expected output:
# [DRY RUN] Would export: pg_dump database
# [DRY RUN] Would SCP: database dump to remote
# [DRY RUN] Would import database on remote server
# ... no actual changes made

# Test update-only mode (dry-run)
.\deploy-staging-enhanced.ps1 -Mode update-only -DryRun -Verbose

# Expected output:
# [DRY RUN] Would copy: .env.staging
# [DRY RUN] Would pull: git pull
# [DRY RUN] Would build: docker-compose build
# ... no actual changes made
```

### For Production (On Server)

```bash
ssh root@165.245.191.216
cd /var/www/html/kms

# Test clean mode (dry-run)
sudo bash deploy-master-enhanced.sh production --mode=clean --dry-run --verbose

# Test update-with-data mode (dry-run)
sudo bash deploy-master-enhanced.sh production --mode=update-with-data --dry-run --verbose

# Test update-only mode (dry-run)
sudo bash deploy-master-enhanced.sh production --mode=update-only --dry-run --verbose
```

✅ **Expected Result:** No errors, all commands show what WOULD happen

---

## 🧪 Test 2: Connectivity Tests

### SSH Connection

```powershell
# Test SSH connectivity
ssh -i c:\Users\khair\khaz -o ConnectTimeout=5 root@165.245.191.216 "echo SSH OK"

# Expected: "SSH OK"
```

### Database Connectivity

```powershell
# Test local PostgreSQL
$env:PGPASSWORD = "Okkdpdri@2026"
psql -U postgres -h localhost -d postgres -c "SELECT version();"
$env:PGPASSWORD = ""

# Expected: PostgreSQL version information
```

### Git Repository

```powershell
# Verify Git status
git status

# Expected: "nothing to commit" or list of changes

# Verify remote
git remote -v

# Expected: Shows origin as GitHub URL
```

---

## 🧪 Test 3: Script Syntax Validation

### PowerShell Script

```powershell
# Test script syntax
Test-Path ".\deploy-staging-enhanced.ps1" -ErrorAction Stop
$scriptContent = Get-Content ".\deploy-staging-enhanced.ps1"

# Check for syntax errors
if ($scriptContent -match "ERROR|INVALID") {
    Write-Host "Syntax errors found!" -ForegroundColor Red
} else {
    Write-Host "PowerShell script OK" -ForegroundColor Green
}
```

### Bash Script

```bash
# Test script syntax
bash -n deploy-master-enhanced.sh

# Expected: No errors (if there are errors, bash will report them)

# Verify script is executable
ls -la deploy-master-enhanced.sh

# Expected: x permission present (rwxr-xr-x)
```

---

## 🧪 Test 4: Simulation (Local Only)

### Simulate Clean Mode

```powershell
# On local machine ONLY, simulate what would happen in clean mode
.\deploy-staging-enhanced.ps1 -Mode clean -DryRun

# This should show:
# 1. Environment check steps
# 2. Would copy .env
# 3. Would pull Git
# 4. Would export database
# 5. Would build Docker (clean)
# 6. Would stop/start containers
# 7. Would run migrations
```

### Simulate Update-with-Data Mode

```powershell
# Simulate data migration
.\deploy-staging-enhanced.ps1 -Mode update-with-data -DryRun

# This should show:
# 1. Environment check
# 2. Export local database
# 3. Transfer to server
# 4. Pull code
# 5. Reset remote database
# 6. Import data
# 7. Sync media files
# 8. Build and restart
```

### Simulate Update-Only Mode

```powershell
# Simulate safe update
.\deploy-staging-enhanced.ps1 -Mode update-only -DryRun

# This should show:
# 1. Copy .env
# 2. Pull code
# 3. Build Docker images
# 4. Restart containers
# 5. Run migrations (if any)
# NO DATABASE CHANGES
```

---

## 🧪 Test 5: Small Live Deployment (Staging First)

### Step 1: Test Update-Only Mode

```powershell
# This is the safest first test
cd d:\Project\KMSetjen\ DPD\ RI\

# Run actual deployment (not dry-run)
.\deploy-staging-enhanced.ps1 -Mode update-only -Verbose

# Monitor logs
Get-Content deployment_logs/deploy_*.log -Tail 50 -Wait

# Expected: 
# ✓ Environment validated
# ✓ .env copied
# ✓ Code pulled
# ✓ Docker built
# ✓ Containers restarted
# ✓ Migrations run
```

### Step 2: Verify Deployment

```powershell
# SSH to staging server
ssh -i c:\Users\khair\khaz root@165.245.191.216

# Check container status
cd /var/www/html/kms
docker-compose ps

# Expected: All containers RUNNING (not exited)
```

### Step 3: Test Application

```bash
# On the server, test API
curl http://127.0.0.1:8002/health/

# Expected: HTTP 200 with health status

# Test frontend
curl http://127.0.0.1:5175/ | head -20

# Expected: HTML content starts (not error)

# Check database
docker-compose exec -T django python manage.py shell -c "from django.contrib.auth import get_user_model; print(f'Users: {get_user_model().objects.count()}')"

# Expected: Shows user count (> 0 if data exists)
```

---

## 🧪 Test 6: Full Deployment Cycle (Recommended Sequence)

### Week 1: Preparation
```powershell
# Create test data locally
# Write test cases
# Document changes

# Run dry-run on staging
.\deploy-staging-enhanced.ps1 -Mode update-only -DryRun
```

### Week 2: Testing
```powershell
# Deploy to staging (update-only)
.\deploy-staging-enhanced.ps1 -Mode update-only -Verbose

# Test on staging
# https://kms.khaz.app/
# Check all features

# Check logs
ssh root@165.245.191.216
docker-compose logs -f
```

### Week 3: Production Preparation
```bash
# On production server
ssh root@PROD_IP
cd /var/www/html/production

# Dry-run production deployment
sudo bash deploy-master-enhanced.sh production --mode=update-only --dry-run --verbose
```

### Week 4: Production Deployment
```bash
# On production server
sudo bash deploy-master-enhanced.sh production --mode=update-only --verbose

# Verify
docker-compose ps
curl https://kms-be.dpd.go.id/health/
```

---

## ✅ Validation Checklist

### After Deployment

- [ ] Log file created: Check `deployment_logs/`
- [ ] No errors in logs: `grep ERROR deployment_logs/*.log`
- [ ] Containers running: `docker-compose ps` shows RUNNING
- [ ] Database connected: Can access via Django shell
- [ ] Frontend loads: Visit https://kms.khaz.app/
- [ ] API responds: GET /api/v1/public/articles/
- [ ] Authentication works: Login and check JWT token
- [ ] Media loads: Images appear correctly
- [ ] Migrations applied: `python manage.py showmigrations` shows all applied
- [ ] No crashes in logs: `docker-compose logs` shows normal operation

### Performance Checks

```bash
# Check CPU usage
docker stats --no-stream

# Check memory
free -h

# Check disk space
df -h

# Check database size
du -h /var/lib/postgresql/data/
```

---

## 🆘 Troubleshooting During Testing

### If Dry-Run Shows Errors

1. **SSH Connection Failed**
   ```powershell
   # Verify SSH key
   Test-Path "c:\Users\khair\khaz"
   
   # Test manually
   ssh -i "c:\Users\khair\khaz" root@165.245.191.216 "echo OK"
   ```

2. **Database Export Failed**
   ```powershell
   # Check PostgreSQL
   psql -U postgres -l
   
   # Test manually
   pg_dump -U postgres kmsdb > test_dump.sql
   ```

3. **File Permission Issues**
   ```bash
   # Make scripts executable
   chmod +x deploy-master-enhanced.sh
   ls -la deploy-master-enhanced.sh  # Verify x permission
   ```

### If Live Deployment Fails

1. **Check Logs**
   ```powershell
   Get-Content deployment_logs/deploy_*.log | Select-Object -Last 100
   ```

2. **SSH to Server**
   ```bash
   ssh root@165.245.191.216
   docker-compose logs --tail=100 django
   ```

3. **Rollback**
   ```bash
   git reset --hard origin/previous-commit
   docker-compose down
   docker-compose up -d
   ```

---

## 📊 Success Criteria

### Dry-Run Tests
- ✅ Script runs without errors
- ✅ Shows all planned actions
- ✅ No actual changes made
- ✅ Log file created

### Live Update-Only Test
- ✅ Code pulled from Git
- ✅ Docker images built
- ✅ Containers restarted
- ✅ Migrations applied
- ✅ No database changes
- ✅ Application accessible
- ✅ All features working

### Live Update-With-Data Test
- ✅ Database exported
- ✅ Data transferred to server
- ✅ Database imported on remote
- ✅ Media files synced
- ✅ Application running with new data
- ✅ Data integrity verified

### Production Deployment
- ✅ Test on staging passed
- ✅ Team approved
- ✅ Backup created
- ✅ Update-only mode used (safest)
- ✅ Monitoring active during deployment
- ✅ All checks passed
- ✅ Ready to monitor in production

---

## 📝 Test Report Template

```
Test Date: _______________
Environment: [ ] Local [ ] Staging [ ] Production
Mode: [ ] Clean [ ] Update-With-Data [ ] Update-Only
Tester: _______________

PRE-DEPLOYMENT
- [ ] All prerequisites met
- [ ] SSH connectivity OK
- [ ] Database accessible
- [ ] Git repository clean

DRY-RUN TEST
- [ ] Dry-run completed successfully
- [ ] All planned actions displayed
- [ ] No actual changes made
- [ ] Log file created

LIVE DEPLOYMENT
- [ ] Deployment started
- [ ] Code pulled successfully
- [ ] Docker images built
- [ ] Containers restarted
- [ ] Migrations applied
- [ ] Deployment completed

POST-DEPLOYMENT VERIFICATION
- [ ] Application accessible
- [ ] Frontend loads
- [ ] API responds
- [ ] Authentication works
- [ ] Media loads
- [ ] No errors in logs

NOTES:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

APPROVED BY: _________________ DATE: _________
```

---

**Status:** ✅ All Tests Ready  
**Version:** 3.0  
**Last Updated:** April 19, 2026
