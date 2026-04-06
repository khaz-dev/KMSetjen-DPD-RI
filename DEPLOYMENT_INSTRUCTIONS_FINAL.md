# DEPLOYMENT INSTRUCTIONS - STAGE BY STAGE

**Date**: April 1, 2026
**Target Server**: linux.143.198.200.57
**Domain**: https://khaz.app/kmsetjendpdri
**Repository**: https://github.com/khaz-dev/KMSetjen-DPD-RI.git

---

## BEFORE YOU START

✓ Git repository is up-to-date (all changes committed)
✓ Production .env file is configured locally at: `d:\Project\KMSetjen DPD RI\.env`
✓ SSH access to root@143.198.200.57 is available
✓ deployment scripts are committed to git (deploy-final.sh is in repository root)

---

## DEPLOYMENT INSTRUCTIONS

### PREREQUISITE: Get your .env file to the server

You have these options:

#### Option A: Copy via SCP (Secure Copy)
```powershell
# From Windows PowerShell/CMD in your project directory
scp -i C:\Users\[YourUsername]\.ssh\id_rsa .env root@143.198.200.57:/var/www/html/kmsetjendpdri/.env
```

#### Option B: Copy via Git (Simpler - but .env is security-sensitive)
Due to `.env` being in `.gitignore`, it won't be in git. You MUST use SCP or manually create it on the server.

#### Option C: Manually create on server
```bash
# SSH to server
ssh -i khaz root@143.198.200.57

# Create .env on server
sudo cat > /var/www/html/kmsetjendpdri/.env << 'EOF'
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=dYDsPPg3oNpEaSnGp_k2nW3eUs4EixmG7lWj42ISaNJ_jnKob-5Cq50Njh6jMeWRDxM
ALLOWED_HOSTS=khaz.app,www.khaz.app,143.198.200.57,localhost,127.0.0.1
DOMAIN_NAME=khaz.app
APP_SUBPATH=/kmsetjendpdri
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kmsdb_prod
DB_USER=kms_user
DB_PASSWORD=w6nPlZbRv6fYDFfuHDhP
DB_HOST=localhost
DB_PORT=5432
REDIS_PASSWORD=YxUVAk0raKzBKunD
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://:YxUVAk0raKzBKunD@localhost:6379/0
VITE_API_BASE_URL=https://khaz.app/kmsetjendpdri/api
VITE_APP_SUBPATH=/kmsetjendpdri
DJANGO_SETTINGS_MODULE=config.settings
CORS_ALLOWED_ORIGINS=https://khaz.app,https://www.khaz.app
CSRF_TRUSTED_ORIGINS=https://khaz.app,https://www.khaz.app
SECURE_SSL_REDIRECT=True
DISABLE_SSL_REDIRECT=False
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
LOG_LEVEL=INFO
EOF
```

---

### STEP 1: SSH to the Server

```bash
ssh -i khaz root@143.198.200.57
```

### STEP 2: Navigate to Project Directory

```bash
cd /var/www/html/kmsetjendpdri
pwd  # Should show: /var/www/html/kmsetjendpdri
ls -la  # Should show files from git repo
```

### STEP 3: Pull Latest Code from Git

```bash
git status  # Check status
git pull origin main  # Pull latest changes
git log --oneline -3  # Verify latest commit is there
```

### STEP 4: Verify .env File Exists

```bash
ls -la .env
# Should show: -rw------- 1 root root [size] ... .env

# If not present, copy it using SCP from your local machine:
# On your local machine:
# scp -i khaz .env root@143.198.200.57:/var/www/html/kmsetjendpdri/.env
```

### STEP 5: Make Deployment Script Executable

```bash
chmod +x deploy-final.sh
ls -la deploy-final.sh  # Should show: -rwxr-xr-x
```

### STEP 6: Run the Deployment Script

```bash
# This will take 3-5 minutes
sudo ./deploy-final.sh
```

**The script will automatically:**
- ✓ Install system dependencies (Python, Node, PostgreSQL, Redis, Nginx)
- ✓ Create PostgreSQL database and user
- ✓ Start Redis service
- ✓ Build React frontend (npm build)
- ✓ Set up Python backend (virtualenv, pip install, migrations)
- ✓ Configure Gunicorn (WSGI server)
- ✓ Configure Nginx (reverse proxy)
- ✓ Set permissions and start services
- ✓ Verify all services are running

### STEP 7: Verify Deployment Succeeded

```bash
# Check services are running
systemctl status postgresql redis-server kmsetjendpdri-gunicorn nginx

# All should show: active (running) in green

# Check if Gunicorn is listening
netstat -tlnp | grep 8002
# Should show: 127.0.0.1:8002 LISTEN

# Check logs for any errors
sudo journalctl -u kmsetjendpdri-gunicorn -n 20
# Should show: Gunicorn workers started without major errors
```

### STEP 8: Create Admin User (IMPORTANT!)

```bash
cd /var/www/html/kmsetjendpdri/backend
source venv/bin/activate
export $(cat .env | grep -v '#' | xargs)
python manage.py createsuperuser
# Follow prompts to create admin user
```

### STEP 9: Test Application

```bash
# From your LOCAL machine, open browser:
https://khaz.app/kmsetjendpdri/

# Should see:
✓ React application loads
✓ No console errors (F12 → Console)
✓ Navigation menu works
✓ Styling looks good

# Test API
curl https://khaz.app/kmsetjendpdri/api/health/
# Should return JSON response

# Test Admin
https://khaz.app/kmsetjendpdri/admin/
# Should show Django admin login
```

### STEP 10: Test Print Functionality

```bash
# From browser:
1. Navigate to any article
2. Press Ctrl+P (or Cmd+P)
3. In print preview, verify:
   ✓ Only article content visible
   ✗ NO navbar
   ✗ NO footer
   ✗ NO buttons
   ✗ NO sidebar
```

---

## TROUBLESHOOTING

### Issue: SSH Key Not Working

**Solution:**
```bash
# Try with different SSH key
ssh -i /path/to/alternative/key root@143.198.200.57

# Or use password authentication:
ssh root@143.198.200.57
# Then enter password when prompted
```

### Issue: Script Says "Permission Denied"

```bash
# Make sure script is executable
chmod +x deploy-final.sh

# Run with sudo
sudo ./deploy-final.sh
```

### Issue: PostgreSQL Installation Hangs

```bash
# You can interrupt with Ctrl+C and try again
# Or check PostgreSQL status:
systemctl status postgresql

# If stuck, try:
sudo systemctl restart postgresql
```

### Issue: Port 80/443 Already in Use

```bash
# Check what's using the port
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service if needed
sudo systemctl stop [service-name]
```

### Issue: API Returns 502 Bad Gateway

```bash
# Check Gunicorn logs
sudo journalctl -u kmsetjendpdri-gunicorn -n 50

# Restart Gunicorn
sudo systemctl restart kmsetjendpdri-gunicorn

# Check if database is accessible
psql -U kms_user -h localhost -d kmsdb_prod -c "SELECT 1;"
```

### Issue: Static Files Return 404

```bash
# Rebuild static files
cd /var/www/html/kmsetjendpdri/backend
source venv/bin/activate
export $(cat .env | grep -v '#' | xargs)
python manage.py collectstatic --noinput

# Restart Nginx
sudo systemctl restart nginx
```

---

## DEPLOYMENT COMPLETE VERIFICATION

After successful deployment, verify:

- [ ] **Systemd Services** - All running
  ```bash
  systemctl status postgresql redis-server kmsetjendpdri-gunicorn nginx
  ```

- [ ] **Application URL** - Loads in browser
  ```
  https://khaz.app/kmsetjendpdri/
  ```

- [ ] **Admin Access** - Accessible
  ```
  https://khaz.app/kmsetjendpdri/admin/
  (Login with admin user created in Step 8)
  ```

- [ ] **API Endpoints** - Respond
  ```bash
  curl https://khaz.app/kmsetjendpdri/api/health/
  ```

- [ ] **Print Output** - Article-only
  - Test print from article page (Ctrl+P)
  - Verify no navbar/footer/buttons appear

- [ ] **Logs Clear** - No major errors
  ```bash
  sudo journalctl -u kmsetjendpdri-gunicorn | grep ERROR
  sudo tail -f /var/log/nginx/kmsetjendpdri_error.log
  ```

---

## ONGOING MAINTENANCE

### Daily
```bash
# Monitor logs
sudo journalctl -u kmsetjendpdri-gunicorn -f

# Check services are running
systemctl status kmsetjendpdri-gunicorn nginx
```

### Weekly
```bash
# Check disk space
df -h

# Monitor database size
du -sh /var/lib/postgresql/

# Check system load
top
```

### Monthly
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Clean up logs
sudo journalctl --vacuum=30d

# Verify backups
ls -la /backups/ 2>/dev/null || echo "Backups not yet configured"
```

---

## IMPORTANT SECURITY NOTES

⚠️ **Never commit .env to Git** - It contains secrets!
⚠️ **Keep .env permissions restricted** - Should be 600 (rw-------)
⚠️ **Change SECRET_KEY** - Keep it secret and strong
⚠️ **Use strong DB password** - Don't use default
⚠️ **Monitor logs regularly** - Watch for security issues
⚠️ **Keep packages updated** - Patch security vulnerabilities

---

## NEXT STEPS AFTER DEPLOYMENT

1. **Create backup strategy**
   - Set up automated PostgreSQL backups
   - Consider disk snapshots

2. **Configure monitoring** (Optional)
   - Set up monitoring for services
   - Configure alerts for failures

3. **Configure email** (If needed)
   - Update EMAIL_* variables in .env
   - Test email functionality

4. **SSL Certificate Management**
   - Verify cert renewal schedule
   - Test: `sudo certbot renew --dry-run`

5. **Performance Tuning**
   - Monitor server load
   - Adjust Gunicorn workers if needed
   - Optimize database queries

---

**Your application is ready to deploy!** 🚀

Questions? See: [DEPLOYMENT_START_HERE.md](DEPLOYMENT_START_HERE.md)
