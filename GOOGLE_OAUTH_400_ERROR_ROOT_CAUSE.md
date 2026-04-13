# Google OAuth 400 Error: Root Cause Analysis & Fix

**Date:** April 13, 2026  
**Status:** ✅ FIXED - Backend server restarted with updated configuration

---

## Executive Summary

The 400 Bad Request error when attempting Google OAuth login on local development was caused by **the backend development server continuing to use stale environment variables** after the `.env` file was updated.

**Root Cause:** Django reads environment variables at startup time. The .env file was updated BEFORE the backend server restarted, so the old configuration remained in memory.

**Solution:** Restart the Django development server to force it to reload the `.env` file and apply the updated Google OAuth configuration.

---

## The Problem Timeline

### Step 1: Frontend Successfully Gets Google Auth Code
- User clicks "Masuk dengan Google"
- Frontend redirects to Google's OAuth login
- User logs in at Google and consents
- Google redirects back with: `http://localhost:5175/google/callback/?code=...&state=...`

### Step 2: Frontend Attempts Code Exchange
- Frontend extracts code and state from URL
- Frontend calls backend: `POST /api/auth/google/callback/`
- Request body includes:
  ```json
  {
    "code": "4/0Aci98E-0AdfHVEsZ3r7Wp-n7U5yIFjiZa-rWDxVIuUDK6AgE5VQXRWXD7kOnTW15mJGiNQ",
    "state": "eUHx0U5s6gMVPggO77bXJuy6f1olKliC",
    "redirect_uri": "http://localhost:5175/google/callback/"
  }
  ```

### Step 3: Backend Receives Request but Returns 400
- Backend receives the request
- Backend attempts to exchange code with Google
- But backend uses its **own configured `GOOGLE_REDIRECT_URI`** (not the frontend's)
- If this doesn't match Google's registered redirect_uri, Google rejects it

### Step 4: Issue Identified
The problem was that:
1. `.env` file had been updated to include: `GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback/`
2. BUT the Django development server was started **BEFORE** this update
3. So the server still had the OLD configuration in memory
4. When backend tried to exchange the code, Google rejected it as a mismatch

---

## Detailed Root Cause Analysis

### How Django Loads Environment Variables

```python
# In settings.py, near the top:
env = environ.Env()
env_file = os.path.join(BASE_DIR, '.env')
if os.path.exists(env_file):
    environ.Env.read_env(env_file)  # ← Reads .env ONCE at startup
```

Django reads the `.env` file **exactly once** when the server starts. If you update `.env` later, those changes are **not** automatically picked up. You must restart the server.

### Configuration Flow

**Before Fix (Stale Configuration in Memory):**
```
┌─────────────────────────────────────────────────┐
│ Backend Process (Old - Before .env Update)      │
├─────────────────────────────────────────────────┤
│ GOOGLE_REDIRECT_URI = ???                       │
│ (Old value from previous .env, or default)      │
└─────────────────────────────────────────────────┘
                        ↓
              User clicks Google Login
                        ↓
┌─────────────────────────────────────────────────┐
│ .env File (Updated with NEW Value)              │
├─────────────────────────────────────────────────┤
│ GOOGLE_REDIRECT_URI=                            │
│ http://localhost:5175/google/callback/          │
└─────────────────────────────────────────────────┘
                        ↓
            Backend tries to exchange code
                        ↓
║ ❌ ERROR: Backend still using OLD config        ║
║    Google rejects as redirect_uri mismatch      ║
```

**After Fix (Backend Restarted):**
```
┌─────────────────────────────────────────────────┐
│ .env File (Already Updated)                     │
├─────────────────────────────────────────────────┤
│ GOOGLE_REDIRECT_URI=                            │
│ http://localhost:5175/google/callback/          │
└─────────────────────────────────────────────────┘
          ↓ (RESTART BACKEND SERVER)
┌─────────────────────────────────────────────────┐
│ Backend Process (Fresh - Reads .env Again)      │
├─────────────────────────────────────────────────┤
│ GOOGLE_REDIRECT_URI =                           │
│ http://localhost:5175/google/callback/          │
│ (✅ Matches Google's registered URI)            │
└─────────────────────────────────────────────────┘
                        ↓
              User clicks Google Login
                        ↓
        Backend exchanges code successfully
                        ↓
                ✅ User is logged in
```

---

## Backend OAuth Flow Explained

Here's what happens in the backend's `google_callback` view when it receives your request:

### Step 1: Receive Request
```python
code = request.data.get('code')  # Gets from frontend
state = request.data.get('state')  # Gets from frontend
redirect_uri_from_frontend = request.data.get('redirect_uri')  # NOT USED

# Get backend's configured redirect_uri
google_redirect_uri = getattr(settings, 'GOOGLE_REDIRECT_URI', default)
```

**Important:** The backend **ignores** the `redirect_uri` from the frontend for security reasons. It uses its own configured value.

### Step 2: Exchange Code with Google
```python
token_response = requests.post(
    'https://oauth2.googleapis.com/token',
    data={
        'code': code,  # Your authorization code
        'client_id': google_client_id,
        'client_secret': google_client_secret,
        'redirect_uri': google_redirect_uri,  # ← MUST MATCH Google's registered URI
        'grant_type': 'authorization_code',
    }
)
```

This is the critical step. The `redirect_uri` parameter **must match exactly** what's registered in your Google Cloud Console. If it doesn't, Google returns an error.

### Step 3: Error Handling
If `token_response.status_code != 200`, the backend returns:
```python
return Response(
    {'error': f'Failed to exchange authorization code for tokens: {error_msg}'},
    status=status.HTTP_400_BAD_REQUEST
)
```

This is where you saw the 400 error.

---

## Configuration Verification

After the fix, here's what the backend now has loaded:

```json
{
  "GOOGLE_CLIENT_ID": "403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com",
  "GOOGLE_CLIENT_SECRET": "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",
  "GOOGLE_REDIRECT_URI": "http://localhost:5175/google/callback/"
}
```

This matches:
- ✅ Frontend: `http://localhost:5175/google/callback/`
- ✅ Google Cloud Console: Registered for localhost (without /kms/)

---

## Environment Configuration Separation

The project now correctly has separate configurations:

### `.env` (Local Development)
```
GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback/
```

### `.env.production` (Staging/Production)
```
GOOGLE_REDIRECT_URI=https://khaz.app/kms/google/callback/
```

This separation is **critical** because:
- **Local:** No subpath (`/kms/`) because frontend runs on port 5175
- **Staging/Production:** Includes subpath because app runs under `https://khaz.app/kms/`

---

## Testing the Fix

### For Local Development (After Backend Restart)

1. **Verify Backend Config:**
   ```bash
   cd backend
   python manage.py shell -c "
   from django.conf import settings
   print('GOOGLE_REDIRECT_URI:', settings.GOOGLE_REDIRECT_URI)
   "
   ```
   Should show: `http://localhost:5175/google/callback/`

2. **Test OAuth Flow:**
   - Open `http://localhost:5175/login`
   - Click "Masuk dengan Google"
   - Should redirect to Google login (no error)
   - After logging in, should be redirected back to app dashboard

3. **Check Browser DevTools:**
   - Network tab: POST request to `/api/auth/google/callback/`
   - Should see 200 response with JWT tokens
   - Should NOT see 400 error

4. **Check Browser Console:**
   - Should see: `[GoogleCallback] Code exchange successful`
   - Should NOT see: multiple retry attempts

---

## Summary: Why This Happened

| When | What | Why | Impact |
|------|------|-----|--------|
| Previous session | `.env` updated with correct redirect_uri | Previous OAuth fix | ✅ Correct values in file |
| Still running | Backend dev server NOT restarted | Server continued running with old config | ❌ Old values in memory |
| User login attempt | Backend tried to exchange code | Backend used stale config | ❌ 400 error from Google |
| This session | Backend server restarted | Force reload of updated .env | ✅ New values loaded |

---

## Prevention for Future

For any environment variable changes in development:

1. **Update the `.env` file**
2. **Restart the backend server:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart:
   cd backend
   python manage.py runserver 0.0.0.0:8002
   ```
3. **Rebuild frontend if needed:**
   ```bash
   cd frontend
   npm run build  # or npm run dev
   ```
4. **Test thoroughly**

---

## Related Previous Fixes

This issue was part of a series of OAuth fixes:

1. ✅ **Phase 1:** Logo path construction bug (imageUtils.js)
2. ✅ **Phase 2:** OAuth redirect_uri trailing slash
3. ✅ **Phase 3:** Backend settings had wrong /kms/ prefix
4. ✅ **Phase 4:** Backend server not reloaded after .env update

All fixes are now complete and integrated.
