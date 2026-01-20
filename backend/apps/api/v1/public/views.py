"""Views for public API endpoints."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.content.models import Article, Category, Tag
from apps.audit.services import AuditService
from shared.permissions.base import IsPublic
from .serializers import (
    ArticleListSerializer, ArticleDetailSerializer,
    CategoryListSerializer, CategoryDetailSerializer,
    TagSerializer, SearchResultSerializer
)
from .filters import ArticleFilter, CategoryFilter, TagFilter


class PublicAPIPagination(PageNumberPagination):
    """Pagination for public API endpoints."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class ArticleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API for articles.
    
    - GET /api/v1/public/articles/ - List published articles
    - GET /api/v1/public/articles/{id}/ - Article detail
    - GET /api/v1/public/articles/search/ - Search articles
    - GET /api/v1/public/articles/trending/ - Trending articles (most viewed last 30 days)
    - GET /api/v1/public/articles/latest/ - Latest articles
    - GET /api/v1/public/articles/popular/ - Popular articles (most viewed)
    - POST /api/v1/public/articles/{id}/view/ - Record view (increment counter)
    """
    permission_classes = [AllowAny]
    pagination_class = PublicAPIPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ArticleFilter
    search_fields = ['title_id', 'title_en', 'content_id', 'content_en']
    ordering = ['-published_at']
    
    def get_queryset(self):
        """
        Return only published public articles or those accessible to the user.
        """
        user = self.request.user
        
        # Start with published articles
        queryset = Article.objects.filter(
            is_published=True,
            status='published'
        ).select_related('author', 'category').prefetch_related('tags', 'allowed_roles')
        
        # Filter by access level
        public_articles = queryset.filter(access_level='public')
        
        # If user is authenticated, include internal articles
        if user and user.is_authenticated:
            internal_articles = queryset.filter(access_level='internal')
            role_based = queryset.filter(access_level='role_based')
            
            # Check role-based access
            if user.roles.exists():
                role_based = role_based.filter(allowed_roles__in=user.roles.all())
            else:
                role_based = Article.objects.none()
            
            queryset = public_articles | internal_articles | role_based
        else:
            # Anonymous users only see public articles
            queryset = public_articles
        
        return queryset.distinct()
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve, list serializer for list."""
        if self.action == 'retrieve':
            return ArticleDetailSerializer
        return ArticleListSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """
        Get article detail and record view.
        """
        response = super().retrieve(request, *args, **kwargs)
        
        # Increment view count with error handling for database locks
        article = self.get_object()
        try:
            article.increment_view_count()
        except Exception as e:
            # Don't fail the request if view count increment fails
            # Database will retry on next request
            print(f"Warning: Could not increment view count: {str(e)}")
        
        # Log view in audit trail
        try:
            AuditService.log_action(
                user=request.user if request.user.is_authenticated else None,
                action='VIEW',
                content_type='Article',
                content_id=article.id,
                content_display=article.title_en,
                changes={'view_count': article.view_count},
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        except Exception:
            # Don't fail the request if audit logging fails
            pass
        
        return response
    
    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        """
        Record a view of the article.
        POST /api/v1/public/articles/{id}/view/
        """
        article = self.get_object()
        article.increment_view_count()
        
        return Response({
            'success': True,
            'view_count': article.view_count,
            'message': 'View recorded'
        })
    
    @action(detail=False, methods=['get'])
    def trending(self, request):
        """
        Get trending articles (most viewed last 30 days).
        GET /api/v1/public/articles/trending/
        """
        from django.utils import timezone
        from datetime import timedelta
        
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        trending = self.get_queryset().filter(
            published_at__gte=thirty_days_ago
        ).order_by('-view_count')[:10]
        
        page = self.paginate_queryset(trending)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(trending, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        Get latest articles.
        GET /api/v1/public/articles/latest/
        """
        latest = self.get_queryset().order_by('-published_at')[:10]
        
        page = self.paginate_queryset(latest)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(latest, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """
        Get popular articles (most viewed).
        GET /api/v1/public/articles/popular/
        """
        popular = self.get_queryset().order_by('-view_count')[:10]
        
        page = self.paginate_queryset(popular)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(popular, many=True)
        return Response(serializer.data)
    
    def _get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API for categories.
    
    - GET /api/v1/public/categories/ - List categories
    - GET /api/v1/public/categories/{id}/ - Category detail with child categories
    """
    queryset = Category.objects.filter(is_active=True).order_by('order_index')
    permission_classes = [AllowAny]
    pagination_class = PublicAPIPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_class = CategoryFilter
    search_fields = ['name_id', 'name_en']
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve, list serializer for list."""
        if self.action == 'retrieve':
            return CategoryDetailSerializer
        return CategoryListSerializer


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API for tags.
    
    - GET /api/v1/public/tags/ - List tags
    - GET /api/v1/public/tags/{id}/ - Tag detail with articles
    """
    queryset = Tag.objects.filter(is_active=True).order_by('-usage_count')
    serializer_class = TagSerializer
    permission_classes = [AllowAny]
    pagination_class = PublicAPIPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = TagFilter
    search_fields = ['name_id', 'name_en']
    ordering_fields = ['usage_count', 'name_id']
    
    @action(detail=True, methods=['get'])
    def articles(self, request, pk=None):
        """
        Get articles with this tag.
        GET /api/v1/public/tags/{id}/articles/
        """
        tag = self.get_object()
        articles = Article.objects.filter(
            tags=tag,
            is_published=True,
            status='PUBLISHED'
        ).select_related('author', 'category').prefetch_related('tags')
        
        page = self.paginate_queryset(articles)
        if page is not None:
            serializer = ArticleListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ArticleListSerializer(articles, many=True)
        return Response(serializer.data)
