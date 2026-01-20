# Google OAuth Integration Guide - KMS DPD RI

## Overview
This document describes the Google OAuth 2.0 integration for the KMS DPD RI login page, allowing users to sign in with their Google accounts.

## Architecture

### Components
1. **Frontend**
   - `googleService.js` - OAuth 2.0 flow handling
   - `GoogleCallbackPage.js` - Callback handler
   - `LoginPage.js` - Google button integration
   - Environment variables for configuration

2. **Backend**
   - Google OAuth token exchange endpoint
   - User lookup/creation by Google email
   - JWT token generation

### OAuth 2.0 Flow

```
User clicks "Sign in with Google"
        ↓
Frontend redirects to: https://accounts.google.com/o/oauth2/v2/auth
   - client_id: YOUR_GOOGLE_CLIENT_ID
   - redirect_uri: http://localhost:3000/google/callback
   - response_type: code
   - scope: profile email openid
   - access_type: online
   - prompt: consent
   - state: random_csrf_token
        ↓
User authenticates at Google
        ↓
Google redirects to: http://localhost:3000/google/callback?code=...&state=...
        ↓
GoogleCallbackPage exchanges code for tokens:
   POST /api/auth/google/callback/ {code, state, redirect_uri}
        ↓
Backend exchanges code with Google for ID token
Backend creates/updates user
Backend returns access_token, refresh_token, user_data
        ↓
Frontend stores tokens and redirects to dashboard
```

## Setup Instructions

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API:
   - Go to APIs & Services → Library
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth 2.0 Credentials:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `http://localhost:5173` (Vite)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/google/callback`
     - `https://yourdomain.com/google/callback`
   - Copy Client ID and Client Secret

### Step 2: Frontend Configuration

Create or update `.env` in frontend directory:

```env
# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/google/callback

# API
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with the Client ID from Google Cloud Console.

### Step 3: Backend Configuration

Update `.env` in backend directory:

```env
# Google OAuth
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# CSRF
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Step 4: Backend Implementation

Create Google callback endpoint in `backend/apps/auth/views.py`:

```python
@api_view(['POST'])
@permission_classes([AllowAny])
def google_callback(request):
    """
    Handle Google OAuth callback.
    Exchange authorization code for Google ID token.
    """
    from django.conf import settings
    import requests
    import jwt
    
    code = request.data.get('code')
    redirect_uri = request.data.get('redirect_uri')
    
    if not code:
        return Response(
            {'error': 'Missing code'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Exchange code for ID token with Google
        token_response = requests.post(
            'https://oauth2.googleapis.com/token',
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirect_uri,
                'client_id': settings.GOOGLE_CLIENT_ID,
                'client_secret': settings.GOOGLE_CLIENT_SECRET,
            }
        )
        
        if token_response.status_code != 200:
            return Response(
                {'error': 'Google token exchange failed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tokens = token_response.json()
        id_token = tokens.get('id_token')
        
        if not id_token:
            return Response(
                {'error': 'No ID token received'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Decode ID token (without verification in dev, with verification in prod)
        decoded = jwt.decode(
            id_token,
            options={"verify_signature": False}  # For dev only
            # For production, use public key verification
        )
        
        user_email = decoded.get('email')
        user_name = decoded.get('name', '')
        first_name = decoded.get('given_name', '')
        last_name = decoded.get('family_name', '')
        
        # Find or create user
        user, created = User.objects.get_or_create(
            email=user_email,
            defaults={
                'username': user_email.split('@')[0],
                'first_name': first_name,
                'last_name': last_name,
                'is_active': True,
            }
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        return Response({
            'access': str(access),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_admin': user.is_admin(),
                'roles': [role.code for role in user.roles.all()],
            }
        })
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
```

Add to `backend/apps/auth/urls.py`:

```python
path('google/callback/', google_callback, name='google_callback'),
```

### Step 5: Install Required Backend Packages

```bash
pip install PyJWT requests
```

## Frontend Features

### Google Login Button on Login Page

Located at `http://localhost:3000/login`

- Shows "Sign in with Google" button with Google icon
- Only displays if `REACT_APP_GOOGLE_CLIENT_ID` is configured
- Smooth redirect to Google authentication
- Automatic callback handling

### Login Flow Visualization

```
┌─────────────────────────────┐
│  Masuk ke KMS / Sign In     │
├─────────────────────────────┤
│ Email: [_______________]    │
│ Pass:  [_______________] 👁️ │
│                             │
│  [    Masuk / Sign In    ]  │
│                             │
│   ─────── atau / or ───────  │
│                             │
│  [🔓 Masuk dengan SSO]      │
│                             │
│  [🔍 Masuk dengan Google]   │
│                             │
│  Belum punya akun? Daftar di sini
└─────────────────────────────┘
```

### Callback Handling

Route: `/google/callback`

- Validates state parameter (CSRF protection)
- Exchanges authorization code for tokens
- Stores tokens in localStorage
- Auto-redirects to dashboard on success
- Auto-redirects to login on failure (with error message)

### Security Features

✅ **CSRF Protection**
- Random state generation and verification
- Session storage for temporary state
- State mismatch detection

✅ **Secure Token Storage**
- Access token in localStorage
- Refresh token in localStorage
- Auto-refresh on token expiration

✅ **Error Handling**
- Graceful error display
- User-friendly error messages
- Automatic retry capability
- Security error logging

## Testing

### Local Testing

```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit: `http://localhost:3000/login`

### Test Google Login

1. Click "Sign in with Google" button
2. You'll be redirected to Google's sign-in page
3. Enter your Google credentials
4. Accept permissions if prompted
5. Automatically redirected back to `http://localhost:3000/google/callback`
6. If successful → redirected to `/dashboard`
7. If failed → redirected to `/login` with error message

### Error Testing

Test these scenarios:
- **Missing Client ID**: Configure `REACT_APP_GOOGLE_CLIENT_ID` as empty string
- **Invalid Client Secret**: Use wrong secret in backend .env
- **Invalid Redirect URI**: Change callback URL configuration
- **Revoked Credentials**: Test with invalid authorization code

## Configuration Reference

### Required Environment Variables

**Frontend (.env)**
```env
REACT_APP_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

**Backend (.env)**
```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000
```

### Google API Scopes

Current scopes used:
- `openid` - Request ID token
- `profile` - User profile information
- `email` - User email address

Additional scopes available (if needed):
- `https://www.googleapis.com/auth/userinfo.profile`
- `https://www.googleapis.com/auth/userinfo.email`

## Production Deployment

### HTTPS Configuration

```env
# Production backend .env
GOOGLE_CALLBACK_URL=https://yourdomain.com/google/callback

# Production frontend .env
REACT_APP_GOOGLE_CLIENT_ID=YOUR_PROD_CLIENT_ID
REACT_APP_API_BASE_URL=https://api.yourdomain.com
```

### Google Cloud Console Updates

1. Update Authorized JavaScript origins:
   - Add `https://yourdomain.com`
2. Update Authorized redirect URIs:
   - Add `https://yourdomain.com/google/callback`
3. Re-download OAuth credentials if needed

### Security Checklist

- [ ] Use HTTPS in production
- [ ] Verify ID token signature in production (not skipping verification)
- [ ] Set `SESSION_COOKIE_SECURE = True`
- [ ] Set `CSRF_COOKIE_SECURE = True`
- [ ] Restrict CORS to production domain only
- [ ] Never expose `GOOGLE_CLIENT_SECRET` in frontend
- [ ] Enable Google 2FA for account security
- [ ] Rotate credentials regularly

### JWT Verification in Production

For production, implement proper JWT verification:

```python
from google.oauth2 import id_token
from google.auth.transport import requests

try:
    # Verify signature with Google's public keys
    idinfo = id_token.verify_oauth2_token(
        id_token,
        requests.Request(),
        settings.GOOGLE_CLIENT_ID
    )
    
    # Token is valid
    user_email = idinfo['email']
    
except ValueError:
    # Invalid token
    return Response(
        {'error': 'Invalid token'},
        status=status.HTTP_400_BAD_REQUEST
    )
```

Install: `pip install google-auth google-auth-oauthlib google-auth-httplib2`

## Troubleshooting

### Issue: "Invalid state parameter"
**Cause**: Session state doesn't match callback state
**Solution**:
- Clear browser cache and localStorage
- Try login again
- Check browser dev tools console

### Issue: "Redirect to Google fails"
**Cause**: `REACT_APP_GOOGLE_CLIENT_ID` not set
**Solution**:
- Verify `.env` file has Google Client ID
- Restart frontend dev server
- Verify Client ID from Google Cloud Console

### Issue: "Token exchange failed"
**Cause**: Backend can't reach Google or invalid credentials
**Solution**:
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in backend `.env`
- Check network connectivity
- Verify credentials in Google Cloud Console
- Check backend logs for detailed error

### Issue: User created but can't access resources
**Cause**: Missing role assignments
**Solution**:
- Assign default role to Google-authenticated users
- Update user creation logic to set roles
- Verify RBAC configuration

### Issue: "Missing ID token"
**Cause**: Google didn't return ID token
**Solution**:
- Verify `scope` includes `openid`
- Check `prompt=consent` parameter
- Review Google API permissions

## Comparison: SSO vs Google vs Local Login

| Feature | Local | SSO | Google |
|---------|-------|-----|--------|
| Username/Password | ✅ | ❌ | ❌ |
| Organization SSO | ❌ | ✅ | ❌ |
| Google Account | ❌ | ❌ | ✅ |
| 2FA Available | ✅ | ✅ | ✅ |
| Configuration | ✅ | ⚠️ | ✅ |
| User Control | ✅ | ❌ | ❌ |

## API Reference

### Google Callback Endpoint

**Endpoint**: `POST /api/auth/google/callback/`

**Request Body**:
```json
{
  "code": "4/0gU...auth_code_from_google",
  "state": "random_state_string",
  "redirect_uri": "http://localhost:3000/google/callback"
}
```

**Success Response (200)**:
```json
{
  "access": "eyJhbGciOiJIUzI1NiIs...jwt_access_token",
  "refresh": "eyJhbGciOiJIUzI1NiIs...jwt_refresh_token",
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "username": "user",
    "first_name": "John",
    "last_name": "Doe",
    "is_admin": false,
    "roles": ["READER"]
  }
}
```

**Error Response (400)**:
```json
{
  "error": "Error message describing what went wrong"
}
```

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In Integration Guide](https://developers.google.com/identity/sign-in)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [Google Cloud Console](https://console.cloud.google.com/)

## Support

For questions or issues:
1. Check this guide's Troubleshooting section
2. Review Google API documentation
3. Check backend logs: `logs/security_audit.log`
4. Verify environment variables
5. Review browser console for client-side errors

---

**Last Updated**: January 9, 2026
**OAuth Provider**: Google (https://accounts.google.com)
**OAuth Version**: 2.0 with OpenID Connect
