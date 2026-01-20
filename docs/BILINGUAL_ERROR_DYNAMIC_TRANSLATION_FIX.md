# Bilingual Error Message Dynamic Translation Fix

**Date:** January 14, 2026  
**Issue:** Error messages showing Indonesian text ("Gagal menyimpan draf") in both Indonesian AND English modes  
**Status:** ✅ FIXED

---

## Root Cause Analysis

The problem was that error messages were being **translated at error time** rather than **at display time**:

### Before (Broken):
```javascript
// In saveDraft() when error occurs:
const translatedError = t('errors.failed_save_draft'); // Translates IMMEDIATELY (using current language)
setError(translatedError); // Stores: "Gagal menyimpan draf" (Indonesian)

// User switches language to English
// But error state still contains "Gagal menyimpan draf" (stale value)
```

**Problem:** When the user switches language after an error, the stored error message remains in the original language because it was translated and frozen in state.

### After (Fixed):
```javascript
// In saveDraft() when error occurs:
setError('t:errors.failed_save_draft'); // Stores TRANSLATION KEY (not translated text)

// ErrorAlert component handles translation at display time:
const displayMessage = message.startsWith('t:') 
  ? t(message.substring(2))  // Translates WHEN DISPLAYING (using current language)
  : message;

// User switches language to English
// Component re-renders, t() is called with new language context
// Error message automatically displays: "Error! Failed to save draft"
```

**Solution:** Store translation keys instead of translated strings, let ErrorAlert translate them when rendering.

---

## Changes Made

### File: `frontend/src/pages/ArticleEditorPage.js`

Updated all error handlers to use translation key prefix `t:` instead of calling `t()` immediately:

**Error handlers updated (13 total):**

1. **saveDraft()** - Line 145
   ```javascript
   // Before: setError(t('errors.failed_save_draft'));
   // After:  setError('t:errors.failed_save_draft');
   ```

2. **loadArticle()** - Line 90
   ```javascript
   // Before: setError(t('errors.failed_load_articles'));
   // After:  setError('t:errors.failed_load_articles');
   ```

3. **handleImageUpload()** - Invalid file type
   ```javascript
   // Before: setError(t('errors.invalid_file_type'));
   // After:  setError('t:errors.invalid_file_type');
   ```

4. **handleImageUpload()** - File too large (5MB)
   ```javascript
   // Before: setError(t('errors.file_too_large'));
   // After:  setError('t:errors.file_too_large');
   ```

5. **handleFileUpload()** - Save article first
   ```javascript
   // Before: setError(t('errors.save_article_first') || 'Please save article first');
   // After:  setError('t:errors.save_article_first');
   ```

6. **handleFileUpload()** - File too large (50MB)
   ```javascript
   // Before: setError(t('errors.file_too_large_50mb'));
   // After:  setError('t:errors.file_too_large_50mb');
   ```

7. **handleFileUpload()** - Upload failed
   ```javascript
   // Before: setError(t('errors.file_upload_failed') || 'Failed to upload file');
   // After:  setError('t:errors.file_upload_failed');
   ```

8. **handleFileDelete()** - Delete failed
   ```javascript
   // Before: setError(t('errors.file_delete_failed'));
   // After:  setError('t:errors.file_delete_failed');
   ```

9. **handleFileDescriptionUpdate()** - Update failed
   ```javascript
   // Before: setError(t('errors.file_update_failed'));
   // After:  setError('t:errors.file_update_failed');
   ```

10. **handleSubmitForReview()** - Fill required fields
    ```javascript
    // Before: setError(t('errors.fill_required_fields'));
    // After:  setError('t:errors.fill_required_fields');
    ```

11. **handleSubmitForReview()** - Slug format validation
    ```javascript
    // Before: setError(t(`errors.${formatValidation.messageKey}`));
    // After:  setError(`t:errors.${formatValidation.messageKey}`);
    ```

12. **handleSubmitForReview()** - Slug duplicate
    ```javascript
    // Before: setError(t('errors.slug_duplicate'));
    // After:  setError('t:errors.slug_duplicate');
    ```

13. **handleSubmitForReview()** - Submit article failed
    ```javascript
    // Before: setError(t('errors.failed_submit_article'));
    // After:  setError('t:errors.failed_submit_article');
    ```

### File: `frontend/src/components/ErrorAlert.js` (Already Correct)

The ErrorAlert component already had proper support for `t:` prefix:

```javascript
// If message starts with 't:', treat it as a translation key
const displayMessage = message.startsWith('t:') 
  ? t(message.substring(2))    // Translates dynamically at display time
  : message;
```

This means whenever the component re-renders (which happens when language changes), it will call `t()` with the current language context.

---

## How It Works Now

### Flow When Language Changes:

1. **User is on Indonesian**
   ```
   Try to save article → Error occurs
   → setError('t:errors.failed_save_draft')
   → ErrorAlert extracts key: 'errors.failed_save_draft'
   → t('errors.failed_save_draft') → "Gagal menyimpan draf" ✓
   ```

2. **User switches to English (Header → Language Dropdown)**
   ```
   Header: changeLanguage('en')
   → i18n.changeLanguage('en')
   → localStorage.setItem('language', 'en')
   → All components using useTranslation() re-render
   ```

3. **Error message re-displays in English**
   ```
   ErrorAlert receives: 't:errors.failed_save_draft'
   → Extracts key: 'errors.failed_save_draft'
   → t('errors.failed_save_draft') [NOW USING i18n.language='en']
   → "Failed to save draft" ✓
   ```

---

## Verification

**Test Procedure:**

1. Navigate to http://localhost:3000/editor
2. Set language to **Indonesian** (Header → Language dropdown)
3. Try to save an article without required fields
4. **Verify:** Error shows "Kesalahan! Gagal menyimpan draf" (fully in Indonesian)
5. Switch language to **English** (Header → Language dropdown)
6. **Verify:** Error updates to "Error! Failed to save draft" (fully in English)
7. Repeat with other error scenarios (file upload, slug validation, etc.)

---

## Technical Details

### Why This Works:

- **i18next** watches for language changes via `i18n.changeLanguage()`
- **react-i18next** re-renders all components using `useTranslation()` hook
- **ErrorAlert** calls `t()` during render, not during error occurrence
- **Translation key storage** delays translation until needed

### Error Prefix Pattern:

- `'t:errors.key'` = Translation key (will be translated)
- `'Plain text'` = Plain text message (displayed as-is)
- This allows mixing static messages and translated messages if needed

---

## Related Files

- ✅ `frontend/src/pages/ArticleEditorPage.js` - Updated (13 error handlers)
- ✅ `frontend/src/components/ErrorAlert.js` - Already correct
- ✅ `frontend/src/locales/en/translation.json` - Keys verified exist
- ✅ `frontend/src/locales/id/translation.json` - Keys verified exist
- ✅ `frontend/src/i18n/config.js` - Configuration verified correct
- ✅ `frontend/src/hooks/useLanguage.js` - Language switching verified

---

## Benefits

1. ✅ **Dynamic Translation:** Error messages automatically switch when language changes
2. ✅ **No Cache Issues:** Translation happens at display time, not storage time
3. ✅ **Consistent Behavior:** All error messages now behave the same way
4. ✅ **Future-Proof:** Any new error messages following this pattern will work correctly
5. ✅ **No Backend Changes Needed:** Pure frontend fix

---

## Next Steps

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Restart npm dev server** (`npm start`)
3. **Test all error scenarios** in both languages
4. **Verify no regressions** in other error messages

---

## Summary

The issue was caused by translating error messages at error-time (freezing them in state) instead of display-time. The fix stores translation keys (`'t:errors.key'`) in state, allowing ErrorAlert to translate them dynamically when rendering. This ensures error messages always display in the current language, even if the language is switched after the error occurs.

**Status:** ✅ Ready to test
