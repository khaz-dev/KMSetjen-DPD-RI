# CRITICAL FIX - Check-Slug 404 Resolution

## Current Status
✅ Code fix applied and reordered  
❌ Backend server needs restart  

---

## The Problem

URL routing in Django is **order-dependent**. Previous configuration:
```python
urlpatterns = [
    path('', include(router.urls)),               # ← Catches /articles/check-slug/
    path('articles/check-slug/', ...),            # ← Never reached
]
```

**Result:** Router can't find action → 404 error

---

## The Fix Applied

✅ **File:** `backend/apps/api/v1/internal/urls.py`

**NEW ORDER (correct):**
```python
urlpatterns = [
    path('articles/check-slug/', ArticleViewSet.as_view({'get': 'check_slug'}), name='article-check-slug'),  # ← Checked FIRST
    path('', include(router.urls)),                                                                              # ← Fallback
]
```

**Why this works:**
- Explicit path is checked first
- If `/articles/check-slug/` matches → use check_slug method
- All other `/articles/*` go through router
- This is standard Django URL pattern practice

---

## CRITICAL: Django Backend Restart Required

**The issue:** Django caches URLs at startup. Changes to urls.py require restart.

### Step 1: Kill Current Django Process

**Option A - In Terminal:**
```bash
Ctrl + C
```
Wait for the process to fully stop.

**Option B - Force kill (if stuck):**
```bash
taskkill /F /PID <python_process_id>
```

### Step 2: Verify Process Stopped
```bash
netstat -ano | findstr :8000
```
Should return NOTHING if port 8000 is free.

### Step 3: Restart Django

**Navigate to backend folder:**
```bash
cd D:\Project\KMSetjen DPD RI\backend
```

**Activate virtual environment (if not already):**
```bash
.venv\Scripts\activate
```

**Start Django server:**
```bash
python manage.py runserver
```

**Expected output:**
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

---

## Step 4: Test Immediately

### In Browser (http://localhost:3000/editor):
1. Open DevTools Console (F12)
2. Clear console (⌘L or Ctrl+L)
3. Type a title in the editor
4. **Watch console for 2 seconds**

### ✅ Expected Result:
```
GET /api/v1/internal/articles/check-slug/?slug=test-article 200
```

### ❌ If Still 404:
```
GET /api/v1/internal/articles/check-slug/?slug=test-article 404
```

---

## Why 404 Was Happening

**Before fix (wrong order):**
```
Django receives: GET /articles/check-slug/?slug=test
  ↓
Check urlpatterns in order:
  1. path('', include(router.urls)) ← Router tries to handle it
     ├─ Checks for {id} parameter → not found
     ├─ Checks for .format suffix → not found
     ├─ Checks for registered action → not found in router
     └─ Returns 404
  2. path('articles/check-slug/', ...) ← Never reaches here
```

**After fix (correct order):**
```
Django receives: GET /articles/check-slug/?slug=test
  ↓
Check urlpatterns in order:
  1. path('articles/check-slug/', ArticleViewSet.as_view({'get': 'check_slug'})) ← MATCH!
     └─ Calls check_slug method → 200 OK
  2. path('', include(router.urls)) ← Not checked
```

---

## Verification Checklist

After restart:
- [ ] Django server shows "Starting development server..."
- [ ] No errors in Django terminal
- [ ] Browser console shows NO 404 for check-slug
- [ ] Slug validation badge appears (Checking... → Valid)
- [ ] Backend logs show: `GET /api/v1/internal/articles/check-slug/ 200 OK`

---

## If Problem Persists

**Check 1: Verify file was saved**
```bash
cat backend/apps/api/v1/internal/urls.py | grep "articles/check-slug"
```
Should show the explicit path line.

**Check 2: Verify Django restarted (check process)**
```bash
# On Windows
tasklist | findstr python

# On Mac/Linux
ps aux | grep python
```
You should see a NEW python process (different timestamp).

**Check 3: Clear Django cache**
```bash
python manage.py clear_cache
python manage.py runserver
```

**Check 4: Try different port (if 8000 is stuck)**
```bash
python manage.py runserver 8001
```
Then in frontend .env:
```
REACT_APP_API_BASE_URL=http://localhost:8001/api
```

---

## Summary

| What | Status |
|------|--------|
| URL ordering fixed | ✅ Done |
| Code change applied | ✅ Done |
| Backend restarted | ⏳ **NEEDS TO BE DONE NOW** |
| 404 resolved | ⏳ Happens after restart |

**ACTION REQUIRED:** Restart Django backend and test immediately!
