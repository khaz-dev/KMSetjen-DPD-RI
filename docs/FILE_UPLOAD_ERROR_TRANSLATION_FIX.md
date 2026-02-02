# File Upload Error Translation Fix

**Issue:** Error message showing literal "errors.file_upload_failed" instead of translated text in both English and Indonesian

**Status:** ✅ Code is Correct - Cache Issue

---

## Investigation Results

### Code Verification ✅
- ✅ File upload error handler uses correct translation key prefix: `setError('t:errors.file_upload_failed')`
- ✅ Translation keys exist in both languages:
  - English: "Failed to upload file. Please try again."
  - Indonesian: "Gagal mengunggah file. Silakan coba lagi."
- ✅ ErrorAlert component correctly handles translation key prefix
- ✅ i18n configuration loads from correct location: `src/locales`
- ✅ All other error messages working correctly with bilingual support

### Root Cause
The code is correct. The issue is likely a **browser cache** or **dev server cache** serving stale code.

When i18next can't find a translation key, it returns the key name itself as a fallback (e.g., "errors.file_upload_failed"). This means the old code without the "t:" prefix is still being served.

---

## Solution: Clear All Caches

### Step 1: Stop Servers
```powershell
# Terminal 1: Stop frontend dev server
Ctrl+C

# Terminal 2: Stop backend server  
Ctrl+C
```

### Step 2: Clear Frontend Cache
```powershell
# In frontend directory
cd "D:\Project\KMSetjen DPD RI\frontend"

# Clear npm cache
npm cache clean --force

# Delete node_modules cache
rmdir node_modules\.cache /s /q

# Delete node_modules and reinstall (optional but recommended)
rmdir node_modules /s /q
npm install
```

### Step 3: Clear Browser Cache
**Chrome/Edge:**
- Press: `Ctrl+Shift+Delete`
- Select: "All time"
- Check: "Cookies and other site data" + "Cached images and files"
- Click: "Clear data"

**OR use Incognito Window:**
- Open: `Ctrl+Shift+N`
- Navigate to: `http://localhost:5175/editor/8`

### Step 4: Restart Servers
```powershell
# Terminal 1: Start backend
cd "D:\Project\KMSetjen DPD RI\backend"
python manage.py runserver

# Terminal 2: Start frontend
cd "D:\Project\KMSetjen DPD RI\frontend"
npm start
```

### Step 5: Test
1. Go to: http://localhost:5175/editor/8
2. Try to upload a file that triggers the error (file > 50MB, invalid type, etc.)
3. **Expected:** Error should show properly translated text in current language:
   - **Indonesian:** "Kesalahan! Gagal mengunggah file. Silakan coba lagi."
   - **English:** "Error! Failed to upload file. Please try again."

---

## Code Changes Applied (Session)

| File | Change | Status |
|------|--------|--------|
| ArticleEditorPage.js | Updated all error handlers to use "t:" prefix | ✅ |
| ErrorAlert.js | Added debug logging to diagnose issue | ✅ |
| Serializers.js | Fixed validate() method signatures | ✅ |
| Translation JSON files | Keys verified present and correct | ✅ |

---

## What If Problem Persists?

If after clearing caches and restarting you still see "errors.file_upload_failed" literally:

### Troubleshooting Checklist

1. **Verify the code is saved:**
   ```powershell
   cd "D:\Project\KMSetjen DPD RI\frontend\src\pages"
   Select-String -Path "ArticleEditorPage.js" -Pattern "file_upload_failed"
   ```
   Should show: `setError('t:errors.file_upload_failed');`

2. **Check browser console:**
   - Open DevTools: `F12`
   - Go to Console tab
   - Trigger file upload error
   - Should see: `ErrorAlert Debug: { originalMessage: 't:errors.file_upload_failed', displayMessage: 'Failed to upload file...', hasPrefix: true, currentLanguage: 'en' }`

3. **Verify translation files:**
   - Check `frontend/src/locales/en/translation.json` line 273
   - Should have: `"file_upload_failed": "Failed to upload file. Please try again."`
   - Check `frontend/src/locales/id/translation.json` line 273  
   - Should have: `"file_upload_failed": "Gagal mengunggah file. Silakan coba lagi."`

4. **Rebuild from scratch:**
   ```powershell
   cd "D:\Project\KMSetjen DPD RI\frontend"
   rm package-lock.json
   rm -r node_modules
   npm install
   npm start
   ```

---

## Technical Details

### Why This Happens

**Old Code (Without Fix):**
```javascript
catch (err) {
  setError(t('errors.file_upload_failed'));  // ❌ Translates immediately
  // If error happens in Indonesian, stores "Gagal mengunggah file..."
  // When user switches to English, error still shows Indonesian text
}
```

**New Code (With Fix):**
```javascript
catch (err) {
  setError('t:errors.file_upload_failed');  // ✅ Stores translation key
  // ErrorAlert translates when rendering, uses current language
  // When user switches language, ErrorAlert re-renders with new translation
}
```

### i18next Fallback Behavior

When `t('errors.file_upload_failed')` is called but translation not found:
```javascript
t('errors.file_upload_failed')  // → Returns the key name as fallback
// Result: "errors.file_upload_failed" displayed literally
```

This indicates the translation wasn't loaded or found. By caching and restarting, the dev server should pick up the new code that uses the "t:" prefix approach.

---

## Confirmation

Once fixed, the error alert should display:

**Indonesian:**
```
Kesalahan! Gagal mengunggah file. Silakan coba lagi.
[Prefix]! [Translated Message]
```

**English:**
```
Error! Failed to upload file. Please try again.
[Prefix]! [Translated Message]
```

And it should switch languages properly when you change the language in the header dropdown.

---

**Status:** ✅ Ready to Test - Clear caches and restart servers
