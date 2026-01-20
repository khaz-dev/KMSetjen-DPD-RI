"""Django admin configuration for content models."""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Article, Category, Tag, File, ArticleVersion


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin for Category model."""
    list_display = ('name_id', 'name_en', 'parent', 'icon', 'color', 'order_index', 'slug')
    list_filter = ('parent', 'icon', 'is_active')
    search_fields = ('name_id', 'name_en', 'slug')
    prepopulated_fields = {'slug': ('name_id',)}
    fieldsets = (
        (_('Names'), {'fields': ('name_id', 'name_en')}),
        (_('Description'), {'fields': ('description_id', 'description_en')}),
        (_('Hierarchy'), {'fields': ('parent',)}),
        (_('Display'), {'fields': ('icon', 'color', 'order_index', 'slug')}),
        (_('Status'), {'fields': ('is_active',)}),
    )


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """Admin for Tag model."""
    list_display = ('name_id', 'name_en', 'color', 'usage_count', 'slug')
    list_filter = ('color', 'is_active')
    search_fields = ('name_id', 'name_en', 'slug')
    prepopulated_fields = {'slug': ('name_id',)}
    readonly_fields = ('usage_count',)
    fieldsets = (
        (_('Names'), {'fields': ('name_id', 'name_en')}),
        (_('Description'), {'fields': ('description_id', 'description_en')}),
        (_('Display'), {'fields': ('color', 'slug', 'usage_count')}),
        (_('Status'), {'fields': ('is_active',)}),
    )


class FileInline(admin.TabularInline):
    """Inline editor for File model."""
    model = File
    extra = 1
    fields = ('original_filename', 'file', 'file_size', 'mime_type', 'order_index')
    readonly_fields = ('file_size', 'mime_type')


class ArticleVersionInline(admin.TabularInline):
    """Inline editor for ArticleVersion model."""
    model = ArticleVersion
    extra = 0
    fields = ('version_number', 'created_by', 'created_at')
    readonly_fields = ('version_number', 'created_by', 'created_at')
    can_delete = False


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    """Admin for Article model."""
    list_display = ('title_id', 'category', 'status', 'access_level', 'author', 'is_published', 'view_count', 'created_at')
    list_filter = ('status', 'access_level', 'is_published', 'is_bilingual', 'category', 'created_at')
    search_fields = ('title_id', 'title_en', 'content_id', 'content_en', 'slug')
    readonly_fields = ('uuid', 'slug', 'view_count', 'created_at', 'updated_at', 'published_at')
    filter_horizontal = ('tags', 'allowed_roles')
    inlines = [FileInline, ArticleVersionInline]
    
    fieldsets = (
        (_('Title & Content (Indonesian)'), {'fields': ('title_id', 'content_id', 'summary_id')}),
        (_('Title & Content (English)'), {'fields': ('title_en', 'content_en', 'summary_en')}),
        (_('Metadata'), {'fields': ('uuid', 'slug', 'category', 'tags', 'language', 'is_bilingual')}),
        (_('Status & Publishing'), {
            'fields': ('status', 'is_published', 'published_at', 'scheduled_at')
        }),
        (_('Access Control'), {
            'fields': ('access_level', 'allowed_roles'),
            'description': _('Configure who can view this article')
        }),
        (_('Author & Workflow'), {
            'fields': ('author', 'reviewer', 'publisher')
        }),
        (_('Statistics'), {
            'fields': ('view_count',),
            'classes': ('collapse',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make certain fields readonly based on status."""
        readonly = list(self.readonly_fields)
        if obj and obj.is_published:
            # Prevent editing published articles in certain ways
            readonly.extend(['title_id', 'title_en', 'content_id', 'content_en'])
        return readonly


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    """Admin for File model."""
    list_display = ('original_filename', 'article', 'file_size', 'mime_type', 'uploaded_by', 'created_at')
    list_filter = ('mime_type', 'article', 'created_at')
    search_fields = ('original_filename', 'article__title_id')
    readonly_fields = ('file_size', 'mime_type', 'created_at')
    fieldsets = (
        (_('File'), {'fields': ('file', 'original_filename', 'file_size', 'mime_type')}),
        (_('Description'), {'fields': ('description_id', 'description_en')}),
        (_('Article'), {'fields': ('article', 'order_index')}),
        (_('Metadata'), {'fields': ('uploaded_by', 'created_at')}),
    )
    
    def save_model(self, request, obj, form, change):
        """Set uploaded_by to current user if creating."""
        if not change:
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change)
