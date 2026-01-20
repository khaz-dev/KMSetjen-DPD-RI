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
        """Count published PUBLIC articles in category."""
        # Only count articles visible to anonymous users (public access level)
        return obj.articles.filter(
            is_published=True,
            status='published',
            access_level='public'
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
    
    class Meta:
        model = Article
        fields = ['id', 'uuid', 'title_id', 'title_en', 'summary_id', 'summary_en', 'image',
                  'slug', 'category', 'tags', 'author_name', 'is_bilingual',
                  'view_count', 'like_count', 'published_at', 'created_at']
        read_only_fields = ['id', 'uuid', 'view_count', 'like_count', 'published_at', 'created_at']
    
    def get_author_name(self, obj):
        """Get full name of author."""
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username
    
    def get_image(self, obj):
        """Get image URL for article."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f'/media/{obj.image.name}'
        return None


class ArticleDetailSerializer(serializers.ModelSerializer):
    """Serializer for article detail view."""
    category = CategoryDetailSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    files = FileSerializer(many=True, read_only=True, source='file_set')
    author_name = serializers.SerializerMethodField()
    author_email = serializers.SerializerMethodField()
    allowed_roles_display = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = ['id', 'uuid', 'title_id', 'title_en', 'content_id', 'content_en',
                  'summary_id', 'summary_en', 'image', 'slug', 'category', 'tags', 'files',
                  'status', 'access_level', 'allowed_roles_display', 'author_name',
                  'author_email', 'is_bilingual', 'language', 'view_count', 'like_count',
                  'published_at', 'scheduled_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'uuid', 'view_count', 'like_count', 'published_at', 'created_at', 'updated_at']
    
    def get_author_name(self, obj):
        """Get full name of author."""
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username
    
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
        """Get image URL for article."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f'/media/{obj.image.name}'
        return None


class CategoryListSerializer(serializers.ModelSerializer):
    """Serializer for category list view."""
    article_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name_id', 'name_en', 'slug', 'icon', 'color', 'image',
                  'order_index', 'article_count']
    
    def get_article_count(self, obj):
        """Count published PUBLIC articles in category."""
        # Only count articles visible to anonymous users (public access level)
        return obj.articles.filter(
            is_published=True,
            status='published',
            access_level='public'
        ).count()


class SearchResultSerializer(serializers.Serializer):
    """Serializer for search results combining articles, categories, and tags."""
    articles = ArticleListSerializer(many=True, read_only=True)
    categories = CategoryListSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    total_results = serializers.IntegerField(read_only=True)
