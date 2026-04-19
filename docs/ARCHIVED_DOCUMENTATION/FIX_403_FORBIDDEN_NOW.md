# QUICK FIX: 403 Forbidden Error at https://khaz.app/kmsetjendpdri/

## Root Causes & Solutions

### Problem: 403 Forbidden

The 403 Forbidden error means nginx found the location but doesn't have permission to serve the file, usually because:

1. **Frontend not built** - `dist/index.html` doesn't exist
2. **Permission denied** - nginx can't read the files
3. **Path wrong** - nginx looking in wrong directory

---

## Immediate Fix (5 minutes)

### Step 1: SSH into Server
```bash
ssh -i c:\Users\khair\khaz root@165.245.191.216
```

### Step 2: Check if dist exists
```bash
ls -la /var/www/html/kmsetjendpdri/dist/index.html
```

**If file not found**, go to Step 4.

**If file exists**, go to Step 3.

### Step 3: Fix Permissions (if dist exists)
```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/html/kmsetjendpdri/dist/

# Set directory permissions
sudo chmod -R 755 /var/www/html/kmsetjendpdri/dist/

# Set file permissions
sudo chmod 644 /var/www/html/kmsetjendpdri/dist/*

# Make index.html readable
sudo chmod 644 /var/www/html/kmsetjendpdri/dist/index.html

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx

# Test
curl -I https://khaz.app/kmsetjendpdri/
# Should return 200 OK, not 403
```

Skip to Step 5 if this worked.

### Step 4: Build Frontend
```bash
cd /var/www/html/kmsetjendpdri/

# Delete old dist
rm -rf frontend/dist/

# Install dependencies
cd frontend
npm ci --legacy-peer-deps

# Build with correct subpath
VITE_APP_SUBPATH=/kmsetjendpdri npm run build

# Verify it was created
ls -la dist/
# Should show: index.html, assets/ directory

# Fix permissions
sudo chown -R www-data:www-data dist/
sudo chmod -R 755 dist/
sudo chmod 644 dist/index.html

# Go back to root
cd ../

# Stop any running frontend container (if using Docker)
docker-compose stop kms_frontend 2>/dev/null || true

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

### Step 5: Verify Fix
```bash
# Test locally
curl -I https://khaz.app/kmsetjendpdri/
# Should return: HTTP/2 200

# Check nginx error log for errors
tail -20 /var/log/nginx/kmsetjendpdri_error.log
# Should be empty or only warnings

# Test from browser
# Open: https://khaz.app/kmsetjendpdri/
# Should see the React app, not 403 Forbidden
```

---

## Nginx Config Verification

If still getting 403, verify nginx config:

```bash
# Check syntax
sudo nginx -t

# Check the config file
sudo cat /etc/nginx/sites-available/kmsetjendpdri | grep -A3 "location /kmsetjendpdri/"

# Should show:
# location /kmsetjendpdri/ {
#     root /var/www/html;
#     try_files /kmsetjendpdri/dist/$uri /kmsetjendpdri/dist/index.html;
```

If config is wrong, fix it:

```bash
# Edit config
sudo nano /etc/nginx/sites-available/kmsetjendpdri

# Or copy from project
sudo cp /var/www/html/kmsetjendpdri/nginx-kmsetjendpdri-config.conf /etc/nginx/sites-available/kmsetjendpdri

# Enable if not enabled
sudo ln -s /etc/nginx/sites-available/kmsetjendpdri /etc/nginx/sites-enabled/kmsetjendpdri

# Test
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

---

## Detailed Diagnostics

If still not working, gather diagnostics:

```bash
# 1. Check if dist directory even exists
ls -la /var/www/html/kmsetjendpdri/dist/
# Expected: index.html, assets/ directory

# 2. Check index.html permissions
ls -la /var/www/html/kmsetjendpdri/dist/index.html
# Expected: -rw-r--r-- (644) owner www-data

# 3. Check nginx is running
sudo systemctl status nginx
# Expected: active (running)

# 4. Check for nginx errors
sudo tail -50 /var/log/nginx/kmsetjendpdri_error.log

# 5. Check nginx access log
sudo tail -50 /var/log/nginx/kmsetjendpdri_access.log
# Look for: 403 errors with /kmsetjendpdri/ requests

# 6. Check DNS resolution
nslookup khaz.app
# Should return IP address

# 7. Test nginx config syntax
sudo nginx -t

# 8. Reload nginx with verbose output
sudo systemctl reload nginx
systemctl status nginx
```

---

## Advanced Debugging

### Check Nginx Process
```bash
# See nginx processes
ps aux | grep nginx

# Should show master and worker processes
```

### Check File Permissions in Detail
```bash
# Detailed permission check
stat /var/www/html/kmsetjendpdri/dist/index.html

# Check if www-data can read it
sudo -u www-data cat /var/www/html/kmsetjendpdri/dist/index.html > /dev/null && echo "OK" || echo "FAILED"
```

### Test Direct File Access
```bash
# SSH into server and test locally
curl -v -I http://localhost/kmsetjendpdri/
# This bypasses DNS

# Or test with explicit file
curl -v -I http://localhost/var/www/html/kmsetjendpdri/dist/index.html
```

### Reload Nginx Completely
```bash
# Hard restart (might drop connections)
sudo systemctl restart nginx

# Wait a moment
sleep 2

# Verify running
sudo systemctl status nginx

# Test
curl -I https://khaz.app/kmsetjendpdri/
```

---

## Still Getting 403?

### Check These Common Issues

1. **Is nginx serving static files or proxying?**
   ```bash
   # Check which nginx config is being used
   sudo nginx -T | grep kmsetjendpdri
   ```

2. **Is there a conflicting location block?**
   ```bash
   # Check for overlapping routes
   sudo grep -n "location" /etc/nginx/sites-available/kmsetjendpdri
   ```

3. **Are you behind a proxy?**
   ```bash
   # Check headers
   curl -I https://khaz.app/kmsetjendpdri/ -H "verbose"
   ```

4. **Is Docker frontend container interfering?**
   ```bash
   # Stop container
   docker-compose stop kms_frontend

   # Try again
   curl -I https://khaz.app/kmsetjendpdri/

   # Then rebuild if needed
   docker-compose build kms_frontend
   docker-compose up -d kms_frontend
   ```

5. **Wrong server responding?**
   ```bash
   # Check which server is handling requests
   curl -I https://khaz.app/kmsetjendpdri/ -v | grep -i "server:"
   ```

---

## When to Use Docker vs Static Files

### If Using Docker Frontend:
- Files served from Docker container
- Must be accessible via port 5175
- Nginx proxies to http://localhost:5175

To check if using Docker:
```bash
docker-compose ps | grep frontend
# If running, it's using Docker frontend
```

### If Using Static Files:
- Frontend built to `/var/www/html/kmsetjendpdri/dist/`
- Nginx serves directly with try_files
- No container needed after build

To use static files properly:
```bash
# Build frontend
cd /var/www/html/kmsetjendpdri/frontend
VITE_APP_SUBPATH=/kmsetjendpdri npm run build

# Verify dist folder
ls dist/index.html

# Stop Docker frontend container (if running)
docker-compose stop kms_frontend

# Reload nginx
sudo systemctl reload nginx
```

---

## Final Verification Checklist

- [ ] `ls /var/www/html/kmsetjendpdri/dist/index.html` - File exists
- [ ] `stat /var/www/html/kmsetjendpdri/dist/index.html` - Permissions 644, owned by www-data
- [ ] `sudo nginx -t` - Configuration "successful"
- [ ] `sudo systemctl status nginx` - Is active and running
- [ ] `curl -I http://localhost/kmsetjendpdri/` - Returns 200 OK locally
- [ ] `curl -I https://khaz.app/kmsetjendpdri/` - Returns 200 OK externally
- [ ] Check browser: https://khaz.app/kmsetjendpdri/ - Loads without 403

---

## Support Quick Commands

```bash
# View real-time logs
sudo journalctl -u nginx -f

# Check disk space
df -h /var/www/html

# Clear nginx cache
sudo systemctl reload nginx

# Restore from backup (if needed)
sudo rm -rf /var/www/html/kmsetjendpdri/dist
# Rebuild frontend as above
```

---

**If still stuck after trying all above steps:**

1. Share Docker section of this guide and run deployment script
2. Check output of: `sudo tail -100 /var/log/nginx/kmsetjendpdri_error.log`
3. Share DNS/server info for further investigation

**Most Common Fix**: Missing `dist` folder or wrong permissions (90% of 403 errors)
