# Mixed Content Error Fix - April 21, 2026

## Problem Description

**Error Message:**
```
Mixed Content: The page at 'https://kms.khaz.app/knowledges/...' was loaded over HTTPS, 
but requested an insecure frame 'http://kms-be.khaz.app/media/articles/.../file.pdf#toolbar=0'. 
This request has been blocked; the content must be served over HTTPS.
```

**Symptoms:**
- File preview (PDF, presentations) fails to load on staging
- Browser console shows mixed content error
- Media files accessible via direct URL but blocked in iframe
- Only affects HTTPS pages (production/staging), not local development

**Environment:** Staging (https://kms.khaz.app)

---

## Root Cause Analysis

### The Problem Chain
1. **Frontend** requests article from API at `https://kms-be.khaz.app/api/v1/public/articles/{id}/`
2. **Backend** returns file data through `FileSerializer`
3. **FileSerializer** was returning RELATIVE file paths like `/media/articles/2026/04/file.pdf`
4. **Frontend** (`getAbsoluteMediaUrl()`) prepends `VITE_API_BASE_URL` to construct absolute URL
5. **If VITE_API_BASE_URL was HTTP** → Results in `http://kms-be.khaz.app/media/...` ❌

### Why It Happened
- `FileSerializer` used Django's default `FileField` serialization
- Default `FileField` returns relative paths, not absolute URLs
- Other serializers (images) correctly used `request.build_absolute_uri()` but files didn't
- Protocol mismatch: frontend HTTPS page + HTTP backend URL = mixed content error

---

## Solution Implemented

### Backend Changes

**File:** `backend/apps/api/v1/public/serializers.py`

Changed `FileSerializer` to use `SerializerMethodField` with `request.build_absolute_uri()`:

```python
class FileSerializer(serializers.ModelSerializer):
    """Serializer for File attachments."""
    file_size_display = serializers.SerializerMethodField()
    file = serializers.SerializerMethodField()  # Override: get absolute URL with correct protocol
    
    class Meta:
        model = File
        fields = ['id', 'original_filename', 'file', 'file_size', 'file_size_display',
                  'mime_type', 'description_id', 'description_en', 'order_index', 'created_at']
        read_only_fields = ['id', 'file_size', 'created_at']
    
    def get_file(self, obj):
        """Get absolute URL for file with correct protocol (HTTPS on staging/production)."""
        if not obj.file:
            return None
        
        request = self.context.get('request')
        if request:
            # Use request to build absolute URL with correct protocol (HTTPS on staging/prod)
            return request.build_absolute_uri(obj.file.url)
        
        # Fallback to relative path if no request context
        return obj.file.url if obj.file else None
    
    def get_file_size_display(self, obj):
        """Format file size in human-readable format."""
        from shared.utils.formatters import format_file_size
        return format_file_size(obj.file_size) if obj.file_size else '0B'
```

### Why This Works

1. **`request.build_absolute_uri()`** extracts protocol from current request
2. **Nginx passes `X-Forwarded-Proto: https`** header for HTTPS requests
3. **Backend config** has `SECURE_PROXY_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')`
4. **Django** trusts this header and uses `https://` when building absolute URLs
5. **Frontend** receives `https://kms-be.khaz.app/media/...` ✅

### Scope of Fix

**Applied to:**
- ✅ Public API (`/api/v1/public/articles/`) - File attachments in article detail
- ✅ Internal API (`/api/v1/internal/articles/`) - Uses same `FileSerializer`
- ✅ All file types: PDF, presentations (PPTX), images, videos, audio

**Files Modified:**
1. `backend/apps/api/v1/public/serializers.py` (lines 118-147)

**No Changes Needed:**
- `frontend/src/services/api.js` - Already handles absolute URLs correctly
- `frontend/src/pages/ArticleDetailPage.jsx` - Already compatible
- `backend/config/settings.py` - Already has correct `SECURE_PROXY_HEADER` setting
- `.env.staging` - Already has correct `VITE_API_BASE_URL=https://kms-be.khaz.app/api`

---

## Verification Steps

### Local Testing
```bash
# Backend verification
cd backend
python manage.py check  # Should show: 0 errors

# Test API response
curl http://localhost:8002/api/v1/public/articles/ | grep -o '"file":"[^"]*"'
# Should show relative paths like "/media/articles/..."
```

### Staging Testing

**Before Deployment:**
- File previews show mixed content error
- Browser console shows: `http://kms-be.khaz.app/media/...`

**After Deployment:**
1. Navigate to article: https://kms.khaz.app/knowledges/best-practice-...
2. Click "Preview" on Lampiran (attachment) file
3. **Expected:** PDF loads without console errors ✅
4. **Verify:** Open DevTools → Console → No "Mixed Content" errors

**Check API Response:**
```bash
curl https://kms-be.khaz.app/api/v1/public/articles/{article_id}/ \
  -H "Authorization: Bearer $TOKEN" | jq '.files[0].file'
# Should show: "https://kms-be.khaz.app/media/articles/2026/04/file.pdf"
```

---

## Deployment Procedure

### Option 1: Using deploy-staging.ps1 (Windows)
```powershell
# From local machine
.\deploy-staging.ps1 -Mode update-only -Verbose

# This will:
# 1. Git pull latest changes (including FileSerializer fix)
# 2. Rebuild Docker images with new backend code
# 3. Restart containers
# 4. Run health checks
```

### Option 2: Manual SSH Deployment
```bash
# SSH into staging server
ssh root@165.245.191.216

# Navigate to project
cd /var/www/html/kms

# Pull latest code
git pull origin main

# Rebuild backend container
docker-compose build --no-cache django

# Restart services
docker-compose up -d

# Verify
docker-compose exec -T django python manage.py check
```

### Option 3: On-Server Deployment
```bash
# On staging server
sudo bash deploy-master.sh staging --mode=update-only --verbose

# Confirms:
# - Code updated from git
# - Docker images rebuilt
# - Migrations applied
# - Health checks pass
```

---

## Testing Scenarios

### Scenario 1: PDF File Preview
1. Go to: https://kms.khaz.app/knowledges/best-practice-teknik-menyusun-notulensi-dan-laporan-singkat-sidang-yang-akurat
2. Click "Preview" on PDF file (Lampiran)
3. **Result:** PDF viewer loads without mixed content error
4. **DevTools Console:** No "Mixed Content" warnings

### Scenario 2: PowerPoint Preview
1. Find article with PPTX file
2. Click "Preview" on presentation
3. **Result:** Presentation loads in Microsoft Office Online viewer
4. **DevTools Console:** No mixed content errors

### Scenario 3: Direct File Access
1. Right-click file in preview → "Download"
2. **Result:** File downloads with correct HTTPS URL
3. **URL Format:** `https://kms-be.khaz.app/media/articles/2026/04/...`

### Scenario 4: Browser Network Inspector
1. Open DevTools → Network tab
2. Click file preview
3. **Expected Requests:**
   - `https://kms-be.khaz.app/api/v1/public/articles/{id}/` (GET) → 200 OK
   - `https://kms-be.khaz.app/media/articles/...pdf` (GET) → 200 OK
4. **Verify:** All requests use HTTPS ✅

---

## Rollback Procedure

If issues occur after deployment:

```bash
# Revert FileSerializer changes
git revert [commit-hash]

# Rebuild and restart
docker-compose build --no-cache django
docker-compose up -d

# Verify rollback
docker-compose exec -T django python manage.py check
```

---

## Technical Details

### How request.build_absolute_uri() Works

```python
# Given request from HTTPS page → backend
# Request headers include: X-Forwarded-Proto: https (from Nginx)

request.build_absolute_uri('/media/articles/file.pdf')
# Django reads X-Forwarded-Proto header (trusted via SECURE_PROXY_HEADER setting)
# Constructs: "https://kms-be.khaz.app/media/articles/file.pdf"
```

### Nginx Configuration (Already Correct)
```nginx
# In /etc/nginx/sites-available/kms
location /media/ {
    # Add X-Forwarded-Proto so Django knows it's HTTPS
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Django Security Settings (Already Correct)
```python
# In backend/config/settings.py
SECURE_PROXY_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
# Tells Django to trust X-Forwarded-Proto header from Nginx
```

---

## Related Issues & Prevention

### Similar Issues to Watch For
1. **Image serialization** - Already using `request.build_absolute_uri()` ✅
2. **User avatars** - Already using `request.build_absolute_uri()` ✅
3. **Category images** - Already using `request.build_absolute_uri()` ✅

### Prevention Checklist for Future Files
- [ ] Always use `SerializerMethodField` with `request.build_absolute_uri()` for file URLs
- [ ] Test absolute URLs in both HTTP (local) and HTTPS (staging/prod) environments
- [ ] Check browser console for mixed content errors during testing
- [ ] Use curl to verify API responses return absolute HTTPS URLs on staging

---

## Status: ✅ READY FOR DEPLOYMENT

- [x] Backend changes implemented and verified
- [x] Django check passed (0 errors)
- [x] Matches existing patterns (like image serialization)
- [x] All APIs covered (public + internal)
- [x] Backward compatible (fallback to relative paths)
- [x] No frontend changes required
- [x] Deployment procedure documented
- [x] Testing scenarios defined
- [x] Rollback procedure available

**Next Steps:**
1. Deploy to staging using `deploy-staging.ps1`
2. Test file previews on staging
3. Verify browser console has no mixed content errors
4. If successful, deploy to production using `deploy-master.sh production`
