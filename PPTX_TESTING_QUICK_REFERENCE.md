# PPTX Gallery - Quick Testing Guide

## ✅ Expected Browser Console Output (When Working)

After clicking Preview on a 14-page PPTX file, you should see these logs:

```javascript
// Initial load
[PptxGallery] Loading presentation - articleId: 35, fileId: 42

// API responses (check status: 200)
[PptxGallery] pptx_info response: {
  file_id: 42,
  filename: "Bahan_Internal_Best_Practice_Perencanaan_dan_Penganggaran_APBN.pptx",
  file_size: 1234567,
  slide_count: 14,
  title: "Best Practice Perencanaan...",
  width: 960,
  height: 720,
  aspect_ratio: "1.33:1"
}

[PptxGallery] thumbnails_all response - total slides: 14, thumbnails loaded: 14
```

## ❌ Error Symptoms (If Not Working)

### **Symptom 1: 404 Errors**
```javascript
[PptxGallery] API load failed: {
  status: 404,
  message: "Not Found",
  url: "http://localhost:8002/api/v1/internal/articles/35/files/42/pptx_info/"
}
```
**Fix:** URL patterns not registered. Restart Django server.

### **Symptom 2: 500 Errors**
```javascript
[PptxGallery] API load failed: {
  status: 500,
  message: "Internal server error",
  url: "http://localhost:8002/api/v1/internal/articles/35/files/42/thumbnails_all/"
}
```
**Fix:** Check Django logs for python-pptx import error. Run: `pip install python-pptx==1.0.2`

### **Symptom 3: Empty Thumbnails**
```javascript
[PptxGallery] thumbnails_all response - total slides: 14, thumbnails loaded: 0
```
**Fix:** Backend can't generate thumbnails. Check:
- Is Pillow installed? `pip install Pillow==10.1.0`
- Can file be read? Check file path exists
- Permissions issue? Check file is readable

## 🧪 Testing Steps

### **Step 1: Verify Backend URL Routes**
```bash
# In backend directory
python manage.py show_urls | grep -i pptx
```

Should show:
```
/api/v1/internal/articles/{article_id}/files/{id}/pptx_info/
/api/v1/internal/articles/{article_id}/files/{id}/thumbnails_all/
/api/v1/internal/articles/{article_id}/files/{id}/thumbnail/
/api/v1/internal/articles/{article_id}/files/{id}/convert_pdf/
```

### **Step 2: Test API Endpoint Directly**
```bash
# Get article ID and file ID first from UI
# Then test in browser or curl:

curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8002/api/v1/internal/articles/35/files/42/pptx_info/"

# Should return 200 with JSON like:
# {
#   "file_id": 42,
#   "slide_count": 14,
#   "title": "...",
#   ...
# }
```

### **Step 3: Test in UI**
1. Open http://localhost:5175/editor/35
2. Scroll to attachments section
3. Find PPTX file
4. Click "Preview" button
5. Open Developer Console (F12)
6. Look for logs with "pptx_info response" and "thumbnails_all response"
7. Verify UI shows thumbnail images

## 📊 Visual Verification

### **✅ WORKING (Correct Display)**
- Gallery shows 14 thumbnails in strip at bottom
- Main view displays first slide as image
- Slide counter shows "1 / 14"
- Prev/next buttons enabled/disabled correctly
- Fullscreen button visible
- Download button works

### **❌ NOT WORKING (Broken Display)**
- Gallery shows empty placeholder
- Main view shows "Slide 1" text only
- Slide counter shows "1 / 1"
- No thumbnail images visible
- Prev/next buttons greyed out
- Looks incomplete

## 🔧 Troubleshooting Commands

### **Check if python-pptx is installed:**
```bash
cd backend
python -c "from pptx import Presentation; print('OK')"
```

### **Check if Pillow is installed:**
```bash
python -c "from PIL import Image; print('OK')"
```

### **Restart Django with debug output:**
```bash
python manage.py runserver --verbosity=2
```

### **Clear cache in case of stale data:**
```bash
rm -rf backend/media/.pptx_cache/*
```

### **Test API with verbose output:**
```bash
# In browser console, with token from localStorage
const token = localStorage.getItem('access_token');
fetch('/api/v1/internal/articles/35/files/42/pptx_info/', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log(d))
```

## 📱 What Each Endpoint Does

### **GET `/pptx_info/`** (Fast)
- **Purpose:** Get presentation metadata (slide count, title, dimensions)
- **Time:** <50ms (reads PPTX header only)
- **Response:** JSON with basic info
- **Used for:** Display slide count, aspect ratio

### **GET `/thumbnails_all/`** (Slow First Run)
- **Purpose:** Generate PNG thumbnail for every slide
- **Time:** 500ms-2s (depends on slide count and complexity)
- **Caching:** Subsequent calls <100ms (cached on disk)
- **Response:** All slide thumbnails as base64 PNG data URLs
- **Used for:** Display thumbnail gallery strip

### **GET `/thumbnail/?slide=N`** (Fast)
- **Purpose:** Get single slide thumbnail by index
- **Time:** <50ms (cached)
- **Response:** Single thumbnail as base64 PNG
- **Used for:** (Optional, for lazy loading)

### **POST `/convert_pdf/`** (Very Slow)
- **Purpose:** Convert entire presentation to PDF
- **Time:** 5-30s (requires LibreOffice)
- **Requirements:** LibreOffice must be installed
- **Response:** PDF as base64 data URL
- **Used for:** PDF export feature (not yet implemented)

## 💡 Pro Tips

1. **First thumbnail load might be slow (500ms-2s)** - this is normal, subsequent loads are cached
2. **Check browser's Network tab** - should see GET requests returning 200 status
3. **Check browser's Application tab** - can inspect localStorage for token
4. **Enable Django debug toolbar** - shows SQL queries and request/response details
5. **Look at `backend/media/.pptx_cache/`** - thumbnails are cached here as PNG files

## 🎯 Success Criteria

You know it's working when:
- ✅ Browser console shows no 404 or 500 errors
- ✅ PptxGallery logs show successful API responses
- ✅ Thumbnail images are visible in the UI
- ✅ Slide counter shows correct number (e.g., "1 / 14")
- ✅ Navigation buttons work
- ✅ Fullscreen mode works
- ✅ No error messages in red text

---

**If you see "Slide 1 / 1" with no image, something is still broken. Follow the troubleshooting steps above!**
