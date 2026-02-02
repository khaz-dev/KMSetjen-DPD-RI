"""
Google OAuth 2.0 Callback Implementation for Django

This file contains the complete Google OAuth callback view to be added to backend/apps/auth/views.py

Date: January 9, 2026
Purpose: Handle Google OAuth 2.0 authentication flow
"""

# ============================================================================
# STEP 1: Add this import section to the top of backend/apps/auth/views.py
# ============================================================================

"""
Add these imports at the top of views.py:
"""

# import requests
# from django.conf import settings


# ============================================================================
# STEP 2: Add this view to backend/apps/auth/views.py (after existing views)
# ============================================================================

"""
Add this complete view function to views.py:
"""


@api_view(['POST'])
@permission_classes([AllowAny])
def google_callback(request):
    """
    Handle Google OAuth 2.0 callback.
    POST /api/auth/google/callback/
    
    This endpoint processes the Google OAuth authorization code exchange flow:
    1. Receives authorization code from frontend
    2. Exchanges code for Google access token
    3. Retrieves user info from Google
    4. Creates or retrieves user in database
    5. Generates JWT tokens
    6. Returns tokens and user info
    
    Request body:
    {
        "code": "authorization_code_from_google",
        "state": "csrf_state_token",
        "redirect_uri": "http://localhost:5175/google/callback"
    }
    
    Response:
    {
        "access": "jwt_access_token",
        "refresh": "jwt_refresh_token",
        "user": {
            "id": 1,
            "email": "user@example.com",
            "username": "username",
            "first_name": "First",
            "last_name": "Last"
        }
    }
    """
    try:
        # Extract parameters from request
        code = request.data.get('code')
        state = request.data.get('state')
        redirect_uri = request.data.get('redirect_uri', '')
        
        # Validate required parameters
        if not code:
            return Response(
                {'error': 'Authorization code not provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get Google OAuth configuration from Django settings
        google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        google_client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', '')
        
        if not google_client_id or not google_client_secret:
            return Response(
                {'error': 'Google OAuth is not configured on server'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # ====================================================================
        # Step 1: Exchange authorization code for Google access token
        # ====================================================================
        token_response = requests.post(
            'https://oauth2.googleapis.com/token',
            data={
                'code': code,
                'client_id': google_client_id,
                'client_secret': google_client_secret,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code',
            }
        )
        
        if token_response.status_code != 200:
            return Response(
                {'error': 'Failed to exchange authorization code for tokens'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tokens = token_response.json()
        google_access_token = tokens.get('access_token')
        
        if not google_access_token:
            return Response(
                {'error': 'No access token returned from Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ====================================================================
        # Step 2: Retrieve user information from Google
        # ====================================================================
        userinfo_response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {google_access_token}'}
        )
        
        if userinfo_response.status_code != 200:
            return Response(
                {'error': 'Failed to retrieve user information from Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_info = userinfo_response.json()
        
        # Extract user information
        email = user_info.get('email')
        first_name = user_info.get('given_name', '')
        last_name = user_info.get('family_name', '')
        
        if not email:
            return Response(
                {'error': 'Email not provided by Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ====================================================================
        # Step 3: Create or retrieve user in database
        # ====================================================================
        # Generate username from email (before @)
        username = email.split('@')[0]
        
        # Check if user with this email already exists
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': username,
                'first_name': first_name,
                'last_name': last_name,
                'is_active': True,
            }
        )
        
        # If user exists but doesn't have first/last name, update it
        if not created:
            if not user.first_name and first_name:
                user.first_name = first_name
            if not user.last_name and last_name:
                user.last_name = last_name
            user.save()
        
        # ====================================================================
        # Step 4: Generate JWT tokens for the user
        # ====================================================================
        from rest_framework_simplejwt.tokens import RefreshToken
        
        refresh = RefreshToken.for_user(user)
        
        # ====================================================================
        # Step 5: Return tokens and user information
        # ====================================================================
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'nip': user.nip,
                'department': user.department,
                'is_staff': user.is_staff,
                'is_admin': user.is_admin(),
                'is_editor': user.is_editor(),
                'is_contributor': user.is_contributor(),
                'is_reader': user.is_reader(),
                'primary_role': user.get_primary_role().code if user.get_primary_role() else None,
                'roles': [role.code for role in user.roles.all()],
                'preferred_language': user.preferred_language,
                'theme_mode': user.theme_mode,
            }
        }, status=status.HTTP_200_OK)
        
    except requests.exceptions.RequestException as e:
        return Response(
            {'error': f'Network error communicating with Google: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        return Response(
            {'error': f'Server error processing Google callback: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================================================
# STEP 3: Add this to backend/apps/auth/urls.py (in urlpatterns list)
# ============================================================================

"""
Add this URL pattern to the urlpatterns list in urls.py:

    path('google/callback/', google_callback, name='google_callback'),

Complete urls.py should look like:

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, register, me, update_profile,
    change_password, logout, google_callback  # <-- Add this
)

urlpatterns = [
    # Token endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User endpoints
    path('register/', register, name='register'),
    path('me/', me, name='current_user'),
    path('update-profile/', update_profile, name='update_profile'),
    path('change-password/', change_password, name='change_password'),
    path('logout/', logout, name='logout'),
    
    # OAuth endpoints
    path('google/callback/', google_callback, name='google_callback'),  # <-- Add this
]
"""


# ============================================================================
# STEP 4: Add these settings to backend/config/settings.py
# ============================================================================

"""
Add these lines to settings.py:

from decouple import config

# Google OAuth Configuration
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET', '')
GOOGLE_REDIRECT_URI = config('GOOGLE_REDIRECT_URI', 'http://localhost:5175/google/callback')
"""


# ============================================================================
# STEP 5: Add these to backend/.env
# ============================================================================

"""
Add these lines to backend/.env:

# Google OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=http://localhost:5175/google/callback

Replace YOUR_GOOGLE_CLIENT_ID_HERE and YOUR_GOOGLE_CLIENT_SECRET_HERE with 
credentials from Google Cloud Console.
"""


# ============================================================================
# STEP 6: Install required package
# ============================================================================

"""
Run this command in backend directory:

pip install requests

This package is needed to make HTTP requests to Google OAuth endpoints.
"""


# ============================================================================
# TESTING
# ============================================================================

"""
Test the endpoint with curl:

curl -X POST http://localhost:8002/api/auth/google/callback/ \\
  -H "Content-Type: application/json" \\
  -d '{
    "code": "TEST_AUTHORIZATION_CODE",
    "state": "TEST_STATE_TOKEN",
    "redirect_uri": "http://localhost:5175/google/callback"
  }'

Or test via the frontend by:
1. Going to http://localhost:5175/login
2. Setting REACT_APP_GOOGLE_CLIENT_ID in frontend/.env.local
3. Clicking "Masuk dengan Google"
4. Completing the Google login flow
5. Being redirected to dashboard after successful callback
"""


# ============================================================================
# FLOW DIAGRAM
# ============================================================================

"""
Frontend → Google OAuth Login Page
    ↓ (User approves scopes)
Google → Frontend Callback URL with code
    ↓ (Frontend sends code to this endpoint)
POST /api/auth/google/callback/
    ↓ (Exchange code for Google token)
Google OAuth Token Endpoint
    ↓ (Get user info with token)
Google User Info API
    ↓ (Create/retrieve user, generate JWT)
Database & JWT Token Generation
    ↓ (Return tokens to frontend)
Frontend (localStorage JWT tokens)
    ↓ (Redirect to dashboard)
User Logged In ✅
"""


# ============================================================================
# TROUBLESHOOTING
# ============================================================================

"""
1. "No access token returned from Google"
   - Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env
   - Verify code hasn't expired (Google codes expire in 10 minutes)
   - Verify redirect_uri matches Google Cloud Console settings

2. "Email not provided by Google"
   - User may not have a public email profile
   - Ask user to enable email sharing in Google account settings

3. "Failed to retrieve user information from Google"
   - Google token may be invalid or expired
   - Network issue connecting to Google API

4. Network errors
   - Check if requests library is installed: pip install requests
   - Verify backend has internet connection to Google APIs
   - Check firewall isn't blocking outbound HTTPS to Google

5. User creation fails
   - Check User model is properly configured
   - Verify email field uniqueness constraint
   - Check required fields (username, email) have values

For debugging, add this to views.py:

import logging
logger = logging.getLogger(__name__)

Then add in google_callback:
    logger.error(f"Google callback error: {str(e)}")
"""
