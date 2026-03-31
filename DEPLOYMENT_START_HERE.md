# 🚀 KMSetjen DPD RI DEPLOYMENT - START HERE

> **Last Updated**: 2024  
> **Status**: ✅ PRODUCTION READY  
> **Deployment Target**: Ubuntu 24.04 LTS at khaz.app/kmsetjendpdri

**READ THIS FIRST** - This guide will take you from zero to a fully deployed application in 15 minutes.

---

## 📋 What You Need Before Starting

1. **SSH Access** to your Ubuntu 24.04 LTS server
   ```
   Server IP: 143.198.200.57
   User: root
   Method: SSH key (khaz.key) authentication
   ```

2. **Domain Setup** - Your domain should point to your server
   ```
   Domain: khaz.app
   DNS A Record: Points to 143.198.200.57 IP
   SSL Certificate: Let's Encrypt (configured automatically)
   ```

3. **Git Repository** - Already cloned on server at:
   ```
   /var/www/html/kmsetjendpdri/
   ```

4. **Production .env File** - You need to create/update this with:
   ```
   SECRET_KEY=<random-50-char-string>
   DB_PASSWORD=<strong-password>
   ALLOWED_HOSTS=khaz.app,www.khaz.app,143.198.200.57
   VITE_API_BASE_URL=https://khaz.app/kmsetjendpdri/api
   VITE_APP_SUBPATH=/kmsetjendpdri
   ```

---

## ⚡ Quick Start (3 Steps)

### Step 1: SSH to Your Server
```bash
ssh -i khaz.key root@143.198.200.57
```

### Step 2: Prepare Environment File
```bash
cd /var/www/html/kmsetjendpdri

# Create the production environment file
nano .env
```

**Paste this and update the placeholders:**
```env
# Security
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=<GENERATE-A-RANDOM-50-CHARACTER-STRING-HERE>
ALLOWED_HOSTS=khaz.app,www.khaz.app,143.198.200.57,localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kmsdb_prod
DB_USER=kms_user
DB_PASSWORD=<CREATE-A-STRONG-PASSWORD>
DB_HOST=localhost
DB_PORT=5432

# Redis/Cache
REDIS_URL=redis://localhost:6379/0

# Frontend
VITE_API_BASE_URL=https://khaz.app/kmsetjendpdri/api
VITE_APP_SUBPATH=/kmsetjendpdri

# CORS & CSRF
CORS_ALLOWED_ORIGINS=https://khaz.app,https://www.khaz.app
CSRF_TRUSTED_ORIGINS=https://khaz.app,https://www.khaz.app
```

**To generate SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

**Save file**: In nano: `Ctrl+O`, `Enter`, `Ctrl+X`

### Step 3: Run the Deployment Script
```bash
# Make script executable
chmod +x deploy-final.sh

# Run deployment (this takes 3-5 minutes)
sudo ./deploy-final.sh
```

**This will automatically:**
- ✅ Install all system dependencies (Node, Python, PostgreSQL, Redis, Nginx)
- ✅ Set up the PostgreSQL database
- ✅ Start Redis cache server
- ✅ Build your React frontend
- ✅ Set up Python virtual environment
- ✅ Run Django migrations
- ✅ Collect static files
- ✅ Configure and start Gunicorn
- ✅ Configure and start Nginx proxy
- ✅ Set file permissions
- ✅ Verify everything is working

---

## ✅ Verify It Worked

After the script completes successfully:

### 1. Check All Services Are Running
```bash
systemctl status postgresql redis-server kmsetjendpdri-gunicorn nginx
```
All should show **"active (running)"** in green.

### 2. Visit Your Application
Open browser and go to: **https://khaz.app/kmsetjendpdri/**

**You should see:**
- ✅ React application loads
- ✅ CSS and styling works
- ✅ Navigation menu visible
- ✅ No console errors (F12 → Console tab)

### 3. Test Print Functionality
- Navigate to any article
- Press Ctrl+P (or Cmd+P)
- In print preview, verify:
  - ✅ Only article content visible
  - ❌ NO navbar
  - ❌ NO footer
  - ❌ NO buttons
  - ❌ NO sidebar

### 4. Create Admin User
```bash
cd /var/www/html/kmsetjendpdri/backend
source venv/bin/activate
python manage.py createsuperuser
```

Then visit: https://khaz.app/kmsetjendpdri/admin/

---

## 🐛 If Something Doesn't Work

### Issue: Page shows 404 Not Found
```bash
# Check nginx configuration
sudo nginx -t

# Check frontend build
ls -la /var/www/html/kmsetjendpdri/frontend/dist/index.html

# See what's wrong
sudo tail -f /var/log/nginx/kmsetjendpdri_error.log
```

### Issue: API returns 502 Bad Gateway
```bash
# Check Gunicorn is running
systemctl status kmsetjendpdri-gunicorn

# See what went wrong
sudo journalctl -u kmsetjendpdri-gunicorn -n 30
```

### Issue: CSS/JS files return 404
```bash
# Rebuild static files
cd /var/www/html/kmsetjendpdri/backend
source venv/bin/activate
export $(cat /var/www/html/kmsetjendpdri/.env | grep -v '#' | xargs)
python manage.py collectstatic --noinput

# Restart nginx
sudo systemctl restart nginx
```

**Still stuck?** See [POST_DEPLOYMENT_VERIFICATION.md](POST_DEPLOYMENT_VERIFICATION.md) for detailed troubleshooting.

---

## 📖 Full Documentation Guide

After successful deployment, read these in order:

1. **[POST_DEPLOYMENT_VERIFICATION.md](POST_DEPLOYMENT_VERIFICATION.md)** ← Comprehensive testing checklist
2. **[DEPLOYMENT_SUBPATH_GUIDE.md](DEPLOYMENT_SUBPATH_GUIDE.md)** ← Technical details about subpath routing
3. **[DEPLOYMENT_ISSUES_AND_SOLUTIONS.md](DEPLOYMENT_ISSUES_AND_SOLUTIONS.md)** ← Why we made each change
4. **[DEPLOY_PS1_COMPLETE_GUIDE.md](DEPLOY_PS1_COMPLETE_GUIDE.md)** ← Windows PowerShell deployment (alternative)

---

## 📚 Key Files in This Project

| File | Purpose |
|------|---------|
| `deploy-final.sh` | ⭐ Main deployment script (RUN THIS) |
| `nginx-kmsetjendpdri-config.conf` | Nginx reverse proxy configuration |
| `.env.production` | Template for production environment variables |
| `.env` | Your actual production configuration (keep secret!) |
| `frontend/vite.config.js` | Frontend build config with subpath support |
| `backend/config/settings.py` | Django settings for subpath deployment |
| `backend/requirements.txt` | Python dependencies |
| `frontend/package.json` | Node.js dependencies |

---

## 🔒 Production Security Checklist

Before going live, verify:

- [ ] **SECRET_KEY** is a random 50+ character string
- [ ] **DEBUG=False** (not Debug=True!)
- [ ] **Database password** is strong (20+ chars, mixed case, symbols)
- [ ] **.env file permissions** are restricted:
  ```bash
  ls -la /var/www/html/kmsetjendpdri/.env
  # Should show: -rw------- (600 permissions)
  ```
- [ ] **SSL certificate** is valid:
  ```bash
  echo | openssl s_client -servername khaz.app -connect khaz.app:443 2>/dev/null | grep "Not After"
  # Should show a date 90+ days in the future
  ```
- [ ] **Firewall** allows HTTP/HTTPS:
  ```bash
  sudo ufw status
  # Should show 80/tcp and 443/tcp allowed
  ```

---

## 🆘 Useful Commands for Later

### View Logs
```bash
# Application logs
sudo journalctl -u kmsetjendpdri-gunicorn -f  # -f = follow (live)

# Nginx errors
sudo tail -f /var/log/nginx/kmsetjendpdri_error.log

# All nginx logs
sudo tail -f /var/log/nginx/kmsetjendpdri_access.log
```

### Restart Services
```bash
# Restart application
sudo systemctl restart kmsetjendpdri-gunicorn

# Restart web server
sudo systemctl restart nginx

# Restart all
sudo systemctl restart kmsetjendpdri-gunicorn nginx
```

### Manage Database
```bash
# Connect to PostgreSQL
psql -U kms_user -d kmsdb_prod -c "SELECT COUNT(*) FROM core_article;"

# Backup database
pg_dump -U kms_user -h localhost kmsdb_prod > backup.sql

# Restore database (CAUTION!)
psql -U kms_user -d kmsdb_prod < backup.sql
```

### Monitor Performance
```bash
# CPU and memory usage
top

# Disk space
df -h

# Which processes are using most resources
ps aux --sort=-%cpu | head -20
```

---

## ❓ Q&A

**Q: Why is the deployment at a subpath (/kmsetjendpdri/) and not root?**  
A: Multiple applications are hosted on the same server. Subpath isolation is safer and allows independent deployment cycles.

**Q: Can I change the subpath later?**  
A: Yes, but you'll need to rebuild the frontend and update nginx config. Contact support if needed.

**Q: How do I update the application?**  
A: Pull latest code → rebuild frontend → restart gunicorn/nginx. See deployment docs for details.

**Q: What if the server runs out of disk space?**  
A: Delete old log files and old migrations. If still needed, upgrade server capacity.

**Q: How do I set up automated backups?**  
A: Use `pg_baselines` or a cron job with `pg_dump`. See PostgreSQL documentation.

**Q: What about SSL certificate renewal?**  
A: Certbot handles this automatically. If not, manually run: `sudo certbot renew --dry-run` to test.

---

## 📞 Support

- **Deployment Issues**: Check [POST_DEPLOYMENT_VERIFICATION.md](POST_DEPLOYMENT_VERIFICATION.md)
- **Configuration Help**: See [DEPLOYMENT_ISSUES_AND_SOLUTIONS.md](DEPLOYMENT_ISSUES_AND_SOLUTIONS.md)
- **Technical Details**: Read [DEPLOYMENT_SUBPATH_GUIDE.md](DEPLOYMENT_SUBPATH_GUIDE.md)
- **Print CSS Issues**: See [ARTICLE_404_BUG_ANALYSIS_AND_FIX.md](ARTICLE_404_BUG_ANALYSIS_AND_FIX.md)

---

## 🎉 You Did It!

Your KMSetjen DPD RI application is now live at:

### **https://khaz.app/kmsetjendpdri/** 🌐

**What's Running:**
- ✅ React frontend with professional Bootstrap styling
- ✅ Django REST API backend
- ✅ PostgreSQL database
- ✅ Redis caching
- ✅ Nginx reverse proxy with SSL
- ✅ Print optimization (article-only output)
- ✅ Subpath routing (/kmsetjendpdri/)
- ✅ Static file serving
- ✅ Media file management

---

**Happy Deploying!** 🚀

*If this is your first time, don't worry—the script handles everything automatically. Just follow the 3 steps above.*
