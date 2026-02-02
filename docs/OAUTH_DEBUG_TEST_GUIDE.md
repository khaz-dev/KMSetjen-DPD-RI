# OAuth 400 Error - Debug Test Guide

**Status**: 🔍 **DEBUGGING IN PROGRESS**

## Summary

Backend server has been restarted with comprehensive debug logging. The debug logs will capture the exact failure point during the OAuth callback exchange.

## Debug Logging Added

**File**: `backend/apps/auth/views.py`

**Logging Points:**
1. **Initial parameters**: Logs code and state received from frontend
2. **Configuration check**: Logs Client ID, Client Secret, and Redirect URI
3. **Token exchange**: Logs request status and response from Google API
4. **User info fetch**: Logs request status and Google user data response
5. **User creation**: Logs username generation and user creation/retrieval
6. **JWT generation**: Logs token generation success
7. **Responses**: Logs error messages at each failure point

## Next Steps to Debug

### Step 1: Test Google OAuth Login

1. Open browser to **http://localhost:5175**
2. Click **"Masuk dengan Google"** button
3. You'll be redirected to Google login page
4. Log in with your Google account
5. Google will redirect back to app
6. You should see either:
   - ✅ Dashboard (success)
   - ❌ 400 error in browser console (failure)

### Step 2: Check Backend Logs

While the test is running, **watch the backend terminal** for debug output:

```
[GoogleCallback] Request data: code=...
[GoogleCallback] OAuth Config - Client ID: 403156786636...
[GoogleCallback] Exchanging code for tokens with Google...
[GoogleCallback] Token exchange response status: 200
[GoogleCallback] Fetching user info from Google...
[GoogleCallback] User info response status: 200
[GoogleCallback] Extracted user info - Email: ...
[GoogleCallback] Generated username: ...
[GoogleCallback] User created/retrieved: ...
[GoogleCallback] Generating JWT tokens...
[GoogleCallback] JWT tokens generated successfully
```

### Step 3: Identify Error Point

The logs will show WHERE the 400 error occurs:

**If error is in token exchange:**
```
[GoogleCallback] Token exchange response status: 400
[GoogleCallback] Failed to exchange code: {...error details from Google...}
```
→ This means Google rejected the authorization code

**If error is in user info fetch:**
```
[GoogleCallback] User info response status: 401
[GoogleCallback] Failed to retrieve user info: {...error...}
```
→ This means the access token was invalid

**If error is missing parameters:**
```
[GoogleCallback] Request data: code=MISSING...
[GoogleCallback] Authorization code not provided
```
→ Frontend didn't send the code

## Current Configuration

**Backend .env (google_callback reads these):**
```
GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback
```

**Frontend .env.local (for OAuth button):**
```
REACT_APP_GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
```

## Servers Status

✅ Backend: http://localhost:8002 (Django)
✅ Frontend: http://localhost:5175 (React)

## What To Do After Getting Logs

Once you see the debug logs and the 400 error, **provide:**

1. The exact error message from backend logs
2. The status code shown in logs (400, 401, 500, etc.)
3. Any error details from Google API response

I will then:
1. Analyze the specific failure point
2. Identify the root cause
3. Implement a targeted fix
4. Verify the fix works

---

**Time to test**: ~30 seconds
**Ready**: ✅ Yes, start testing now!
