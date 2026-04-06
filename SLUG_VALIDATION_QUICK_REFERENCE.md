# Slug Validation Bug - Quick Reference & Troubleshooting

## The Bug (Now Fixed ✅)

**Symptom:** Saving an article without changing slug shows "Slug sudah digunakan" error  
**Before Fix:** Would consistently fail to save  
**After Fix:** Should save successfully, slug remains valid  

---

## Testing in 30 Seconds

```
1. Go to: http://localhost:5175/editor/27
2. Click: "Simpan sebagai Draft" (without changing anything)
3. Result Should Be: ✅ Success toast, slug stays valid

Result Is: ❌ Red error "Slug sudah digunakan"?
→ See Troubleshooting section below
```

---

## What Changed

| Component | Change | Why |
|-----------|--------|-----|
| Frontend API check | Better `exclude_id` handling | Ensures article is excluded from duplicate check |
| Frontend logging | Added console logs | Easy debugging of slug validation flow |
| Backend check_slug | Clearer error handling | More predictable behavior |
| Backend serializer | More defensive validation | Prevents edge cases |

---

## Console Logs to Look For ✅

### When checking slug (should see):
```
[SLUG_VALIDATION_EFFECT] Triggered - slug: "X", id: 27
[API_checkSlug] Calling with params: {..., exclude_id: 27}
[SLUG_VALIDATION_EFFECT] checkSlug response: {available: true, ...}
```

### When saving (should see):
```
[SAVE_DRAFT] Starting save process...
[SAVE_DRAFT] Validation failed: No validation errors
[SAVE_DRAFT] Save successful! Response data: {id: 27, ...}
```

### If error, should see:
```
[SAVE_DRAFT] Validation failed: Slug marked as unavailable
// OR
[BACKEND VALIDATION ERROR] Status Code: 400
Error Response: {detail: {slug: [...]}}
```

---

## Troubleshooting

### ❓ After save, slug shows as "already in use"

**Check #1: Is exclude_id in the API call?**
```
[API_checkSlug] Calling with params: {..., exclude_id: 27}
                                         ^^^^^^^^^^^^
```
- ✅ If YES and available=true → Browser cache issue
- ❌ If NO (missing) → Check api.js fix wasn't applied
- ❌ If undefined → formData.id not being set properly

**Check #2: What does backend return?**
```
[SLUG_VALIDATION_EFFECT] checkSlug response: {available: ???}
```
- ✅ If available=true → Should not show error
- ❌ If available=false → Backend finding duplicate

**Fix #1 - Clear browser cache:**
```
Ctrl + Shift + Delete → Clear all cookies/cache
F5 to refresh
```

**Fix #2 - Check formData.id is being set:**
```
In console during load:
> formData  // Should show id: 27
```

---

### ❓ Slug validation doesn't run at all

**Check:** Is the useEffect dependency array correct?
```
// Should be watching both:
// [formData.slug, formData.id]
```

**Check:** Browser console for any JavaScript errors
```
F12 → Console → Look for red errors
```

**Fix:** Hard refresh browser
```
Ctrl + Shift + R (not just F5)
```

---

### ❓ Save button is disabled (gray)

**Check:** Form has unsaved changes?
- hasFormChanged() returns true

**Check:** All required fields filled?
- Title (ID) - required
- Category - required
- Content (ID) - optional but good to have

**Check:** Slug validation state?
- Should be null or true (not false)

---

### ❓ Backend returning 400 error    

**Check:** Error response in console:
```
[BACKEND VALIDATION ERROR] Status Code: 400
Error Response: {detail: {slug: [...]}}
```

**Possible causes:**
1. Slug IS actually a duplicate for another article
2. Slug validation in serializer triggered
3. Required fields missing

**Check: Database directly**
```bash  
# In Django shell
python manage.py shell
>>> from apps.content.models import Article
>>> Article.objects.filter(slug='the-slug')
# Should show only current article
```

---

## Verify Fix is Applied

### Frontend Check
**File:** `frontend/src/services/api.js`  
**Line:** ~295

Should have:
```javascript
if (excludeId && typeof excludeId === 'number' && excludeId > 0) {
```

❌ Missing? → Frontend changes not deployed

### Backend Check  
**File:** `backend/apps/api/v1/internal/serializers.py`  
**Line:** ~157

Should have:
```python
current_id = self.instance.id
```

❌ Missing? → Backend changes not deployed

---

## Performance Check

**Frontend Build Time:** Should be < 10 seconds
```
✅ built in 5.66s
```

**API Response Time:** Should be < 200ms
```
In Network tab: check-slug request
```

**Database Query:** Should use the index on (version_type, slug)
```
In backend: Article.objects.filter(slug=X, version_type=Y)
```

---

## Known Limitations

❌ **Not Fixed By This Update:**
- Auto-slug generation (still uses title)
- Slug character validation (still has same rules)
- Multi-language slug handling (draft/published versioning unchanged)

✅ **Fixed By This Update:**
- Slug showing as duplicate when it's the current article
- False "already in use" errors on save
- Edge cases with null/0 IDs

---

## When to Suspect Different Issue

If you see any of these, it's probably NOT this bug:

❌ "Slug invalid format" - Different issue (format validation)  
❌ "Network error" - Different issue (backend connectivity)  
❌ "Form won't submit" - Different issue (button enabled state)  
❌ "Slug auto-generates wrong" - Different issue (auto-slug logic)  

---

## Contact Points

**For this specific bug:**
- Console logs: `[SLUG_VALIDATION_EFFECT]`, `[SAVE_DRAFT]`, `[API_checkSlug]`
- Database: Article model with `version_type` and `slug`
- Files: api.js, ArticleEditorPage.jsx, views.py, serializers.py

**When reporting issues:**
1. Include browser console output
2. Specify article ID and slug
3. Open Network tab and share check-slug request/response
4. Check if issue is reproducible

---

## Quick Fixes to Try (in order)

1. Hard refresh: `Ctrl + Shift + R`
2. Clear cache: `Ctrl + Shift + Delete`
3. Close all tabs and reopen
4. Logout and login
5. Restart frontend: `npm run dev`
6. Restart backend: `python manage.py runserver 8002`

---

**Status:** ✅ Fix Applied & Ready for Testing  
**Build:** ✅ Frontend compiled successfully  
**Docs:** ✅ Testing checklist available  

**Next:** Follow test checklist and report results!
