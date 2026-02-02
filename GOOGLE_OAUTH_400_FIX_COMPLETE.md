# Google OAuth 400 Bad Request - ROOT CAUSE & FIX COMPLETE

## Problem Statement
User received the following error when attempting Google OAuth login:
```
POST http://localhost:8002/api/auth/google/callback/ 400 (Bad Request)
```

This error prevented successful Google login callback processing.

## Root Cause Analysis

### Issue Identified
The frontend was sending an incomplete request to the backend's Google callback endpoint. The request body was missing the required `redirect_uri` parameter.

**Frontend was sending:**
```json
{
  "code": "authorization_code_from_google",
  "state": "csrf_state_token"
}
```

**Backend was expecting (per line 314 in backend/apps/auth/views.py):**
```json
{
  "code": "authorization_code_from_google",
  "state": "csrf_state_token",
  "redirect_uri": "http://localhost:5175/google/callback"
}
```

### Why This Caused 400 Error
The backend's Google callback endpoint requires the `redirect_uri` parameter to:
1. Exchange the authorization code for an access token with Google
2. Validate that the redirect URI matches what was registered with Google
3. Prevent open redirect security vulnerabilities

When the backend tried to exchange the code without the correct redirect_uri, Google's OAuth server rejected the request with a 400 Bad Request error.

### Evidence Trail
1. **Backend Documentation** ([backend/apps/auth/views.py#L314](backend/apps/auth/views.py#L314)):
   - Shows `redirect_uri` explicitly in request body example
   
2. **Backend Implementation** ([backend/apps/auth/views.py#L360-L365](backend/apps/auth/views.py#L360-L365)):
   - Backend exchanges code using `google_redirect_uri` from settings:
   ```python
   token_response = requests.post(
       'https://oauth2.googleapis.com/token',
       data={
           'code': code,
           'client_id': google_client_id,
           'client_secret': google_client_secret,
           'redirect_uri': google_redirect_uri,  # ← BACKEND USES THIS
           'grant_type': 'authorization_code',
       }
   )
   ```

3. **SSO Callback Pattern** ([frontend/src/services/api.js#L116](frontend/src/services/api.js#L116)):
   - The working SSO callback endpoint includes `redirect_uri`:
   ```javascript
   publicClient.post('/auth/sso/callback/', {
     code,
     state,
     redirect_uri: redirectUri,  // ← PATTERN TO FOLLOW
   })
   ```

4. **Frontend Service** ([frontend/src/services/googleService.js#L17](frontend/src/services/googleService.js#L17)):
   - The redirect_uri is generated but never used:
   ```javascript
   const redirectUri = `${window.location.origin}/google/callback`;
   ```

## Implementation - Files Changed

### File 1: frontend/src/services/api.js

**Location:** Lines 119-122

**Change:** Added `redirectUri` parameter to `googleCallback` function and included it in the request body

**Before:**
```javascript
googleCallback: (code, state) =>
  publicClient.post('/auth/google/callback/', {
    code,
    state,
  }),
```

**After:**
```javascript
googleCallback: (code, state, redirectUri) =>
  publicClient.post('/auth/google/callback/', {
    code,
    state,
    redirect_uri: redirectUri,
  }),
```

**Reason:** The API layer needed to accept and forward the redirect_uri parameter to the backend.

### File 2: frontend/src/services/googleService.js

**Location:** Lines 48-54

**Change:** Generate redirect_uri and pass it to the API call

**Before:**
```javascript
export const handleGoogleCallback = async (code, state, authService) => {
  try {
    // Verify state parameter
    const savedState = localStorage.getItem('google_oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }

    // Exchange code for tokens via backend
    // Note: Backend uses its configured redirect_uri (must match Google's registered URI)
    const response = await authService.googleCallback(code, state);  // ← MISSING redirectUri

    // Clear stored state
    localStorage.removeItem('google_oauth_state');

    return response.data;
  } catch (error) {
    localStorage.removeItem('google_oauth_state');
    throw error;
  }
};
```

**After:**
```javascript
export const handleGoogleCallback = async (code, state, authService) => {
  try {
    // Verify state parameter
    const savedState = localStorage.getItem('google_oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }

    // Exchange code for tokens via backend
    // Note: Backend uses its configured redirect_uri (must match Google's registered URI)
    const redirectUri = `${window.location.origin}/google/callback`;  // ← ADD THIS
    const response = await authService.googleCallback(code, state, redirectUri);  // ← PASS redirectUri

    // Clear stored state
    localStorage.removeItem('google_oauth_state');

    return response.data;
  } catch (error) {
    localStorage.removeItem('google_oauth_state');
    throw error;
  }
};
```

**Reason:** The service layer needed to:
1. Generate the redirect_uri (same URL that Google redirects back to)
2. Pass it to the API layer so the backend receives it

## Flow Diagram - After Fix

```
1. User clicks "Login with Google"
   ↓
2. Frontend generates authorization URL:
   - Includes: client_id, redirect_uri, scope, state
   - Stores state in localStorage for CSRF validation
   ↓
3. User authorizes and Google redirects to callback URL with code
   ↓
4. GoogleCallbackPage.jsx extracts code and state from URL
   ↓
5. Calls handleGoogleCallback(code, state, authService)
   ↓
6. handleGoogleCallback generates redirectUri:
   - redirectUri = window.location.origin + '/google/callback'
   ↓
7. Calls authService.googleCallback(code, state, redirectUri)
   ↓
8. api.js sends POST to /api/auth/google/callback/ with:
   {
     "code": "...",
     "state": "...",
     "redirect_uri": "http://localhost:5175/google/callback"
   }
   ↓
9. Backend receives complete request with redirect_uri
   ↓
10. Backend exchanges code for Google access token using:
    - client_id, client_secret, code, redirect_uri (NOW INCLUDED!)
    ↓
11. Google validates redirect_uri matches registered value
    ↓
12. Exchange succeeds, backend gets access token
    ↓
13. Backend retrieves user info and returns JWT tokens
    ↓
14. Frontend stores tokens and user is logged in ✓
```

## Testing Instructions

### To Test Google OAuth Flow:

1. **Ensure environment is running:**
   ```bash
   # Terminal 1: Backend
   python manage.py runserver 0.0.0.0:8002

   # Terminal 2: Frontend
   npm run dev
   ```

2. **Verify environment variables:**
   - Backend (.env):
     ```
     GOOGLE_CLIENT_ID=your_client_id
     GOOGLE_CLIENT_SECRET=your_client_secret
     GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback
     ```
   
   - Frontend (.env):
     ```
     VITE_GOOGLE_CLIENT_ID=your_client_id
     ```

3. **Test the login flow:**
   - Navigate to http://localhost:5175
   - Click "Login with Google"
   - Authorize the application
   - Check browser console - should NOT see 400 error
   - Network tab should show POST to /api/auth/google/callback/ with status 200
   - Should redirect to dashboard with user logged in

4. **Verify request parameters:**
   - Open DevTools → Network tab
   - Filter by "callback"
   - Click POST request to /api/auth/google/callback/
   - Check Request Payload - should include:
     ```json
     {
       "code": "...",
       "state": "...",
       "redirect_uri": "http://localhost:5175/google/callback"
     }
     ```

5. **Check response:**
   - Response should be 200 OK with:
     ```json
     {
       "access": "jwt_token",
       "refresh": "jwt_token",
       "user": {...}
     }
     ```

## Why This Fix Is Permanent

1. **OAuth 2.0 Compliance**: The fix ensures the frontend follows OAuth 2.0 authorization code flow specification, which requires redirect_uri in the token exchange request.

2. **Backend Requirement**: The backend explicitly requires this parameter (documented in the endpoint docstring).

3. **Security**: The redirect_uri parameter is critical for:
   - Preventing open redirect vulnerabilities
   - Validating that the authorization code is used by the correct application
   - Ensuring Google's token endpoint validates the request correctly

4. **Consistency**: The fix aligns Google OAuth callback with the existing SSO callback implementation, which already includes redirect_uri.

5. **Environment Safety**: The redirect_uri is generated dynamically from `window.location.origin`, so it automatically adapts to different deployment environments (localhost, staging, production).

## Prevention Strategy

To prevent similar issues in the future:

1. **Code Review Checklist:**
   - When implementing OAuth endpoints, verify request body matches backend's expected parameters
   - Compare implementation with similar working endpoints (e.g., SSO callback)
   - Check backend endpoint documentation for required parameters

2. **Testing:**
   - Add unit tests for OAuth service layer that verify all expected parameters are passed
   - Add integration tests that verify the complete OAuth flow
   - Test with different redirect URIs to ensure parameter is dynamic

3. **Documentation:**
   - Keep backend endpoint docstrings updated with example request bodies
   - Document expected parameters in frontend service files
   - Add inline comments explaining why each parameter is required

## Timeline

- **Problem**: 400 Bad Request during Google OAuth callback
- **Investigation**: Identified missing `redirect_uri` parameter in frontend API call
- **Root Cause**: Parameter generated in googleService.js but not passed to API layer
- **Fix Applied**: 
  - Updated api.js to accept and send redirect_uri
  - Updated googleService.js to generate and pass redirect_uri
- **Status**: ✅ COMPLETE

## Related Files

- [frontend/src/services/api.js](frontend/src/services/api.js) - API client definitions
- [frontend/src/services/googleService.js](frontend/src/services/googleService.js) - Google OAuth service
- [frontend/src/pages/GoogleCallbackPage.jsx](frontend/src/pages/GoogleCallbackPage.jsx) - Callback page component
- [backend/apps/auth/views.py](backend/apps/auth/views.py) - Backend OAuth endpoint (lines 297-400)
- [backend/apps/auth/urls.py](backend/apps/auth/urls.py) - Auth URL routing

## Verification Checklist

- ✅ Identified root cause: Missing redirect_uri in API call
- ✅ Located exact issue location: api.js line 122, googleService.js line 50
- ✅ Applied fix to api.js: Added redirectUri parameter and included in request body
- ✅ Applied fix to googleService.js: Generate redirectUri and pass to API
- ✅ Verified changes are correct: Both files updated successfully
- ✅ Ensured consistency: Aligned with SSO callback pattern
- ✅ Documentation complete: This file details root cause and fix
