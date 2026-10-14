"""Filters for public API endpoints."""
import django_filters
from django.db.models import Q
from apps.content.models import Article, Category, Tag
from apps.content.search import search_articles_queryset


class ArticleFilter(django_filters.FilterSet):
    """Filter for Article list endpoint."""
    
    # Full-text search
    search = django_filters.CharFilter(
        method='filter_search',
        label='Search articles by title, content, summary, creator, author, date, category, tags, or attachments'
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
        conjoined=False,  # OR condition (any tag match) - default
        label='Filter by tags'
    )
    
    # Tag filter logic mode (OR or AND)
    tags_logic = django_filters.ChoiceFilter(
        choices=[('or', 'OR - Any tag match'), ('and', 'AND - All tags match')],
        method='filter_tags_logic',
        label='Tag filter logic'
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

    # Bentuk Pengetahuan filter (Persekjen No. 8/2026 Bab II Pasal 7)
    knowledge_type = django_filters.CharFilter(
        field_name='knowledge_type',
        lookup_expr='iexact',
        label='Bentuk Pengetahuan'
    )

    # Klaster Bentuk Pengetahuan filter (Klaster a, b, c, d)
    knowledge_cluster = django_filters.ChoiceFilter(
        choices=[
            ('a', 'Klaster a: Buku, Peraturan, Kajian, Jurnal'),
            ('b', 'Klaster b: Ringkasan Kebijakan / Policy Brief'),
            ('c', 'Klaster c: Laporan Resmi, Buletin, Artikel Pengetahuan'),
            ('d', 'Klaster d: Infografis dan Produk Audiovisual'),
        ],
        method='filter_knowledge_cluster',
        label='Klaster Bentuk Pengetahuan (Pasal 7)'
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
            ('share_count', 'share_count'),
            ('-share_count', '-share_count'),
        ),
        label='Order by'
    )
    
    class Meta:
        model = Article
        fields = [
            'search', 'category', 'knowledge_type', 'knowledge_cluster',
            'tags', 'tags_logic', 'published_after', 'published_before',
            'language', 'access_level'
        ]
    
    def filter_search(self, queryset, name, value):
        """Full-text search across title, content, summary, creator, author, date, category, tags, and attachments."""
        return search_articles_queryset(queryset, value)
    
    def filter_knowledge_cluster(self, queryset, name, value):
        """Filter articles belonging to Pasal 7 cluster (a, b, c, or d)."""
        from apps.content.constants import KNOWLEDGE_CLUSTER_MAP
        cluster_info = KNOWLEDGE_CLUSTER_MAP.get(value)
        if cluster_info and 'types' in cluster_info:
            return queryset.filter(knowledge_type__in=cluster_info['types'])
        return queryset

    def filter_tags_logic(self, queryset, name, value):
        """
        This is a placeholder filter - actual tag filtering is handled by the
        tags field with dynamic conjoined value based on tags_logic parameter.
        """
        return queryset



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
