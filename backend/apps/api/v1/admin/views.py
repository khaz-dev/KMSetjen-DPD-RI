"""
Admin API Views
===============

Admin-only viewsets for:
- User management (CRUD)
- Role management (CRUD)
- Audit log viewing and filtering
- System statistics
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
import requests
import logging
import threading
import time
from django.core.cache import cache

from apps.core.models import Role
from apps.audit.models import AuditLog
from apps.content.models import Tag
from apps.shared import IsAdmin, StandardResultsSetPagination
from django.conf import settings

logger = logging.getLogger(__name__)

from .serializers import (
    UserListSerializer, UserDetailSerializer, UserCreateSerializer,
    UserUpdateSerializer, UserSetPasswordSerializer,
    RoleSerializer, RoleCreateUpdateSerializer,
    AuditLogSerializer, AuditLogFilterSerializer,
    SystemStatisticsSerializer, PermissionSerializer,
    TagSerializer, TagCreateUpdateSerializer
)

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    Admin user management viewset.
    
    Endpoints:
    - GET /api/v1/admin/users/ - List all users
    - POST /api/v1/admin/users/ - Create new user
    - GET /api/v1/admin/users/{id}/ - Get user detail
    - PUT /api/v1/admin/users/{id}/ - Full update user
    - PATCH /api/v1/admin/users/{id}/ - Partial update user
    - DELETE /api/v1/admin/users/{id}/ - Delete user
    - POST /api/v1/admin/users/{id}/set-password/ - Admin set password
    - POST /api/v1/admin/users/{id}/activate/ - Activate user
    - POST /api/v1/admin/users/{id}/deactivate/ - Deactivate user
    """
    
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination
    search_fields = ['username', 'email', 'first_name', 'last_name']
    filterset_fields = ['is_active', 'is_staff']
    
    def get_serializer_class(self):
        """Return serializer based on action."""
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action == 'list':
            return UserListSerializer
        elif self.action == 'retrieve':
            return UserDetailSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        elif self.action == 'set_password':
            return UserSetPasswordSerializer
        return UserDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """Create new user."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return detail view
        user = serializer.instance
        return Response(
            UserDetailSerializer(user).data,
            status=status.HTTP_201_CREATED
        )
    
    def perform_create(self, serializer):
        """Save new user."""
        serializer.save()
    
    def perform_update(self, serializer):
        """Save updated user."""
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete user."""
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def set_password(self, request, pk=None):
        """
        Admin-only endpoint to set user password without old password verification.
        
        POST /api/v1/admin/users/{id}/set-password/
        {
            "password": "newpass123",
            "password_confirm": "newpass123"
        }
        """
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        password = serializer.validated_data['password']
        user.set_password(password)
        user.save()
        
        return Response({
            'success': True,
            'message': f'Password for user {user.username} has been reset.'
        })
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Activate a user account.
        
        POST /api/v1/admin/users/{id}/activate/
        """
        user = self.get_object()
        user.is_active = True
        user.save()
        
        return Response({
            'success': True,
            'message': f'User {user.username} has been activated.',
            'user': UserDetailSerializer(user).data
        })
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """
        Deactivate a user account.
        
        POST /api/v1/admin/users/{id}/deactivate/
        """
        user = self.get_object()
        user.is_active = False
        user.save()
        
        return Response({
            'success': True,
            'message': f'User {user.username} has been deactivated.',
            'user': UserDetailSerializer(user).data
        })
    
    @action(detail=False, methods=['get'], url_path='sync-external-users-progress', url_name='sync-external-users-progress')
    def sync_external_users_progress(self, request):
        """
        Get current progress of sync operation.
        
        GET /api/v1/admin/users/sync-external-users-progress/
        
        Response includes progress percentage, current stats, and time estimates.
        """
        progress_key = f'sync_progress_{request.user.id}'
        progress_data = cache.get(progress_key, {})
        
        if not progress_data:
            # No sync in progress
            return Response({
                'is_syncing': False,
                'progress': 0,
                'current_page': 0,
                'total_pages': 0,
                'total_fetched': 0,
                'created': 0,
                'updated': 0,
                'errors_count': 0,
                'elapsed_seconds': 0,
                'estimated_total_seconds': 0,
                'estimated_remaining_seconds': 0,
                'status_message': 'No sync in progress'
            })
        
        # Calculate progress percentage and time estimates
        total_phase_items = max(progress_data.get('total_pages', 1) + progress_data.get('total_fetched', 0), 1)
        current_phase_items = progress_data.get('current_page', 0) + progress_data.get('processed_count', 0)
        progress_percent = min(100, int((current_phase_items / total_phase_items * 100)) if total_phase_items > 0 else 0)
        
        elapsed = progress_data.get('elapsed_seconds', 0)
        if progress_percent > 0 and elapsed > 0:
            estimated_total = int((elapsed / progress_percent) * 100)
            estimated_remaining = max(0, estimated_total - elapsed)
        else:
            estimated_total = 0
            estimated_remaining = 0
        
        return Response({
            'is_syncing': True,
            'progress': progress_percent,
            'current_page': progress_data.get('current_page', 0),
            'total_pages': progress_data.get('total_pages', 0),
            'total_fetched': progress_data.get('total_fetched', 0),
            'created': progress_data.get('created', 0),
            'updated': progress_data.get('updated', 0),
            'errors_count': len(progress_data.get('errors', [])),
            'elapsed_seconds': elapsed,
            'estimated_total_seconds': estimated_total,
            'estimated_remaining_seconds': estimated_remaining,
            'status_message': progress_data.get('status_message', 'Processing...')
        })

    @action(detail=False, methods=['post'], url_path='check-external-api-health', url_name='check-external-api-health')
    def check_external_api_health(self, request):
        """
        Check if the external API is accessible.
        
        POST /api/v1/admin/users/check-external-api-health/
        
        Performs diagnostic tests and reports the status of the external API.
        Useful for troubleshooting sync issues.
        
        Response:
        {
            'healthy': bool,
            'api_url': str,
            'status': str,
            'http_status_code': int|null,
            'dns_resolved': bool|null,
            'socket_connected': bool|null,
            'error': str|null,
            'diagnostic': dict
        }
        """
        try:
            import socket
            
            external_api_base_url = settings.EXTERNAL_API_BASE_URL
            external_api_token = settings.EXTERNAL_API_TOKEN
            
            logger.info(f"[HEALTH] Checking health of external API: {external_api_base_url}")
            
            # Parse hostname from URL
            from urllib.parse import urlparse
            parsed = urlparse(external_api_base_url)
            hostname = parsed.hostname
            port = parsed.port or (443 if parsed.scheme == 'https' else 80)
            
            diagnostics = {
                'api_url': external_api_base_url,
                'hostname': hostname,
                'port': port,
                'scheme': parsed.scheme
            }
            
            # Test DNS Resolution
            try:
                ip = socket.gethostbyname(hostname)
                diagnostics['dns_resolved'] = True
                diagnostics['ip_address'] = ip
                logger.info(f"[HEALTH] DNS resolved {hostname} to {ip}")
            except socket.gaierror as e:
                diagnostics['dns_resolved'] = False
                diagnostics['dns_error'] = str(e)
                logger.error(f"[HEALTH] DNS resolution failed for {hostname}: {e}")
                return Response({
                    'healthy': False,
                    'status': 'DNS_RESOLUTION_FAILED',
                    'error': f"Cannot resolve hostname {hostname}",
                    'diagnostic': diagnostics
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            # Test Socket Connection
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(5)
                result = sock.connect_ex((hostname, port))
                sock.close()
                
                if result == 0:
                    diagnostics['socket_connected'] = True
                    logger.info(f"[HEALTH] Socket connection successful to {hostname}:{port}")
                else:
                    diagnostics['socket_connected'] = False
                    diagnostics['socket_error_code'] = result
                    logger.error(f"[HEALTH] Socket connection failed to {hostname}:{port}, code: {result}")
                    return Response({
                        'healthy': False,
                        'status': 'CONNECTION_REFUSED',
                        'error': f"Cannot establish connection to {hostname}:{port}",
                        'diagnostic': diagnostics
                    }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            except Exception as e:
                diagnostics['socket_connected'] = False
                diagnostics['socket_error'] = str(e)
                logger.error(f"[HEALTH] Socket error: {e}")
                return Response({
                    'healthy': False,
                    'status': 'SOCKET_ERROR',
                    'error': str(e),
                    'diagnostic': diagnostics
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            # Test HTTP Request
            headers = {'X-API-Token': external_api_token}
            endpoint_url = f"{external_api_base_url}/api/external/users"
            
            try:
                response = requests.get(
                    endpoint_url,
                    headers=headers,
                    params={'page': 1, 'per_page': 1},
                    timeout=10,
                    verify=True
                )
                diagnostics['http_status_code'] = response.status_code
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        diagnostics['response_type'] = 'json'
                        diagnostics['response_keys'] = list(data.keys()) if isinstance(data, dict) else 'list'
                        
                        logger.info(f"[HEALTH] External API healthy - Status 200, valid JSON response")
                        return Response({
                            'healthy': True,
                            'status': 'HEALTHY',
                            'http_status_code': response.status_code,
                            'diagnostic': diagnostics
                        }, status=status.HTTP_200_OK)
                    except ValueError:
                        diagnostics['response_type'] = 'invalid_json'
                        logger.warning(f"[HEALTH] API returned 200 but response is not valid JSON")
                        return Response({
                            'healthy': False,
                            'status': 'INVALID_RESPONSE_FORMAT',
                            'error': 'API returned 200 but response is not valid JSON',
                            'http_status_code': response.status_code,
                            'diagnostic': diagnostics
                        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
                else:
                    diagnostics['response_status'] = response.status_code
                    diagnostics['response_text'] = response.text[:200]  # First 200 chars
                    logger.error(f"[HEALTH] External API returned status {response.status_code}")
                    return Response({
                        'healthy': False,
                        'status': f'HTTP_{response.status_code}',
                        'error': f'API returned status {response.status_code}',
                        'http_status_code': response.status_code,
                        'diagnostic': diagnostics
                    }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
                    
            except requests.exceptions.Timeout:
                diagnostics['http_error'] = 'timeout'
                logger.error(f"[HEALTH] HTTP request to {endpoint_url} timed out")
                return Response({
                    'healthy': False,
                    'status': 'HTTP_TIMEOUT',
                    'error': 'HTTP request timed out (10 seconds exceeded)',
                    'diagnostic': diagnostics
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
                
            except requests.exceptions.RequestException as e:
                diagnostics['http_error'] = str(e)
                logger.error(f"[HEALTH] HTTP request failed: {e}")
                return Response({
                    'healthy': False,
                    'status': 'HTTP_REQUEST_FAILED',
                    'error': str(e),
                    'diagnostic': diagnostics
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
                
        except Exception as e:
            logger.error(f"[HEALTH] Unexpected error during health check: {e}")
            return Response({
                'healthy': False,
                'status': 'UNKNOWN_ERROR',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='sync-external-users', url_name='sync-external-users')
    def sync_external_users(self, request):
        """
        Sync users from external API (Pegawai ASN).
        
        POST /api/v1/admin/users/sync-external-users/
        
        Fetches user data from external system and creates/updates local users.
        Handles pagination automatically to fetch all users.
        
        Response:
        {
            'success': bool,
            'message': str,
            'created': int,
            'updated': int,
            'errors': list,
            'details': []
        }
        """
        try:
            # Initialize progress tracking
            progress_key = f'sync_progress_{request.user.id}'
            start_time = time.time()
            
            def update_progress(page, total_pages, total_fetched, created, updated, errors, status_msg):
                """Update progress in cache for real-time tracking"""
                cache.set(progress_key, {
                    'current_page': page,
                    'total_pages': total_pages,
                    'total_fetched': total_fetched,
                    'created': created,
                    'updated': updated,
                    'errors': errors,
                    'processed_count': created + updated,
                    'elapsed_seconds': int(time.time() - start_time),
                    'status_message': status_msg
                }, timeout=3600)  # Store for up to 1 hour
            
            # Get external API configuration from settings
            external_api_base_url = settings.EXTERNAL_API_BASE_URL
            external_api_token = settings.EXTERNAL_API_TOKEN
            
            # Construct the full API URL
            external_api_url = f"{external_api_base_url}/api/external/users"
            
            logger.info(f"[SYNC] Attempting to fetch data from: {external_api_url}")
            
            # Add API authentication headers
            headers = {
                'X-API-Token': external_api_token,
            }
            
            created_count = 0
            updated_count = 0
            errors = []
            details = []
            all_external_users = []
            
            # Pagination handling - fetch all pages
            page = 1
            per_page = 500  # Request 500 users per page
            total_pages = 1
            
            update_progress(0, 1, 0, 0, 0, [], 'Starting sync... Fetching data from API')
            
            while page <= total_pages:
                logger.info(f"[SYNC] Fetching page {page} with {per_page} users per page...")
                update_progress(page, total_pages, len(all_external_users), created_count, updated_count, errors, f'Fetching page {page} of {total_pages}...')
                
                # Add pagination parameters
                params = {
                    'page': page,
                    'per_page': per_page
                }
                
                # Fetch users from external API with timeout
                response = requests.get(
                    external_api_url,
                    headers=headers,
                    params=params,
                    timeout=30
                )
                
                if response.status_code != 200:
                    error_msg = f"External API returned status {response.status_code}"
                    logger.error(f"[SYNC] Error: {error_msg}")
                    logger.error(f"[SYNC] Response: {response.text}")
                    error_list = [error_msg]
                    update_progress(page, total_pages, len(all_external_users), created_count, updated_count, error_list, f'Error: {error_msg}')
                    return Response({
                        'success': False,
                        'message': error_msg,
                        'created': 0,
                        'updated': 0,
                        'errors': error_list
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                response_data = response.json()
                
                # Parse response to extract users and pagination info
                if isinstance(response_data, list):
                    # Direct list response (no pagination metadata)
                    page_users = response_data
                    logger.info(f"[SYNC] Received list response with {len(page_users)} users (assuming single page)")
                    all_external_users.extend(page_users)
                    break  # Single page, exit loop
                
                elif isinstance(response_data, dict):
                    # Paginated response - check for various possible structures
                    
                    # Try common pagination response formats
                    if 'data' in response_data:
                        page_users = response_data.get('data', [])
                    elif 'results' in response_data:
                        page_users = response_data.get('results', [])
                    elif 'users' in response_data:
                        page_users = response_data.get('users', [])
                    else:
                        # Fallback: assume the entire dict is malformed
                        page_users = []
                        logger.warning(f"[SYNC] Unknown response format, trying to extract users...")
                    
                    logger.info(f"[SYNC] Fetched {len(page_users)} users on page {page}")
                    all_external_users.extend(page_users)
                    
                    # Check for pagination metadata in various formats
                    # Priority 1: Root-level pagination fields (from API like Cmb2.duckdns.org)
                    if 'last_page' in response_data:
                        total_pages = response_data.get('last_page', 1)
                        logger.info(f"[SYNC] Pagination info: page {page}/{total_pages} (root-level last_page)")
                    # Priority 2: Nested pagination object
                    elif 'pagination' in response_data:
                        pagination = response_data.get('pagination', {})
                        total_pages = pagination.get('total_pages', pagination.get('last_page', pagination.get('pages', 1)))
                        logger.info(f"[SYNC] Pagination info: page {page}/{total_pages} (nested pagination object)")
                    # Priority 3: Root-level pages field
                    elif 'pages' in response_data:
                        total_pages = response_data.get('pages', 1)
                        logger.info(f"[SYNC] Pagination info: page {page}/{total_pages} (root-level pages)")
                    # Priority 4: Total pages field
                    elif 'total_pages' in response_data:
                        total_pages = response_data.get('total_pages', 1)
                        logger.info(f"[SYNC] Pagination info: page {page}/{total_pages} (root-level total_pages)")
                    # Priority 5: Check if fewer users than requested = last page
                    elif len(page_users) < per_page:
                        # If we got fewer users than requested, this is the last page
                        logger.info(f"[SYNC] Received {len(page_users)} users (< {per_page}), assuming last page")
                        break
                    else:
                        # Default: continue to next page
                        total_pages = page + 1
                        logger.info(f"[SYNC] No pagination metadata found, assuming more pages may exist")
                
                page += 1
            
            logger.info(f"[SYNC] Total users fetched from API: {len(all_external_users)}")
            update_progress(total_pages, total_pages, len(all_external_users), 0, 0, [], f'Processing {len(all_external_users)} users...')
            
            # Get Pembaca role for assignment to synced users
            try:
                pembaca_role = Role.objects.get(code='reader')
            except Role.DoesNotExist:
                logger.warning("[SYNC] Pembaca (reader) role not found in database")
                pembaca_role = None
            
            # Process each external user
            for idx, ext_user in enumerate(all_external_users):
                try:
                    # Update progress every 10 users or on first/last
                    if idx % 10 == 0 or idx == len(all_external_users) - 1:
                        update_progress(total_pages, total_pages, len(all_external_users), created_count, updated_count, errors, 
                                      f'Processing users: {idx + 1} of {len(all_external_users)}...')
                    
                    # Extract user data from external system with proper field mapping
                    # Email is the unique identifier for users
                    nip = ext_user.get('nip')
                    email = ext_user.get('email')
                    department = ext_user.get('department', '')
                    
                    # Extract organization-related fields
                    # Handle both string and object formats from external API
                    # e.g., "Tenaga Ahli" or {"id": 1, "name": "Tenaga Ahli"}
                    def extract_field(obj, key, default=''):
                        """Extract field from dict, handling both string and object formats"""
                        value = obj.get(key, default)
                        if isinstance(value, dict):
                            # If it's an object, try to get the 'name' field
                            return value.get('name', str(value))
                        return str(value) if value else default
                    
                    jenis_jabatan = extract_field(ext_user, 'jenis_jabatan', '')
                    unit_organisasi = extract_field(ext_user, 'unit_organisasi', '')
                    jabatan = extract_field(ext_user, 'jabatan', '')
                    
                    # Parse employee name from API
                    # Try to get full name from various sources
                    first_name = ext_user.get('first_name', '')
                    last_name = ext_user.get('last_name', '')
                    
                    # If we have both first_name and last_name, try to detect if they need re-splitting
                    # (external API might return role/title in first_name field)
                    # Check: if first_name is very long (>30 chars) or contains multiple words,
                    # it's likely a full name or title that needs splitting
                    full_name_to_split = None
                    
                    if first_name and len(first_name) > 30 or (first_name and ' ' in first_name and len(first_name.split()) >= 2):
                        # First_name looks like a full name or long description, re-split it
                        # Combine with last_name if last_name exists
                        if last_name:
                            full_name_to_split = f"{first_name} {last_name}"
                        else:
                            full_name_to_split = first_name
                    elif not first_name and not last_name:
                        # No names provided, try to get from other fields
                        full_name_to_split = ext_user.get('username') or ext_user.get('name', '')
                    
                    if full_name_to_split:
                        # Apply intelligent splitting: First 2 words = Nama Depan, Remaining = Nama Belakang
                        name_parts = full_name_to_split.strip().split()
                        if len(name_parts) >= 3:
                            # 3+ words: first 2 words = first_name, rest = last_name
                            first_name = ' '.join(name_parts[:2])
                            last_name = ' '.join(name_parts[2:])
                        elif len(name_parts) == 2:
                            # 2 words: word 1 = first_name, word 2 = last_name
                            first_name = name_parts[0]
                            last_name = name_parts[1]
                        elif len(name_parts) == 1:
                            # 1 word: all goes to first_name
                            first_name = name_parts[0]
                            last_name = ''
                    
                    # Use email as unique username (Pegawai always have email)
                    username = email
                    
                    if not username:
                        errors.append(f"User missing email: {ext_user}")
                        continue
                    
                    # Get or create user by email
                    user, created = User.objects.get_or_create(
                        email=email,
                        defaults={
                            'username': username,
                            'first_name': first_name,
                            'last_name': last_name,
                            'nip': nip,
                            'department': department,
                            'jenis_jabatan': jenis_jabatan,
                            'unit_organisasi': unit_organisasi,
                            'jabatan': jabatan,
                            'is_active': ext_user.get('is_active', True),
                            'is_staff': True,  # Pegawai users are staff
                        }
                    )
                    
                    if created:
                        # Set a default password for new users (they should change it)
                        user.set_password('ChangeMe@2026')
                        user.save()
                        
                        # Assign Pembaca role to synced users
                        if pembaca_role:
                            user.roles.add(pembaca_role)
                        
                        created_count += 1
                        logger.info(f"[SYNC] Created user: {username}")
                        details.append({
                            'action': 'created',
                            'username': username,
                            'email': email,
                            'nip': nip
                        })
                    else:
                        # Update existing user with latest data from external system
                        user.username = username
                        user.email = email
                        user.first_name = first_name
                        user.last_name = last_name
                        user.nip = nip
                        user.department = department
                        user.jenis_jabatan = jenis_jabatan
                        user.unit_organisasi = unit_organisasi
                        user.jabatan = jabatan
                        user.is_active = ext_user.get('is_active', True)
                        user.is_staff = True  # Pegawai users are staff
                        user.save()
                        
                        # Assign Pembaca role to synced users
                        if pembaca_role:
                            user.roles.add(pembaca_role)
                        
                        updated_count += 1
                        logger.info(f"[SYNC] Updated user: {username}")
                        details.append({
                            'action': 'updated',
                            'username': username,
                            'email': email,
                            'nip': nip
                        })
                
                except Exception as e:
                    error_msg = f"Error processing user {ext_user.get('username', 'unknown')}: {str(e)}"
                    errors.append(error_msg)
                    logger.error(f"[SYNC] {error_msg}")
            
            message = f"Sync completed: {created_count} created, {updated_count} updated from {len(all_external_users)} total users"
            logger.info(f"[SYNC] {message}")
            
            # Final progress update and cleanup
            update_progress(total_pages, total_pages, len(all_external_users), created_count, updated_count, errors, 'Sync completed!')
            cache.delete(progress_key)  # Clear progress after 5 seconds via background task
            
            return Response({
                'success': True,
                'message': message,
                'created': created_count,
                'updated': updated_count,
                'errors': errors,
                'details': details if len(details) <= 100 else details[:100]  # Limit details to first 100 for response size
            }, status=status.HTTP_200_OK)
        
        except requests.exceptions.Timeout:
            error_msg = "External API request timeout (30 seconds exceeded)"
            logger.error(f"[SYNC] {error_msg}")
            progress_key = f'sync_progress_{request.user.id}'
            cache.delete(progress_key)
            return Response({
                'success': False,
                'message': error_msg,
                'created': 0,
                'updated': 0,
                'errors': [error_msg],
                'diagnostic': {
                    'type': 'timeout',
                    'hint': 'The external API is not responding within 30 seconds. Check if the server is online and not overloaded.'
                }
            }, status=status.HTTP_408_REQUEST_TIMEOUT)
        
        except requests.exceptions.ConnectionError as e:
            error_str = str(e)
            
            # Provide detailed diagnostics for different connection error types
            diagnostic_hint = None
            if 'getaddrinfo failed' in error_str or 'Name or service not known' in error_str:
                diagnostic_hint = f"DNS resolution failed for {external_api_base_url}. Check: (1) Domain is registered and active, (2) Network has DNS access, (3) Check your internet connection"
            elif 'Connection refused' in error_str:
                diagnostic_hint = f"Connection refused by {external_api_base_url}. The server may not be running or not accepting connections on this port."
            elif 'Network unreachable' in error_str:
                diagnostic_hint = "Network is unreachable. Check your internet connection and firewall settings."
            else:
                diagnostic_hint = "Unable to connect to the external API. Check your network connection and firewall rules."
            
            error_msg = f"Cannot connect to external API: {error_str}"
            logger.error(f"[SYNC] {error_msg}")
            logger.error(f"[SYNC] Diagnostic: {diagnostic_hint}")
            
            progress_key = f'sync_progress_{request.user.id}'
            cache.delete(progress_key)
            
            return Response({
                'success': False,
                'message': error_msg,
                'created': 0,
                'updated': 0,
                'errors': [error_msg],
                'diagnostic': {
                    'type': 'connection_error',
                    'api_url': external_api_base_url,
                    'hint': diagnostic_hint
                }
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        except requests.exceptions.RequestException as e:
            error_msg = f"External API request failed: {str(e)}"
            logger.error(f"[SYNC] {error_msg}")
            progress_key = f'sync_progress_{request.user.id}'
            cache.delete(progress_key)
            return Response({
                'success': False,
                'message': error_msg,
                'created': 0,
                'updated': 0,
                'errors': [error_msg],
                'diagnostic': {
                    'type': 'request_exception',
                    'api_url': external_api_base_url,
                    'hint': 'An unexpected error occurred. Check the Django logs for more details.'
                }
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        except Exception as e:
            error_msg = f"Unexpected error during sync: {str(e)}"
            logger.error(f"[SYNC] {error_msg}")
            progress_key = f'sync_progress_{request.user.id}'
            cache.delete(progress_key)
            return Response({
                'success': False,
                'message': error_msg,
                'created': 0,
                'updated': 0,
                'errors': [error_msg]
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RoleViewSet(viewsets.ModelViewSet):
    """
    Admin role management viewset.
    
    Endpoints:
    - GET /api/v1/admin/roles/ - List all roles
    - POST /api/v1/admin/roles/ - Create new role
    - GET /api/v1/admin/roles/{id}/ - Get role detail
    - PUT /api/v1/admin/roles/{id}/ - Full update role
    - PATCH /api/v1/admin/roles/{id}/ - Partial update role
    - DELETE /api/v1/admin/roles/{id}/ - Delete role
    - POST /api/v1/admin/roles/{id}/add-permission/ - Add permission to role
    - POST /api/v1/admin/roles/{id}/remove-permission/ - Remove permission from role
    """
    
    queryset = Role.objects.all().order_by('code')
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination
    
    def get_serializer_class(self):
        """Return serializer based on action."""
        if self.action in ['create', 'update', 'partial_update']:
            return RoleCreateUpdateSerializer
        return RoleSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create a new role with enhanced error handling and logging.
        """
        logger.info(f"[ROLE CREATE] Received request data: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            logger.warning(f"[ROLE CREATE] Validation failed. Errors: {serializer.errors}")
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_create(serializer)
        
        return Response(
            RoleSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """
        Update a role with enhanced error handling and logging.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        logger.info(f"[ROLE UPDATE] Received request for role {instance.id}. Data: {request.data}")
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if not serializer.is_valid():
            logger.warning(f"[ROLE UPDATE] Validation failed. Errors: {serializer.errors}")
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_update(serializer)
        
        return Response(
            RoleSerializer(serializer.instance).data,
            status=status.HTTP_200_OK
        )
    
        """Save new role with logging."""
        try:
            validated_data = serializer.validated_data
            logger.info(f"[ROLE CREATE] Creating role with code={validated_data.get('code')}, name_id={validated_data.get('name_id')}")
            serializer.save()
            logger.info(f"[ROLE CREATE] Successfully created role: {serializer.instance.code}")
        except Exception as e:
            logger.error(f"[ROLE CREATE] Error creating role: {str(e)}")
            raise
    
    def perform_update(self, serializer):
        """Save updated role with logging."""
        try:
            validated_data = serializer.validated_data
            logger.info(f"[ROLE UPDATE] Updating role {self.kwargs.get('pk')} with code={validated_data.get('code')}")
            serializer.save()
            logger.info(f"[ROLE UPDATE] Successfully updated role: {serializer.instance.code}")
        except Exception as e:
            logger.error(f"[ROLE UPDATE] Error updating role: {str(e)}")
            raise
    
    def perform_destroy(self, instance):
        """Delete role (if no users have it)."""
        instance.delete()
    
    def destroy(self, request, *args, **kwargs):
        """
        Override destroy to add business logic validation.
        Delete role only if it has no users assigned.
        """
        instance = self.get_object()
        
        # Check if role has users
        if instance.users.exists():
            user_count = instance.users.count()
            logger.warning(f"[ROLE DELETE] Attempted to delete role '{instance.code}' with {user_count} users - BLOCKED")
            return Response(
                {
                    'detail': f'Cannot delete role "{instance.code}" - it has {user_count} user{"s" if user_count != 1 else ""}. Please unassign all users first.',
                    'error_code': 'ROLE_HAS_USERS',
                    'user_count': user_count
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # No users assigned, proceed with deletion
        logger.info(f"[ROLE DELETE] Deleting role '{instance.code}' (ID: {instance.id})")
        self.perform_destroy(instance)
        
        return Response(
            {
                'detail': f'Role "{instance.code}" deleted successfully',
                'success': True
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def add_permission(self, request, pk=None):
        """
        Add permission to role.
        
        POST /api/v1/admin/roles/{id}/add-permission/
        {
            "permission_id": 1
        }
        """
        role = self.get_object()
        permission_id = request.data.get('permission_id')
        
        try:
            permission = Permission.objects.get(id=permission_id)
        except Permission.DoesNotExist:
            return Response(
                {'error': f'Permission with id {permission_id} not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Manage JSONField permissions list
        if not isinstance(role.permissions, list):
            role.permissions = []
        
        if permission.id not in role.permissions:
            role.permissions.append(permission.id)
            role.save()
        
        return Response(RoleSerializer(role).data)
    
    @action(detail=True, methods=['post'])
    def remove_permission(self, request, pk=None):
        """
        Remove permission from role.
        
        POST /api/v1/admin/roles/{id}/remove-permission/
        {
            "permission_id": 1
        }
        """
        role = self.get_object()
        permission_id = request.data.get('permission_id')
        
        try:
            permission = Permission.objects.get(id=permission_id)
        except Permission.DoesNotExist:
            return Response(
                {'error': f'Permission with id {permission_id} not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Manage JSONField permissions list
        if isinstance(role.permissions, list) and permission.id in role.permissions:
            role.permissions.remove(permission.id)
            role.save()
        
        return Response(RoleSerializer(role).data)


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only permission viewset.
    
    Endpoints:
    - GET /api/v1/admin/permissions/ - List all permissions
    - GET /api/v1/admin/permissions/{id}/ - Get permission detail
    """
    
    queryset = Permission.objects.all().order_by('codename')
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only audit log viewset with filtering.
    
    Endpoints:
    - GET /api/v1/admin/audit-logs/ - List all audit logs (with filters)
    - GET /api/v1/admin/audit-logs/{id}/ - Get audit log detail
    - POST /api/v1/admin/audit-logs/filter/ - Advanced filtering
    
    Query Parameters (for filtering):
    - action: CREATE, UPDATE, DELETE, PUBLISH, APPROVE, REJECT, REVIEW, ARCHIVE
    - resource_type: Article, User, Role
    - user_id: Filter by user who made the action
    - date_from: Filter from this date (ISO format)
    - date_to: Filter until this date (ISO format)
    - ip_address: Filter by IP address
    """
    
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """Filter audit logs based on query parameters."""
        queryset = super().get_queryset()
        
        # Filter by action (case-insensitive to match both uppercase and lowercase values)
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action__iexact=action)
        
        # Filter by resource type (maps to content_type field on model)
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(content_type=resource_type)
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        # Filter by IP address
        ip_address = self.request.query_params.get('ip_address')
        if ip_address:
            queryset = queryset.filter(ip_address=ip_address)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def filter(self, request):
        """
        Advanced filter endpoint.
        
        POST /api/v1/admin/audit-logs/filter/
        {
            "action": "UPDATE",
            "resource_type": "Article",
            "date_from": "2026-01-01T00:00:00Z",
            "date_to": "2026-01-05T23:59:59Z"
        }
        """
        serializer = AuditLogFilterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        filters = Q()
        
        if 'action' in serializer.validated_data:
            filters &= Q(action__iexact=serializer.validated_data['action'])
        
        if 'resource_type' in serializer.validated_data:
            filters &= Q(content_type=serializer.validated_data['resource_type'])
        
        if 'user_id' in serializer.validated_data:
            filters &= Q(user_id=serializer.validated_data['user_id'])
        
        if 'date_from' in serializer.validated_data:
            filters &= Q(timestamp__gte=serializer.validated_data['date_from'])
        
        if 'date_to' in serializer.validated_data:
            filters &= Q(timestamp__lte=serializer.validated_data['date_to'])
        
        if 'ip_address' in serializer.validated_data:
            filters &= Q(ip_address=serializer.validated_data['ip_address'])
        
        logs = AuditLog.objects.filter(filters).order_by('-timestamp')
        page = self.paginate_queryset(logs)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)


class SystemStatisticsViewSet(viewsets.ViewSet):
    """
    System-wide statistics viewset.
    
    Endpoints:
    - GET /api/v1/admin/statistics/ - Get system statistics
    - GET /api/v1/admin/statistics/users/ - User statistics
    - GET /api/v1/admin/statistics/articles/ - Article statistics
    - GET /api/v1/admin/statistics/audit/ - Audit log statistics
    """
    
    permission_classes = [IsAuthenticated, IsAdmin]
    
    def list(self, request):
        """
        Get comprehensive system statistics.
        
        GET /api/v1/admin/statistics/
        """
        from apps.content.models import Article
        
        stats = {
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'total_articles': Article.objects.count(),
            'published_articles': Article.objects.filter(is_published=True).count(),
            'draft_articles': Article.objects.filter(status='draft').count(),
            'in_review_articles': Article.objects.filter(status='review').count(),
            'total_audit_logs': AuditLog.objects.count(),
            'users_by_role': dict(
                User.objects.filter(roles__isnull=False)
                    .values('roles__code')
                    .annotate(count=Count('id'))
                    .values_list('roles__code', 'count')
            ),
            'articles_by_status': dict(
                Article.objects.values('status')
                    .annotate(count=Count('id'))
                    .values_list('status', 'count')
            ),
            'audit_logs_by_action': dict(
                AuditLog.objects.values('action')
                    .annotate(count=Count('id'))
                    .values_list('action', 'count')
            ),
            'recent_audit_logs': AuditLog.objects.all()[:10]
        }
        
        serializer = SystemStatisticsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def users(self, request):
        """
        Get user statistics.
        
        GET /api/v1/admin/statistics/users/
        """
        stats = {
            'total': User.objects.count(),
            'active': User.objects.filter(is_active=True).count(),
            'inactive': User.objects.filter(is_active=False).count(),
            'is_staff': User.objects.filter(is_staff=True).count(),
            'by_role': dict(
                User.objects.filter(roles__isnull=False)
                    .values('roles__code')
                    .annotate(count=Count('id'))
                    .values_list('roles__code', 'count')
            ),
            'joined_last_7_days': User.objects.filter(
                date_joined__gte=timezone.now() - timedelta(days=7)
            ).count(),
            'last_login_7_days': User.objects.filter(
                last_login__gte=timezone.now() - timedelta(days=7)
            ).count(),
        }
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def articles(self, request):
        """
        Get article statistics.
        
        GET /api/v1/admin/statistics/articles/
        """
        from apps.content.models import Article
        
        stats = {
            'total': Article.objects.count(),
            'published': Article.objects.filter(is_published=True).count(),
            'draft': Article.objects.filter(status='DRAFT').count(),
            'in_review': Article.objects.filter(status='REVIEW').count(),
            'by_category': dict(
                Article.objects.values('category__name_en')
                    .annotate(count=Count('id'))
                    .values_list('category__name_en', 'count')
            ),
            'created_last_7_days': Article.objects.filter(
                created_at__gte=timezone.now() - timedelta(days=7)
            ).count(),
            'published_last_7_days': Article.objects.filter(
                is_published=True,
                published_at__gte=timezone.now() - timedelta(days=7)
            ).count(),
            'total_views': Article.objects.aggregate(total=Count('views'))['total'],
        }
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def audit(self, request):
        """
        Get audit log statistics.
        
        GET /api/v1/admin/statistics/audit/
        """
        stats = {
            'total_logs': AuditLog.objects.count(),
            'by_action': dict(
                AuditLog.objects.values('action')
                    .annotate(count=Count('id'))
                    .values_list('action', 'count')
            ),
            'by_resource_type': dict(
                AuditLog.objects.values('resource_type')
                    .annotate(count=Count('id'))
                    .values_list('resource_type', 'count')
            ),
            'logs_last_7_days': AuditLog.objects.filter(
                timestamp__gte=timezone.now() - timedelta(days=7)
            ).count(),
            'logs_last_24_hours': AuditLog.objects.filter(
                timestamp__gte=timezone.now() - timedelta(hours=24)
            ).count(),
        }
        return Response(stats)


class TagViewSet(viewsets.ModelViewSet):
    """
    Admin tag management viewset.
    
    Endpoints:
    - GET /api/v1/admin/tags/ - List all tags
    - POST /api/v1/admin/tags/ - Create new tag
    - GET /api/v1/admin/tags/{id}/ - Get tag detail
    - PUT /api/v1/admin/tags/{id}/ - Full update tag
    - PATCH /api/v1/admin/tags/{id}/ - Partial update tag
    - DELETE /api/v1/admin/tags/{id}/ - Delete tag
    """
    
    queryset = Tag.objects.all().order_by('-usage_count')
    permission_classes = [IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination
    search_fields = ['name_id', 'name_en']
    filterset_fields = ['is_active', 'color']
    
    def get_serializer_class(self):
        """Return serializer based on action."""
        if self.action in ['create', 'update', 'partial_update']:
            return TagCreateUpdateSerializer
        return TagSerializer
    
    def create(self, request, *args, **kwargs):
        """Create new tag."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return detail view
        tag = serializer.instance
        return Response(
            TagSerializer(tag).data,
            status=status.HTTP_201_CREATED
        )
    
    def perform_create(self, serializer):
        """Save new tag."""
        serializer.save()
    
    def perform_update(self, serializer):
        """Save updated tag."""
        serializer.save()
