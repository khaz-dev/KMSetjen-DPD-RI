# Avatar Image Loading Fix - Deployment Guide

## Summary of Changes

**Issue:** Avatar images (user avatars, navbar-avatar, avatar-preview-container) not loading on staging server (https://kms.khaz.app), but work fine on localhost.

**Root Cause:** Two-part problem:
1. Django not serving media files when DEBUG=False (production mode)
2. Nginx not configured to serve media files directly

**Solution:** 
1. ✅ Allow Django to serve media files regardless of DEBUG setting
2. ✅ Configure Nginx to serve media files directly from Docker volume

---

## 📝 Deployment Checklist

### Step 1: Verify Changes are in Place

**Backend URL Configuration:**
```bash
grep -A3 "Serve media and static" backend/config/urls.py
```
Should show:
```python
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
```

**Nginx Configuration:**
```bash
grep -A10 "Media Files - Serve directly" nginx-kms-subdomains.conf
```
Should show location block for `/media/` with Docker volume alias.

### Step 2: Deploy to Staging

**Option A: Using deploy-staging.ps1 (from Windows)**
```powershell
cd "d:\Project\KMSetjen DPD RI"
.\deploy-staging.ps1 -Verbose
```

**Option B: Manual SSH deployment**
```bash
# Copy .env.staging
scp -i ~/.ssh/khaz ~/.env.staging root@165.245.191.216:/var/www/html/kms/.env

# SSH to server
ssh -i ~/.ssh/khaz root@165.245.191.216

# On server:
cd /var/www/html/kms
git pull origin main
chmod +x deploy-master.sh
sudo ./deploy-master.sh staging
```

### Step 3: Post-Deployment Verification

**On staging server (SSH):**

```bash
# 1. Verify Docker volume has media files
ls -lh /var/lib/docker/volumes/kms_kms_django_media/_data/avatars/

# 2. Test Nginx config
sudo nginx -t

# 3. Verify Nginx is reloaded
sudo systemctl status nginx

# 4. Check Django is running
docker ps | grep django

# 5. Test media file access
curl -I https://kms-be.khaz.app/media/avatars/user_1.jpg
# Should return: HTTP/2 200 OK

# 6. Monitor Nginx media log (in separate terminal)
sudo tail -f /var/log/nginx/kms-media-access.log

# 7. Test frontend health
curl -I https://kms.khaz.app/admin/users
```

**From browser:**

1. **Navigate to:** https://kms.khaz.app/admin/users
2. **Login** as admin user with avatar
3. **Check Navbar Avatar:**
   - Look for user avatar in top-right corner
   - Right-click → Inspect Element
   - Verify `<img>` tag loads (no 404)
   - Check Network tab: image should be 200 OK
4. **Check Profile Page:**
   - Navigate to Profile
   - Avatar preview should display
   - Check Network tab: no 404 errors
5. **Check Console:**
   - Open DevTools → Console
   - Should see NO errors related to `/media/avatars/`
   - Should see logs like: `[API] Added Authorization header for: GET https://kms-be.khaz.app/media/avatars/user_1.jpg`

### Step 4: Verify URL Construction

**In browser console (F12):**
```javascript
// Check URL construction
localStorage.getItem('access_token')  // Should have token

// Simulate getAbsoluteMediaUrl function
const mediaUrl = "/media/avatars/user_1.jpg";
const expectedUrl = "https://kms-be.khaz.app/media/avatars/user_1.jpg";
console.log("Media URL:", mediaUrl);
console.log("Expected:", expectedUrl);
```

---

## 🧪 Testing Scenarios

### Scenario 1: User with Avatar
1. Login as user with avatar set
2. Avatar should display in navbar
3. Click profile → avatar displays in preview
4. All images load without 404

### Scenario 2: Upload New Avatar
1. Navigate to Profile page
2. Click avatar preview area
3. Select an image file
4. Upload completes successfully
5. New avatar displays immediately
6. Avatar shows in navbar after page refresh

### Scenario 3: Different Image Formats
1. Test with .jpg, .png files
2. Avatar should display correctly for all formats
3. No console errors

### Scenario 4: Load Time
1. Navigate to /admin/users
2. Avatars should load quickly (Nginx direct serve)
3. Should NOT see proxying delays

---

## 🔧 Troubleshooting

### Issue: 404 Still for Avatar Images

**Check 1: Verify Nginx config loaded**
```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx
```

**Check 2: Verify Docker volume exists**
```bash
ls -la /var/lib/docker/volumes/kms_kms_django_media/_data/
```
Should show `avatars/` directory with user avatar files.

**Check 3: Verify file permissions**
```bash
sudo ls -la /var/lib/docker/volumes/kms_kms_django_media/_data/avatars/
sudo stat /var/lib/docker/volumes/kms_kms_django_media/_data/avatars/user_1.jpg
```

**Check 4: Test Nginx directly**
```bash
sudo curl -I http://127.0.0.1/media/avatars/user_1.jpg
```

**Check 5: Check Nginx error log**
```bash
sudo tail -f /var/log/nginx/kms-backend-error.log
sudo tail -f /var/log/nginx/kms-media-error.log
```

### Issue: Avatars Load But Slowly

**Check:** Monitor Nginx access log  
```bash
sudo tail -f /var/log/nginx/kms-media-access.log
```
Should show direct file serving (not proxied).

### Issue: Browser Cache Issue

**Solution:**
```bash
# Hard refresh
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# Or clear browser cache
# Settings → Privacy → Clear browsing data → Cached images/files
```

### Issue: CORS Error

**Check:** Browser console for CORS errors  
If seeing CORS errors:
```bash
# Verify Django responses include CORS headers
curl -I -H "Origin: https://kms.khaz.app" https://kms-be.khaz.app/media/avatars/user_1.jpg
# Should include: `Access-Control-Allow-Origin: https://kms.khaz.app`
```

---

## 📊 Expected Behavior After Fix

| Component | Before | After |
|-----------|--------|-------|
| Navbar Avatar | 404, not displayed | ✅ Displays immediately |
| Profile Avatar | 404, not displayed | ✅ Displays immediately |
| Avatar Upload | Works on local only | ✅ Works on both local and staging |
| Image Cache | Not cached | ✅ 30-day cache (fast) |
| Loading Performance | N/A (404) | ✅ Fast (direct Nginx serve) |
| Network Requests | Proxied to Django | ✅ Direct from Nginx (better) |

---

## 🚨 Rollback Instructions

If issues occur, rollback to previous versions:

```bash
# Rollback files
cd /var/www/html/kms
git checkout HEAD -- backend/config/urls.py
git checkout HEAD -- nginx-kms-subdomains.conf

# Restart services
docker-compose restart django
sudo nginx -t && sudo systemctl reload nginx

# Verify rollback
curl -I https://kms-be.khaz.app/media/avatars/user_1.jpg
```

---

## 📋 Files Modified

| File | Lines | Change |
|------|-------|--------|
| `backend/config/urls.py` | 63-68 | Removed DEBUG condition for media serving |
| `nginx-kms-subdomains.conf` | 189-204 | Added /media/ location handler |

---

## ✅ Validation Commands

Run these after deployment to confirm everything works:

```bash
# 1. Django can serve media
docker-compose exec -T django python manage.py shell -c "from django.conf import settings; print(f'MEDIA_URL: {settings.MEDIA_URL}'); print(f'MEDIA_ROOT: {settings.MEDIA_ROOT}')"

# 2. Docker volume has files
docker-compose exec -T django ls -la /app/media/avatars/

# 3. Nginx can serve files directly
sudo curl -I http://127.0.0.1/media/avatars/user_1.jpg | head -5

# 4. HTTPS access works
curl -I https://kms-be.khaz.app/media/avatars/user_1.jpg | head -5

# 5. Response headers are correct
curl -i https://kms-be.khaz.app/media/avatars/user_1.jpg | grep -E "Content-Type|Cache-Control|Content-Length" | head -3
```

---

## 📞 Support / Questions

If avatars still don't load after following steps:

1. **Check browser console (F12)** for any error messages
2. **Check Network tab** to see actual request/response
3. **SSH to server and check logs:**
   - `sudo tail -f /var/log/nginx/kms-media-error.log`
   - `sudo tail -f /var/log/nginx/kms-backend-error.log`  
   - `docker logs kms_django`
4. **Verify .env.staging has:**
   ```bash
   DEBUG=False
   VITE_API_BASE_URL=https://kms-be.khaz.app/api
   VITE_API_URL=https://kms-be.khaz.app
   ```

---

**Status:** ✅ READY FOR DEPLOYMENT  
**Risk Level:** LOW (configuration changes only, no code logic changes)  
**Estimated Fix Time:** 2-5 minutes  
**Testing Time:** 10-15 minutes
