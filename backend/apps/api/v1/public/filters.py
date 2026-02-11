"""Filters for public API endpoints."""
import django_filters
from django.db.models import Q
from apps.content.models import Article, Category, Tag


class ArticleFilter(django_filters.FilterSet):
    """Filter for Article list endpoint."""
    
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
    
    # Access level filter
    access_level = django_filters.ChoiceFilter(
        choices=[
            ('public', 'Public (tanpa login)'),
            ('internal', 'Internal (semua ASN)'),
            ('role_based', 'Role-based (specific roles)'),
        ],
        label='Access Level'
    )
    
    # Ordering
    ordering = django_filters.OrderingFilter(
        fields=(
            ('published_at', 'published_at'),
            ('-published_at', '-published_at'),
            ('view_count', 'view_count'),
            ('-view_count', '-view_count'),
            ('like_count', 'like_count'),
            ('-like_count', '-like_count'),
        ),
        label='Order by'
    )
    
    class Meta:
        model = Article
        fields = ['search', 'category', 'tags', 'published_after', 'published_before', 'language', 'access_level']
    
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


class CategoryFilter(django_filters.FilterSet):
    """Filter for Category list endpoint."""
    
    search = django_filters.CharFilter(
        method='filter_search',
        label='Search categories by name'
    )
    
    ordering = django_filters.OrderingFilter(
        fields=(
            ('order_index', 'order'),
            ('name_id', 'name'),
        )
    )
    
    class Meta:
        model = Category
        fields = ['search']
    
    def filter_search(self, queryset, name, value):
        """Search by category name."""
        if not value:
            return queryset
        
        return queryset.filter(
            Q(name_id__icontains=value) |
            Q(name_en__icontains=value)
        )


class TagFilter(django_filters.FilterSet):
    """Filter for Tag list endpoint."""
    
    search = django_filters.CharFilter(
        method='filter_search',
        label='Search tags by name'
    )
    
    # Popular tags (usage count threshold)
    popular = django_filters.BooleanFilter(
        method='filter_popular',
        label='Only popular tags (5+ uses)'
    )
    
    ordering = django_filters.OrderingFilter(
        fields=(
            ('-usage_count', 'popular'),
            ('name_id', 'name'),
        )
    )
    
    class Meta:
        model = Tag
        fields = ['search']
    
    def filter_search(self, queryset, name, value):
        """Search by tag name."""
        if not value:
            return queryset
        
        return queryset.filter(
            Q(name_id__icontains=value) |
            Q(name_en__icontains=value)
        )
    
    def filter_popular(self, queryset, name, value):
        """Filter popular tags."""
        if value:
            return queryset.filter(usage_count__gte=5)
        return queryset
