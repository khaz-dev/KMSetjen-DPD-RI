"""Base serializer classes for DRF."""
from rest_framework import serializers


class BaseSerializer(serializers.ModelSerializer):
    """Base serializer with common functionality."""
    
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        fields = ['id', 'created_at', 'updated_at']


class BilingualSerializerMixin:
    """Mixin for bilingual content serialization."""
    
    def to_representation(self, instance):
        """Include both Indonesian and English versions."""
        ret = super().to_representation(instance)
        # Bilingual fields will be automatically included via model fields
        return ret


class UserSerializer(BaseSerializer):
    """Serializer for User model."""
    primary_role = serializers.SerializerMethodField()
    
    class Meta:
        model = None  # Set by subclass
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'nip', 
                  'department', 'phone', 'preferred_language', 'theme_mode', 
                  'primary_role', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_primary_role(self, obj):
        """Get primary role."""
        role = obj.get_primary_role()
        return role.code if role else None


class PaginatedResponseSerializer(serializers.Serializer):
    """Standard paginated response format."""
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    results = serializers.ListField()
