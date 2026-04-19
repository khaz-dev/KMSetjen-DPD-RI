# PPTX Thumbnails Diagnostic Guide & Fix

## Changes Applied

### ✅ Issue #1: File-List Height - FIXED
- Changed `.file-list` max-height from `none` → `600px` (approximately 3/4 of viewport)
- Mobile media query also updated from `300px` → `600px` for consistency
- File list now has reasonable height limit while allowing content to scroll

**Result:** File-list now takes up about 3/4 of the available space, preventing it from becoming too tall.

---

## 🔍 Issue #2: PPTX Thumbnails Not Showing - DIAGNOSTIC REQUIRED

### Backend Status: ✅ WORKING
- ✅ PPTX file exists at correct path
- ✅ Thumbnail generation works (PNG bytes generated)
- ✅ API endpoint `/api/v1/internal/articles/35/files/21/thumbnails_all/` returns **200 OK**
- ✅ Response contains base64 thumbnail data: `data:image/png;base64,iVBORw0...`
- ✅ HAS_PPTX: True

### Frontend Status: ❓ NEEDS VERIFICATION
The frontend code is correct, but we need to verify that:
1. The API call is actually succeeding (not getting 401/404)
2. The token is still valid at the time of the API call
3. The response is being received and processed correctly

### Enhanced Logging Added

I've added comprehensive logging that will show:
- Exact HTTP status code from API
- Full response headers
- Full response data
- Any error messages with status codes
- Request headers including Authorization token

---

## 🧪 Step-by-Step Testing & Diagnosis

### Step 1: Clear Cache & Hard Refresh
```
1. Press Ctrl+Shift+R (hard refresh - clears cache)
2. Wait for page to load completely
3. Open DevTools: Press F12
4. Go to Console tab
```

### Step 2: Navigate to Editor Page
```
1. Go to: http://localhost:5175/editor/35
2. Wait for page to load (look for "Article Editor" header)
3. Look in Console for [PptxGallery] logs
```

### Step 3: Click Preview on PPTX File
```
1. Scroll down to "Attachments & Files" section
2. Find the PPTX file (Bahan_Internal_Best_Practice_...)
3. Click "Preview" button (eye icon)
4. Watch Console - look for logs starting with [PptxGallery]
```

### Step 4: Check Console Output

You should see these logs in order:

**GOOD OUTPUT (Images Should Show):**
```
[PptxGallery] Loading presentation - articleId: 35, fileId: 21
[PptxGallery] pptx_info response: {
  status: 200,
  headers: {...},
  data: {slide_count: 14, ...}
}
[PptxGallery] thumbnails_all API Response: {
  status: 200,  ← THIS IS KEY
  url: "http://localhost:8002/api/v1/internal/articles/35/files/21/thumbnails_all/",
  headers: {
    content-type: "application/json",
    authorization: "Bearer eyJhbGc..."
  },
  data: {
    file_id: 21,
    total_slides: 14,
    thumbnails_count: 14,  ← SHOULD BE 14, NOT 0
    first_thumbnail: "data:image/png;base64,iVBORw0KGgo..."
  }
}
[PptxGallery] Thumbnail data received: {
  total_thumbnails: 14,
  all_have_data: true,  ← THIS MUST BE true
  thumbnail_types: [{slide: 0, has_data: true, ...}]
}
[PptxGallery] Rendering image for slide 0: data:image/png;base64,iVBORw0...
```

**BAD OUTPUT (Images Won't Show):**
```
[PptxGallery] ❌ API LOAD FAILED - Full Error Details: {
  status_code: 401,  ← OR 404 or other error
  error_message: "Given token not valid for any token type",
  request_url: "...",
  full_response_data: {...}
}
[PptxGallery] ⚠️ Falling back to placeholder viewer
```

---

## Step 5: Check Network Tab for API Request

If console shows an error, verify the API response:

```
1. Open DevTools: F12
2. Go to Network tab
3. Look for request: "thumbnails_all"
4. Click on it
5. Check "Response" tab → Full response JSON
6. Check Status → Should be 200, not 401/404
```

**Check these fields:**
- Status: `200` (or error code if failing)
- URL: `http://localhost:8002/api/v1/internal/articles/35/files/21/thumbnails_all/`
- Response Headers → `content-type: application/json`

---

## 🔧 Diagnostic Checklist

Based on your console output, use this checklist:

### ✅ If status: 200 AND all_have_data: true
```
✓ API call successful
✓ Thumbnail data received
✓ Images SHOULD be showing in gallery

ACTION: Check browser's Elements inspector
  1. Right-click on gallery
  2. Choose "Inspect"
  3. Look for <img> tags with src="data:image/png;base64,..."
  4. If img tags exist, images should render
  5. If no img tags, check CSS for display:none or visibility:hidden
```

### ⚠️ If status: 401 (Unauthorized)
```
Your authentication token expired or is invalid

SOLUTION:
  1. Log out: Go to /login
  2. Log back in
  3. Go back to /editor/35
  4. The token should be refreshed
  5. Try Preview again

WHY IT HAPPENS:
  - Token expires after 5-15 minutes (depends on settings)
  - When token expires, backend rejects API call with 401
  - Frontend tries to refresh token, but it might fail
```

### ❌ If status: 404 (Not Found)
```
API endpoint is not being reached correctly

CHECK:
  1. Is the URL correct? Should be:
     http://localhost:8002/api/v1/internal/articles/35/files/21/thumbnails_all/
  2. Is the fileId correct? Should be 21
  3. Is the articleId correct? Should be 35
  4. Is the backend running on 8002?

SOLUTION:
  1. Verify backend is running: 
     python manage.py runserver 8002
  2. Check in console for: 
     [PptxGallery] Loading presentation - articleId: 35, fileId: 21
  3. If numbers are different, article/file IDs are wrong
```

### 🔍 If thumbnails_count: 0
```
API returned empty thumbnails array

CAUSES:
  1. Backend thumbnail generation failed
  2. File is not a valid PPTX
  3. PPTX has no slides
  4. Cache generation failed

CHECK BACKEND LOGS:
  1. Look for [THUMBNAILS_ALL_ACTION] logs
  2. Look for [THUMBNAIL_GEN] errors
  3. Check if thumbnail PNG files exist in:
     backend/media/.pptx_cache/thumb_*.png
```

---

## 🚀 What to Report

When testing, report EXACTLY what you see:

**Report Template:**
```
1. Did images appear after clicking Preview? YES / NO

2. What status code in console?
   Status: ???

3. What does all_have_data show?
   all_have_data: ???

4. How many thumbnails loaded?
   thumbnails_count: ???

5. Any error message?
   Error: [paste exact error]

6. Can you click the Gallery? YES / NO

7. Can you see the slide viewer with thumbnail? YES / NO

8. Does fullscreen button work? YES / NO
```

---

## 📝 Current Build Status

✅ **Frontend Build:** Success (5.25s)
- File-list height fixed to 600px
- Enhanced error logging added
- Ready for testing

✅ **Backend Status:** Running
- API endpoint working (200 OK confirmed)
- Thumbnails being generated
- Ready to serve requests

---

## 🎯 Next Steps

1. **Hard Refresh:** Ctrl+Shift+R
2. **Go to:** http://localhost:5175/editor/35
3. **Click Preview** on PPTX file
4. **Open Console:** F12
5. **Read console logs** for status code
6. **Report results** based on diagnostic checklist above

---

## Detailed Diagnostic Scenarios

### Scenario A: Images Show ✅
```
Result: Feature is WORKING!
- Thumbnails display actual slide content
- Gallery navigation works
- Fullscreen mode works
Next: Test on detail page at /article/35
```

### Scenario B: Status 401 - Token Expired
```
Result: Authentication issue
Action: 
  1. Log out
  2. Log back in
  3. Token will refresh
  4. Try again
Next: If still fails after re-login, token refresh is broken
```

### Scenario C: Status 404 - URL Not Found
```
Result: API routing issue
Check:
  1. Is file ID 21 correct?
  2. Is article ID 35 correct?
  3. Is backend running on port 8002?
Action: 
  1. Verify IDs match PPTX file
  2. Restart backend if needed
  3. Try again
```

### Scenario D: thumbnails_count: 0
```
Result: Backend not generating thumbnails
Check:
  1. Does PNG file exist in backend/media/.pptx_cache/?
  2. Are there [THUMBNAIL_GEN] errors in backend logs?
  3. Is python-pptx working?
Action:
  1. Check backend logs for errors
  2. Verify PPTX file is valid
  3. May need to manually regenerate cache
```

---

## File-List Height Verification

The file-list should now:
- ✅ Take up approximately 3/4 of available space (600px max)
- ✅ Show the file items with names visible
- ✅ Have scrollbar when preview exceeds container height
- ✅ Allow clicking Preview button without truncation
- ✅ Display on mobile as well (media query updated)

---

## Summary

**DONE:**
- ✅ Fixed file-list height to 600px (3/4 of form)
- ✅ Enhanced logging to show exact API status
- ✅ Added error details including status code
- ✅ Frontend build complete

**NEEDED:**
- ⏳ Your browser test to see console output
- ⏳ Report status code and thumbnail count
- ⏳ If 200 OK, images should show (if not, CSS might be hiding them)
- ⏳ If 401, token needs refresh (log out/in)
- ⏳ If 404, file/article IDs might be wrong

---

**Test now at http://localhost:5175/editor/35 and report what the console shows!** 🎯
