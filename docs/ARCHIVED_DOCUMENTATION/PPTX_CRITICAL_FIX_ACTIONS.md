# PPTX Gallery - Critical Fix Instructions

## 🎯 **Immediate Action Required**

The backend is returning 500 error when trying to process PPTX files. I've added comprehensive logging to diagnose the issue. Now you need to:

### **STEP 1: Restart Django Server**
This is **CRITICAL** - Django caches module imports. When python-pptx was installed, Django didn't reload the modules.

```bash
# In the backend terminal:
1. Stop Django (press Ctrl+C)
2. Run: python manage.py runserver
```

**Expected output in terminal:**
```
[PPTX_ENDPOINTS] Initialized - HAS_PPTX: True
Starting development server at http://127.0.0.1:8000
```

If you see `HAS_PPTX: False`, then python-pptx is NOT installed. Run:
```bash
pip install python-pptx==1.0.2 Pillow==10.1.0
```

### **STEP 2: Test in Browser**
1. Go to: http://localhost:5175/editor/35
2. Click Preview on the PPTX file
3. Open browser console (F12)

**Expected success logs:**
```
[PptxGallery] Loading presentation - articleId: 35, fileId: 21
[PptxGallery] pptx_info response: {
  file_id: 21,
  slide_count: 14,
  ...
}
[PptxGallery] thumbnails_all response - total slides: 14, thumbnails loaded: 14
```

### **STEP 3: Check Backend Logs**
Look at the Django terminal for detailed processing logs:

**For pptx_info endpoint:**
```
[PPTX_ENDPOINTS] Initialized - HAS_PPTX: True
[PPTX_INFO_ACTION] Started - article_id: 35, pk: 21
[PPTX_INFO_ACTION] File object retrieved - id: 21, mime_type: application/vnd.openxmlformats-officedocument.presentationml.presentation
[PPTX_INFO_ACTION] File path: /backend/media/articles/2026/04/...pptx
[PPTX_INFO] Opening file: /backend/media/articles/2026/04/...pptx
[PPTX_INFO] File size: 1234567 bytes
[PPTX_INFO] Successfully opened PPTX - slides: 14
[PPTX_INFO_ACTION] Successfully got info: {...}
```

**For thumbnails_all endpoint:**
```
[THUMBNAILS_ALL_ACTION] Started - article_id: 35, pk: 21
[THUMBNAILS_ALL_ACTION] File object retrieved - id: 21
[THUMBNAILS_ALL_ACTION] File path: ...
[THUMBNAILS_ALL_ACTION] Getting PPTX info...
[THUMBNAILS_ALL_ACTION] PPTX info retrieved - slides: 14
[THUMBNAILS_ALL_ACTION] Generating 14 thumbnails...
[THUMBNAIL_GEN] Starting - file: ..., slide: 0
[THUMBNAIL_GEN] Opened PPTX - total slides: 14
[THUMBNAIL_GEN] Retrieved slide 0
[THUMBNAIL_GEN] Creating image - size: 320x240, scale: 0.35
[THUMBNAIL_GEN] Rendered 12 shapes
[THUMBNAIL_GEN] Generated PNG - size: 45678 bytes
...
[THUMBNAILS_ALL_ACTION] Thumbnail generation complete - 14 thumbnails generated
```

---

## 📋 **Files Modified with Enhanced Logging**

1. **backend/shared/utils/pptx_processor.py**
   - `get_pptx_info()` - Detailed logging at every step
   - `generate_slide_thumbnail()` - Debug logging for thumbnail generation

2. **backend/apps/api/v1/internal/pptx_endpoints.py**
   - Module import log for HAS_PPTX status
   - `pptx_info()` - Comprehensive action logging
   - `thumbnails_all()` - Detailed step-by-step logging
   - Both actions now check if python-pptx is installed

---

## 🚨 **If Still Getting 500 Error**

### **Symptom 1: HAS_PPTX: False**
```
[PPTX_ENDPOINTS] Initialized - HAS_PPTX: False
```

**Fix:**
```bash
pip install python-pptx==1.0.2
python manage.py runserver
```

### **Symptom 2: File not found**
```
[PPTX_INFO_ACTION] File not found at path: /nonexistent/path/file.pptx
```

**Cause:** File storage path is incorrect
**Fix:** Check that uploaded file exists in media directory

### **Symptom 3: PPTX parsing error**
```
[PPTX_INFO] Error reading PPTX info from ...: [specific error]
```

**Fix:** Copy the error message and check if file is corrupted

### **Symptom 4: Thumbnail generation fails**
```
[THUMBNAILS_ALL_ACTION] Failed to generate thumbnail for slide 0
```

**Possible causes:**
- Pillow not installed: `pip install Pillow==10.1.0`
- PPTX file is corrupted
- File permissions issue

---

## ✅ **Success Indicators**

- [x] Django shows `[PPTX_ENDPOINTS] Initialized - HAS_PPTX: True`
- [x] Browser console shows pptx_info response with slide_count: 14
- [x] Browser console shows thumbnails_all response with 14 thumbnails
- [x] Backend logs show successful thumbnail generation
- [x] Gallery displays all 14 slides with working navigation
- [x] Thumbnails visible in the bottom strip
- [x] Main slide viewer shows current slide as image

---

## 🔧 **Technical Details**

### **Why Django Needs Restart**
Python imports modules once and caches them. If `pptx_processor.py` was imported before python-pptx was installed:
- Import statement would fail silently
- `HAS_PPTX` would be False
- All PPTX operations would fail

Solution: Restart Django to force fresh imports.

### **Why Comprehensive Logging**
With these detailed logs, we can pinpoint exactly where the failure occurs:
- If import failed → log shows `HAS_PPTX: False`
- If file not found → log shows file path and "File not found"
- If PPTX parsing failed → log shows exact exception
- If thumbnail rendering failed → log shows which slide and why

---

## 📞 **If Still Not Working**

Please share:
1. **Full Django console output** after restarting
2. **Browser console output** when clicking Preview
3. **Specific error message** from logs
4. **Output of this command**:
   ```bash
   python -c "from pptx import Presentation; print('python-pptx OK')"
   ```

---

## 🎯 **Expected Workflow After Fix**

1. ✅ Restart Django
2. ✅ See `HAS_PPTX: True` in console
3. ✅ Go to editor page
4. ✅ Click Preview on PPTX
5. ✅ See all 14 slides in gallery
6. ✅ Click thumbnails to navigate
7. ✅ Click fullscreen to view slide
8. ✅ Download original file

---

**Next: Restart Django and report the console output!**
