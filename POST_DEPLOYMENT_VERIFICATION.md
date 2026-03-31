# POST-DEPLOYMENT VERIFICATION CHECKLIST

## Immediate Steps After Deployment (First 5 Minutes)

### 1. Check All Services Are Running
```bash
# SSH into server
ssh -i khaz root@143.198.200.57

# Check all services
systemctl status postgresql
systemctl status redis-server
systemctl status kmsetjendpdri-gunicorn
systemctl status nginx

# Check if all return "active (running)" in green
```

### 2. Verify Backend Health
```bash
# Check if Gunicorn is listening
netstat -tlnp | grep 8002
# Should show: tcp 127.0.0.1:8002 LISTEN

# Check backend logs
sudo journalctl -u kmsetjendpdri-gunicorn -n 20
# Should show gunicorn workers started without errors
```

### 3. Verify Frontend Files Were Built
```bash
# Check if frontend dist exists and has files
ls -la /var/www/html/kmsetjendpdri/frontend/dist/
# Should show: index.html, css/, js/, assets/ directories

# Count files
find /var/www/html/kmsetjendpdri/frontend/dist -type f | wc -l
# Should show: 50+ files
```

### 4. Verify Database Connection
```bash
# Test database connection
cd /var/www/html/kmsetjendpdri/backend
source venv/bin/activate
export $(cat /var/www/html/kmsetjendpdri/.env | grep -v '#' | xargs)
python manage.py dbshell
# Type: SELECT 1;
# Should return: 1
# Type: \q (to exit)
```

### 5. Test API Endpoint
```bash
# From server terminal
curl -X GET http://127.0.0.1:8002/api/health/ -H "Content-Type: application/json"
# Should return: {"status": "ok"} or 200 OK response

# Or from local machine
curl -X GET https://khaz.app/kmsetjendpdri/api/health/ -H "Content-Type: application/json"
# Should return same response (via nginx proxy)
```

## Browser Testing (5 Minutes)

### 1. Visit Main URL
- **URL**: https://khaz.app/kmsetjendpdri/
- **Expected**: React application loads, no 404 errors
- **Check*:
  - [ ] Page title changes to "KMSetjen DPD RI"
  - [ ] Navigation menu appears at top
  - [ ] No red error messages in page
  - [ ] Footer loads at bottom

### 2. Check Console for Errors
- **Open**: Browser DevTools (F12 or Cmd+Option+I)
- **Tab**: Console
- **Expected**: No red error messages
- **Common Errors (If Any)**:
  - `Mixed Content: The page was loaded over HTTPS, but requested an insecure resource`
    - **Fix**: Update API URLs to use HTTPS in api.js
  - `Failed to fetch /api/...`
    - **Fix**: Check nginx is proxying requests to Gunicorn
  - `404 Not Found /kmsetjendpdri/static/...`
    - **Fix**: Run `python manage.py collectstatic` again

### 3. Check Network Tab
- **Open**: DevTools → Network tab
- **Reload**: Page (Cmd+R or Ctrl+R)
- **Check Status Codes**:
  - [ ] HTML file: 200 OK (from nginx serving dist/index.html)
  - [ ] CSS files: 200 OK (from nginx serving /kmsetjendpdri/static/)
  - [ ] JS bundles: 200 OK (from nginx serving /kmsetjendpdri/static/)
  - [ ] API calls: 200 OK or 401 Unauthorized (if auth required)
  - **Red/Orange entries**: Something is wrong, check nginx proxy config

### 4. Test Print Functionality
- **Navigate**: To an article page
- **Print**: Ctrl+P or Cmd+P
- **Check**:
  - [ ] Only article content visible in print preview
  - [ ] Navigation bar NOT visible
  - [ ] Footer NOT visible
  - [ ] Buttons NOT visible
  - [ ] Sidebar NOT visible

### 5. Test Authentication (If Applicable)
- **Navigate**: Try to access protected page or click "Login"
- **Expected**: Login form appears
- **After Login**: Should be redirected to dashboard/home

### 6. Test API Request from Browser
In browser console (F12 → Console tab):
```javascript
fetch('https://khaz.app/kmsetjendpdri/api/articles/')
  .then(r => r.json())
  .then(data => console.log(data))
```
**Expected**: JSON response with article data (or auth error if login required)

## Advanced Verification (Optional)

### 1. Test File Upload (Media)
- If app has file upload:
  - Upload a file
  - Check it appears in `/var/www/html/kmsetjendpdri/backend/media/`
  - Verify it's accessible via `https://khaz.app/kmsetjendpdri/media/...`

### 2. Test Static File Caching
```bash
# Check Cache-Control headers
curl -I https://khaz.app/kmsetjendpdri/static/css/main.css
# Should include: Cache-Control: public, max-age=31536000 (1 year)

curl -I https://khaz.app/kmsetjendpdri/media/image.jpg
# Should include: Cache-Control: public, max-age=2592000 (30 days)
```

### 3. Verify SSL Certificate
```bash
# From server or local machine
echo | openssl s_client -servername khaz.app -connect khaz.app:443 2>/dev/null | grep -A 2 "subject="
# Should show: subject=CN = khaz.app (or similar)

# Check expiration
echo | openssl s_client -servername khaz.app -connect khaz.app:443 2>/dev/null | grep -i "not after"
# Should show a date several months in the future
```

### 4. Performance Check
In browser DevTools → Lighthouse (or Pagespeed):
- Run audit
- Check scores
- Look for warnings about:
  - Missing charset UTF-8
  - Missing viewport meta tag
  - Unminified CSS/JS (should be minified in production build)

### 5. Database Backup Test
```bash
# Create backup
pg_dump -U kms_user -h localhost kmsdb_prod > /tmp/kms_backup.sql

# Verify backup size and lines
ls -lh /tmp/kms_backup.sql
wc -l /tmp/kms_backup.sql

# Should be: file size > 1MB (depending on data) and > 1000 lines
```

## Troubleshooting Guide

### Issue: Page Shows 404 Not Found

**1. Check nginx configuration:**
```bash
nginx -t  # Should say "test successful"
sudo systemctl restart nginx
```

**2. Check if dist folder exists:**
```bash
ls -la /var/www/html/kmsetjendpdri/frontend/dist/index.html
# Should exist
```

**3. Check nginx error log:**
```bash
sudo tail -f /var/log/nginx/kmsetjendpdri_error.log
# Should show what's wrong
```

### Issue: API Requests Return 502 Bad Gateway

**1. Check Gunicorn status:**
```bash
systemctl status kmsetjendpdri-gunicorn
# Should show "active (running)"
```

**2. Check if Gunicorn is listening:**
```bash
netstat -tlnp | grep 8002
# Should show listening on 127.0.0.1:8002
```

**3. Check Gunicorn logs:**
```bash
sudo journalctl -u kmsetjendpdri-gunicorn -n 50
# Look for error messages
```

**4. If Gunicorn crashed:**
```bash
cd /var/www/html/kmsetjendpdri/backend
source venv/bin/activate
export $(cat /var/www/html/kmsetjendpdri/.env | grep -v '#' | xargs)
gunicorn --bind 127.0.0.1:8002 --workers 4 config.wsgi:application
# Will show what's wrong; usually a Python error
```

### Issue: CSS/JS Files Return 404

**1. Check static files were collected:**
```bash
ls -la /var/www/html/kmsetjendpdri/backend/staticfiles/
# Should have: admin/, django_admin_freezegun/, rest_framework/ directories
```

**2. If missing, collect them:**
```bash
cd /var/www/html/kmsetjendpdri/backend
source venv/bin/activate
export $(cat /var/www/html/kmsetjendpdri/.env | grep -v '#' | xargs)
python manage.py collectstatic --noinput
```

**3. Check nginx is configured to serve static files:**
```bash
grep "location /kmsetjendpdri/static/" /etc/nginx/sites-available/kmsetjendpdri
# Should exist and point to backend/staticfiles/
```

### Issue: Database Connection Refused

**1. Check PostgreSQL is running:**
```bash
systemctl status postgresql
# Should show "active (running)"

# If not, start it:
sudo systemctl start postgresql
```

**2. Check database exists:**
```bash
sudo -u postgres psql -l | grep kmsdb_prod
# Should show the database listed
```

**3. Check database credentials in .env:**
```bash
grep "^DB_" /var/www/html/kmsetjendpdri/.env
# Verify DB_NAME, DB_USER, DB_PASSWORD are correct
```

### Issue: Static Files Not Loading (Styling Broken)

**The Most Common Reason**: VITE_APP_SUBPATH not set correctly

**1. Check environment variable:**
```bash
grep "VITE_APP_SUBPATH" /var/www/html/kmsetjendpdri/.env
# Should show: VITE_APP_SUBPATH=/kmsetjendpdri
```

**2. Rebuild frontend with variable set:**
```bash
cd /var/www/html/kmsetjendpdri/frontend
export $(cat /var/www/html/kmsetjendpdri/.env | grep -v '#' | xargs)
npm run build
```

**3. Clear nginx cache:**
```bash
sudo systemctl reload nginx
```

## Success Checklist

After running deploy-final.sh and all above tests, verify:

- [ ] **Services Running**
  - [ ] PostgreSQL active
  - [ ] Redis active
  - [ ] Gunicorn active
  - [ ] Nginx active

- [ ] **Network**
  - [ ] Port 80 redirects to HTTPS
  - [ ] Port 443 serves HTTPS with valid certificate
  - [ ] Gunicorn responds on 127.0.0.1:8002

- [ ] **Frontend**
  - [ ] https://khaz.app/kmsetjendpdri/ loads
  - [ ] CSS/JS files load (check Network tab)
  - [ ] No console errors (F12 → Console)
  - [ ] Print page looks correct (no navbar/footer)

- [ ] **Backend**
  - [ ] API endpoints respond (test in console)
  - [ ] Database connected
  - [ ] Static files served
  - [ ] Media uploads work (if applicable)

- [ ] **Security**
  - [ ] HTTPS enforced (http redirects to https)
  - [ ] .env file permissions are 600
  - [ ] DEBUG=False in production
  - [ ] SECRET_KEY is random/strong
  - [ ] Database password is randomized

## Emergency Rollback

If something goes catastrophically wrong:

```bash
# Stop services
sudo systemctl stop kmsetjendpdri-gunicorn nginx

# Restore from git
cd /var/www/html/kmsetjendpdri
git reset --hard HEAD~1

# Restart
sudo systemctl restart kmsetjendpdri-gunicorn nginx
```

## Next Steps

1. **Configure Email** (if needed)
   - Update EMAIL_* variables in .env
   - Test by triggering password reset

2. **Enable Monitoring** (optional)
   - Set up alerts for service crashes
   - Configure log rotation

3. **Set Up Backups**
   - Schedule daily PostgreSQL backups
   - Back up media files

4. **Performance Tuning** (if needed)
   - Monitor CPU/memory usage
   - Increase Gunicorn workers if needed

5. **SSL Auto-Renewal**
   - Set up certbot auto-renewal cron:
     ```bash
     sudo systemctl enable certbot-renew.service
     sudo systemctl enable certbot-renew.timer
     ```

---

**Questions?** Check the logs, search for error messages, and compare with this guide. Most issues are configuration-related and can be fixed by adjusting .env or nginx configuration.
