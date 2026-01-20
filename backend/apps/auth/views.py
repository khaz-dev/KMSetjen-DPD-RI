"""Authentication views and endpoints."""
import requests
import logging
from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .captcha import verify_recaptcha

logger = logging.getLogger(__name__)
User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Customize token response to include user info."""
    
    def validate(self, attrs):
        """Add user info to token response."""
        data = super().validate(attrs)
        
        user = self.user
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
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
        
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login endpoint with custom token serializer and CAPTCHA verification."""
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        """
        Override post to add CAPTCHA verification.
        """
        # Get CAPTCHA token from request
        captcha_token = request.data.get('captcha_token')
        
        # Verify CAPTCHA if enabled
        if settings.ENABLE_CAPTCHA:
            if not captcha_token:
                return Response(
                    {'captcha_token': ['CAPTCHA token is required']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not verify_recaptcha(captcha_token):
                logger.warning(f"CAPTCHA verification failed for user login attempt")
                return Response(
                    {'captcha_token': ['CAPTCHA verification failed. Please try again.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Proceed with normal login
        return super().post(request, *args, **kwargs)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user.
    POST /api/auth/register/
    
    Request body:
    {
        "username": "username",
        "email": "user@example.com",
        "password": "password123",
        "first_name": "First",
        "last_name": "Last",
        "nip": "123456789",
        "department": "Ministry Department"
    }
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    nip = request.data.get('nip', '')
    department = request.data.get('department', '')
    
    # Validate required fields
    if not username or not email or not password:
        return Response(
            {'error': 'username, email, and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user exists
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        nip=nip,
        department=department,
    )
    
    return Response({
        'success': True,
        'message': 'User registered successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Get current user info.
    GET /api/auth/me/
    """
    user = request.user
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'nip': user.nip,
        'department': user.department,
        'phone': user.phone,
        'avatar': user.avatar.url if user.avatar else None,
        'is_staff': user.is_staff,
        'is_active': user.is_active,
        'is_admin': user.is_admin(),
        'is_editor': user.is_editor(),
        'is_contributor': user.is_contributor(),
        'is_reader': user.is_reader(),
        'primary_role': user.get_primary_role().code if user.get_primary_role() else None,
        'roles': [role.code for role in user.roles.all()],
        'preferred_language': user.preferred_language,
        'theme_mode': user.theme_mode,
        'created_at': user.date_joined,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """
    Update user profile.
    POST /api/auth/update-profile/
    
    Request body:
    {
        "first_name": "First",
        "last_name": "Last",
        "phone": "08123456789",
        "preferred_language": "en",
        "theme_mode": "dark"
    }
    """
    user = request.user
    
    # Update allowed fields
    if 'first_name' in request.data:
        user.first_name = request.data['first_name']
    
    if 'last_name' in request.data:
        user.last_name = request.data['last_name']
    
    if 'phone' in request.data:
        user.phone = request.data['phone']
    
    if 'preferred_language' in request.data:
        user.preferred_language = request.data['preferred_language']
    
    if 'theme_mode' in request.data:
        user.theme_mode = request.data['theme_mode']
    
    user.save()
    
    return Response({
        'success': True,
        'message': 'Profile updated successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'preferred_language': user.preferred_language,
            'theme_mode': user.theme_mode,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password.
    POST /api/auth/change-password/
    
    Request body:
    {
        "old_password": "old_pass",
        "new_password": "new_pass"
    }
    """
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response(
            {'error': 'old_password and new_password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not user.check_password(old_password):
        return Response(
            {'error': 'Old password is incorrect'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(new_password) < 8:
        return Response(
            {'error': 'New password must be at least 8 characters'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.set_password(new_password)
    user.save()
    
    return Response({
        'success': True,
        'message': 'Password changed successfully'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout user (invalidate token).
    POST /api/auth/logout/
    
    Note: JWT tokens cannot be invalidated on the server side.
    Client should discard the token.
    """
    return Response({
        'success': True,
        'message': 'Logout successful. Please discard your token.'
    })


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
        "redirect_uri": "http://localhost:3000/google/callback"
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
        
        # Validate required parameters
        if not code:
            logger.error('[GoogleCallback] Authorization code not provided')
            return Response(
                {'error': 'Authorization code not provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get Google OAuth configuration from Django settings
        google_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        google_client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', '')
        google_redirect_uri = getattr(settings, 'GOOGLE_REDIRECT_URI', 'http://localhost:3000/google/callback')
        
        if not google_client_id or not google_client_secret:
            logger.error('[GoogleCallback] Google OAuth not configured on server')
            return Response(
                {'error': 'Google OAuth is not configured on server'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # ====================================================================
        # Step 1: Exchange authorization code for Google access token
        # ====================================================================
        # IMPORTANT: Use backend's configured redirect_uri, not frontend's
        # This must match the redirect_uri registered with Google
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
        
        if token_response.status_code != 200:
            error_msg = token_response.text
            logger.error(f'[GoogleCallback] Failed to exchange code: {error_msg}')
            return Response(
                {'error': f'Failed to exchange authorization code for tokens: {error_msg}'},
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
            error_msg = userinfo_response.text if userinfo_response.text else 'Unknown error'
            logger.error(f'[GoogleCallback] Failed to retrieve user info: {error_msg}')
            return Response(
                {'error': f'Failed to retrieve user information from Google: {error_msg}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_info = userinfo_response.json()
        
        # Extract user information
        email = user_info.get('email')
        first_name = user_info.get('given_name', '')
        last_name = user_info.get('family_name', '')
        
        if not email:
            logger.error('[GoogleCallback] Email not provided by Google')
            return Response(
                {'error': 'Email not provided by Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ====================================================================
        # Step 3: Create or retrieve user in database (inside atomic transaction)
        # ====================================================================
        # Wrap only database operations in atomic() to avoid holding lock during HTTP calls
        with transaction.atomic():
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
            # Step 4: Generate JWT tokens for the user (inside atomic transaction)
            # ====================================================================
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
        logger.error(f'Network error in google_callback: {str(e)}', exc_info=True)
        return Response(
            {'error': f'Network error communicating with Google: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f'Unexpected error in google_callback: {str(e)}', exc_info=True)
        return Response(
            {'error': f'Server error processing Google callback: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
