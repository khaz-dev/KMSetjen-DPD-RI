"""Views for public API endpoints."""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes, renderer_classes
from rest_framework.renderers import BaseRenderer
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404, HttpResponse, JsonResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.content.models import Article, Category, Tag, File
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
        Return only published articles based on user role and access level.
        
        With versioning:
        - Only show published version of articles (version_type='published')
        - Draft versions are never shown to public API
        
        Access level filtering:
        - Anonymous users: only 'public' articles
        - PUBLIC role users: only 'public' articles
        - Other auth users (READER/CONTRIBUTOR/EDITOR/ADMIN): 'public' + 'internal' + 'role_based' (if assigned)
        """
        user = self.request.user
        
        # Start with published version articles that are publicly available
        queryset = Article.objects.filter(
            version_type='published',  # Only published versions
            is_published=True,
            status='published'
        ).select_related('author', 'category').prefetch_related('tags', 'allowed_roles', 'files')
        
        # Filter by access level based on user role
        from apps.core.models import Role
        
        if user and user.is_authenticated:
            # Get user's primary role to distinguish PUBLIC role from other roles
            primary_role = user.get_primary_role()
            
            if primary_role and primary_role.code == Role.PUBLIC:
                # PUBLIC role users can only see 'public' articles (like anonymous)
                queryset = queryset.filter(access_level='public')
            else:
                # Other authenticated users (READER/CONTRIBUTOR/EDITOR/ADMIN) can see:
                # - public articles (always)
                # - internal articles (for all authenticated staff)
                # - role-based articles (if they have the specific role)
                queryset = queryset.filter(
                    Q(access_level='public') | 
                    Q(access_level='internal') | 
                    Q(access_level='role_based', allowed_roles__in=user.roles.all())
                )
        else:
            # Anonymous users only see public articles
            queryset = queryset.filter(access_level='public')
        
        return queryset.distinct()
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve, list serializer for list."""
        if self.action == 'retrieve':
            return ArticleDetailSerializer
        return ArticleListSerializer
    
    def filter_queryset(self, queryset):
        """Override filter_queryset to handle AND/OR logic for tags."""
        # Apply default filtering
        queryset = super().filter_queryset(queryset)
        
        # Handle tag filtering with AND/OR logic
        # Use getlist() to get all tag values (django-filter compatibility)
        tag_ids = self.request.query_params.getlist('tags')
        tags_logic = self.request.query_params.get('tags_logic', 'or')
        
        if tag_ids and tags_logic == 'and':
            # AND logic - articles must have ALL selected tags
            for tag_id in tag_ids:
                queryset = queryset.filter(tags__id=tag_id)
        
        return queryset
    
    def get_object(self):
        """
        Override to support lookup by SLUG or ID.
        - First tries numeric ID lookup
        - Falls back to slug lookup
        - Maintains proper permission filtering
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get the lookup value from URL parameter (pk)
        lookup_value = self.kwargs.get(self.lookup_field)
        
        if not lookup_value:
            raise ValueError("No lookup value provided")
        
        # Try to parse as integer (ID lookup)
        try:
            lookup_id = int(lookup_value)
            # First try to find by ID
            try:
                return queryset.get(id=lookup_id)
            except Article.DoesNotExist:
                pass
        except (ValueError, TypeError):
            pass
        
        # Try to find by slug
        try:
            return queryset.get(slug=lookup_value)
        except Article.DoesNotExist:
            # Not found by slug or ID
            pass
        
        # If we get here, article not found with this slug or ID
        # Let the default behavior handle the 404
        return get_object_or_404(queryset, pk=lookup_value)
    
    def retrieve(self, request, *args, **kwargs):
        """
        Get article detail and record view (if article is published).
        """
        response = super().retrieve(request, *args, **kwargs)
        
        article = self.get_object()
        
        # Only track views for published articles
        if article.status == Article.STATUS_PUBLISHED and article.is_published:
            try:
                # Record view with user and IP tracking
                user = request.user if request.user.is_authenticated else None
                ip_address = self._get_client_ip(request)
                user_agent = request.META.get('HTTP_USER_AGENT', '')
                
                # increment_view_count handles the uniqueness check
                # (prevents same user/IP from counting multiple times)
                view_counted = article.increment_view_count(user=user, ip_address=ip_address)
                
                if view_counted:
                    # Also log in audit trail if view was actually counted
                    try:
                        AuditService.log_action(
                            user=user,
                            action='view',
                            content_type='Article',
                            content_id=article.id,
                            content_display=article.title_en,
                            changes={},
                            ip_address=ip_address,
                            user_agent=user_agent
                        )
                    except Exception:
                        pass
            except Exception as e:
                # Don't fail the request if view count increment fails
                print(f"Warning: Could not increment view count: {str(e)}")
        
        return response
    
    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        """
        Record a view of the article (only for published articles).
        POST /api/v1/public/articles/{id}/view/
        
        Returns:
            - 200: View counted successfully OR article already viewed by this user/IP
            - 400: Article is not published (view count not incremented)
        """
        article = self.get_object()
        
        # CRITICAL: Only allow view counting for published articles
        if article.status != Article.STATUS_PUBLISHED or not article.is_published:
            return Response(
                {
                    'success': False,
                    'view_count': article.view_count,
                    'message': 'View counting only allowed for published articles'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Record view with user and IP tracking
            user = request.user if request.user.is_authenticated else None
            ip_address = self._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # increment_view_count handles the uniqueness check
            view_counted = article.increment_view_count(user=user, ip_address=ip_address)
            
            if view_counted:
                # Log the view in audit trail
                try:
                    AuditService.log_action(
                        user=user,
                        action='view',
                        content_type='Article',
                        content_id=article.id,
                        content_display=article.title_en,
                        changes={},
                        ip_address=ip_address,
                        user_agent=user_agent
                    )
                except Exception:
                    pass
                
                return Response({
                    'success': True,
                    'view_count': article.view_count,
                    'view_recorded': True,
                    'message': 'View recorded successfully'
                })
            else:
                # User/IP already viewed this article
                return Response({
                    'success': True,
                    'view_count': article.view_count,
                    'view_recorded': False,
                    'message': 'Article already viewed by this user/IP'
                })
        except Exception as e:
            return Response(
                {
                    'success': False,
                    'view_count': article.view_count,
                    'message': f'Error recording view: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """
        Toggle like on the article (only for published articles and authenticated users).
        POST /api/v1/public/articles/{id}/like/
        
        CRITICAL: Only authenticated users can like articles.
        
        Returns:
            - 200: Like toggled successfully
            - 400: Article is not published (like not allowed) or user not authenticated
            - 401: User not authenticated
        """
        article = self.get_object()
        
        # CRITICAL: Only allow likes on published articles
        if article.status != Article.STATUS_PUBLISHED or not article.is_published:
            return Response(
                {
                    'success': False,
                    'like_count': article.like_count,
                    'liked_by_user': False,
                    'message': 'Liking only allowed for published articles'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Only authenticated users can like
            user = request.user
            if not user or not user.is_authenticated:
                return Response(
                    {
                        'success': False,
                        'like_count': article.like_count,
                        'message': 'Authentication required to like articles'
                    },
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # toggle_like only with user (no IP-based tracking for public API)
            result = article.toggle_like(user=user, ip_address=None)
            
            if 'error' in result:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
            # Log the like/unlike action in audit trail
            try:
                action = 'like' if result['liked'] else 'unlike'
                AuditService.log_action(
                    user=user,
                    action=action,
                    content_type='Article',
                    content_id=article.id,
                    content_display=article.title_en,
                    changes={},
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
            except Exception:
                pass
            
            return Response({
                'success': True,
                'like_count': article.like_count,
                'liked': result['liked'],
                'liked_by_user': result['liked_by_user'],
                'message': 'Like' if result['liked'] else 'Unlike' + ' recorded successfully'
            })
        except Exception as e:
            return Response(
                {
                    'success': False,
                    'like_count': article.like_count,
                    'message': f'Error toggling like: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    
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


class PassthroughRenderer(BaseRenderer):
    """Renderer that allows any media type and returns binary/file data directly without modification."""
    media_type = '*/*'
    format = ''

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


@api_view(['GET', 'HEAD', 'OPTIONS'])
@permission_classes([AllowAny])
@renderer_classes([PassthroughRenderer])
def preview_file(request, file_id):
    """
    Serve file for inline browser preview.
    The URL has NO .pdf extension (e.g. /api/v1/public/files/31/preview/),
    preventing IDM (Internet Download Manager) and other browser extensions from intercepting it.
    """
    if request.method == 'OPTIONS':
        response = HttpResponse()
        origin = request.META.get('HTTP_ORIGIN')
        if origin:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
        else:
            response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS, HEAD'
        response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, Accept, X-Requested-With'
        return response

    import os
    import mimetypes

    file_obj = get_object_or_404(File.objects.select_related('article'), id=file_id)
    article = file_obj.article

    # Check article access: published public article or authenticated staff
    is_public_published = (
        article.version_type == 'published' and
        article.is_published and
        article.status == 'published' and
        article.access_level == 'public'
    )
    if not is_public_published:
        user = request.user
        if not (user and user.is_authenticated):
            raise Http404("File not found or access denied")
        if article.access_level == 'role_based':
            if not article.allowed_roles.filter(id__in=user.roles.all()).exists() and not (user.is_editor() or user.is_admin()):
                raise Http404("File not found or access denied")

    if not file_obj.file or not os.path.exists(file_obj.file.path):
        raise Http404("File not found on disk")

    is_raw = request.GET.get('raw') == '1' or 'application/octet-stream' in request.META.get('HTTP_ACCEPT', '')

    if is_raw:
        # Return base64-encoded document data as application/json.
        # This completely guarantees that IDM, browser download hooks, or file-type sniffers
        # will NEVER treat this as a download or intercept the preview stream.
        import base64
        with open(file_obj.file.path, 'rb') as f:
            encoded_data = base64.b64encode(f.read()).decode('ascii')

        response = JsonResponse({
            'success': True,
            'file_id': file_obj.id,
            'filename': file_obj.original_filename,
            'file_size': file_obj.file_size,
            'data': encoded_data,
        })
    else:
        mime_type = file_obj.mime_type or mimetypes.guess_type(file_obj.original_filename)[0] or 'application/octet-stream'
        response = FileResponse(open(file_obj.file.path, 'rb'), content_type=mime_type)
        response['Content-Disposition'] = f'inline; filename="{file_obj.original_filename}"'

    origin = request.META.get('HTTP_ORIGIN')
    if origin:
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Credentials'] = 'true'
    else:
        response['Access-Control-Allow-Origin'] = '*'

    response['X-Frame-Options'] = 'ALLOWALL'
    response['Access-Control-Allow-Methods'] = 'GET, OPTIONS, HEAD'
    response['Access-Control-Allow-Headers'] = 'Authorization, Content-Type, Accept, X-Requested-With'
    response['Access-Control-Expose-Headers'] = 'Content-Length, Content-Range, Accept-Ranges'
    return response

