# SSO Integration Guide - KMS DPD RI

## Overview
This document describes the Single Sign-On (SSO) implementation for integrating with the Nusa DPD SSO provider (https://nusadpd.duckdns.org).

## Architecture

### Components
1. **Frontend**
   - `ssoService.js` - OAuth flow handling
   - `SSOCallbackPage.js` - Callback handler
   - `LoginPage.js` - SSO button integration
   - Environment variables for SSO configuration

2. **Backend**
   - SSO-ready authentication endpoints
   - Token exchange and validation
   - User model with SSO support (`is_sso_user`, `last_sso_login`)

### OAuth 2.0 Flow

```
User clicks "Sign in with SSO"
        ↓
Frontend redirects to: https://nusadpd.duckdns.org/oauth/authorize
   - client_id: kms-dpd-ri
   - redirect_uri: http://localhost:3000/sso/callback
   - response_type: code
   - scope: openid profile email
   - state: random_csrf_token
        ↓
User authenticates at SSO provider
        ↓
SSO redirects to: http://localhost:3000/sso/callback?code=...&state=...
        ↓
SSOCallbackPage exchanges code for tokens:
   POST /api/auth/sso/callback/ {code, state, redirect_uri}
        ↓
Backend validates and returns access_token, refresh_token, user_data
        ↓
Frontend stores tokens and redirects to dashboard
```

## Setup Instructions

### 1. Frontend Configuration

Create or update `.env` file in frontend directory:

```env
# SSO Provider
REACT_APP_SSO_URL=https://nusadpd.duckdns.org
REACT_APP_SSO_CLIENT_ID=kms-dpd-ri

# API
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

### 2. Backend Configuration

Update `.env` in backend directory:

```env
# SSO Configuration
SSO_ENABLED=True
SSO_URL=https://nusadpd.duckdns.org
SSO_CALLBACK_URL=http://localhost:8000/api/auth/sso/callback

# CORS - Add to frontend URL
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# CSRF Trusted Origins
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. Backend Implementation

Create SSO endpoint in `backend/apps/auth/views.py`:

```python
@api_view(['POST'])
@permission_classes([AllowAny])
def sso_callback(request):
    """
    Handle SSO OAuth callback.
    Exchange authorization code for tokens.
    """
    from django.conf import settings
    import requests
    
    code = request.data.get('code')
    state = request.data.get('state')
    redirect_uri = request.data.get('redirect_uri')
    
    if not code or not state:
        return Response(
            {'error': 'Missing code or state'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Exchange code for tokens with SSO provider
        token_response = requests.post(
            f'{settings.SSO_URL}/oauth/token',
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': redirect_uri,
                'client_id': settings.SSO_CLIENT_ID,
                'client_secret': settings.SSO_CLIENT_SECRET,
            }
        )
        
        if token_response.status_code != 200:
            return Response(
                {'error': 'SSO token exchange failed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        sso_tokens = token_response.json()
        
        # Get user info from SSO provider
        user_info_response = requests.get(
            f'{settings.SSO_URL}/oauth/userinfo',
            headers={'Authorization': f'Bearer {sso_tokens["access_token"]}'}
        )
        
        user_data = user_info_response.json()
        
        # Find or create user
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults={
                'username': user_data.get('preferred_username', user_data['email'].split('@')[0]),
                'first_name': user_data.get('given_name', ''),
                'last_name': user_data.get('family_name', ''),
                'is_sso_user': True,
            }
        )
        
        user.last_sso_login = timezone.now()
        user.save()
        
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
path('sso/callback/', sso_callback, name='sso_callback'),
```

### 4. Environment Variables for Backend

Add to `.env`:

```env
SSO_CLIENT_ID=kms-dpd-ri
SSO_CLIENT_SECRET=your-client-secret-here
```

## Frontend Features

### SSO Button on Login Page

Located at `http://localhost:3000/login`

- Shows "Sign in with SSO" button with OpenID icon
- Divider line separating traditional login from SSO
- Smooth redirect to SSO provider
- Automatic callback handling

### Callback Handling

Route: `/sso/callback`

- Validates state parameter (CSRF protection)
- Exchanges authorization code for tokens
- Stores tokens in localStorage
- Auto-redirects to dashboard on success
- Auto-redirects to login on failure (with error message)

### Security Features

✅ **CSRF Protection**
- Random state generation and verification
- Session storage for temporary state

✅ **Secure Token Storage**
- Access token in localStorage
- Refresh token in localStorage
- Auto-refresh on token expiration

✅ **Error Handling**
- Graceful error display
- Automatic retry capability
- Security error logging

## Testing

### 1. Local Testing

```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

Visit: `http://localhost:3000/login`

### 2. Test Flow

1. Click "Sign in with SSO" button
2. You'll be redirected to `https://nusadpd.duckdns.org`
3. Authenticate with your credentials
4. Accept permissions if prompted
5. Automatically redirected back to `http://localhost:3000/sso/callback`
6. If successful → redirected to `/dashboard`
7. If failed → redirected to `/login` with error message

### 3. Error Scenarios

- **Invalid callback params**: Missing code or state
- **State mismatch**: CSRF attack attempt detected
- **Token exchange failure**: SSO provider unreachable
- **User creation failure**: Database issues

All errors display with clear user messages in both Indonesian and English.

## Configuration Details

### Required Backend Settings

```python
# settings.py
SSO_ENABLED = env.bool('SSO_ENABLED', default=False)
SSO_URL = env('SSO_URL', default='https://nusadpd.duckdns.org')
SSO_CLIENT_ID = env('SSO_CLIENT_ID', default='')
SSO_CLIENT_SECRET = env('SSO_CLIENT_SECRET', default='')
SSO_CALLBACK_URL = env('SSO_CALLBACK_URL', default='http://localhost:8000/api/auth/sso/callback')
```

### Required Frontend Configuration

```javascript
// Environment variables
REACT_APP_SSO_URL=https://nusadpd.duckdns.org
REACT_APP_SSO_CLIENT_ID=kms-dpd-ri
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

## User Model Changes

The User model now includes SSO-specific fields:

- `is_sso_user` (Boolean) - Whether user logged in via SSO
- `last_sso_login` (DateTime) - Last SSO authentication timestamp

These allow:
- Distinguishing SSO users from local users
- Tracking SSO login patterns
- Audit logging for SSO access

## Troubleshooting

### Issue: "Invalid state parameter"
**Cause**: Session state doesn't match callback state
**Solution**: 
- Clear browser cache and localStorage
- Try login again
- Check browser dev tools for console errors

### Issue: "Redirect to SSO provider fails"
**Cause**: Environment variables not set
**Solution**:
- Verify `.env` file has `REACT_APP_SSO_URL` and `REACT_APP_SSO_CLIENT_ID`
- Restart frontend dev server
- Check that SSO provider URL is correct

### Issue: "Token exchange failed"
**Cause**: Backend cannot reach SSO provider or invalid credentials
**Solution**:
- Verify backend `.env` has correct SSO settings
- Check network connectivity to SSO provider
- Verify `SSO_CLIENT_SECRET` is correct
- Check SSO provider logs for errors

### Issue: User created but not properly set up
**Cause**: Missing role assignments
**Solution**:
- Check backend user creation logic
- Ensure roles are assigned during SSO user creation
- Verify RBAC configuration

## Production Deployment

### HTTPS Configuration

```env
# Production backend .env
SSO_CALLBACK_URL=https://yourdomain.com/api/auth/sso/callback
CSRF_TRUSTED_ORIGINS=https://yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### CORS Security

Ensure CORS is properly configured for production:

```python
# settings.py
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['https://yourdomain.com']
)
CORS_ALLOW_CREDENTIALS = True
```

### Session Security

```python
# settings.py (production)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
```

## API Reference

### SSO Callback Endpoint

**Endpoint**: `POST /api/auth/sso/callback/`

**Request Body**:
```json
{
  "code": "auth_code_from_sso_provider",
  "state": "csrf_protection_state",
  "redirect_uri": "http://localhost:3000/sso/callback"
}
```

**Success Response (200)**:
```json
{
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "first_name": "John",
    "last_name": "Doe",
    "is_admin": false,
    "roles": ["CONTRIBUTOR"]
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

- [OAuth 2.0 Authorization Code Flow](https://tools.ietf.org/html/rfc6749#section-1.3.1)
- [OpenID Connect](https://openid.net/connect/)
- [Django REST Framework JWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [React OAuth Integration Best Practices](https://tools.ietf.org/html/rfc6749#section-10)

## Support & Questions

For questions or issues with SSO integration:
1. Check this guide's Troubleshooting section
2. Review backend logs: `logs/security_audit.log`
3. Check browser developer console for errors
4. Verify all environment variables are set correctly
5. Contact the SSO provider support team if provider-side issues occur

---

**Last Updated**: January 9, 2026
**Supported SSO Provider**: Nusa DPD (https://nusadpd.duckdns.org)
**OAuth Version**: OAuth 2.0 with OpenID Connect
