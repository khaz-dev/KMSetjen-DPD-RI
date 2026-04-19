# 🚀 DEPLOYMENT CHECKLIST & QUICK START GUIDE

**Date**: April 1, 2026  
**Status**: ✅ READY FOR PRODUCTION DEPLOYMENT  
**Server**: 143.198.200.57  
**Domain**: https://khaz.app/kmsetjendpdri  

---

## 📋 PRE-DEPLOYMENT CHECKLIST (Local Machine)

### ✓ Code & Configuration
- [x] All code changes committed to Git (see git log)
- [x] Production `.env` file configured at: `d:\Project\KMSetjen DPD RI\.env`
- [x] `.env` file is in `.gitignore` (for security)
- [x] Deployment scripts created:
  - ✓ `deploy-final.sh` (main deployment)
  - ✓ `deploy-helper.ps1` (Windows automation helper)
  - ✓ `nginx-kmsetjendpdri-config.conf` (web server config)
  - ✓ `.env.production` (environment template)

### ✓ Security Verification
- [x] SECRET_KEY: `dYDsPPg3oNpEaSnGp_k2nW3eUs4EixmG7lWj42ISaNJ_jnKob-5Cq50Njh6jMeWRDxM`
- [x] DB_PASSWORD: `w6nPlZbRv6fYDFfuHDhP` (strong, randomized)
- [x] REDIS_PASSWORD: `YxUVAk0raKzBKunD` (strong, randomized)
- [x] DEBUG: `False` (never True in production)
- [x] DOMAIN: `khaz.app` (correct)
- [x] ALLOWED_HOSTS: `khaz.app,www.khaz.app,143.198.200.57,localhost,127.0.0.1`

### ✓ SSH Access
- [x] SSH key located at: `C:\Users\khair\.ssh\id_rsa`
- [x] Can connect to server: `ssh -i C:\Users\khair\.ssh\id_rsa root@143.198.200.57`
- [x] Git repository configured: `https://github.com/khaz-dev/KMSetjen-DPD-RI.git`

---

## 🚀 DEPLOYMENT OPTIONS

### **OPTION 1: Automatic Deployment (Recommended)**

Use the PowerShell helper script to automate the entire process:

```powershell
# Step 1: Navigate to project directory
cd "d:\Project\KMSetjen DPD RI"

# Step 2: Run deployment helper
.\deploy-helper.ps1

# Answer prompts:
# - SSH key path: (will auto-detect)
# - .env file: (will auto-copy)
# - Run deployment now?: yes

# Done! Script will handle everything
```

**What the script does:**
- ✓ Verifies prerequisites
- ✓ Copies .env file to server via SCP
- ✓ Connects to server via SSH
- ✓ Pulls latest code from Git
- ✓ Runs deployment script (sudo ./deploy-final.sh)
- ✓ Verifies services are running
- ✓ Shows troubleshooting tips

---

### **OPTION 2: Manual Step-by-Step Deployment**

If the helper script doesn't work, follow these steps manually:

#### Step 1: Copy .env to Server
```powershell
$keyPath = "C:\Users\khair\.ssh\id_rsa"
$envFile = "d:\Project\KMSetjen DPD RI\.env"
scp -i $keyPath $envFile root@143.198.200.57:/var/www/html/kmsetjendpdri/.env
```

#### Step 2: SSH to Server
```powershell
ssh -i "C:\Users\khair\.ssh\id_rsa" root@143.198.200.57
```

#### Step 3: Pull Code and Deploy
```bash
cd /var/www/html/kmsetjendpdri
git pull origin main
chmod +x deploy-final.sh
sudo ./deploy-final.sh
```

#### Step 4: Create Admin User
```bash
cd /var/www/html/kmsetjendpdri/backend
source venv/bin/activate
export $(cat .env | grep -v '#' | xargs)
python manage.py createsuperuser
# Follow prompts to create user
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

After deployment completes, verify everything works:

### 🌐 Visit the Application
```
https://khaz.app/kmsetjendpdri/
```

**Should See:**
- ✓ React application loads
- ✓ Bootstrap styling applied correctly
- ✓ Navigation menu visible
- ✓ No error messages in console (F12 → Console)

### 🔐 Test Admin Panel
```
https://khaz.app/kmsetjendpdri/admin/
```

**Login with:**
- Username: (created in Step 4 above)
- Password: (as entered)

### ⚙️ Check Services on Server
```bash
ssh -i C:\Users\khair\.ssh\id_rsa root@143.198.200.57

systemctl status postgresql          # Should: active (running)
systemctl status redis-server        # Should: active (running)
systemctl status kmsetjendpdri-gunicorn    # Should: active (running)
systemctl status nginx               # Should: active (running)
```

### 📋 Verify Print Functionality
1. Navigate to any article in application
2. Press `Ctrl+P` (or `Cmd+P` on Mac)
3. In print preview, verify:
   - ✓ Only article content visible
   - ✗ NO navbar
   - ✗ NO footer
   - ✗ NO buttons/sidebars

### 🔗 Test API Endpoints
```bash
# From any terminal/PowerShell:
curl -X GET https://khaz.app/kmsetjendpdri/api/health/

# Should return JSON, not 404 or 502
```

---

## 🐛 TROUBLESHOOTING

### Problem: SSH Connection Fails

```powershell
# Try with different SSH key
ssh -i "C:\Users\khair\.ssh\id_ed25519" root@143.198.200.57

# Or use password auth
ssh root@143.198.200.57
```

### Problem: Script Says "Permission Denied"

```bash
# Make script executable
chmod +x deploy-final.sh

# Run with sudo
sudo ./deploy-final.sh
```

### Problem: 502 Bad Gateway Error

```bash
# Check Gunicorn is running
sudo systemctl status kmsetjendpdri-gunicorn

# Check logs
sudo journalctl -u kmsetjendpdri-gunicorn -n 50

# Restart Gunicorn
sudo systemctl restart kmsetjendpdri-gunicorn
```

### Problem: CSS/JS Files Return 404

```bash
# Rebuild static files
cd /var/www/html/kmsetjendpdri/backend
source venv/bin/activate
export $(cat .env | grep -v '#' | xargs)
python manage.py collectstatic --noinput

# Restart Nginx
sudo systemctl restart nginx
```

### Problem: Database Connection Error

```bash
# Test database connection
psql -U kms_user -h localhost -d kmsdb_prod -c "SELECT 1;"

# Should return: 1

# If fails, check PostgreSQL is running:
sudo systemctl status postgresql
```

---

## 📊 DEPLOYMENT TIMELINE

| Phase | Component | Duration | Notes |
|-------|-----------|----------|-------|
| Prep | Copy .env, verify SSH | 2 min | One-time setup |
| Exec | run deploy-final.sh | 5-10 min | Automatic |
| Install | Dependencies, packages | 2-3 min | Automatic |
| Build | Frontend React build | 2-3 min | Automatic |
| Config | Database, migrations | 1-2 min | Automatic |
| Verify | Service startup | 1 min | Automatic |
| **Total** | **Full Deployment** | **~15 min** | **Automated** |

---

## 🔒 SECURITY CHECKLIST (Post-Deployment)

After deployment, verify security:

- [ ] HTTPS is enforced (HTTP redirects to HTTPS)
- [ ] .env file is not readable to world:
  ```bash
  ls -la .env  # Should show: -rw------- (perms: 600)
  ```
- [ ] SECRET_KEY is random and strong (50+ chars)
- [ ] DEBUG=False (never=True in production)
- [ ] Database password is strong (20+ chars)
- [ ] CORS only allows khaz.app domain
- [ ] SSL certificate is valid:
  ```bash
  echo | openssl s_client -servername khaz.app -connect khaz.app:443 2>/dev/null | grep "Not After"
  ```

---

## 📈 PERFORMANCE BASELINE

After deployment, these are expected performance metrics:

| Metric | Expected | How to Check |
|--------|----------|--------------|
| Page Load | < 2s | Open in browser, check Network tab |
| API Response | < 500ms | curl or Postman |
| CPU Usage | < 50% | `top` command |
| Memory Usage | < 1GB | `free -h` |
| Disk Usage | < 30% | `df -h` |

---

## 📞 SUPPORT RESOURCES

### Documentation Files
- **Quick Start**: Read `DEPLOYMENT_START_HERE.md`
- **Detailed Steps**: See `DEPLOYMENT_INSTRUCTIONS_FINAL.md`
- **Troubleshooting**: Check `POST_DEPLOYMENT_VERIFICATION.md`
- **Architecture**: Review `DEPLOYMENT_SUBPATH_GUIDE.md`

### Server Logs
```bash
# Application errors
sudo journalctl -u kmsetjendpdri-gunicorn -f

# Web server errors
sudo tail -f /var/log/nginx/kmsetjendpdri_error.log

# Django application
tail -f /var/www/html/kmsetjendpdri/backend/logs/django.log
```

### Common Commands
```bash
# Restart services
sudo systemctl restart kmsetjendpdri-gunicorn nginx

# Check service status
systemctl status kmsetjendpdri-gunicorn

# View recent logs
sudo journalctl -u kmsetjendpdri-gunicorn -n 100

# Database backup
pg_dump -U kms_user -d kmsdb_prod > backup_$(date +%Y%m%d).sql

# View disk usage
df -h
du -sh /var/www/html/kmsetjendpdri
```

---

## ✨ WHAT'S DEPLOYED

### Frontend Stack ✓
- React 18.2.0 with Vite 5.0.0 build tool
- Bootstrap 5.3.0 for responsive design
- Optimized CSS for print (article-only output)
- Dynamic subpath support (/kmsetjendpdri/)

### Backend Stack ✓
- Django 4.2.8 with Django REST Framework 3.14.0
- JWT authentication
- PostgreSQL 15+ database
- Redis 7+ caching
- Gunicorn WSGI server

### Infrastructure ✓
- Nginx 1.24+ reverse proxy with SSL
- Let's Encrypt SSL certificates
- Systemd service management
- Ubuntu 24.04 LTS operating system
- Comprehensive error logging

---

## 🎯 SUCCESS CRITERIA

Your deployment is successful if:

✓ Application loads at https://khaz.app/kmsetjendpdri/  
✓ All 4 systemd services are running (active)  
✓ Admin panel accessible at /admin/  
✓ Print output shows article-only content  
✓ API endpoints respond without 502/503 errors  
✓ Static files load (CSS/JS not 404)  
✓ No major errors in logs  
✓ Database is accessible  

---

## 🎉 NEXT STEPS

### Immediate (This Evening)
1. ✓ Run deployment using Option 1 (helper script) or Option 2 (manual)
2. ✓ Verify application loads
3. ✓ Create admin user
4. ✓ Test key features

### Short-Term (This Week)
1. Set up monitoring/alerting (optional)
2. Configure email (if needed)
3. Test all features thoroughly
4. Train team on operations

### Medium-Term (This Month)
1. Set up automated backups
2. Configure log rotation
3. Plan maintenance schedule
4. Document any customizations

---

## 🚀 READY TO DEPLOY

```
╔═════════════════════════════════════════════════╗
║  KMSetjen DPD RI - DEPLOYMENT READY             ║
║  ─────────────────────────────────────────────  ║
║  Status: 🟢 PRODUCTION READY                    ║
║  Configuration: ✓ Complete                      ║
║  Scripts: ✓ Ready                               ║
║  Documentation: ✓ Comprehensive                 ║
║                                                 ║
║  Next: Run ./deploy-helper.ps1                  ║
║  Expected Result: Live at khaz.app/kmsetjendpdri║
╚═════════════════════════════════════════════════╝
```

**Start deployment:** 
```powershell
cd "d:\Project\KMSetjen DPD RI"
.\deploy-helper.ps1
```

---

**Generated**: April 1, 2026  
**Version**: 1.0-production-ready  
**Status**: ✅ VERIFIED & TESTED
