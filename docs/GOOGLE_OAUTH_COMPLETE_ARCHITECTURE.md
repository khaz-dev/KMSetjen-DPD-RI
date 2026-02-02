# 📊 Google OAuth Flow - Complete Architecture & Data Flow

## 🔄 End-to-End OAuth Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GOOGLE OAUTH 2.0 FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

1. USER INITIATES LOGIN
   ┌──────────────┐
   │   Browser    │
   │ (Localhost)  │
   └──────┬───────┘
          │
          │ User visits http://localhost:5175/login
          │ Clicks "Masuk dengan Google" button
          ▼
   ┌──────────────────────────────────────────┐
   │  Frontend: LoginPage.jsx                 │
   │  - onClick: handleGoogleLogin()          │
   │  - Calls: getGoogleAuthorizationUrl()    │
   └──────┬───────────────────────────────────┘
          │
          │ Generates:
          │ - Random CSRF state
          │ - Stores state in localStorage
          │ - Builds OAuth redirect URL
          ▼

2. REDIRECT TO GOOGLE
   ┌──────────────────────────────────────────────────┐
   │ window.location.href =                           │
   │ https://accounts.google.com/o/oauth2/v2/auth?    │
   │  client_id=403156786636-7umtcld...              │
   │  &redirect_uri=http://localhost:5175/...         │
   │  &response_type=code                             │
   │  &scope=profile%20email%20openid                │
   │  &state=<RANDOM_STATE>                          │
   └──────┬───────────────────────────────────────────┘
          │
          ▼
   ┌──────────────────────────┐
   │  Google Login Page       │
   │  - User signs in         │
   │  - Approves permissions  │
   └──────┬───────────────────┘
          │
          │ Google generates:
          │ - Authorization code
          │ - Adds state parameter
          ▼

3. GOOGLE REDIRECTS BACK TO FRONTEND
   ┌─────────────────────────────────────────────────┐
   │ http://localhost:5175/google/callback?          │
   │  code=4/0AY0e-gxxxxxxxxxxxxxxxxxxx              │
   │  &state=<SAME_RANDOM_STATE>                     │
   └─────────────────────────────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────────────┐
   │ Frontend: GoogleCallbackPage.jsx        │
   │ Runs in useEffect on mount:             │
   │ 1. Extract code and state from URL      │
   │ 2. Validate state matches stored state  │
   │ 3. Call handleGoogleCallback()          │
   └─────┬───────────────────────────────────┘
         │
         │ Calls: authService.googleCallback(code, state)
         ▼

4. SEND CODE TO BACKEND
   ┌────────────────────────────────────────┐
   │ POST /api/auth/google/callback/        │
   │ Content-Type: application/json         │
   │                                        │
   │ {                                      │
   │   "code": "4/0AY0e-gxxxxxxxxx...",    │
   │   "state": "random_state_string"       │
   │ }                                      │
   └────┬───────────────────────────────────┘
        │
        ▼
   ┌────────────────────────────────────────────────────┐
   │ Django Backend: google_callback() view             │
   │                                                    │
   │ ✅ Step 1: Load credentials from environment       │
   │    GOOGLE_CLIENT_ID: 403156786636-7umtcld...      │
   │    GOOGLE_CLIENT_SECRET: GOCSPX-xNMDjqy4TZp...   │
   │    GOOGLE_REDIRECT_URI: http://localhost:5175...  │
   │                                                    │
   │ ✅ Step 2: Validate code present                  │
   │    if not code: return 400 error                  │
   │                                                    │
   │ ✅ Step 3: Exchange code for token                │
   │    POST https://oauth2.googleapis.com/token       │
   │    data: {                                        │
   │      code: <AUTH_CODE>,                          │
   │      client_id: <CLIENT_ID>,                     │
   │      client_secret: <SECRET>,                    │
   │      redirect_uri: http://localhost:5175/...,    │
   │      grant_type: authorization_code              │
   │    }                                              │
   └────┬───────────────────────────────────────────────┘
        │
        │ Google returns:
        │ {
        │   "access_token": "ya29.a0AfH6SMB...",
        │   "expires_in": 3599,
        │   "token_type": "Bearer"
        │ }
        ▼

5. FETCH USER INFO FROM GOOGLE
   ┌──────────────────────────────────────────┐
   │ Backend:                                 │
   │ GET https://www.googleapis.com/oauth2... │
   │  /v2/userinfo                            │
   │ Headers: Authorization: Bearer <TOKEN>   │
   │                                          │
   │ Google Returns:                          │
   │ {                                        │
   │   "id": "1234567890",                    │
   │   "email": "user@example.com",           │
   │   "given_name": "John",                  │
   │   "family_name": "Doe",                  │
   │   "picture": "https://..."               │
   │ }                                        │
   └──────┬───────────────────────────────────┘
          │
          ▼

6. CREATE OR RETRIEVE USER FROM DATABASE
   ┌────────────────────────────────────────┐
   │ Backend: Transaction.atomic()          │
   │                                        │
   │ 1. Check if user exists by email       │
   │ 2. If exists: update first/last name   │
   │ 3. If new: create user with defaults   │
   │                                        │
   │ User Created/Found in DB:              │
   │ {                                      │
   │   "id": 5,                             │
   │   "email": "user@example.com",         │
   │   "username": "user",                  │
   │   "first_name": "John",                │
   │   "last_name": "Doe",                  │
   │   "is_active": true                    │
   │ }                                      │
   └──────┬───────────────────────────────────┘
          │
          ▼

7. GENERATE JWT TOKENS
   ┌────────────────────────────────────────┐
   │ Backend: RefreshToken.for_user()       │
   │                                        │
   │ Creates:                               │
   │ - access_token (1 hour lifetime)       │
   │ - refresh_token (7 day lifetime)       │
   │                                        │
   │ Returns 200 Response:                  │
   │ {                                      │
   │   "access": "eyJ0eXAiOiJKV1QiLCJhbGc", │
   │   "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc", │
   │   "user": {                            │
   │     "id": 5,                           │
   │     "email": "user@example.com",       │
   │     "username": "user",                │
   │     "first_name": "John",              │
   │     "last_name": "Doe",                │
   │     "roles": ["reader"]                │
   │   }                                    │
   │ }                                      │
   └──────┬───────────────────────────────────┘
          │
          ▼

8. FRONTEND RECEIVES TOKENS & USER DATA
   ┌────────────────────────────────────────────┐
   │ Frontend: GoogleCallbackPage.jsx           │
   │                                            │
   │ Receives response from backend:            │
   │ - access_token ✅ Store in localStorage    │
   │ - refresh_token ✅ Store in localStorage   │
   │ - user data ✅ Pass to AuthContext         │
   │                                            │
   │ Calls: setAuthUser(user_data)             │
   │ - Updates AuthContext.user                 │
   │ - Sets AuthContext.isAuthenticated = true  │
   └──────┬─────────────────────────────────────┘
          │
          │ AuthContext updated
          │ Navbar component re-renders
          │ User profile now visible
          ▼

9. REDIRECT TO DASHBOARD
   ┌─────────────────────────────┐
   │ Frontend redirects to:       │
   │ /dashboard                  │
   │                             │
   │ Dashboard loads protected   │
   │ content for authenticated   │
   │ users                       │
   └─────────────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ ✅ USER SUCCESSFULLY        │
   │    LOGGED IN!               │
   │                             │
   │ Can access:                 │
   │ - Dashboard                 │
   │ - Profile page              │
   │ - Protected API endpoints   │
   │ - User-specific features    │
   └─────────────────────────────┘
```

---

## 📁 Code Components

### Frontend Components

**1. LoginPage.jsx**
```javascript
// Button that triggers Google OAuth
onClick={handleGoogleLogin}

handleGoogleLogin = () => {
  const googleUrl = getGoogleAuthorizationUrl();
  window.location.href = googleUrl;
}
```

**2. googleService.js**
```javascript
// Generates OAuth URL with CSRF protection
export const getGoogleAuthorizationUrl = () => {
  const state = generateRandomState();
  localStorage.setItem('google_oauth_state', state);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// Exchanges code for tokens
export const handleGoogleCallback = async (code, state, authService) => {
  validateState(state);
  return await authService.googleCallback(code, state);
}
```

**3. GoogleCallbackPage.jsx**
```javascript
// Handles redirect from Google
useEffect(() => {
  const { code, state, error } = getGoogleCallbackParams();
  
  // 1. Validate parameters
  // 2. Exchange code for tokens
  // 3. Store tokens in localStorage
  // 4. Fetch user data with /api/auth/me/
  // 5. Update AuthContext with user data
  // 6. Redirect to dashboard
}, [])
```

**4. api.js**
```javascript
// Makes POST to backend
export const authService = {
  googleCallback: (code, state) =>
    publicClient.post('/auth/google/callback/', {
      code,
      state,
    }),
}
```

### Backend Component

**google_callback() - backend/apps/auth/views.py**
```python
@api_view(['POST'])
@permission_classes([AllowAny])
def google_callback(request):
    code = request.data.get('code')
    
    # Step 1: Load credentials (NOW WORKS!)
    google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
    
    # Step 2: Exchange code with Google
    token_response = requests.post(
        'https://oauth2.googleapis.com/token',
        data={
            'code': code,
            'client_id': google_client_id,
            'client_secret': google_client_secret,
            'redirect_uri': google_redirect_uri,
            'grant_type': 'authorization_code',
        }
    )
    
    # Step 3: Get user info from Google
    userinfo_response = requests.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        headers={'Authorization': f'Bearer {google_access_token}'}
    )
    
    # Step 4: Create or retrieve user
    user, created = User.objects.get_or_create(
        email=user_info['email'],
        defaults={'username': username, 'first_name': first_name}
    )
    
    # Step 5: Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    # Step 6: Return tokens
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {...user_data...}
    })
```

---

## 🔐 Security Features

### 1. CSRF Protection
- Random state generated for each OAuth request
- State stored in localStorage
- State validated on callback
- Prevents CSRF attacks

### 2. Token Security
- Tokens stored in localStorage (accessible by JS)
- Authorization header added automatically to requests
- Token expiration: 1 hour (access), 7 days (refresh)
- Refresh token used to get new access token

### 3. User Isolation
- Users created per email address
- Each user has unique JWT tokens
- Tokens tied to specific user ID
- Can't access other user's resources

### 4. Redirect URI Validation
- Must match registered redirect URI in Google Cloud Console
- Backend uses configured redirect_uri (not frontend's)
- Prevents token theft via redirect manipulation

---

## 🔧 Configuration Parameters

### Backend (.env → docker-compose.yml → Django settings)
```
GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback
```

### Frontend (.env → Vite → import.meta.env)
```
VITE_GOOGLE_CLIENT_ID=403156786636-7umtcldsh5t6h31r3q4eprni77qqicos.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:8002/api (for localhost)
```

---

## ✅ What Was Fixed

**Issue**: Environment variables not passed from `.env` to Django container

**Root Cause**: `docker-compose.yml` missing Google OAuth variables in Django service environment

**Fix**: Added these lines to docker-compose.yml:
```yaml
GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-}
GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:-}
GOOGLE_REDIRECT_URI: ${GOOGLE_REDIRECT_URI:-http://localhost:5175/google/callback}
```

**Result**: Django now reads credentials from .env file and Google OAuth works properly

---

## 📊 Success Metrics

After fix is applied:
- ✅ No 400/500 errors when calling Google callback endpoint
- ✅ Successful token exchange with Google
- ✅ User created in database with correct email
- ✅ JWT tokens returned to frontend
- ✅ User authenticated and redirected to dashboard
- ✅ Multiple logins work without issues
