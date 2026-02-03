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

from apps.core.models import Role
from apps.audit.models import AuditLog
from apps.shared import IsAdmin, StandardResultsSetPagination

from .serializers import (
    UserListSerializer, UserDetailSerializer, UserCreateSerializer,
    UserUpdateSerializer, UserSetPasswordSerializer,
    RoleSerializer, RoleCreateUpdateSerializer,
    AuditLogSerializer, AuditLogFilterSerializer,
    SystemStatisticsSerializer, PermissionSerializer
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
    
    def perform_create(self, serializer):
        """Save new role."""
        serializer.save()
    
    def perform_update(self, serializer):
        """Save updated role."""
        serializer.save()
    
    def perform_destroy(self, instance):
        """Delete role (if no users have it)."""
        if instance.users.exists():
            raise serializers.ValidationError(
                f'Cannot delete role {instance.code} - it has {instance.users.count()} users.'
            )
        instance.delete()
    
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
        
        role.permissions.add(permission)
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
        
        role.permissions.remove(permission)
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
        
        # Filter by action
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        # Filter by resource type
        resource_type = self.request.query_params.get('resource_type')
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        
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
            filters &= Q(action=serializer.validated_data['action'])
        
        if 'resource_type' in serializer.validated_data:
            filters &= Q(resource_type=serializer.validated_data['resource_type'])
        
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
            'draft_articles': Article.objects.filter(status='DRAFT').count(),
            'in_review_articles': Article.objects.filter(status='REVIEW').count(),
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
