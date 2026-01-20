# Google Login Setup - Complete Implementation Guide

**Status**: Ready to implement Google OAuth 2.0 login  
**Date**: January 9, 2026  
**Frontend**: ✅ Implemented (needs .env setup)  
**Backend**: ⏳ Needs implementation

---

## Issue Identified

The "Masuk dengan Google" button is **hidden** on the login page because:
- `REACT_APP_GOOGLE_CLIENT_ID` environment variable is **not set** in frontend
- Backend endpoint `/auth/google/callback/` is **not implemented**

The code checks: `isGoogleConfigured()` which returns `false` when `REACT_APP_GOOGLE_CLIENT_ID` is empty.

---

## Part 1: Frontend Setup (Quick - 5 minutes)

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
4. Choose **Web Application**
5. Add authorized redirect URIs:
   - `http://localhost:3000/google/callback` (development)
   - `https://your-domain.com/google/callback` (production)
6. Copy the **Client ID** (looks like: `123456789-abc...xyz.apps.googleusercontent.com`)

### Step 2: Configure Frontend .env

Create or edit `frontend/.env.local`:

```env
# Frontend Configuration
REACT_APP_API_BASE_URL=http://localhost:8000/api
REACT_APP_API_TIMEOUT=10000

# SSO Configuration
REACT_APP_SSO_URL=https://nusadpd.duckdns.org
REACT_APP_SSO_CLIENT_ID=kms-dpd-ri

# Google OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Google Client ID.

### Step 3: Restart Frontend Dev Server

```bash
cd frontend
npm start
```

The Google button should now appear on the login page!

---

## Part 2: Backend Setup (Required for Full Flow)

### Issue: Backend Missing Google OAuth Callback Endpoint

The frontend expects: `POST /api/auth/google/callback/`  
But it doesn't exist in the backend yet.

### Step 1: Add Google OAuth Environment Variables

Edit `backend/.env`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=http://localhost:3000/google/callback
```

Get `GOOGLE_CLIENT_SECRET` from Google Cloud Console (same place as Client ID).

### Step 2: Implement Google Callback Endpoint

Add to `backend/authentication/views.py`:

```python
import json
import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User

class GoogleCallbackView(APIView):
    """
    Handle Google OAuth 2.0 callback
    Flow:
    1. Frontend redirects user to Google
    2. User approves scopes
    3. Google redirects to /google/callback with code
    4. Frontend sends code + state to this endpoint
    5. Backend exchanges code for tokens with Google
    6. Backend creates/finds user and returns JWT tokens
    """
    
    def post(self, request):
        try:
            code = request.data.get('code')
            state = request.data.get('state')
            redirect_uri = request.data.get('redirect_uri', settings.GOOGLE_REDIRECT_URI)
            
            if not code:
                return Response(
                    {'error': 'Authorization code not provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Step 1: Exchange code for tokens with Google
            token_response = requests.post(
                'https://oauth2.googleapis.com/token',
                data={
                    'code': code,
                    'client_id': settings.GOOGLE_CLIENT_ID,
                    'client_secret': settings.GOOGLE_CLIENT_SECRET,
                    'redirect_uri': redirect_uri,
                    'grant_type': 'authorization_code',
                }
            )
            
            if token_response.status_code != 200:
                return Response(
                    {'error': 'Failed to exchange code for tokens'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            tokens = token_response.json()
            access_token = tokens.get('access_token')
            
            # Step 2: Get user info from Google
            userinfo_response = requests.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            
            if userinfo_response.status_code != 200:
                return Response(
                    {'error': 'Failed to get user info'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user_info = userinfo_response.json()
            
            # Step 3: Create or get user
            email = user_info.get('email')
            first_name = user_info.get('given_name', '')
            last_name = user_info.get('family_name', '')
            
            if not email:
                return Response(
                    {'error': 'Email not provided by Google'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': first_name,
                    'last_name': last_name,
                }
            )
            
            # Step 4: Generate JWT tokens
            from rest_framework_simplejwt.tokens import RefreshToken
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
```

### Step 3: Add URL Route

Edit `backend/authentication/urls.py`:

```python
from django.urls import path
from .views import GoogleCallbackView

urlpatterns = [
    # ... existing routes ...
    path('auth/google/callback/', GoogleCallbackView.as_view(), name='google_callback'),
]
```

### Step 4: Install Required Package

```bash
pip install requests
```

### Step 5: Configure Django Settings

Edit `backend/settings.py`:

```python
# Add this to your settings file
from decouple import config

# Google OAuth Configuration
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET', '')
GOOGLE_REDIRECT_URI = config('GOOGLE_REDIRECT_URI', 'http://localhost:3000/google/callback')
```

---

## Testing the Complete Flow

### Frontend Test (No Backend)
1. Set `REACT_APP_GOOGLE_CLIENT_ID` in `.env.local`
2. Go to `http://localhost:3000/login`
3. Click "Masuk dengan Google" button
4. Should redirect to Google login page
5. After approval, redirects to `/google/callback`
6. Error page (expected - backend not set up yet)

### Full End-to-End Test (With Backend)
1. Complete all backend setup above
2. Go to `http://localhost:3000/login`
3. Click "Masuk dengan Google"
4. Approve scopes
5. Should redirect to dashboard
6. User logged in with Google account

---

## Frontend Code Details

### Current Implementation: `frontend/src/pages/LoginPage.js`

The Google button is already implemented:

```jsx
{isGoogleConfigured() && (
  <Button
    type="button"
    className="google-login-btn"
    onClick={handleGoogleLogin}
    disabled={loading}
  >
    <FaGoogle size={20} className="me-2" />
    {t('login.google_login')}
  </Button>
)}
```

✅ Shows only when `REACT_APP_GOOGLE_CLIENT_ID` is set  
✅ Styling in `AuthPages.css` with dark mode support  
✅ Icon from `react-icons/fa`  
✅ Translation key from i18next

### Service: `frontend/src/services/googleService.js`

Handles OAuth flow:
- `getGoogleAuthorizationUrl()` - Generates redirect URL with CSRF protection
- `handleGoogleCallback(code, state)` - Exchanges code for tokens
- `isGoogleConfigured()` - Checks if Client ID is set

### Callback Handler: `frontend/src/pages/GoogleCallbackPage.js`

Processes the callback:
1. Validates state parameter (CSRF protection)
2. Sends code to backend
3. Receives JWT tokens
4. Auto-redirects to dashboard

---

## Environment Variables Summary

### Frontend
```
REACT_APP_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
```
- **Location**: `frontend/.env.local` or `frontend/.env`
- **Purpose**: Used to redirect user to Google login page
- **Get from**: Google Cloud Console → Credentials → OAuth 2.0 Client ID

### Backend
```
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:3000/google/callback
```
- **Location**: `backend/.env`
- **Purpose**: Used to exchange authorization code for tokens
- **Get from**: Google Cloud Console → Credentials → OAuth 2.0 Client ID (Click to view)

---

## Styling

### Dark Mode Support

`frontend/src/pages/AuthPages.css`:

```css
.google-login-btn {
  width: 100%;
  background-color: #ffffff;
  border: 1px solid #ddd;
  color: #333;
  padding: 10px 16px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  transition: all 0.3s ease;
}

.google-login-btn:hover {
  background-color: #f5f5f5;
  border-color: #999;
}

[data-theme="dark"] .google-login-btn {
  background-color: #333;
  border-color: #555;
  color: #ffffff;
}

[data-theme="dark"] .google-login-btn:hover {
  background-color: #444;
  border-color: #777;
}
```

---

## Translations

Both languages supported:

### Indonesian: `frontend/src/locales/id/translation.json`
```json
"login": {
  "google_login": "Masuk dengan Google"
}
```

### English: `frontend/src/locales/en/translation.json`
```json
"login": {
  "google_login": "Sign in with Google"
}
```

---

## Complete Architecture

```
User clicks "Masuk dengan Google"
    ↓
Frontend: getGoogleAuthorizationUrl()
    ↓ (Redirects to)
Google: Asks user to login/approve
    ↓ (Redirects to)
http://localhost:3000/google/callback?code=AUTH_CODE&state=CSRF_TOKEN
    ↓
Frontend: GoogleCallbackPage validates state
    ↓
Frontend: Sends code to backend at POST /auth/google/callback/
    ↓
Backend: Exchanges code for Google tokens
    ↓
Backend: Fetches user info from Google
    ↓
Backend: Creates/finds user in database
    ↓
Backend: Generates JWT tokens
    ↓
Frontend: Receives JWT tokens, stores in localStorage
    ↓
Frontend: Auto-redirects to /dashboard
    ↓
User logged in ✅
```

---

## Troubleshooting

### "Masuk dengan Google" Button Not Showing

**Check**: Is `REACT_APP_GOOGLE_CLIENT_ID` set?
```bash
# In frontend directory
echo %REACT_APP_GOOGLE_CLIENT_ID%  # Windows
# or
echo $REACT_APP_GOOGLE_CLIENT_ID   # Mac/Linux
```

**Fix**: Add to `frontend/.env.local`

### Redirect URI Mismatch Error

**Issue**: "The redirect URI provided is not valid"

**Check**: Authorized URIs in Google Cloud Console match:
- Frontend callback URL
- Backend configuration
- Environment variable

**Fix**: Add all URIs to Google Cloud Console → Credentials → OAuth Client ID

### 500 Error on Callback

**Check**: Backend logs for:
- Missing `GOOGLE_CLIENT_SECRET`
- Invalid credentials
- User creation failure

**Fix**: 
1. Verify all env vars in `backend/.env`
2. Check backend is running
3. Review server logs

---

## Next Steps

1. **Immediate** (5 min): Set up frontend .env with Google Client ID
2. **Next** (15 min): Implement backend callback endpoint
3. **Test** (10 min): Test complete flow from login to dashboard
4. **Document** (5 min): Update deployment configs if needed

---

## Files Modified/Created

✅ **Frontend** (Already exists, just needs .env):
- `frontend/src/pages/LoginPage.js` - Google button with conditional render
- `frontend/src/pages/GoogleCallbackPage.js` - Callback handler
- `frontend/src/services/googleService.js` - OAuth service
- `frontend/src/pages/AuthPages.css` - Styling

⏳ **Backend** (Needs to be created):
- `backend/authentication/views.py` - Add GoogleCallbackView
- `backend/authentication/urls.py` - Add route
- `backend/.env` - Add Google credentials

📝 **Configuration**:
- `frontend/.env.local` - Frontend Google Client ID
- `backend/.env` - Backend Google credentials

---

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- Project: KMS DPD RI
- Started: January 9, 2026
