# 🔍 OAuth Implementation Deep Dive - Technical Details

**For understanding how OAuth is wired in the project**

---

## 📍 Code Locations

### Frontend OAuth Flow

**File 1**: `frontend/src/services/googleService.js`
```javascript
// Line 6: Where Client ID is loaded
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

// Line 10-32: Function that generates Google OAuth URL
export const getGoogleAuthorizationUrl = () => {
  const redirectUri = `${window.location.origin}/google/callback`;
  // Builds: https://accounts.google.com/o/oauth2/v2/auth?client_id=...
}

// Line 40-58: Function that handles callback after user logs in
export const handleGoogleCallback = async (code, state, authService) => {
  // Exchanges code for tokens via backend
  // Sends POST to: /api/auth/google/callback/
}
```

**File 2**: `frontend/src/pages/LoginPage.js`
```javascript
// Line 7: Import Google service
import { getGoogleAuthorizationUrl, isGoogleConfigured } from '../services/googleService';

// Line 31: When user clicks "Login with Google"
const handleGoogleLogin = () => {
  const googleUrl = getGoogleAuthorizationUrl();
  window.location.href = googleUrl;  // Redirect to Google
}

// Line 55-58: Show button only if configured
{isGoogleConfigured() && (
  <Button onClick={handleGoogleLogin}>
    {t('login.google_login')}
  </Button>
)}
```

**File 3**: `frontend/src/pages/GoogleCallbackPage.js`
```javascript
// Handles the redirect after Google login
// Processes the authorization code from URL
// Sends it to backend: POST /api/auth/google/callback/
```

---

### Backend OAuth Flow

**File 1**: `backend/config/settings.py` (Lines 285-291)
```python
# Google OAuth configuration - reads from .env
GOOGLE_CLIENT_ID = env('GOOGLE_CLIENT_ID', default='')
GOOGLE_CLIENT_SECRET = env('GOOGLE_CLIENT_SECRET', default='')
GOOGLE_REDIRECT_URI = env('GOOGLE_REDIRECT_URI', default='http://localhost:5175/google/callback')
```

**File 2**: `backend/apps/auth/views.py` (Lines 295-350+)
```python
@api_view(['POST'])
@permission_classes([AllowAny])
def google_callback(request):
    """
    Handle Google OAuth 2.0 callback
    
    1. Get auth code from request
    2. Exchange code for Google access token
    3. Get user info from Google
    4. Create/retrieve user in database
    5. Generate JWT tokens
    6. Return tokens to frontend
    """
    
    # Line 345: Get config from settings
    google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
    google_client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', '')
    google_redirect_uri = getattr(settings, 'GOOGLE_REDIRECT_URI', '...')
    
    # Line ~360: Exchange code for token
    # POST https://oauth2.googleapis.com/token
    # with: code, client_id, client_secret, redirect_uri
    
    # Line ~380: Get user info from Google
    # GET https://www.googleapis.com/oauth2/v2/userinfo
    
    # Line ~400: Create/update user in database
    # Line ~410: Generate JWT tokens
    # Line ~420: Return tokens to frontend
```

**File 3**: `backend/apps/auth/urls.py` (Line 22)
```python
path('google/callback/', google_callback, name='google_callback'),
# Maps: POST /api/auth/google/callback/ → google_callback function
```

---

## 🔄 Complete OAuth Flow with Code

### Step 1: User Clicks Login

**Frontend - LoginPage.js**
```javascript
onClick={handleGoogleLogin}
  ↓
const handleGoogleLogin = () => {
  const googleUrl = getGoogleAuthorizationUrl();
  window.location.href = googleUrl;  // Redirect!
}
```

### Step 2: Frontend Builds OAuth URL

**Frontend - googleService.js**
```javascript
export const getGoogleAuthorizationUrl = () => {
  const redirectUri = `${window.location.origin}/google/callback`;
  // window.location.origin = "http://localhost:5175"
  // redirectUri = "http://localhost:5175/google/callback"
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,           // From: REACT_APP_GOOGLE_CLIENT_ID in .env.local
    redirect_uri: redirectUri,              // "http://localhost:5175/google/callback"
    response_type: 'code',
    scope: 'profile email openid',          // What data we're requesting
    state: generateRandomState(),           // CSRF protection
    access_type: 'online',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
```

**Result**: Builds URL like:
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=123456789-abc.apps.googleusercontent.com&
  redirect_uri=http://localhost:5175/google/callback&
  response_type=code&
  scope=profile%20email%20openid&
  state=abc123xyz&
  access_type=online&
  prompt=consent
```

### Step 3: User Logs In with Google

- Browser redirects to Google
- User sees: "Sign in with your Google account"
- User enters email and password
- Google shows: "KMSetjen DPD RI wants access to..."
- User clicks: "Allow"

### Step 4: Google Redirects Back to Frontend

**Google redirects to**:
```
http://localhost:5175/google/callback?
  code=4/0AY0e-g...&
  state=abc123xyz
```

### Step 5: Frontend Captures Callback

**Frontend - GoogleCallbackPage.js**
```javascript
// URL: http://localhost:5175/google/callback?code=4/0AY0e-g...&state=abc123xyz

const code = urlParams.get('code');      // Extract: 4/0AY0e-g...
const state = urlParams.get('state');    // Extract: abc123xyz

// Verify state (CSRF protection)
const savedState = localStorage.getItem('google_oauth_state');
if (state !== savedState) {
  throw new Error('CSRF attack detected!');
}

// Send code to backend
apiClient.post('/auth/google/callback/', {
  code: code,
  state: state
});
```

### Step 6: Backend Receives Code

**Backend - auth/views.py (google_callback function)**
```python
@api_view(['POST'])
def google_callback(request):
    code = request.data.get('code')
    state = request.data.get('state')
    
    # Get configuration from .env
    google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
    google_client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', '')
    google_redirect_uri = getattr(settings, 'GOOGLE_REDIRECT_URI', '...')
    
    # Check: Do we have credentials?
    if not google_client_id or not google_client_secret:
        return Response(
            {'error': 'Google OAuth is not configured on server'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

### Step 7: Backend Exchanges Code for Token

**Backend exchanges with Google**
```python
# Prepare request
token_url = 'https://oauth2.googleapis.com/token'
token_request_data = {
    'code': code,
    'client_id': google_client_id,      # From: GOOGLE_CLIENT_ID in .env
    'client_secret': google_client_secret,  # From: GOOGLE_CLIENT_SECRET in .env
    'redirect_uri': google_redirect_uri,    # From: GOOGLE_REDIRECT_URI in .env
    'grant_type': 'authorization_code'
}

# Send request
response = requests.post(token_url, data=token_request_data)
token_data = response.json()

# Get access token from Google
google_access_token = token_data.get('access_token')
```

### Step 8: Backend Gets User Info from Google

```python
# Get user info from Google
userinfo_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
headers = {
    'Authorization': f'Bearer {google_access_token}'
}

response = requests.get(userinfo_url, headers=headers)
user_data = response.json()

# Extract user info
email = user_data.get('email')
first_name = user_data.get('given_name')
last_name = user_data.get('family_name')
picture = user_data.get('picture')
```

### Step 9: Backend Creates/Updates User in Database

```python
# Create or get user
user, created = User.objects.get_or_create(
    email=email,
    defaults={
        'username': email.split('@')[0],
        'first_name': first_name or '',
        'last_name': last_name or '',
    }
)

# Update user info if they exist
if not created:
    user.first_name = first_name or user.first_name
    user.last_name = last_name or user.last_name
    user.save()
```

### Step 10: Backend Generates JWT Tokens

```python
# Use Django REST Framework JWT
from rest_framework_simplejwt.tokens import RefreshToken

# Generate tokens
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)
refresh_token = str(refresh)

# Return to frontend
return Response({
    'access': access_token,
    'refresh': refresh_token,
    'user': {
        'id': user.id,
        'email': user.email,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name
    }
})
```

### Step 11: Frontend Receives Tokens

**Frontend - GoogleCallbackPage.js**
```javascript
// Backend responded with tokens
const response = {
    access: 'eyJ0eXAiOiJKV1QiLCJhbGc...',  // JWT token
    refresh: 'eyJ0eXAiOiJKV1QiLCJhbGc...',  // Refresh token
    user: {
        id: 1,
        email: 'user@example.com',
        username: 'user',
        first_name: 'John',
        last_name: 'Doe'
    }
}

// Save tokens
localStorage.setItem('token', response.access);
localStorage.setItem('refresh_token', response.refresh);

// Save user
setUser(response.user);

// Redirect to dashboard
navigate('/dashboard');
```

### Step 12: User Is Logged In!

- ✅ Browser shows dashboard
- ✅ User profile shows: "John Doe" (from Google)
- ✅ JWT token stored in localStorage
- ✅ All subsequent API calls include JWT token

---

## 📊 Environment Variables Used

### In Backend (`backend/.env`)

```env
GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID
    ├─ Used in: backend/config/settings.py
    ├─ Used in: backend/apps/auth/views.py (google_callback function)
    └─ Sent to: Google when exchanging code for token

GOOGLE_CLIENT_SECRET=YOUR_NEW_CLIENT_SECRET
    ├─ Used in: backend/config/settings.py
    ├─ Used in: backend/apps/auth/views.py (google_callback function)
    └─ Sent to: Google when exchanging code for token (NEVER exposed to frontend)

GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback
    ├─ Used in: backend/config/settings.py
    ├─ Used in: backend/apps/auth/views.py (google_callback function)
    └─ Must match: The redirect_uri registered in Google Console
    └─ Must match: The redirect_uri used in frontend
```

### In Frontend (`frontend/.env.local`)

```env
REACT_APP_GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID
    ├─ Used in: frontend/src/services/googleService.js
    ├─ Used in: frontend/src/pages/LoginPage.js (to check if configured)
    └─ Sent to: Google when building OAuth URL
    └─ NOTE: Frontend gets CLIENT_ID only, not the SECRET
```

---

## 🔒 Security Points

### Why Client Secret is NOT in Frontend

```javascript
// ❌ WRONG - Never do this:
const GOOGLE_CLIENT_SECRET = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
// This would expose the secret to anyone who views the page source!

// ✅ CORRECT - Secret stays on backend:
// backend/.env: GOOGLE_CLIENT_SECRET=xxxxx
// frontend/.env: (no secret, only client id)
```

### Why Redirect URI Must Match

```
When you create OAuth credentials in Google Console:
├─ You register: http://localhost:5175/google/callback
│
Frontend uses: http://localhost:5175/google/callback
│
Backend uses: http://localhost:5175/google/callback
│
Google checks: All three must match EXACTLY
└─ If mismatch: Google rejects the request
```

### Why State Parameter Exists

```javascript
// CSRF Protection:
// 1. Frontend generates random state: "abc123xyz"
// 2. Frontend stores in localStorage
// 3. Frontend sends to Google (in URL)
// 4. Google sends back (in URL)
// 5. Frontend checks: Does it match what we stored?
// 6. If NO match: Someone tampered with the URL, reject!
```

---

## 📱 What Happens If Something Goes Wrong

### Error: "Invalid Client ID"
```
Google doesn't recognize the CLIENT_ID you're using
Cause: Wrong credentials pasted, or typo
Fix: Copy from Google Console again, paste carefully
```

### Error: "Redirect URI mismatch"
```
The redirect_uri doesn't match what Google expects
Cause: URI in Google Console ≠ URI in code
Fix: Make sure EXACT match: http://localhost:5175/google/callback
```

### Error: "Invalid Client"
```
Google doesn't trust these credentials
Cause: Wrong CLIENT_ID or CLIENT_SECRET
Fix: Generate new credentials in Google Console
```

---

## 🎯 Summary: What Gets Exchanged

```
FRONTEND                    BACKEND                     GOOGLE
├─ Client ID                                            
│  (public, ok to share)
│
├─ Authorization Code ──────────────────────────────────→
                            
                            ├─ Client ID ──────────────→
                            ├─ Client Secret ──────────→
                            ├─ Auth Code ──────────────→
                            └─ Redirect URI ───────────→
                                                        
                                    ← Access Token ─────┤
                            
                            ├─ Access Token ───────────→
                                                        
                                    ← User Info ───────┤
                            
                    ← JWT Tokens & User Info ────────────
                    (from Backend)
```

---

**The Key Secret**: Only the backend has CLIENT_SECRET. Frontend never sees it. This keeps your OAuth secure! 🔐

---

**Generated**: January 20, 2026  
**Purpose**: Understand OAuth flow in KMSetjen DPD RI  
**Files Reference**: 
- Frontend: `frontend/src/services/googleService.js`, `frontend/src/pages/LoginPage.js`
- Backend: `backend/apps/auth/views.py`, `backend/config/settings.py`
