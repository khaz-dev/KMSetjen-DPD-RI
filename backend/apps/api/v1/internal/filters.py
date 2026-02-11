"""Filters for internal (authenticated) API endpoints."""
import django_filters
from django.db.models import Q
from apps.content.models import Article, Category, Tag


class InternalArticleFilter(django_filters.FilterSet):
    """Filter for internal Article list endpoint with moderation capabilities."""
    
    # Status filter for moderation (showing articles by workflow status)
    status = django_filters.ChoiceFilter(
        field_name='status',
        choices=[
            ('draft', 'Draft'),
            ('review', 'Dalam Review'),
            ('rejected', 'Ditolak'),
            ('approved', 'Disetujui'),
            ('published', 'Dipublikasikan'),
            ('scheduled', 'Terjadwal'),
            ('archived', 'Diarsipkan'),
        ],
        label='Filter by status'
    )
    
    # Full-text search
    search = django_filters.CharFilter(
        method='filter_search',
        label='Search articles by title, content, or summary'
    )
    
    # Category filter
    category = django_filters.ModelChoiceFilter(
        queryset=Category.objects.filter(is_active=True),
        field_name='category',
        label='Filter by category'
    )
    
    # Tag filter
    tags = django_filters.ModelMultipleChoiceFilter(
        queryset=Tag.objects.filter(is_active=True),
        field_name='tags',
        conjoined=False,  # OR condition (any tag match)
        label='Filter by tags'
    )
    
    # Published date range
    published_after = django_filters.DateTimeFilter(
        field_name='published_at',
        lookup_expr='gte',
        label='Published after'
    )
    
    published_before = django_filters.DateTimeFilter(
        field_name='published_at',
        lookup_expr='lte',
        label='Published before'
    )
    
    # Language filter
    language = django_filters.ChoiceFilter(
        choices=[('id', 'Indonesian'), ('en', 'English')],
        label='Language'
    )
    
    # Ordering
    ordering = django_filters.OrderingFilter(
        fields=(
            ('published_at', 'published_at'),
            ('-published_at', '-published_at'),
            ('updated_at', 'updated_at'),
            ('-updated_at', '-updated_at'),
            ('created_at', 'created_at'),
            ('-created_at', '-created_at'),
            ('view_count', 'view_count'),
            ('-view_count', '-view_count'),
        ),
        label='Order by'
    )
    
    class Meta:
        model = Article
        fields = ['status', 'search', 'category', 'tags', 'published_after', 'published_before', 'language']
    
    def filter_search(self, queryset, name, value):
        """Full-text search across title and content."""
        if not value:
            return queryset
        
        return queryset.filter(
            Q(title_id__icontains=value) |
            Q(title_en__icontains=value) |
            Q(content_id__icontains=value) |
            Q(content_en__icontains=value) |
            Q(summary_id__icontains=value) |
            Q(summary_en__icontains=value)
        )
