# Google OAuth invalid_grant Error - Diagnostic Guide

## Current Status
- Frontend is sending `redirect_uri` parameter ✅ (we just fixed this)
- Backend is configured with `GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback` ✅
- But Google is still returning `invalid_grant` error ❌

## Why This Matters
The `invalid_grant` error means Google is rejecting the token exchange. This happens when:

1. **The redirect_uri in the request doesn't match what's registered in Google Cloud Console**
2. The authorization code has expired (codes last ~10 minutes)
3. The authorization code was already used
4. The client_id or client_secret is wrong

## What We Need to Verify

### Critical Check #1: Google Cloud Console Registration

**Action Required:**
1. Go to https://console.cloud.google.com/
2. Find your OAuth app (Client ID: `403156786636-7umtcldsh5t6h31r3q4eprni77qqicos`)
3. Go to **Credentials** → Find your OAuth 2.0 Client
4. Click to edit and check **Authorized redirect URIs**

**What should be there:**
```
http://localhost:5175/google/callback
```

**If it's missing or different, ADD it:**
- Exact URL: `http://localhost:5175/google/callback`
- No trailing slash issues
- Must be EXACTLY `http://localhost:5175/google/callback` (not https for localhost)

### Critical Check #2: Verify the OAuth Code Flow

The authorization code can only be used once and expires quickly. The typical issue is:

1. User clicks "Login with Google"
2. Browser redirects to: `https://accounts.google.com/o/oauth2/v2/auth?...`
3. User authorizes the app
4. Browser redirects back to: `http://localhost:5175/google/callback?code=XXXX&state=YYYY`
5. Frontend extracts code and state
6. Frontend sends POST to backend with code, state, and redirect_uri
7. Backend exchanges code for token

**If the user refreshes or waits too long between steps 5-6, the code expires**

### Critical Check #3: Environment Variable Verification

Run this command in backend folder to verify settings are loaded:

```bash
python manage.py shell
>>> from django.conf import settings
>>> print(settings.GOOGLE_REDIRECT_URI)
>>> print(settings.GOOGLE_CLIENT_ID[:20] + '...')
>>> print('CLIENT_SECRET configured:', bool(settings.GOOGLE_CLIENT_SECRET))
```

Expected output:
```
http://localhost:5175/google/callback
403156786636-7umtcldsh...
CLIENT_SECRET configured: True
```

### Critical Check #4: URL Format Issues

Common mismatches:
- ❌ `http://localhost:5175/google/callback/` (trailing slash)
- ❌ `http://localhost:5175/Google/Callback` (wrong case)
- ❌ `http://localhost:5175/callback/google` (wrong order)
- ❌ `https://localhost:5175/google/callback` (https instead of http for localhost)
- ✅ `http://localhost:5175/google/callback` (correct)

## Testing Process

### Step 1: Clear All Cached Data
```javascript
// Open browser DevTools console and run:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Step 2: Start Fresh
1. Go to http://localhost:5175
2. Click "Login with Google"
3. **Complete the authorization immediately** (don't wait)
4. Authorize the application

### Step 3: Check Console Logs

**Frontend Console (DevTools F12):**
Should see:
```
[GoogleCallback] Processing callback...
[GoogleService] Calling googleCallback with:
[GoogleService] - redirectUri: http://localhost:5175/google/callback
[GoogleService] - code: 4/XXXXXX...
```

**Backend Console:**
Should see:
```
[GoogleCallback] Request received:
[GoogleCallback] - redirect_uri from frontend: http://localhost:5175/google/callback
[GoogleCallback] - code received: 4/XXXXX...
[GoogleCallback] Exchanging code with parameters:
[GoogleCallback] - redirect_uri: http://localhost:5175/google/callback
```

If you see these logs, the parameter passing is working. The issue is then with Google Cloud Console registration.

## Root Cause Likelihood

**Most Likely (95%):**
→ The redirect_uri `http://localhost:5175/google/callback` is NOT registered in Google Cloud Console

**Less Likely (4%):**
→ Authorization code expired between Google sending it and frontend exchanging it

**Very Unlikely (1%):**
→ Wrong OAuth app credentials (wrong client_id/secret pair)

## Next Steps

1. **Immediately check Google Cloud Console**
   - Verify the exact redirect URI is registered
   - If missing, add it and save
   - Wait a few seconds for changes to propagate

2. **Clear everything and test fresh**
   - Clear browser storage
   - Close and reopen browser
   - Try login flow again immediately

3. **If still failing, collect diagnostics**
   - Share screenshots from Google Cloud Console
   - Share the backend console output when attempting login
   - Share the frontend console output

## Configuration Files Reference

- **Backend settings:** [config/settings.py](../config/settings.py#L300)
- **Environment file:** [.env](.env#L74-L79)
- **Frontend service:** [frontend/src/services/googleService.js](../frontend/src/services/googleService.js#L17)
- **API layer:** [frontend/src/services/api.js](../frontend/src/services/api.js#L122)
- **Backend endpoint:** [backend/apps/auth/views.py](../backend/apps/auth/views.py#L297)

## Debug Logging

Recent additions to help troubleshoot:

**Backend Logging Added:**
- Line 337-341: Logs what redirect_uri was received from frontend
- Line 365-368: Logs what redirect_uri is being sent to Google

**Frontend Logging Added:**
- googleService.js: Logs the redirectUri being passed to API

These will show if the redirect_uri is being transmitted correctly through the chain:
Frontend → API → Backend → Google
