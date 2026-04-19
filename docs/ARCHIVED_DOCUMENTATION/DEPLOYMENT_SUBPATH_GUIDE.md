# 🚀 KMSetjen DPD RI - Subpath Deployment Guide

**Domain**: https://khaz.app/kmsetjendpdri  
**Server**: Ubuntu 24.04 LTS  
**Updated**: April 1, 2026

---

## 📋 Deployment Checklist

### ✅ Already Completed (On Server)
- [x] Server provisioned (143.198.200.57)
- [x] Domain registered (khaz.app)
- [x] SSL certificate installed (Let's Encrypt)
- [x] Nginx installed
- [x] Git repository cloned to /var/www/html/kmsetjendpdri

### ⚠️ Still Required

#### Phase 1: Server Dependencies
- [ ] Install Node.js 18+
- [ ] Install Python 3.10+
- [ ] Install PostgreSQL 15+
- [ ] Install Redis (optional but recommended)
- [ ] Create required directories

#### Phase 2: Environment Setup
- [ ] Copy `.env.production` to `.env` on server
- [ ] Update database credentials in `.env`
- [ ] Update SECRET_KEY in `.env`
- [ ] Update email credentials in `.env`

#### Phase 3: Frontend Build
- [ ] Install frontend dependencies: `npm install`
- [ ] Build frontend: `npm run build`
- [ ] Output will be in `frontend/dist/`

#### Phase 4: Backend Setup
- [ ] Create Python virtual environment
- [ ] Install Python dependencies: `pip install -r requirements.txt`
- [ ] Set up PostgreSQL database
- [ ] Run migrations: `python manage.py migrate`
- [ ] Collect static files: `python manage.py collectstatic --noinput`
- [ ] Create superuser: `python manage.py createsuperuser`

#### Phase 5: Nginx Configuration
- [ ] Copy nginx config to `/etc/nginx/sites-available/kmsetjendpdri`
- [ ] Enable site: `sudo ln -s /etc/nginx/sites-available/kmsetjendpdri /etc/nginx/sites-enabled/kmsetjendpdri`
- [ ] Disable default: `sudo rm -f /etc/nginx/sites-enabled/default`
- [ ] Test config: `sudo nginx -t`
- [ ] Restart nginx: `sudo systemctl restart nginx`

#### Phase 6: Application Server
- [ ] Install gunicorn: `pip install gunicorn`
- [ ] Create systemd service for Django
- [ ] Start Django application server
- [ ] Create systemd service for frontend (or use nginx to serve)
- [ ] Test API connectivity

#### Phase 7: Testing & Verification
- [ ] Access https://khaz.app/kmsetjendpdri in browser
- [ ] Check frontend loads correctly
- [ ] Test API calls (check browser console)
- [ ] Test static file serving (CSS/JS/images)
- [ ] Test media upload functionality
- [ ] Test authentication/login
- [ ] Check Django admin at /admin/

---

## 🔧 Configuration Files

### 1. Production Environment (.env.production)
Located at: `/.env.production`  
**Contains**: Database credentials, API URLs, secret keys, CORS settings

### 2. Nginx Configuration
Should be created at: `/etc/nginx/sites-available/kmsetjendpdri`  
**Contains**: Reverse proxy for Django, static file serving, media file serving

### 3. Vite Configuration (vite.config.js)
**Updated with**: `base: '/kmsetjendpdri/'`  
**Purpose**: Ensures React app uses correct asset paths

### 4. Django Settings (settings.py)
**Updates needed**:
- ALLOWED_HOSTS includes khaz.app
- STATIC_URL = '/kmsetjendpdri/static/'
- MEDIA_URL = '/kmsetjendpdri/media/'
- CORS_ALLOWED_ORIGINS configured for domain

---

## 🌐 App Structure at Subpath

```
https://khaz.app/kmsetjendpdri/
├── /                          → React SPA (frontend/dist/index.html)
├── /api/                       → Django REST API
│   ├── /api/auth/             → Authentication endpoints
│   ├── /api/articles/         → Articles endpoints
│   ├── /api/categories/       → Categories endpoints
│   └── ...
├── /static/                   → Static files (CSS, JS, images)
│   ├── /static/css/
│   ├── /static/js/
│   └── ...
├── /media/                    → User-uploaded files
│   ├── /media/articles/
│   └── ...
└── /admin/                    → Django admin interface
```

---

## 🛠️ Step-by-Step Deployment

### Step 1: Connect to Server
```bash
ssh -i khaz root@143.198.200.57
```

### Step 2: Install System Dependencies
```bash
sudo apt update
sudo apt install -y nodejs npm python3-pip python3-venv postgresql redis-server
```

### Step 3: Navigate to Project
```bash
cd /var/www/html/kmsetjendpdri
```

### Step 4: Set Up Environment
```bash
# Copy production .env
cp .env.production .env

# Edit .env with actual values
sudo nano .env
```

### Step 5: Build Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### Step 6: Set Up Backend
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser
python manage.py createsuperuser

cd ..
```

### Step 7: Configure Nginx
- Create `/etc/nginx/sites-available/kmsetjendpdri` with provided configuration
- Test: `sudo nginx -t`
- Enable and restart

### Step 8: Start Application
```bash
# Using gunicorn
cd backend
source venv/bin/activate
gunicorn config.wsgi:application --bind 127.0.0.1:8002 --workers 4
```

### Step 9: Verify Deployment
- Open browser: https://khaz.app/kmsetjendpdri
- Check browser console for API errors
- Test admin: https://khaz.app/kmsetjendpdri/admin/

---

## 🐛 Troubleshooting

### Frontend not loading
- Check nginx config for React fallback (all routes → index.html)
- Check console for 404 errors
- Verify `base` is set in vite.config.js

### API calls returning 404
- Check ALLOWED_HOSTS includes khaz.app
- Check CORS_ALLOWED_ORIGINS is correct
- Check nginx proxies /api correctly

### Static files (CSS/JS) not loading
- Check STATIC_URL in settings.py
- Run: `python manage.py collectstatic`
- Check nginx serves from correct directory

### Media files not uploading
- Check MEDIA_ROOT has write permissions
- Check MEDIA_URL in settings.py
- Check nginx serves from media directory

### SSL certificate errors
- Certificate should already be set up via certbot
- Verify: `sudo certbot certificates`
- Renew if needed: `sudo certbot renew`

---

## 📊 Directory Structure on Server

```
/var/www/html/kmsetjendpdri/
├── backend/
│   ├── apps/
│   ├── config/
│   ├── staticfiles/          ← Collected static files (serve via nginx)
│   ├── media/                ← User uploads
│   ├── logs/                 ← Application logs
│   ├── venv/                 ← Python virtual environment
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── dist/                 ← Built React app (serve via nginx)
│   ├── node_modules/
│   ├── vite.config.js
│   └── package.json
├── docs/
├── .env                      ← Production environment (created from .env.production)
├── docker-compose.yml
└── README.md
```

---

## 🔒 Security Reminders

1. **Change SECRET_KEY** to a random string (50+ characters)
2. **Use strong database password**
3. **Use strong Redis password** (if using Redis)
4. **Set DEBUG=False** in production
5. **Use HTTPS only** (already configured)
6. **Restrict file permissions** on `.env` file:
   ```bash
   chmod 600 .env
   ```
7. **Use environment-specific credentials** for each service
8. **Keep software updated**: `sudo apt upgrade`

---

## 📞 Support

For issues or questions, check:
1. Django logs: `backend/logs/django.log`
2. Nginx logs: `/var/log/nginx/error.log`, `/var/log/nginx/access.log`
3. Browser console: Check for JavaScript errors
4. Gunicorn output: Check terminal where gunicorn was started
