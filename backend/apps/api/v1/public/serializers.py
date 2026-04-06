"""Serializers for public API endpoints."""
from rest_framework import serializers
from apps.core.models import Language
from apps.content.models import Article, Category, Tag, File


class CategorySimpleSerializer(serializers.ModelSerializer):
    """Simple category serializer for nested usage."""
    class Meta:
        model = Category
        fields = ['id', 'name_id', 'name_en', 'slug', 'icon', 'color', 'image']


class TagSerializer(serializers.ModelSerializer):
    """Serializer for Tag model."""
    class Meta:
        model = Tag
        fields = ['id', 'name_id', 'name_en', 'slug', 'color', 'usage_count']
        read_only_fields = ['id', 'usage_count']


class CategoryDetailSerializer(serializers.ModelSerializer):
    """Detailed category serializer with articles count."""
    article_count = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name_id', 'name_en', 'description_id', 'description_en',
                  'slug', 'icon', 'color', 'image', 'order_index', 'article_count', 'children']
    
    def get_article_count(self, obj):
        """Count published articles based on user access level.
        
        CRITICAL: Only count published version records (version_type='published')
        to avoid duplicates from the draft article that gets marked as published.
        """
        from apps.content.models import Article
        
        # Get request and user from context
        request = self.context.get('request')
        user = request.user if request else None

        # Check if user is authenticated
        if user and user.is_authenticated:
            # Authenticated users can see public + internal + role-based articles
            # CRITICAL: Filter by version_type='published' to only count published versions
            return obj.articles.filter(
                is_published=True,
                status='published',
                access_level__in=['public', 'internal', 'role_based'],
                version_type=Article.VERSION_PUBLISHED
            ).count()
        else:
            # Anonymous users only see public articles
            # CRITICAL: Filter by version_type='published' to only count published versions
            return obj.articles.filter(
                is_published=True,
                status='published',
                access_level='public',
                version_type=Article.VERSION_PUBLISHED
            ).count()
    
    def get_children(self, obj):
        """Get child categories."""
        children = obj.children.filter(is_active=True)
        return CategorySimpleSerializer(children, many=True).data


class FileSerializer(serializers.ModelSerializer):
    """Serializer for File attachments."""
    file_size_display = serializers.SerializerMethodField()
    
    class Meta:
        model = File
        fields = ['id', 'original_filename', 'file', 'file_size', 'file_size_display',
                  'mime_type', 'description_id', 'description_en', 'order_index', 'created_at']
        read_only_fields = ['id', 'file_size', 'created_at']
    
    def get_file_size_display(self, obj):
        """Format file size in human-readable format."""
        from shared.utils.formatters import format_file_size
        return format_file_size(obj.file_size) if obj.file_size else '0B'


class ArticleListSerializer(serializers.ModelSerializer):
    """Serializer for article list view."""
    category = CategorySimpleSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    author_name = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    liked_by_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = ['id', 'uuid', 'title_id', 'title_en', 'summary_id', 'summary_en', 'image',
                  'slug', 'category', 'tags', 'author_name', 'is_bilingual', 'status', 'is_published',
                  'view_count', 'like_count', 'liked_by_user', 'published_at', 'updated_at', 'created_at']
        read_only_fields = ['id', 'uuid', 'view_count', 'like_count', 'published_at', 'updated_at', 'created_at']
    
    def get_author_name(self, obj):
        """Get full name of author."""
        if obj.author:
            return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username
        return "Unknown Author"
    
    def get_image(self, obj):
        """Get image URL for article (uploaded image or external URL)."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f'/media/{obj.image.name}'
        # Fallback to image_url if uploaded image is not available
        if obj.image_url:
            return obj.image_url
        return None
    
    def get_liked_by_user(self, obj):
        """Check if current user has liked this article."""
        request = self.context.get('request')
        if not request:
            return False
        
        user = request.user
        if not user or not user.is_authenticated:
            return False
        
        # Check if user has liked this article
        from apps.content.models import UserLike
        return UserLike.objects.filter(article=obj, user=user).exists()


class ArticleDetailSerializer(serializers.ModelSerializer):
    """Serializer for article detail view."""
    category = CategoryDetailSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    files = FileSerializer(many=True, read_only=True)
    author_name = serializers.SerializerMethodField()
    author_email = serializers.SerializerMethodField()
    allowed_roles_display = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    liked_by_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = ['id', 'uuid', 'title_id', 'title_en', 'content_id', 'content_en',
                  'summary_id', 'summary_en', 'image', 'slug', 'category', 'tags', 'files',
                  'status', 'is_published', 'access_level', 'allowed_roles_display', 'author_name',
                  'author_email', 'is_bilingual', 'language', 'view_count', 'like_count',
                  'liked_by_user', 'published_at', 'scheduled_at', 'created_at', 'updated_at', 'rejection_reason', 'approval_comment']
        read_only_fields = ['id', 'uuid', 'view_count', 'like_count', 'published_at', 'created_at', 'updated_at']
    
    def get_author_name(self, obj):
        """Get full name of author."""
        if obj.author:
            return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username
        return "Unknown Author"
    
    def get_author_email(self, obj):
        """Get author email."""
        return obj.author.email if obj.author else None
    
    def get_allowed_roles_display(self, obj):
        """Display allowed roles for role-based access."""
        if obj.access_level == 'ROLE_BASED':
            return [{'id': role.id, 'code': role.code, 'name': role.name_en}
                    for role in obj.allowed_roles.all()]
        return []
    
    def get_image(self, obj):
        """Get image URL for article (uploaded image or external URL)."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f'/media/{obj.image.name}'
        # Fallback to image_url if uploaded image is not available
        if obj.image_url:
            return obj.image_url
        return None
    
    def get_liked_by_user(self, obj):
        """Check if current user has liked this article."""
        request = self.context.get('request')
        if not request:
            return False
        
        user = request.user
        if not user or not user.is_authenticated:
            return False
        
        # Check if user has liked this article
        from apps.content.models import UserLike
        return UserLike.objects.filter(article=obj, user=user).exists()


class CategoryListSerializer(serializers.ModelSerializer):
    """Serializer for category list view."""
    article_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name_id', 'name_en', 'slug', 'icon', 'color', 'image',
                  'order_index', 'article_count']
    
    def get_article_count(self, obj):
        """Count published articles based on user role and access level.
        
        CRITICAL: Only count published version records (version_type='published')
        to avoid duplicates from the draft article that gets marked as published.
        
        Account for role-based filtering:
        - Anonymous users: only 'public' articles
        - PUBLIC role users: only 'public' articles
        - Other auth users (READER/CONTRIBUTOR/EDITOR/ADMIN): 'public' + 'internal' + 'role_based'
        """
        from apps.core.models import Role
        from apps.content.models import Article
        
        request = self.context.get('request')
        user = request.user if request else None

        # Check if user is authenticated
        if user and user.is_authenticated:
            # Get user's primary role to distinguish PUBLIC role from other roles
            primary_role = user.get_primary_role()
            
            if primary_role and primary_role.code == Role.PUBLIC:
                # PUBLIC role users only see 'public' articles (like anonymous)
                # CRITICAL: Filter by version_type='published' to only count published versions
                return obj.articles.filter(
                    is_published=True,
                    status='published',
                    access_level='public',
                    version_type=Article.VERSION_PUBLISHED
                ).count()
            else:
                # Other authenticated users (READER/CONTRIBUTOR/EDITOR/ADMIN) can see:
                # - public articles (always)
                # - internal articles (for all authenticated staff)
                # - role-based articles (if they have the specific role)
                # CRITICAL: Filter by version_type='published' to only count published versions
                return obj.articles.filter(
                    is_published=True,
                    status='published',
                    access_level__in=['public', 'internal', 'role_based'],
                    version_type=Article.VERSION_PUBLISHED
                ).count()
        else:
            # Anonymous users only see public articles
            # CRITICAL: Filter by version_type='published' to only count published versions
            return obj.articles.filter(
                is_published=True,
                status='published',
                access_level='public',
                version_type=Article.VERSION_PUBLISHED
            ).count()


class SearchResultSerializer(serializers.Serializer):
    """Serializer for search results combining articles, categories, and tags."""
    articles = ArticleListSerializer(many=True, read_only=True)
    categories = CategoryListSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    total_results = serializers.IntegerField(read_only=True)
