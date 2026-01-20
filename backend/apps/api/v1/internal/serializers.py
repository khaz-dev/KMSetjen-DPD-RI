"""Serializers for internal (authenticated) API endpoints."""
from rest_framework import serializers
from django.utils import timezone
from apps.content.models import Article, Category, Tag, File
from apps.audit.services import AuditService
from apps.core.models import Role


class InternalArticleCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating articles (authenticated users)."""
    tags = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        required=False,
        help_text="Tag IDs to add to article"
    )
    allowed_roles = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.filter(is_active=True),
        many=True,
        required=False,
        help_text="Role IDs for role-based access"
    )
    
    class Meta:
        model = Article
        fields = [
            'title_id', 'title_en', 'content_id', 'content_en',
            'summary_id', 'summary_en', 'category', 'tags',
            'status', 'access_level', 'allowed_roles',
            'is_bilingual', 'language', 'slug', 'image', 'image_url'
        ]
        extra_kwargs = {
            'title_id': {'required': True},
            'title_en': {'required': False},
            'content_id': {'required': True},
            'content_en': {'required': False},
            'summary_id': {'required': False},
            'summary_en': {'required': False},
            'category': {'required': True},
            'status': {'default': 'draft'},
            'access_level': {'default': 'public'},
            'is_bilingual': {'default': False},
            'language': {'default': 'id'},
            'slug': {'required': False},
            'image': {'required': False},
            'image_url': {'required': False},
        }
    
    def validate(self, data):
        """
        Validate bilingual requirements based on is_bilingual flag and status.
        - Draft articles can be single-language
        - Published articles must be bilingual
        """
        status = data.get('status', 'draft')
        is_bilingual = data.get('is_bilingual', False)
        
        # For published articles, enforce bilingual
        if status != 'draft':
            if not data.get('title_id') or not data.get('title_en'):
                raise serializers.ValidationError(
                    "Both Indonesian and English titles are required for published articles"
                )
            if not data.get('content_id') or not data.get('content_en'):
                raise serializers.ValidationError(
                    "Both Indonesian and English content are required for published articles"
                )
        # For draft articles with is_bilingual=True, enforce both languages
        elif is_bilingual:
            if not data.get('title_id') or not data.get('title_en'):
                raise serializers.ValidationError(
                    "Both Indonesian and English titles are required for bilingual articles"
                )
            if not data.get('content_id') or not data.get('content_en'):
                raise serializers.ValidationError(
                    "Both Indonesian and English content are required for bilingual articles"
                )
        # Draft articles can be single-language (is_bilingual=False)
        
        return data
    
    def create(self, validated_data):
        """Create article with current user as author."""
        tags = validated_data.pop('tags', [])
        allowed_roles = validated_data.pop('allowed_roles', [])
        
        # Set author to current user
        validated_data['author'] = self.context['request'].user
        
        article = Article.objects.create(**validated_data)
        
        # Add tags
        if tags:
            article.tags.set(tags)
        
        # Add allowed roles
        if allowed_roles:
            article.allowed_roles.set(allowed_roles)
        
        # Log creation
        try:
            AuditService.log_action(
                user=self.context['request'].user,
                action='CREATE',
                content_type='Article',
                content_id=article.id,
                content_display=article.title_en,
                changes={
                    'title_en': article.title_en,
                    'status': article.status,
                    'access_level': article.access_level,
                },
                ip_address=self._get_client_ip(),
                user_agent=self.context['request'].META.get('HTTP_USER_AGENT', '')
            )
        except Exception:
            pass
        
        return article
    
    def _get_client_ip(self):
        """Get client IP address."""
        request = self.context['request']
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class InternalArticleUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating articles (authenticated users)."""
    tags = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        required=False,
        help_text="Tag IDs (replaces existing)"
    )
    allowed_roles = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.filter(is_active=True),
        many=True,
        required=False,
        help_text="Role IDs for role-based access (replaces existing)"
    )
    
    class Meta:
        model = Article
        fields = [
            'title_id', 'title_en', 'content_id', 'content_en',
            'summary_id', 'summary_en', 'category', 'tags',
            'status', 'access_level', 'allowed_roles',
            'is_bilingual', 'language', 'slug', 'image', 'image_url'
        ]
        extra_kwargs = {
            'title_id': {'required': False},
            'title_en': {'required': False},
            'content_id': {'required': False},
            'content_en': {'required': False},
            'slug': {'required': False},
            'image': {'required': False},
            'image_url': {'required': False},
        }
    
    def validate_slug(self, value):
        """Validate slug can only be changed for draft articles."""
        if self.instance and self.instance.pk:
            # This is an update operation (article already exists)
            current_slug = self.instance.slug
            
            # If slug is being changed
            if value != current_slug:
                # Only allow slug changes for draft articles
                if self.instance.status != 'DRAFT':
                    raise serializers.ValidationError(
                        "Slug cannot be modified after publication. "
                        "Slug is locked for all articles except drafts to preserve URL stability."
                    )
        
        return value
    
    def validate_status(self, value):
        """Validate status transitions."""
        current_status = self.instance.status
        
        # Only editors can publish
        if value == 'PUBLISHED' and not self.context['request'].user.is_editor():
            raise serializers.ValidationError(
                "Only editors can publish articles"
            )
        
        # Can't go back to draft if published
        if current_status == 'PUBLISHED' and value == 'DRAFT':
            raise serializers.ValidationError(
                "Cannot move published article back to draft"
            )
        
        return value
    
    def validate(self, data):
        """
        Validate bilingual requirements for update.
        - Published articles must be bilingual
        """
        status = data.get('status', self.instance.status)
        is_bilingual = data.get('is_bilingual', self.instance.is_bilingual)
        
        # For published articles, enforce bilingual (check if moving to published)
        if status == 'published':
            # Use new values if provided, otherwise use existing
            title_id = data.get('title_id', self.instance.title_id)
            title_en = data.get('title_en', self.instance.title_en)
            content_id = data.get('content_id', self.instance.content_id)
            content_en = data.get('content_en', self.instance.content_en)
            
            if not title_id or not title_en:
                raise serializers.ValidationError(
                    "Both Indonesian and English titles are required for published articles"
                )
            if not content_id or not content_en:
                raise serializers.ValidationError(
                    "Both Indonesian and English content are required for published articles"
                )
        # For bilingual articles, enforce both languages
        elif is_bilingual:
            title_id = data.get('title_id', self.instance.title_id)
            title_en = data.get('title_en', self.instance.title_en)
            content_id = data.get('content_id', self.instance.content_id)
            content_en = data.get('content_en', self.instance.content_en)
            
            if not title_id or not title_en:
                raise serializers.ValidationError(
                    "Both Indonesian and English titles are required for bilingual articles"
                )
            if not content_id or not content_en:
                raise serializers.ValidationError(
                    "Both Indonesian and English content are required for bilingual articles"
                )
        
        return data
    
    def update(self, instance, validated_data):
        """Update article and track changes."""
        tags = validated_data.pop('tags', None)
        allowed_roles = validated_data.pop('allowed_roles', None)
        
        # Track changes for audit log
        changes = {}
        for field, value in validated_data.items():
            if getattr(instance, field) != value:
                changes[field] = [getattr(instance, field), value]
        
        # Update fields
        for field, value in validated_data.items():
            setattr(instance, field, value)
        
        instance.updated_at = timezone.now()
        instance.save()
        
        # Update tags
        if tags is not None:
            instance.tags.set(tags)
            changes['tags'] = 'updated'
        
        # Update allowed roles
        if allowed_roles is not None:
            instance.allowed_roles.set(allowed_roles)
            changes['allowed_roles'] = 'updated'
        
        # Log update
        try:
            AuditService.log_action(
                user=self.context['request'].user,
                action='UPDATE',
                content_type='Article',
                content_id=instance.id,
                content_display=instance.title_en,
                changes=changes,
                ip_address=self._get_client_ip(),
                user_agent=self.context['request'].META.get('HTTP_USER_AGENT', '')
            )
        except Exception:
            pass
        
        return instance
    
    def _get_client_ip(self):
        """Get client IP address."""
        request = self.context['request']
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class InternalArticleDetailSerializer(serializers.ModelSerializer):
    """Serializer for article detail in internal API (with edit status)."""
    from apps.api.v1.public.serializers import FileSerializer, CategoryDetailSerializer
    
    category = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()
    files = FileSerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField()
    author_name = serializers.SerializerMethodField()
    author_email = serializers.CharField(source='author.email', read_only=True)
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    can_publish = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = [
            'id', 'uuid', 'title_id', 'title_en', 'content_id', 'content_en',
            'summary_id', 'summary_en', 'slug', 'category',
            'tags', 'files', 'image', 'image_url', 'status', 'access_level', 'is_bilingual', 'language',
            'author_name', 'author_email', 'view_count', 'like_count',
            'published_at', 'scheduled_at', 'created_at', 'updated_at',
            'can_edit', 'can_delete', 'can_publish'
        ]
        read_only_fields = [
            'id', 'uuid', 'slug', 'view_count', 'like_count', 'created_at', 'updated_at',
            'category', 'tags', 'files', 'image_url', 'author_name', 'author_email'
        ]
    
    def get_category(self, obj):
        """Get category for article with bilingual names."""
        if obj.category:
            from apps.api.v1.public.serializers import CategoryDetailSerializer
            return CategoryDetailSerializer(obj.category).data
        return None
    
    def get_tags(self, obj):
        """Get tags for article."""
        from apps.api.v1.public.serializers import TagSerializer
        return TagSerializer(obj.tags.all(), many=True).data
    
    def get_image(self, obj):
        """Get image URL for article."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f'/media/{obj.image.name}'
        return None
    
    def get_author_name(self, obj):
        """Get full name of author."""
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username
    
    def get_can_edit(self, obj):
        """Check if user can edit article."""
        user = self.context['request'].user
        return obj.author == user or user.is_editor()
    
    def get_can_delete(self, obj):
        """Check if user can delete article."""
        user = self.context['request'].user
        return obj.author == user or user.is_admin()
    
    def get_can_publish(self, obj):
        """Check if user can publish article."""
        user = self.context['request'].user
        return user.is_editor() or user.is_admin()


class SubmitReviewSerializer(serializers.Serializer):
    """Serializer for submitting article for review."""
    comment = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True,
        help_text="Optional comment for reviewer"
    )
    
    def update(self, instance, validated_data):
        """Update article status to REVIEW."""
        instance.status = 'REVIEW'
        instance.save()
        
        # Log status change
        try:
            AuditService.log_action(
                user=self.context['request'].user,
                action='REVIEW',
                content_type='Article',
                content_id=instance.id,
                content_display=instance.title_en,
                changes={
                    'status': ['DRAFT', 'REVIEW'],
                    'comment': validated_data.get('comment', '')
                },
                ip_address=self._get_client_ip(),
                user_agent=self.context['request'].META.get('HTTP_USER_AGENT', '')
            )
        except Exception:
            pass
        
        return instance
    
    def _get_client_ip(self):
        """Get client IP address."""
        request = self.context['request']
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class DashboardArticleSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dashboard listing."""
    category_name = serializers.CharField(source='category.name_en', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Article
        fields = [
            'id', 'title_id', 'title_en', 'image', 'category_name', 'status', 'status_display',
            'view_count', 'like_count', 'is_published', 'created_at', 'updated_at'
        ]
        read_only_fields = fields


# ============================================================================
# FILE SERIALIZERS
# ============================================================================

class FileSerializer(serializers.ModelSerializer):
    """
    Serializer for File model.
    Handles file uploads and metadata management.
    """
    file_size_display = serializers.SerializerMethodField()
    
    class Meta:
        model = File
        fields = [
            'id', 'article', 'file', 'original_filename', 'file_size',
            'file_size_display', 'mime_type', 'description_en', 'description_id',
            'uploaded_by', 'order_index', 'created_at'
        ]
        read_only_fields = ['id', 'article', 'file_size', 'mime_type', 'uploaded_by', 'created_at']
    
    def get_file_size_display(self, obj):
        """Format file size to human-readable format."""
        size = obj.file_size
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.2f} KB"
        elif size < 1024 * 1024 * 1024:
            return f"{size / (1024 * 1024):.2f} MB"
        else:
            return f"{size / (1024 * 1024 * 1024):.2f} GB"
    
    def create(self, validated_data):
        """
        Create file instance.
        Set file_size and mime_type from uploaded file.
        Auto-extract original_filename from file if not provided.
        """
        file_obj = validated_data.get('file')
        if file_obj:
            validated_data['file_size'] = file_obj.size
            validated_data['mime_type'] = file_obj.content_type or 'application/octet-stream'
            # Auto-extract original filename if not provided
            if not validated_data.get('original_filename'):
                validated_data['original_filename'] = file_obj.name
        
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)
