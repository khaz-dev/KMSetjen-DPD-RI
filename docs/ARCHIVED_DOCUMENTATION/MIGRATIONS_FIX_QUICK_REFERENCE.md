# ⚡ MIGRATIONS FIX - QUICK REFERENCE

**Problem Found:** Migrations failing silently on Ubuntu production  
**Root Cause:** Error output suppressed with `2>/dev/null`, no exit code checking  
**Status:** ✅ FIXED in both deploy.ps1 and deploy.sh

---

## 🎯 What Changed

### Before (BROKEN)
```bash
# deploy.sh (Line 330)
docker-compose exec -T django python manage.py migrate --noinput 2>/dev/null
log_success "Migrations completed"  # Always logged, even if failed!
```

### After (FIXED)
```bash
# deploy.sh (Lines 328-368)
log_info "Executing migrations..."
if ! docker-compose exec -T django python manage.py migrate --noinput; then
    log_error "Migration failed! See detailed output above."
    exit 1  # STOPS deployment on failure
fi

log_info "Verifying migrations..."
if ! docker-compose exec -T django python manage.py migrate --check; then
    log_error "Migrations verification failed!"
    exit 1
fi

log_success "Migrations completed and verified"  # Only logged if actually successful
```

---

## ✅ Testing the Fix

### Windows (PowerShell)
```powershell
cd "d:\Project\KMSetjen DPD RI"
.\deploy.ps1 -Environment development

# Look for:
# ✓ "[INFO] Executing migrations..."
# ✓ "Running migrations:" and list of migrations
# ✓ "[SUCCESS] Migrations completed and verified"
# ✓ "[SUCCESS] Database and application check passed"
```

### Linux/Ubuntu (Bash)
```bash
cd /path/to/project
chmod +x deploy.sh
./deploy.sh development

# Look for:
# ✓ "[INFO] Executing migrations..."
# ✓ "Running migrations:" and list of migrations
# ✓ "[SUCCESS] Migrations completed and verified"
# ✓ "[SUCCESS] Database and application check passed"
```

---

## 🔍 If Migrations Still Fail

### Quick Diagnostics
```bash
# Both Windows (PowerShell) and Linux (Bash):

# 1. Check database connection
docker-compose exec -T django python manage.py dbshell
# Type: SELECT 1;
# Should return: (1,)

# 2. Check pending migrations
docker-compose exec -T django python manage.py showmigrations

# 3. Check detailed error
docker-compose exec -T django python manage.py migrate --verbosity 3

# 4. Check application
docker-compose exec -T django python manage.py check

# 5. Check logs
docker-compose logs django | tail -50
```

### Full Diagnostics (Linux/Ubuntu)
```bash
chmod +x diagnose_migrations.sh
./diagnose_migrations.sh
# This runs comprehensive checks on:
# • Docker status
# • Database connection
# • Migration table
# • Applied migrations
# • Pending migrations
# • Application health
```

---

## 🛠️ Common Fixes

### Database Connection Issues
```bash
# Check .env database configuration
grep DB_ .env

# For Docker (Windows/macOS):
# DB_HOST should be: host.docker.internal

# For Linux with Docker:
# DB_HOST should be: your-server-ip or hostname

# For local PostgreSQL:
# DB_HOST should be: localhost
```

### Force Migrate if Needed
```bash
# Emergency: Create migration table if missing
docker-compose exec -T django python manage.py migrate --run-syncdb

# Or manually run migrations
docker-compose exec -T django python manage.py migrate --noinput --verbosity 3
```

### Check What Happened
```bash
# After deployment, check migration status
docker-compose exec -T django python manage.py showmigrations

# Output should show [X] for all applied migrations:
# [X] 0001_initial
# [X] 0002_initial
# etc.
```

---

## 📊 Expected Output (Successful)

```
[INFO] Running migrations...
[INFO] Checking pending migrations...
[SUCCESS] No pending migrations found
[INFO] Collecting static files...
[SUCCESS] Static files collected
[INFO] Verifying database connection...
[SUCCESS] Database and application check passed
[SUCCESS] Deployment to [development] completed!
```

---

## 🚨 NOT Working? (What to Check)

| Issue | Check |
|-------|-------|
| "Database connection refused" | Is PostgreSQL running? Is DB_HOST correct? |
| "Column does not exist" | Run: `docker-compose exec -T django python manage.py migrate` |
| "Migration table not found" | Run: `docker-compose exec -T django python manage.py migrate --run-syncdb` |
| "Permission denied" | Check PostgreSQL user permissions |
| "Timeout waiting" | Database might be slow - increase wait time |

---

## 💾 Files Modified

| File | What Changed |
|------|-------------|
| deploy.sh | setup_database() function (100% rewrite) |
| deploy.ps1 | Setup-Database function (100% rewrite) |
| New: diagnose_migrations.sh | Complete diagnostic script |
| New: MIGRATIONS_FIX_COMPLETE_GUIDE.md | Full guide with solutions |

---

## 🎯 Deploy Commands After Fix

### Windows
```powershell
# Development
.\deploy.ps1 -Environment development

# Staging
.\deploy.ps1 -Environment staging

# Production
.\deploy.ps1 -Environment production
```

### Linux/Ubuntu
```bash
# Development
./deploy.sh development

# Staging
./deploy.sh staging

# Production
./deploy.sh production
```

---

## ✨ Key Improvements

✅ **Visible Errors** - No more silent failures  
✅ **Immediate Stop** - Deployment stops if migrations fail  
✅ **3-Stage Verification** - Check → Run → Verify  
✅ **Better Logging** - Know exactly what's happening  
✅ **Application Check** - Verify database connection works  
✅ **Full Output** - See actual error messages  

---

## 📞 Still Need Help?

1. **Check logs:** `docker-compose logs django`
2. **Run diagnostics:** `./diagnose_migrations.sh` (Linux)
3. **Read full guide:** Open `MIGRATIONS_FIX_COMPLETE_GUIDE.md`
4. **Manual test:** `docker-compose exec -T django python manage.py migrate --verbosity 3`

---

**Status:** ✅ READY TO DEPLOY
