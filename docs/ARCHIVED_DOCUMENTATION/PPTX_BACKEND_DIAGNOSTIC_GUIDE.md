# PPTX Backend - Deep Diagnostic & Fix Guide

## 🔴 **The Issue**
Backend returning 500 error with "Failed to read presentation" when frontend calls `/pptx_info/` endpoint.

## 🔍 **Root Cause Analysis**

The error is most likely caused by **one of these**:

1. **Django didn't reload after python-pptx was installed**
   - python-pptx might not be imported when pptx_processor.py was first loaded
   - `HAS_PPTX` flag would be False
   - All PPTX processing would fail

2. **python-pptx import failing silently**
   - If import fails, `HAS_PPTX = False` without logging
   - `get_pptx_info()` returns None immediately
   - Backend returns 500 error

3. **File path or permission issue**
   - File path might be incorrect or inaccessible
   - Permissions might prevent reading the file

## ✅ **Fixes Applied**

### **1. Enhanced Error Logging**
Added comprehensive logging to identify exact failure point:

**In pptx_processor.py - get_pptx_info():**
```python
logger.info(f"[PPTX_INFO] Opening file: {pptx_file_path}")
logger.info(f"[PPTX_INFO] File size: {file_size} bytes")
logger.error(f"[PPTX_INFO] Error reading PPTX info: {error}", exc_info=True)
```

**In pptx_endpoints.py - pptx_info():**
```python
if not HAS_PPTX:
    logger.error("[PPTX_INFO_ACTION] python-pptx is not installed")
    return 503 error
logger.info(f"[PPTX_INFO_ACTION] File path: {file_path}")
logger.info(f"[PPTX_INFO_ACTION] Successfully got info: {info}")
```

### **2. HAS_PPTX Check**
Added explicit check at module import time:
```python
logger.info(f"[PPTX_ENDPOINTS] Initialized - HAS_PPTX: {HAS_PPTX}")
```

---

## 🚀 **What You Need To Do**

### **CRITICAL: Restart Django**
The Django server must be restarted for modules to be freshly imported:

```bash
# Stop the current Django server (Ctrl+C)
# Then run:
python manage.py runserver
```

**Why:** When Python imports a module, it caches the import. If `pptx_processor.py` was imported before python-pptx was installed, the `HAS_PPTX` flag would still be False. Restarting forces Python to reimport everything.

### **Step 1: Restart Django**
```bash
cd backend
# Kill existing process (Ctrl+C if running)
# Then:
python manage.py runserver
```

You should see in the console:
```
[PPTX_ENDPOINTS] Initialized - HAS_PPTX: True
```

If you see `HAS_PPTX: False`, then python-pptx is NOT actually installed. Run:
```bash
pip install python-pptx==1.0.2
```

### **Step 2: Test the Endpoint**
In browser, go to http://localhost:5175/editor/35 and click Preview on PPTX file.

Check browser console for:
```
[PptxGallery] pptx_info response: { slide_count: 14, ... }
```

### **Step 3: Check Backend Logs**
If still getting 500 error, look at Django terminal for these logs:

**If working correctly:**
```
[PPTX_ENDPOINTS] Initialized - HAS_PPTX: True
[PPTX_INFO_ACTION] Started - article_id: 35, pk: 21
[PPTX_INFO_ACTION] File object retrieved - id: 21, mime_type: application/vnd.openxmlformats-officedocument.presentationml.presentation
[PPTX_INFO_ACTION] File path: /path/to/file.pptx
[PPTX_INFO] Opening file: /path/to/file.pptx
[PPTX_INFO] File size: 1234567 bytes
[PPTX_INFO] Successfully opened PPTX - slides: 14
[PPTX_INFO_ACTION] Successfully got info: { slide_count: 14, ... }
```

**If python-pptx not installed:**
```
[PPTX_ENDPOINTS] Initialized - HAS_PPTX: False
[PPTX_INFO_ACTION] Started - article_id: 35, pk: 21
[PPTX_INFO_ACTION] python-pptx is not installed on server - cannot process presentations
```

**If file not found:**
```
[PPTX_INFO_ACTION] File path: /nonexistent/path/file.pptx
[PPTX_INFO_ACTION] File not found at path: /nonexistent/path/file.pptx
```

**If PPTX parsing fails:**
```
[PPTX_INFO] Opening file: /path/to/file.pptx
[PPTX_INFO] File size: 1234567 bytes
[PPTX_INFO] Error reading PPTX info: [error details], exc_info=True
```

---

## 🧪 **Troubleshooting Flowchart**

```
Is Django showing HAS_PPTX: True?
├─ YES → Is file path correct and file exists?
│   ├─ YES → Check if PPTX is valid file format
│   │   └─ Run: python -c "from pptx import Presentation; Presentation('/path/to/file.pptx')"
│   └─ NO → Check file permissions and storage path
│
└─ NO → python-pptx not installed
    └─ Run: pip install python-pptx==1.0.2
    └─ Restart Django server
```

---

## 📋 **Files Modified**

1. **backend/shared/utils/pptx_processor.py**
   - Enhanced `get_pptx_info()` with detailed logging
   - Added file existence and size checks
   - Added try/except with full traceback logging

2. **backend/apps/api/v1/internal/pptx_endpoints.py**
   - Added import of `HAS_PPTX` flag
   - Added explicit check for python-pptx availability
   - Enhanced logging at each step
   - Better error messages with context

---

## 💡 **Expected Behavior After Fix**

### **Working Correctly:**
1. Frontend calls `/pptx_info/` endpoint
2. Backend receives request
3. Django logs show:
   - `[PPTX_INFO_ACTION] Started`
   - `[PPTX_INFO] Opening file`
   - `[PPTX_INFO] Successfully opened PPTX - slides: 14`
   - `[PPTX_INFO_ACTION] Successfully got info`
4. Frontend receives response with slide count, dimensions, etc.
5. Frontend then calls `/thumbnails_all/` endpoint
6. Frontend receives all 14 thumbnails as base64 PNG images
7. Gallery displays all 14 slides with working navigation

### **Still Not Working:**
1. Check Django console output
2. Identify log message showing exact failure
3. Share that log message for further diagnosis

---

## 🎯 **Quick Fix Checklist**

- [ ] Restart Django (`python manage.py runserver`)
- [ ] Check Django logs for `HAS_PPTX: True`
- [ ] Check Django logs for `[PPTX_INFO_ACTION]` messages
- [ ] Refresh browser and click Preview on PPTX
- [ ] Check browser console for success logs with slide count
- [ ] Verify thumbnails are displayed in gallery

---

**Next: Restart Django and share the console output if it still doesn't work!**
