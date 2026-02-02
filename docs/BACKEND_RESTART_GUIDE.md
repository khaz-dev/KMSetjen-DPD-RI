# Backend Restart Guide - Check-Slug Endpoint Fix

## Issue
- Backend returning 404 for `/api/v1/internal/articles/check-slug/` endpoint
- The code fix is in place but Django server hasn't reloaded it

## Root Cause
**Django development server caches the URL routing at startup.** Changes to `urls.py` require a server restart.

---

## Solution: Restart Django Backend

### Step 1: Stop the Current Django Server
If Django is running in your terminal:
1. Press `Ctrl + C` in the **python terminal** (where Django is running)
2. Wait for the server to stop (you'll see "Quit the server with...")

### Step 2: Verify the Fix is in Place
Check that `backend/apps/api/v1/internal/urls.py` contains:
```python
urlpatterns = [
    path('', include(router.urls)),
    # Explicit URL for check-slug action
    path('articles/check-slug/', ArticleViewSet.as_view({'get': 'check_slug'}), name='article-check-slug'),
]
```

✅ **Confirmed in codebase** - The fix is there!

### Step 3: Restart Django Server
Run one of these commands in the backend terminal:

**Option A - Simple restart:**
```bash
python manage.py runserver
```

**Option B - Specific port (if port 8002 is busy):**
```bash
python manage.py runserver 8002
```

**Option C - Listen on all interfaces:**
```bash
python manage.py runserver 0.0.0.0:8002
```

### Step 4: Verify Server is Running
Look for output like:
```
Starting development server at http://127.0.0.1:8002/
Quit the server with CONTROL-C.
```

---

## Step 5: Test the Fix

### In Browser:
1. Open http://localhost:5175/editor
2. Type a title (e.g., "Test Article")
3. Watch the slug field
4. **Expected:** Slug auto-generates, then shows "Checking..." badge → "Valid" badge
5. **Check console:** Should show NO 404 errors

### Expected Console Output (None of these):
```
❌ GET http://localhost:8002/api/v1/internal/articles/check-slug/?slug=... 404 (Not Found)
❌ Slug check error: Error: Failed to check slug
```

### Expected Backend Logs:
```
GET /api/v1/internal/articles/check-slug/?slug=... 200 OK
```

---

## Verification Checklist

After restart, confirm:
- [ ] Django server started successfully
- [ ] No errors in Django terminal
- [ ] Browser shows no 404 in console for check-slug
- [ ] Slug validation badge appears (Checking... → Valid)
- [ ] Backend terminal shows 200 OK for check-slug requests

---

## If Still Getting 404 After Restart

1. **Verify you restarted the correct server:**
   - Check if the terminal still shows the old Python process
   - Kill and restart again

2. **Check if settings.py has DEBUG=True:**
   ```bash
   grep DEBUG backend/kms/settings.py
   ```
   Should show: `DEBUG = True`

3. **Check urls.py is saved:**
   ```bash
   cat backend/apps/api/v1/internal/urls.py | grep check-slug
   ```
   Should show the explicit path

4. **Clear Django cache:**
   ```bash
   python manage.py clear_cache
   python manage.py runserver
   ```

---

## Timeline

- ✅ Code fix applied: URLs file updated with explicit check-slug path
- ⏳ **Backend restart needed:** Stop and restart Django server
- 🎯 Expected result: 200 OK response with slug availability check

---

**IMPORTANT:** The 404 will disappear immediately after restarting the Django server. No code changes needed - just restart!
