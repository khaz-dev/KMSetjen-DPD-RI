# Slug Validation Bug Fix - Testing Checklist ✅

**Build Status:** ✅ Frontend built successfully (5.66s)  
**Fix Status:** ✅ All changes applied  
**Ready to Test:** YES

---

## Quick Start Testing

### Step 1: Start Backend & Frontend

```bash
# Terminal 1: Backend
cd backend
python manage.py runserver 0.0.0.0:8002

# Terminal 2: Frontend
cd frontend
npm run dev  # Serves on http://localhost:5175
```

### Step 2: Browser Setup

1. Open: `http://localhost:5175/editor/27`
2. Open Browser Console: `F12` → Console tab
3. Keep console OPEN during testing

---

## Test Case 1: ✅ Save Without Changing Slug

**EXPECTED:** Slug remains valid, no error

```
Steps:
1. Load page http://localhost:5175/editor/27
2. Wait for article to load
3. Verify slug shows as "✓ Slug valid dan tersedia"
4. DON'T CHANGE ANYTHING in the form
5. Click "Simpan sebagai Draft" button
6. Expected: Success toast appears
7. Expected: Slug stays valid (NO red error)

Console Logs to Verify:
✓ [SLUG_VALIDATION_EFFECT] exclude_id should be 27
✓ [API_checkSlug] params should include exclude_id: 27  
✓ [SAVE_DRAFT] Should show "Save successful"
✓ No error logs about slug
```

---

## Test Case 2: ❌ Save With Duplicate Slug (Should Fail)

**EXPECTED:** Error message appears

```
Steps:
1. Load page http://localhost:5175/editor/27
2. Change slug to another article's slug
3. Click "Simpan sebagai Draft"
4. Expected: Red error "Slug sudah digunakan"
5. Expected: Article NOT saved

Console Logs to Verify:
✓ [SLUG_VALIDATION_EFFECT] should return available: false
✓ [SAVE_DRAFT] should prevent save due to validation
```

---

## Test Case 3: ✅ Create New Article

**EXPECTED:** New article created successfully

```
Steps:
1. Load page http://localhost:5175/editor (no ID)
2. Fill form: Title (ID), Category, Content (ID)
3. Slug auto-generates from title
4. Click "Simpan sebagai Draft"
5. Expected: Redirects to /editor/{newID}
6. Expected: "Draft saved successfully" toast

Console Logs to Verify:
✓ [SAVE_DRAFT] Starting save process
✓ Response shows new article ID
✓ Navigate successful to /editor/{newID}
```

---

## Expected Console Output

### When loading article 27:
```
[SLUG_VALIDATION_EFFECT] Triggered - slug: "ringkasan-evaluasi-kinerja-triwulan-i-setjen-dpd-ri-tahun-2026", id: 27
[SLUG_VALIDATION_EFFECT] Format valid, debouncing checkSlug call (500ms)
[SLUG_VALIDATION_EFFECT] Calling checkSlug with: slug="...", excludeId=27, version='draft'
[API_checkSlug] Calling with params: {slug: "...", version_type: "draft", exclude_id: 27}
[SLUG_VALIDATION_EFFECT] checkSlug response: {available: true, slug: "...", version_type: "draft", exclude_id: 27, message: "Slug is available"}
```

### When saving without changes:
```
[SAVE_DRAFT] Starting save process...
[SAVE_DRAFT] Current form state: {id: 27, slug: "...", title_id: "...", ...}
[SAVE_DRAFT] No validation errors - proceeding with save
[SAVE_DRAFT] Sending PUT request to /api/v1/internal/articles/27/
[SAVE_DRAFT] Save successful! Response data: {id: 27, slug: "...", status: "draft"}
[SAVE_DRAFT] Form data updated with response...
```

---

## Troubleshooting

### ❌ Problem: Slug still shows as "Slug sudah digunakan" after save

**Check:**
1. Is `exclude_id` in the console log output?
   ```
   [API_checkSlug] Calling with params: {..., exclude_id: 27}
   ```
   - If YES: Problem is backend (check backend logs)
   - If NO: Parameter not being sent (check api.js)

2. What does the API response show?
   ```
   [SLUG_VALIDATION_EFFECT] checkSlug response: {available: ???}
   ```
   - If `available: false`: Backend finding duplicate
   - If `available: true`: Should not be showing error

3. Check backend logs for SQL errors or validation issues

### ❌ Problem: Save button is disabled

**Check:**
1. Is `hasFormChanged()` returning true? (form change tracking)
2. Are all required fields filled?
   - title_id (Indonesian title)
   - category
3. Is slug validation running? (look for `[SLUG_VALIDATION_EFFECT]` logs)

### ❌ Problem: Toast not showing success

**Check:**
1. Did save receive a 200 response? (should see `[SAVE_DRAFT] Save successful`)
2. Is there a backend error? (check `[BACKEND VALIDATION ERROR]` in console)
3. Are there any validation errors? (check console for error details)

---

## Cleanup & Debugging

To disable verbose logging (remove later):
1. Find lines with console.log(`[SLUG_VALIDATION_EFFECT]`,  etc.)
2. Either comment out or wrap in `if (process.env.DEBUG)`

Backend logging is in:
- `backend/apps/api/v1/internal/views.py` + `check_slug()` method
- `backend/apps/api/v1/internal/serializers.py` + `validate_slug()` methods

---

##  Common Issues During Testing

| Issue | Solution |
|-------|----------|
| "exclude_id: undefined" in console | Refresh page, check if formData.id is being set |
| API 404 for check-slug | Verify backend running and URL routing correct |
| Slug error appears but no API call shown | Check if slug validation useEffect is in dependencies correctly |
| Save succeeds but error still shows | May need to clear browser cache/localStorage |
| Can't load article 27 | Verify article exists: `python manage.py shell` → `Article.objects.get(id=27)` |

---

## Final Validation

After applying fixes and testing:

- [ ] Test Case 1: Pass (no error when saving unchanged slug)
- [ ] Test Case 2: Pass (error when duplicating slug)
- [ ] Test Case 3: Pass (new article creation works)
- [ ] Console logs show expected flow
- [ ] No red errors in console
- [ ] Backend logs show proper queries
- [ ] Form still has all previous functionality

---

**Status:** ✅ Ready for testing  
**Next:** Follow test cases above and report any issues
