"""
Admin API Serializers
=====================

Serializers for admin-only endpoints:
- User management (list, detail, create, update, delete)
- Role management (CRUD operations)
- Audit log viewing (list, detail, filtering)
- System statistics
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from apps.core.models import Role
from apps.audit.models import AuditLog

User = get_user_model()


class PermissionSerializer(serializers.ModelSerializer):
    """Permission detail serializer."""
    
    class Meta:
        model = Permission
        fields = ['id', 'codename', 'name']
        read_only_fields = ['id']


class RoleSerializer(serializers.ModelSerializer):
    """Role serializer for list and detail."""
    
    permissions = serializers.JSONField(read_only=True)
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Role
        fields = ['id', 'code', 'name_id', 'name_en', 'description_id', 'description_en', 'permissions', 'is_active', 'user_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_user_count(self, obj):
        """Count users with this role."""
        return obj.users.count()


class RoleCreateUpdateSerializer(serializers.ModelSerializer):
    """Role creation and update serializer."""
    
    class Meta:
        model = Role
        fields = ['code', 'name_id', 'name_en', 'description_id', 'description_en', 'permissions', 'is_active']
    
    def validate_code(self, value):
        """Validate role code is unique (except in update)."""
        if self.instance:  # Update case
            if Role.objects.filter(code=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("A role with this code already exists.")
        else:  # Create case
            if Role.objects.filter(code=value).exists():
                raise serializers.ValidationError("A role with this code already exists.")
        return value.upper()


class UserListSerializer(serializers.ModelSerializer):
    """Simplified user serializer for list view."""
    
    primary_role = serializers.SerializerMethodField()
    role_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'nip', 'is_active', 'primary_role', 'role_count', 'last_login', 'date_joined']
        read_only_fields = ['id', 'last_login', 'date_joined']
    
    def get_primary_role(self, obj):
        """Get user's primary role."""
        role = obj.get_primary_role()
        return role.code if role else None
    
    def get_role_count(self, obj):
        """Count user's roles."""
        return obj.roles.count()


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed user serializer with all information."""
    
    roles = RoleSerializer(many=True, read_only=True)
    primary_role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'phone',
            'nip', 'department', 'is_active', 'is_staff', 'roles', 'primary_role',
            'preferred_language', 'theme_mode', 'last_login', 'date_joined', 'updated_at'
        ]
        read_only_fields = ['id', 'last_login', 'date_joined', 'updated_at']
    
    def get_primary_role(self, obj):
        """Get user's primary role."""
        role = obj.get_primary_role()
        return {
            'id': role.id,
            'code': role.code,
            'name': role.name
        } if role else None


class UserCreateSerializer(serializers.ModelSerializer):
    """User creation serializer."""
    
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=True)
    roles = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'nip', 'department',
            'is_active', 'is_staff', 'roles'
        ]
    
    def validate(self, data):
        """Validate password match."""
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data
    
    def validate_username(self, value):
        """Validate username is unique."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def validate_email(self, value):
        """Validate email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def create(self, validated_data):
        """Create user with password."""
        roles = validated_data.pop('roles', [])
        password = validated_data.pop('password')
        
        user = User.objects.create_user(password=password, **validated_data)
        
        if roles:
            user.roles.set(roles)
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """User update serializer."""
    
    roles = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone', 'nip', 'department',
            'is_active', 'is_staff', 'preferred_language', 'theme_mode', 'roles'
        ]
    
    def validate_email(self, value):
        """Validate email is unique (except for current user)."""
        if User.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def update(self, instance, validated_data):
        """Update user and roles."""
        roles = validated_data.pop('roles', None)
        
        # Update basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update roles if provided
        if roles is not None:
            instance.roles.set(roles)
        
        return instance


class UserSetPasswordSerializer(serializers.Serializer):
    """Admin set password for user (without verification)."""
    
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    def validate(self, data):
        """Validate passwords match."""
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data


class AuditLogSerializer(serializers.ModelSerializer):
    """Audit log detail serializer."""
    
    user_name = serializers.CharField(source='user.username', read_only=True, allow_null=True)
    changes = serializers.JSONField(read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'action', 'content_type', 'content_id', 'content_display',
            'user', 'user_name', 'changes', 'ip_address', 'user_agent', 'timestamp'
        ]
        read_only_fields = fields


class AuditLogFilterSerializer(serializers.Serializer):
    """Serializer for audit log filtering."""
    
    action = serializers.ChoiceField(
        choices=['CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'APPROVE', 'REJECT', 'REVIEW', 'ARCHIVE'],
        required=False
    )
    resource_type = serializers.CharField(required=False)
    user_id = serializers.IntegerField(required=False)
    date_from = serializers.DateTimeField(required=False)
    date_to = serializers.DateTimeField(required=False)
    ip_address = serializers.CharField(required=False)


class SystemStatisticsSerializer(serializers.Serializer):
    """System-wide statistics serializer."""
    
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    total_articles = serializers.IntegerField()
    published_articles = serializers.IntegerField()
    draft_articles = serializers.IntegerField()
    in_review_articles = serializers.IntegerField()
    total_audit_logs = serializers.IntegerField()
    users_by_role = serializers.DictField()
    articles_by_status = serializers.DictField()
    audit_logs_by_action = serializers.DictField()
    recent_audit_logs = AuditLogSerializer(many=True)
