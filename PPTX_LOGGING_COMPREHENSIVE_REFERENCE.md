# PPTX Debugging - Complete Summary of Changes

## 📊 **Overview**
This document outlines every debugging enhancement made to diagnose why PPTX thumbnails aren't displaying (500 error: "Failed to read presentation").

---

## 🔧 **Backend Enhancements**

### **1. pptx_processor.py - get_pptx_info() Method**

**Added Comprehensive Logging:**
- File opening: `[PPTX_INFO] Opening file: {path}`
- File existence: `[PPTX_INFO] File does not exist: {path}`
- File size: `[PPTX_INFO] File size: {bytes} bytes`
- Successful open: `[PPTX_INFO] Successfully opened PPTX - slides: {count}`
- Result: `[PPTX_INFO] Result: {dictionary}`
- Errors: `[PPTX_INFO] Error reading PPTX info: {error}` with full traceback

**Changes Made:**
```python
# BEFORE (minimal logging):
prs = Presentation(pptx_file_path)
return {
    'slide_count': len(prs.slides),
    ...
}

# AFTER (comprehensive logging):
logger.info(f"[PPTX_INFO] Opening file: {pptx_file_path}")
if not os.path.exists(pptx_file_path):
    logger.error(f"[PPTX_INFO] File does not exist: {pptx_file_path}")
    return None

file_size = os.path.getsize(pptx_file_path)
logger.info(f"[PPTX_INFO] File size: {file_size} bytes")

try:
    prs = Presentation(pptx_file_path)
    logger.info(f"[PPTX_INFO] Successfully opened PPTX - slides: {len(prs.slides)}")
    # ... process and return result with logging
except Exception as e:
    logger.error(f"[PPTX_INFO] Error: {e}", exc_info=True)
    return None
```

---

### **2. pptx_processor.py - generate_slide_thumbnail() Method**

**Added Debug Logging:**
- Start: `[THUMBNAIL_GEN] Starting - file: ..., slide: {index}`
- PPTX open: `[THUMBNAIL_GEN] Opened PPTX - total slides: {count}`
- Image creation: `[THUMBNAIL_GEN] Creating image - size: {w}x{h}, scale: {s}`
- Shapes rendered: `[THUMBNAIL_GEN] Rendered {n} shapes`
- Completion: `[THUMBNAIL_GEN] Generated PNG - size: {bytes} bytes`
- Errors: `[THUMBNAIL_GEN] Error generating thumbnail for slide {i}: {error}` with traceback

**Purpose:** Track each step of thumbnail generation to identify where rendering fails.

---

### **3. pptx_endpoints.py - Module Initialization**

**Added HAS_PPTX Check:**
```python
from shared.utils.pptx_processor import PptxProcessor, CacheManager, HAS_PPTX

logger.info(f"[PPTX_ENDPOINTS] Initialized - HAS_PPTX: {HAS_PPTX}")
```

**Why:** Immediately shows if python-pptx is available when Django starts.

---

### **4. pptx_endpoints.py - pptx_info() Action**

**Added Diagnostic Logging at Each Step:**

| Step | Log | Type | Purpose |
|------|-----|------|---------|
| Import check | `[PPTX_INFO_ACTION] python-pptx is not installed` | ERROR | Early exit if dependency missing |
| Start | `[PPTX_INFO_ACTION] Started - article_id: 35, pk: 21` | INFO | Entry point tracking |
| File retrieved | `[PPTX_INFO_ACTION] File object retrieved - id: 21, mime_type: ...` | INFO | Confirm file found in DB |
| File type check | `[PPTX_INFO_ACTION] Not a presentation file - mime_type: ...` | WARNING | Validate file type |
| File path | `[PPTX_INFO_ACTION] File path: /media/articles/...` | INFO | Show resolved path |
| File exists | `[PPTX_INFO_ACTION] File not found at path: ...` | ERROR | Confirm file on disk |
| Processing | `[PPTX_INFO_ACTION] Calling PptxProcessor.get_pptx_info()` | INFO | Before expensive operation |
| Result | `[PPTX_INFO_ACTION] PptxProcessor.get_pptx_info() returned None` | ERROR | Catch silent failures |
| Success | `[PPTX_INFO_ACTION] Successfully got info: {...}` | INFO | Final result |
| Exception | `[PPTX_INFO_ACTION] Exception occurred: ...` | ERROR | Full traceback with exc_info=True |

**Error Responses:**
- 503 Service Unavailable → python-pptx not installed
- 400 Bad Request → Not a presentation file
- 404 Not Found → File not found on disk
- 500 Internal Server Error → Processing failed with details

---

### **5. pptx_endpoints.py - thumbnails_all() Action**

**Added Comprehensive Logging:**

| Phase | Logs | Purpose |
|-------|------|---------|
| **Init** | Check HAS_PPTX, log start | Verify dependencies |
| **File Validation** | File object, mime_type, file path, existence | Confirm file is accessible |
| **Info Retrieval** | Get PPTX info, log slide count | Determine how many thumbnails to generate |
| **Generation Loop** | Per-slide thumbnail generation, sizes | Track progress and diagnose individual slide failures |
| **Completion** | Total thumbnails generated | Final success confirmation |
| **Error Handling** | Full exception traces with exc_info=True | Capture all error details |

**Example Log Sequence:**
```
[THUMBNAILS_ALL_ACTION] Started - article_id: 35, pk: 21
[THUMBNAILS_ALL_ACTION] File object retrieved - id: 21
[THUMBNAILS_ALL_ACTION] File path: /backend/media/articles/2026/04/presentation.pptx
[THUMBNAILS_ALL_ACTION] Getting PPTX info...
[THUMBNAILS_ALL_ACTION] PPTX info retrieved - slides: 14
[THUMBNAILS_ALL_ACTION] Generating 14 thumbnails...
[THUMBNAIL_GEN] Starting - file: /backend/media/articles/2026/04/presentation.pptx, slide: 0
[THUMBNAIL_GEN] Opened PPTX - total slides: 14
[THUMBNAIL_GEN] Rendered 12 shapes
[THUMBNAIL_GEN] Generated PNG - size: 45678 bytes
[THUMBNAIL_GEN] Starting - file: /backend/media/articles/2026/04/presentation.pptx, slide: 1
[THUMBNAIL_GEN] Opened PPTX - total slides: 14
[THUMBNAIL_GEN] Rendered 15 shapes
[THUMBNAIL_GEN] Generated PNG - size: 52345 bytes
... (repeats for slides 2-13)
[THUMBNAILS_ALL_ACTION] Thumbnail generation complete - 14 thumbnails generated
```

---

## 🎯 **Diagnostic Flow**

### **Request Flow with Logging:**

```
Frontend Browser
    │
    ├─ /pptx_info/ endpoint
    │   │
    │   └─ Django: pptx_endpoints.py:pptx_info()
    │       │
    │       ├─ [PPTX_INFO_ACTION] Started
    │       ├─ [PPTX_INFO_ACTION] File object retrieved
    │       ├─ [PPTX_INFO_ACTION] File path: ...
    │       │
    │       └─ PptxProcessor.get_pptx_info()
    │           │
    │           ├─ [PPTX_INFO] Opening file: ...
    │           ├─ [PPTX_INFO] File size: ... bytes
    │           ├─ [PPTX_INFO] Successfully opened PPTX - slides: 14
    │           └─ [PPTX_INFO] Result: {...}
    │       │
    │       └─ [PPTX_INFO_ACTION] Successfully got info: {...}
    │
    ├─ /thumbnails_all/ endpoint
    │   │
    │   └─ Django: pptx_endpoints.py:thumbnails_all()
    │       │
    │       ├─ [THUMBNAILS_ALL_ACTION] Started
    │       ├─ [THUMBNAILS_ALL_ACTION] File path: ...
    │       ├─ [THUMBNAILS_ALL_ACTION] PPTX info retrieved - slides: 14
    │       │
    │       └─ Loop: Generate thumbnails (slides 0-13)
    │           │
    │           └─ For each slide:
    │               │
    │               ├─ CacheManager.cache_thumbnail()
    │               │   │
    │               │   └─ PptxProcessor.generate_slide_thumbnail()
    │               │       │
    │               │       ├─ [THUMBNAIL_GEN] Starting
    │               │       ├─ [THUMBNAIL_GEN] Opened PPTX - total slides: 14
    │               │       ├─ [THUMBNAIL_GEN] Creating image - size: 320x240, scale: 0.35
    │               │       ├─ [THUMBNAIL_GEN] Rendered 12 shapes
    │               │       └─ [THUMBNAIL_GEN] Generated PNG - size: 45678 bytes
    │               │
    │               └─ Convert to base64 data URL
    │
    │       └─ [THUMBNAILS_ALL_ACTION] Thumbnail generation complete
    │
    └─ Frontend renders gallery with all thumbnails
```

---

## 🔍 **What Each Log Tells Us**

| Log Prefix | Logs What | If Missing Means | If Present But Error Means |
|-----------|-----------|------------------|-----------------------------|
| `[PPTX_ENDPOINTS]` | Module initialization | Django never loaded pptx_endpoints.py | Django successfully loaded module |
| `HAS_PPTX: True` | python-pptx installed | python-pptx not imported or missing | Library is available |
| `[PPTX_INFO_ACTION]` | pptx_info action flow | API endpoint not reached | Endpoint is being called |
| `[PPTX_INFO]` | get_pptx_info processing | Processing function never called | Main processing happening |
| `File does not exist` | File path validation | Storage path incorrect | Uploaded file missing |
| `Successfully opened PPTX` | Presentation parsing | python-pptx can't parse file | File is valid PPTX |
| `[THUMBNAIL_GEN]` | Thumbnail rendering | Never attempted generation | Thumbnail process running |
| `Rendered N shapes` | Content extraction | File has no visible content | Slide has renderable elements |

---

## 🚀 **How to Use This Logging**

### **Scenario 1: All Working**
You'll see all logs in sequence from `Started` → `Successfully got info` with no ERROR lines.

### **Scenario 2: HAS_PPTX is False**
```
[PPTX_ENDPOINTS] Initialized - HAS_PPTX: False
```
**Action:** Install python-pptx and restart Django.

### **Scenario 3: File Not Found**
```
[PPTX_INFO_ACTION] File not found at path: /nonexistent/path/file.pptx
```
**Action:** Check file upload and media directory configuration.

### **Scenario 4: PPTX Parsing Fails**
```
[PPTX_INFO] Error reading PPTX info: ...
[Full traceback follows with exc_info=True]
```
**Action:** Check if file is corrupted or incompatible format.

### **Scenario 5: Thumbnail Generation Fails**
```
[THUMBNAILS_ALL_ACTION] Failed to generate thumbnail for slide 0
[THUMBNAIL_GEN] Error generating thumbnail: ...
```
**Action:** Check Pillow installation, verify slide content, check permissions.

---

## 📝 **Log Level Reference**

| Level | Prefix | When Used | Example |
|-------|--------|-----------|---------|
| **DEBUG** | `[TAG]` | Detailed progress info | Shape rendering, image dimensions |
| **INFO** | `[TAG]` | Major milestones | File opened, PPTX info retrieved |
| **WARNING** | `[TAG]` | Unexpected but non-fatal | Slide index out of range |
| **ERROR** | `[TAG]` | Failures that prevent success | File not found, parsing failed |

---

## 🎯 **Expected Log Output - Success Case**

```
# Django Startup
[PPTX_ENDPOINTS] Initialized - HAS_PPTX: True

# API Call #1: /pptx_info/
[PPTX_INFO_ACTION] Started - article_id: 35, pk: 21
[PPTX_INFO_ACTION] File object retrieved - id: 21, mime_type: application/vnd.openxmlformats-officedocument.presentationml.presentation
[PPTX_INFO_ACTION] File path: /backend/media/articles/2026/04/Bahan_Internal_Best_Practice_Perencanaan_dan_Penganggaran_APBN.pptx
[PPTX_INFO] Opening file: /backend/media/articles/2026/04/Bahan_Internal_Best_Practice_Perencanaan_dan_Penganggaran_APBN.pptx
[PPTX_INFO] File size: 14567890 bytes
[PPTX_INFO] Successfully opened PPTX - slides: 14
[PPTX_INFO] Result: {'slide_count': 14, 'title': 'Bahan Internal', 'width': 960, 'height': 720, 'aspect_ratio': 1.33}
[PPTX_INFO_ACTION] Successfully got info: {'file_id': 21, 'filename': '...pptx', 'file_size': 14567890, ...}

# API Call #2: /thumbnails_all/
[THUMBNAILS_ALL_ACTION] Started - article_id: 35, pk: 21
[THUMBNAILS_ALL_ACTION] File object retrieved - id: 21
[THUMBNAILS_ALL_ACTION] File path: /backend/media/articles/2026/04/Bahan_Internal_Best_Practice_Perencanaan_dan_Penganggaran_APBN.pptx
[THUMBNAILS_ALL_ACTION] Getting PPTX info...
[PPTX_INFO] Opening file: /backend/media/articles/2026/04/...pptx
[PPTX_INFO] File size: 14567890 bytes
[PPTX_INFO] Successfully opened PPTX - slides: 14
[PPTX_INFO] Result: {...}
[THUMBNAILS_ALL_ACTION] PPTX info retrieved - slides: 14
[THUMBNAILS_ALL_ACTION] Generating 14 thumbnails...

# Thumbnail Generation Loop (slide 0)
[THUMBNAIL_GEN] Starting - file: /backend/media/articles/2026/04/...pptx, slide: 0
[THUMBNAIL_GEN] Opened PPTX - total slides: 14
[THUMBNAIL_GEN] Retrieved slide 0
[THUMBNAIL_GEN] Creating image - size: 320x240, scale: 0.35
[THUMBNAIL_GEN] Rendered 12 shapes
[THUMBNAIL_GEN] Generated PNG - size: 45678 bytes
[THUMBNAIL_GEN] Starting - file: /backend/media/articles/2026/04/...pptx, slide: 1
...
[THUMBNAILS_ALL_ACTION] Thumbnail generation complete - 14 thumbnails generated
```

---

## 📦 **Files Modified**

1. **backend/shared/utils/pptx_processor.py**
   - `get_pptx_info()` method - Added 8 logging points
   - `generate_slide_thumbnail()` method - Added 10 logging points

2. **backend/apps/api/v1/internal/pptx_endpoints.py**
   - Module imports - Added HAS_PPTX check logging
   - `pptx_info()` action - Added 10 logging points + exc_info=True
   - `thumbnails_all()` action - Added 15 logging points + exc_info=True

---

## ✅ **Next Steps**

1. **Restart Django** to apply all logging
2. **Check console output** for `HAS_PPTX: True` confirmation
3. **Click Preview** in editor to trigger API calls
4. **Share logs** if you see any ERROR or unexpected behavior
5. **Verify gallery displays** all 14 thumbnails correctly

---

**All logging is now in place. Restart Django and check the console output!**
