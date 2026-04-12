"""Authentication views and endpoints."""
import requests
import logging
import jwt
from django.conf import settings
from django.db import transaction
from django.utils import timezone
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


def split_full_name(full_name):
    """
    Split a full name into first_name and last_name.
    
    Rules:
    - 3+ words: First 2 words = first_name (Nama Depan), remaining = last_name (Nama Belakang)
    - 2 words: First word = first_name, second word = last_name
    - 1 word: first_name = word, last_name = ''
    
    Examples:
    - "John Doe Smith" → first_name="John Doe", last_name="Smith"
    - "John Doe" → first_name="John", last_name="Doe"
    - "John" → first_name="John", last_name=""
    
    Args:
        full_name (str): The full name to split
    
    Returns:
        tuple: (first_name, last_name)
    """
    if not full_name:
        return '', ''
    
    name_parts = full_name.strip().split()
    
    if len(name_parts) >= 3:
        # 3+ words: first 2 words = first_name, rest = last_name
        first_name = ' '.join(name_parts[:2])
        last_name = ' '.join(name_parts[2:])
    elif len(name_parts) == 2:
        # 2 words: word 1 = first_name, word 2 = last_name
        first_name = name_parts[0]
        last_name = name_parts[1]
    else:
        # 1 word: all goes to first_name
        first_name = name_parts[0]
        last_name = ''
    
    return first_name, last_name


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
        "email": "user@example.com",
        "password": "password123",
        "first_name": "First",
        "last_name": "Last",
        "nip": "123456789",
        "department": "Ministry Department"
    }
    """
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    nip = request.data.get('nip', '')
    department = request.data.get('department', '')
    
    # Use email as username
    username = email
    
    # Validate required fields
    if not email or not password:
        return Response(
            {'error': 'email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user exists
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
        'unit_organisasi': user.unit_organisasi,
        'jenis_jabatan': user.jenis_jabatan,
        'jabatan': user.jabatan,
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
    Update user avatar profile.
    POST /api/auth/update-profile/
    
    Request body (multipart/form-data):
    {
        "avatar": <image_file>  (optional - to upload new avatar)
    }
    
    Note: Only avatar can be updated via this endpoint.
    Other fields (first_name, last_name, email, nip, etc.) are read-only.
    """
    user = request.user
    
    # Handle avatar upload
    if 'avatar' in request.FILES:
        avatar_file = request.FILES['avatar']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if avatar_file.content_type not in allowed_types:
            return Response({
                'success': False,
                'error': 'Invalid image type. Allowed: JPEG, PNG, GIF, WebP'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024
        if avatar_file.size > max_size:
            return Response({
                'success': False,
                'error': 'Image file is too large (max 5MB)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete old avatar if exists
        if user.avatar:
            try:
                from django.core.files.storage import default_storage
                old_path = user.avatar.name
                if old_path:
                    default_storage.delete(old_path)
            except Exception:
                pass  # Log but don't fail if deletion fails
        
        # Set new avatar
        user.avatar = avatar_file
    
    # Handle avatar removal (if avatar field is sent as null/empty)
    elif 'avatar' in request.data and (request.data['avatar'] is None or request.data['avatar'] == ''):
        if user.avatar:
            try:
                from django.core.files.storage import default_storage
                storage_path = user.avatar.name
                if storage_path:
                    default_storage.delete(storage_path)
            except Exception:
                pass  # Log but don't fail if deletion fails
        
        user.avatar = None
    
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
            'avatar': user.avatar.url if user.avatar else None,
            'nip': user.nip,
            'unit_organisasi': user.unit_organisasi,
            'jenis_jabatan': user.jenis_jabatan,
            'jabatan': user.jabatan,
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_activity(request):
    """
    Get current user's activity logs and profile information.
    GET /api/auth/me/activity/
    
    Returns user's roles, permissions, and recent activity.
    """
    from apps.audit.models import AuditLog
    from apps.core.models import Role
    
    user = request.user
    
    # Get user's roles with their permissions
    user_roles = user.roles.all().values(
        'id', 'code', 'name_id', 'name_en', 'description_id', 'description_en',
        'permissions'  # JSONField containing permission IDs
    )
    
    # Get user's recent activity (last 20 actions)
    user_activity_logs = AuditLog.objects.filter(
        user=user
    ).order_by('-timestamp')[:20].values(
        'id', 'action', 'content_type', 'content_id', 'content_display',
        'changes', 'timestamp', 'ip_address'
    )
    
    # Get all available permissions for reference (from Django's auth model)
    from django.contrib.auth.models import Permission
    all_permissions = Permission.objects.all().values('id', 'name', 'codename')
    
    # Build permissions map
    permissions_map = {perm['id']: perm for perm in all_permissions}
    
    # Resolve permission IDs in user roles and normalize field names
    roles_with_permissions = []
    for role in user_roles:
        role_data = dict(role)
        permission_ids = role_data.get('permissions', [])
        role_data['permissions'] = [
            permissions_map.get(perm_id, {'id': perm_id, 'name': 'Unknown'})
            for perm_id in permission_ids
        ]
        # Normalize role names and descriptions for frontend
        # Use English versions as defaults
        role_data['name'] = role_data.get('name_en') or role_data.get('name_id') or 'Unknown'
        role_data['description'] = role_data.get('description_en') or role_data.get('description_id') or ''
        roles_with_permissions.append(role_data)
    
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'department': user.department,
            'is_staff': user.is_staff,
            'is_active': user.is_active,
            'is_admin': user.is_admin(),
            'is_editor': user.is_editor(),
            'is_contributor': user.is_contributor(),
            'is_reader': user.is_reader(),
            'created_at': user.date_joined,
        },
        'roles': list(roles_with_permissions),
        'activity': list(user_activity_logs)
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
        "redirect_uri": "http://localhost:5175/kms/google/callback/"
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
        redirect_uri_from_frontend = request.data.get('redirect_uri')
        
        logger.info(f'[GoogleCallback] Request received:')
        logger.info(f'[GoogleCallback] - redirect_uri from frontend: {redirect_uri_from_frontend}')
        logger.info(f'[GoogleCallback] - code received: {code[:20] if code else "MISSING"}...')
        logger.info(f'[GoogleCallback] - state received: {state[:20] if state else "MISSING"}...')
        
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
        google_redirect_uri = getattr(settings, 'GOOGLE_REDIRECT_URI', 'http://localhost:5175/kms/google/callback/')
        
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
        logger.info(f'[GoogleCallback] Exchanging code with parameters:')
        logger.info(f'[GoogleCallback] - client_id: {google_client_id[:20]}...')
        logger.info(f'[GoogleCallback] - redirect_uri: {google_redirect_uri}')
        logger.info(f'[GoogleCallback] - code: {code[:20]}...')
        
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
        
        # Extract name components from Google
        given_name = user_info.get('given_name', '')
        family_name = user_info.get('family_name', '')
        full_name = user_info.get('name', '')
        
        # Strategy: ALWAYS use intelligent splitting to ensure first 2 words = Nama Depan
        # Build full name from available components:
        # Priority 1: Use 'name' field if available (most complete)
        # Priority 2: Combine given_name + family_name if both available
        # Priority 3: Use just given_name if that's all we have
        
        full_name_to_split = None
        
        if full_name:
            # Use Google's 'name' field directly (it's the official full name)
            full_name_to_split = full_name
        elif given_name and family_name:
            # Combine given_name and family_name to get full name for splitting
            full_name_to_split = f"{given_name} {family_name}"
        elif given_name:
            # Only have given_name
            full_name_to_split = given_name
        
        # Apply intelligent splitting to all cases
        if full_name_to_split:
            first_name, last_name = split_full_name(full_name_to_split)
        else:
            first_name = ''
            last_name = ''
        
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
            # Use email as unique username identifier
            username = email
            
            # Try to find user by email first (most common case)
            user = User.objects.filter(email=email).first()
            created = False
            
            if user:
                # User found by email
                logger.info(f'[GoogleCallback] Found existing user by email: {email}')
            else:
                # User not found, try to create
                try:
                    logger.info(f'[GoogleCallback] User not found by email, creating new user: {email}')
                    
                    # Check if this email belongs to an existing Pegawai user (staff)
                    # Users from Pegawai sync will have is_staff=True set
                    pegawai_user = User.objects.filter(email=email).first()
                    is_pegawai_user = pegawai_user.is_staff if pegawai_user else False
                    
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        is_active=True,
                        is_staff=is_pegawai_user,  # Set is_staff if user is in Pegawai data
                        password='',  # No password for OAuth users (auth via Google)
                    )
                    created = True
                    logger.info(f'[GoogleCallback] Created new user: {email}')
                    
                except Exception as e:
                    logger.error(f'[GoogleCallback] Error creating user: {str(e)}', exc_info=True)
                    # If creation fails, try one more time to find the user (race condition)
                    user = User.objects.filter(email=email).first()
                    if user:
                        logger.info(f'[GoogleCallback] User exists (race condition), using existing user: {email}')
                        created = False
                    else:
                        raise
            
            try:
                # If user exists but doesn't have first/last name, update it
                if not created:
                    updated = False
                    if not user.first_name and first_name:
                        user.first_name = first_name
                        updated = True
                    if not user.last_name and last_name:
                        user.last_name = last_name
                        updated = True
                    
                    # Check if this email belongs to an existing Pegawai user (staff)
                    pegawai_user = User.objects.filter(email=email).first()
                    is_pegawai_user = pegawai_user.is_staff if pegawai_user else False
                    
                    # Ensure is_staff status matches Pegawai database (in case synced after Google login)
                    if is_pegawai_user and not user.is_staff:
                        user.is_staff = True
                        updated = True
                        logger.info(f'[GoogleCallback] Updated user {email} to is_staff=True (found in Pegawai data)')
                    
                    if updated:
                        user.save()
                        logger.info(f'[GoogleCallback] Updated user: {email}')
                
            except User.MultipleObjectsReturned:
                # This should not happen if data is clean, but handle it gracefully
                logger.error(f'[GoogleCallback] CRITICAL: Multiple users found with email {email}')
                logger.error('[GoogleCallback] This indicates database corruption with duplicate emails')
                logger.error('[GoogleCallback] Taking first (oldest) user as primary')
                
                # Get the oldest user with this email
                user = User.objects.filter(email=email).order_by('created_at').first()
                created = False
                
                if not user:
                    # Should never happen, but be defensive
                    return Response(
                        {'error': 'Database consistency error: user lookup failed'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            
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


@api_view(['POST'])
@permission_classes([AllowAny])
def sso_callback(request):
    """
    Handle NUSA DPD SSO callback.
    POST /api/auth/sso/callback/
    
    This endpoint processes the SSO callback from NUSA DPD SSO server.
    Users logging via SSO are government staff (Pegawai ASN).
    
    Request body:
    {
        "nip": "123456789",
        "email": "user@dpd.go.id",
        "first_name": "John",
        "last_name": "Doe",
        "department": "IT Division",
        "token": "sso_token_from_server"
    }
    
    Response:
    {
        "access": "jwt_access_token",
        "refresh": "jwt_refresh_token",
        "user": {
            "id": 1,
            "username": "123456789",
            "email": "user@dpd.go.id",
            "first_name": "John",
            "last_name": "Doe",
            "nip": "123456789",
            "department": "IT Division",
            "is_staff": true,
            "is_sso_user": true
        }
    }
    """
    try:
        # Extract SSO data from request
        nip = request.data.get('nip')
        email = request.data.get('email')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        department = request.data.get('department', '')
        sso_token = request.data.get('token')
        
        # If first_name and last_name are empty, try to split full_name field
        if not first_name and not last_name:
            full_name = request.data.get('full_name') or request.data.get('name', '')
            if full_name:
                # Split full name using intelligent logic: first 2 words = first_name, rest = last_name
                first_name, last_name = split_full_name(full_name)
        
        logger.info(f'[SSOCallback] SSO login attempt for NIP: {nip}')
        
        # Validate required parameters
        if not nip or not email:
            logger.error('[SSOCallback] NIP and email are required')
            return Response(
                {'error': 'NIP and email are required for SSO login'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Use email as unique identifier for all users
            username = email
            
            # Get or create user by email (Pegawai always have email)
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': username,
                    'nip': nip,
                    'first_name': first_name,
                    'last_name': last_name,
                    'department': department,
                    'is_active': True,
                    'is_staff': True,  # SSO users are always Pegawai (staff)
                    'is_sso_user': True,  # Mark as SSO user
                    'is_superuser': False,  # SSO users are not superusers
                    'password': '',  # No password for SSO users (auth via SSO provider)
                }
            )
            
            # Update existing user info if they've changed
            if not created:
                updated = False
                if user.username != username:
                    user.username = username
                    updated = True
                if user.email != email:
                    user.email = email
                    updated = True
                if user.nip != nip and nip:
                    user.nip = nip
                    updated = True
                if user.first_name != first_name and first_name:
                    user.first_name = first_name
                    updated = True
                if user.last_name != last_name and last_name:
                    user.last_name = last_name
                    updated = True
                if user.department != department and department:
                    user.department = department
                    updated = True
                
                # Ensure is_staff and is_sso_user are set
                if not user.is_staff:
                    user.is_staff = True
                    updated = True
                if not user.is_sso_user:
                    user.is_sso_user = True
                    updated = True
                
                # Update last SSO login timestamp
                user.last_sso_login = timezone.now()
                updated = True
                
                if updated:
                    user.save()
                    logger.info(f'[SSOCallback] Updated SSO user: {nip}')
            else:
                logger.info(f'[SSOCallback] Created new SSO user: {nip}')
            
            # Generate JWT tokens for the user
            refresh = RefreshToken.for_user(user)
        
        # Return tokens and user information
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'nip': user.nip,
                'department': user.department,
                'is_staff': user.is_staff,
                'is_sso_user': user.is_sso_user,
                'is_admin': user.is_admin(),
                'is_editor': user.is_editor(),
                'primary_role': user.get_primary_role().code if user.get_primary_role() else None,
                'roles': [role.code for role in user.roles.all()],
                'preferred_language': user.preferred_language,
                'theme_mode': user.theme_mode,
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f'Error in sso_callback: {str(e)}', exc_info=True)
        return Response(
            {'error': f'SSO callback error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def sso_token_verify(request):
    """
    Verify and process SSO JWT token from SSO provider.
    POST /api/auth/sso/token/
    
    This endpoint handles direct SSO tokens sent via URL path parameter.
    The token is a JWT from the NUSA DPD SSO server containing user information.
    
    Request body:
    {
        "token": "sso_jwt_token_from_provider"
    }
    
    Response:
    {
        "access": "jwt_access_token",
        "refresh": "jwt_refresh_token",
        "user": {
            "id": 1,
            "username": "123456789",
            "email": "user@dpd.go.id",
            "first_name": "John",
            "last_name": "Doe",
            "nip": "123456789",
            "department": "IT Division",
            "is_staff": true,
            "is_sso_user": true
        }
    }
    """
    try:
        # Extract token from request
        sso_token = request.data.get('token')
        
        if not sso_token:
            logger.error('[SSOTokenVerify] No token provided')
            return Response(
                {'error': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info('[SSOTokenVerify] Verifying SSO token')
        
        # Decode the JWT token without verification first to extract user data
        # In production, you should verify the signature with the SSO provider's public key
        try:
            # Try to decode without verification (if SSO provider uses RS256 or HS256)
            # For development, we decode without verification
            # In production, you need the SSO provider's public key to verify the signature
            decoded = jwt.decode(sso_token, options={"verify_signature": False})
            logger.info(f'[SSOTokenVerify] Token claims available: {list(decoded.keys())}')
            logger.debug(f'[SSOTokenVerify] Full token payload: {decoded}')
        except jwt.DecodeError as e:
            logger.error(f'[SSOTokenVerify] Invalid JWT token: {str(e)}')
            return Response(
                {'error': 'Invalid token format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract user information from token claims
        # The SSO provider should send these in the JWT payload
        # Common claim mappings for NUSA DPD:
        nip = decoded.get('nip') or decoded.get('user_id') or decoded.get('sub')
        
        # Try multiple email field names (SSO provider might use different field names)
        email = (
            decoded.get('email') or 
            decoded.get('email_address') or 
            decoded.get('mail') or 
            decoded.get('username') or 
            decoded.get('account_name') or
            decoded.get('upn')  # User Principal Name
        )
        
        # If email still not found but NIP exists, check if user already exists in system
        # If they do, use their current email instead of generating a synthetic one
        if not email and nip:
            existing_user = User.objects.filter(nip=nip).first()
            if existing_user:
                email = existing_user.email
                logger.info(f'[SSOTokenVerify] Email not in token, using existing user email: {email}')
            else:
                # Use NIP as a fallback identifier for email (only for new users)
                email = f"user_{nip}@dpd.go.id"
                logger.warning(f'[SSOTokenVerify] Email not in token and user not found, using synthetic: {email}')
        
        first_name = decoded.get('first_name') or decoded.get('given_name') or ''
        last_name = decoded.get('last_name') or decoded.get('family_name') or ''
        
        # If first_name and last_name are empty, try to split full_name field
        if not first_name and not last_name:
            full_name = decoded.get('full_name') or decoded.get('name', '')
            if full_name:
                # Split full name using intelligent logic: first 2 words = first_name, rest = last_name
                first_name, last_name = split_full_name(full_name)
        
        department = decoded.get('department') or decoded.get('org_unit') or ''
        
        logger.info(f'[SSOTokenVerify] Extracted user info - NIP: {nip}, Email: {email}')
        
        if not nip or not email:
            logger.error('[SSOTokenVerify] NIP and email not found in token')
            return Response(
                {'error': 'Token does not contain required user information (nip, email)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            # Use email as unique identifier for all users (consistent with Google and sso_callback)
            # This ensures both Google OAuth and SSO logins use the same account
            username = email
            
            # Try to find user by email first
            user = User.objects.filter(email=email).first()
            created = False
            
            # If not found by email, try to find by NIP (in case NIP already exists from previous login)
            if not user and nip:
                user = User.objects.filter(nip=nip).first()
                logger.info(f'[SSOTokenVerify] User not found by email, found by NIP: {nip}')
            
            # If still not found, create new user
            if not user:
                try:
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        nip=nip,
                        first_name=first_name,
                        last_name=last_name,
                        is_active=True,
                        is_staff=True,  # SSO users are always Pegawai (staff)
                        is_sso_user=True,  # Mark as SSO user
                        password='',  # No password for SSO users (auth via SSO provider)
                    )
                    user.department = department
                    user.save()
                    created = True
                    logger.info(f'[SSOTokenVerify] Created new SSO user: {nip}')
                except Exception as e:
                    logger.error(f'[SSOTokenVerify] Error creating user: {str(e)}')
                    # If user creation fails, try one more fallback: maybe NIP exists with different email
                    if nip:
                        user = User.objects.filter(nip=nip).first()
                        if user:
                            logger.info(f'[SSOTokenVerify] User exists with this NIP, using existing user')
                        else:
                            raise
            
            # Update existing user info if they've changed
            if not created and user:
                updated = False
                if user.username != username:
                    user.username = username
                    updated = True
                if user.email != email and email:
                    user.email = email
                    updated = True
                if user.nip != nip and nip:
                    user.nip = nip
                    updated = True
                if user.first_name != first_name and first_name:
                    user.first_name = first_name
                    updated = True
                if user.last_name != last_name and last_name:
                    user.last_name = last_name
                    updated = True
                if user.department != department and department:
                    user.department = department
                    updated = True
                
                # Ensure is_staff and is_sso_user are set
                if not user.is_staff:
                    user.is_staff = True
                    updated = True
                if not user.is_sso_user:
                    user.is_sso_user = True
                    updated = True
                
                # Update last SSO login timestamp
                user.last_sso_login = timezone.now()
                updated = True
                
                if updated:
                    user.save()
                    logger.info(f'[SSOTokenVerify] Updated SSO user: {nip}')
            else:
                # For new users, set last_sso_login timestamp
                user.last_sso_login = timezone.now()
                user.save()
                logger.info(f'[SSOTokenVerify] Created new SSO user: {nip}')
            
            # Generate JWT tokens for the user
            refresh = RefreshToken.for_user(user)
        
        # Return tokens and user information
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'nip': user.nip,
                'department': user.department,
                'is_staff': user.is_staff,
                'is_sso_user': user.is_sso_user,
                'is_admin': user.is_admin(),
                'is_editor': user.is_editor(),
                'primary_role': user.get_primary_role().code if user.get_primary_role() else None,
                'roles': [role.code for role in user.roles.all()],
                'preferred_language': user.preferred_language,
                'theme_mode': user.theme_mode,
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f'[SSOTokenVerify] Error: {str(e)}', exc_info=True)
        return Response(
            {'error': f'SSO token verification error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
