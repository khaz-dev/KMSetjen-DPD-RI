"""Views for internal (authenticated) API endpoints."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.content.models import Article, Category, Tag, File
from apps.audit.services import AuditService
from shared.permissions.base import IsAuthorOrEditor, IsEditor
from .serializers import (
    InternalArticleCreateSerializer, InternalArticleUpdateSerializer,
    InternalArticleDetailSerializer, SubmitReviewSerializer,
    DashboardArticleSerializer, FileSerializer
)
from .filters import InternalArticleFilter



class InternalAPIPagination(PageNumberPagination):
    """Pagination for internal API endpoints."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class ArticleViewSet(viewsets.ModelViewSet):
    """
    Internal API for article management (authenticated users).
    
    - GET /api/v1/internal/articles/ - List user's articles
    - POST /api/v1/internal/articles/ - Create article
    - GET /api/v1/internal/articles/{id}/ - Article detail
    - PUT /api/v1/internal/articles/{id}/ - Full update
    - PATCH /api/v1/internal/articles/{id}/ - Partial update
    - DELETE /api/v1/internal/articles/{id}/ - Delete article
    - POST /api/v1/internal/articles/{id}/submit-review/ - Submit for review
    - POST /api/v1/internal/articles/{id}/publish/ - Publish (editor only)
    - POST /api/v1/internal/articles/{id}/archive/ - Archive article
    """
    permission_classes = [IsAuthenticated]
    pagination_class = InternalAPIPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = InternalArticleFilter
    search_fields = ['title_id', 'title_en', 'content_id', 'content_en']
    ordering_fields = ['created_at', 'updated_at', 'published_at', 'view_count']
    ordering = ['-updated_at']
    
    def get_queryset(self):
        """
        Return articles for the authenticated user.
        - Authors see their own articles (all statuses)
        - Editors see all articles
        """
        user = self.request.user
        
        if user.is_editor() or user.is_admin():
            # Editors see all articles
            return Article.objects.all().select_related(
                'author', 'category'
            ).prefetch_related('tags', 'allowed_roles')
        else:
            # Authors see only their articles
            return Article.objects.filter(
                author=user
            ).select_related('author', 'category').prefetch_related('tags', 'allowed_roles')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return InternalArticleCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return InternalArticleUpdateSerializer
        elif self.action == 'retrieve':
            return InternalArticleDetailSerializer
        elif self.action == 'submit_review':
            return SubmitReviewSerializer
        elif self.action == 'list':
            # Use lightweight serializer for list to avoid heavy nested queries
            from .serializers import DashboardArticleSerializer
            return DashboardArticleSerializer
        else:
            return InternalArticleDetailSerializer
    
    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create']:
            # Contributors and above can create
            permission_classes = [IsAuthenticated]
        elif self.action in ['update', 'partial_update']:
            # Author or editor can edit
            permission_classes = [IsAuthenticated, IsAuthorOrEditor]
        elif self.action == 'destroy':
            # Author or admin can delete
            permission_classes = [IsAuthenticated, IsAuthorOrEditor]
        elif self.action in ['publish', 'reject', 'approve']:
            # Only editors can publish/approve/reject
            permission_classes = [IsAuthenticated, IsEditor]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
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
    
    def create(self, request, *args, **kwargs):
        """Create new article."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return detail view of created article
        headers = self.get_success_headers(serializer.data)
        article = serializer.instance
        detail_serializer = InternalArticleDetailSerializer(
            article,
            context=self.get_serializer_context()
        )
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        """Create article and set the author to current user."""
        serializer.save(author=self.request.user)
    
    def update(self, request, *args, **kwargs):
        """Update article (full or partial)."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete article."""
        instance = self.get_object()
        
        # Log deletion
        try:
            AuditService.log_action(
                user=request.user,
                action='delete',
                content_type='Article',
                content_id=instance.id,
                content_display=instance.title_en,
                changes={'status': [instance.status, 'DELETED']},
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        except Exception:
            pass
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'], url_path='submit-review', url_name='submit-review')
    def submit_review(self, request, pk=None):
        """
        Submit article for review.
        POST /api/v1/internal/articles/{id}/submit-review/
        """
        article = self.get_object()
        
        # Check permission (author or editor)
        if article.author != request.user and not request.user.is_editor():
            return Response(
                {'error': 'You do not have permission to submit this article for review'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SubmitReviewSerializer(
            article,
            data=request.data,
            context=self.get_serializer_context()
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'success': True,
            'status': article.status,
            'message': 'Article submitted for review'
        })
    
    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        """
        Record a view of the article (only for published articles).
        POST /api/v1/internal/articles/{id}/view/
        
        Note: Internal API allows viewing unpublished articles (for editors),
        but view count is only incremented for published articles.
        
        Returns:
            - 200: View counted successfully OR article already viewed by this user
            - 400: Article is not published (view count not incremented)
        """
        article = self.get_object()
        
        # CRITICAL: Only count views for published articles
        if article.status != 'published' or not article.is_published:
            return Response({
                'success': False,
                'view_count': article.view_count,
                'message': 'View counting only allowed for published articles'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Record view with user and IP tracking
            user = request.user if request.user.is_authenticated else None
            ip_address = self._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # increment_view_count handles the uniqueness check
            # (prevents same user/IP from counting multiple times)
            view_counted = article.increment_view_count(user=user, ip_address=ip_address)
            
            if view_counted:
                # Log the view in audit trail
                try:
                    from apps.audit.services import AuditService
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
                # User already viewed this article
                return Response({
                    'success': True,
                    'view_count': article.view_count,
                    'view_recorded': False,
                    'message': 'Article already viewed by this user'
                })
        except Exception as e:
            return Response({
                'success': False,
                'view_count': article.view_count,
                'message': f'Error recording view: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """
        Toggle like on the article (only for published articles).
        POST /api/v1/internal/articles/{id}/like/
        
        Note: Internal API allows viewing unpublished articles (for editors),
        but likes are only allowed on published articles.
        
        Returns:
            - 200: Like toggled successfully
            - 400: Article is not published (like not allowed)
        """
        article = self.get_object()
        
        # CRITICAL: Only allow likes on published articles
        if article.status != 'published' or not article.is_published:
            return Response({
                'success': False,
                'like_count': article.like_count,
                'liked_by_user': False,
                'message': 'Liking only allowed for published articles'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Toggle like with user and IP tracking
            user = request.user if request.user.is_authenticated else None
            ip_address = self._get_client_ip(request)
            
            # toggle_like handles the like/unlike logic
            result = article.toggle_like(user=user, ip_address=ip_address)
            
            if 'error' in result:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
            # Log the like/unlike action in audit trail
            try:
                from apps.audit.services import AuditService
                action = 'like' if result['liked'] else 'unlike'
                AuditService.log_action(
                    user=user,
                    action=action,
                    content_type='Article',
                    content_id=article.id,
                    content_display=article.title_en,
                    changes={},
                    ip_address=ip_address,
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
            except Exception:
                pass
            
            return Response({
                'success': True,
                'like_count': article.like_count,
                'liked': result['liked'],
                'liked_by_user': result['liked_by_user'],
                'message': ('Like' if result['liked'] else 'Unlike') + ' recorded successfully'
            })
        except Exception as e:
            return Response({
                'success': False,
                'like_count': article.like_count,
                'message': f'Error toggling like: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsEditor])
    def publish(self, request, pk=None):
        """
        Publish article (editor only).
        POST /api/v1/internal/articles/{id}/publish/
        """
        article = self.get_object()
        
        if article.status not in ['approved', 'draft', 'review']:
            return Response(
                {'error': f'Cannot publish article with status {article.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        article.status = 'published'
        article.is_published = True
        article.published_at = timezone.now()
        article.publisher = request.user
        article.save()
        
        # Log publication
        try:
            AuditService.log_action(
                user=request.user,
                action='publish',
                content_type='Article',
                content_id=article.id,
                content_display=article.title_en,
                changes={'status': 'PUBLISHED', 'is_published': True},
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        except Exception:
            pass
        
        serializer = InternalArticleDetailSerializer(
            article,
            context=self.get_serializer_context()
        )
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsEditor])
    def approve(self, request, pk=None):
        """
        Approve article for publishing (editor only).
        POST /api/v1/internal/articles/{id}/approve/
        """
        article = self.get_object()
        comment = request.data.get('comment', '')
        
        if article.status != 'review':
            return Response(
                {'error': 'Only articles in review can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        article.status = 'approved'
        article.reviewer = request.user
        article.approval_comment = comment
        article.save()
        
        # Log approval
        try:
            AuditService.log_action(
                user=request.user,
                action='approve',
                content_type='Article',
                content_id=article.id,
                content_display=article.title_en,
                changes={'status': 'approved', 'comment': comment},
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        except Exception:
            pass
        
        serializer = InternalArticleDetailSerializer(
            article,
            context=self.get_serializer_context()
        )
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsEditor])
    def reject(self, request, pk=None):
        """
        Reject article (return to draft).
        POST /api/v1/internal/articles/{id}/reject/
        """
        article = self.get_object()
        reason = request.data.get('reason', '')
        
        if article.status != 'review':
            return Response(
                {'error': 'Only articles in review can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        article.status = 'rejected'
        article.rejection_reason = reason
        article.save()
        
        # Log rejection
        try:
            AuditService.log_action(
                user=request.user,
                action='reject',
                content_type='Article',
                content_id=article.id,
                content_display=article.title_en,
                changes={'status': 'rejected', 'reason': reason},
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        except Exception:
            pass
        
        serializer = InternalArticleDetailSerializer(
            article,
            context=self.get_serializer_context()
        )
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """
        Archive article (author or editor only).
        POST /api/v1/internal/articles/{id}/archive/
        """
        article = self.get_object()
        
        # Check permission
        if article.author != request.user and not request.user.is_editor():
            return Response(
                {'error': 'You do not have permission to archive this article'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        article.status = 'ARCHIVED'
        article.is_published = False
        article.save()
        
        # Log archival
        try:
            AuditService.log_action(
                user=request.user,
                action='unpublish',
                content_type='Article',
                content_id=article.id,
                content_display=article.title_en,
                changes={'status': 'ARCHIVED'},
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        except Exception:
            pass
        
        serializer = InternalArticleDetailSerializer(
            article,
            context=self.get_serializer_context()
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def check_slug(self, request):
        """
        Check if a slug is available (not used by any article).
        GET /api/v1/internal/articles/check-slug/?slug=my-article&exclude_id=123
        
        Parameters:
        - slug: The slug to check (required)
        - exclude_id: Article ID to exclude from check (optional, used when editing)
        
        Returns:
        - available: boolean (true if slug is available, false if already in use)
        - message: string (explains the result)
        """
        slug = request.query_params.get('slug', '').strip()
        exclude_id = request.query_params.get('exclude_id')
        
        if not slug:
            return Response(
                {
                    'available': False,
                    'message': 'Slug is required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if slug exists
        query = Article.objects.filter(slug=slug)
        
        # If editing, exclude the current article
        if exclude_id:
            query = query.exclude(id=exclude_id)
        
        slug_exists = query.exists()
        
        return Response({
            'available': not slug_exists,
            'slug': slug,
            'message': 'Slug is already in use' if slug_exists else 'Slug is available'
        })

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get user's dashboard data (statistics and recent articles).
        GET /api/v1/internal/articles/dashboard/
        """
        user = request.user
        
        # Get user's articles
        articles = Article.objects.filter(author=user)
        
        # Calculate statistics
        return Response({
            'total_articles': articles.count(),
            'draft_articles': articles.filter(status=Article.STATUS_DRAFT).count(),
            'review_articles': articles.filter(status=Article.STATUS_REVIEW).count(),
            'rejected_articles': articles.filter(status=Article.STATUS_REJECTED).count(),
            'approved_articles': articles.filter(status=Article.STATUS_APPROVED).count(),
            'published_articles': articles.filter(status=Article.STATUS_PUBLISHED).count(),
            'total_views': sum(article.view_count for article in articles),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'recent_articles': DashboardArticleSerializer(
                articles.order_by('-updated_at')[:10],
                many=True
            ).data,
        })
    
    def _get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


# ============================================================================
# FILE VIEWSET
# ============================================================================

class FileViewSet(viewsets.ModelViewSet):
    """
    API endpoints for article file management.
    
    Endpoints:
    - GET /api/v1/internal/articles/{article_id}/files/ - List files
    - POST /api/v1/internal/articles/{article_id}/files/ - Upload file
    - GET /api/v1/internal/articles/{article_id}/files/{id}/ - File detail
    - PATCH /api/v1/internal/articles/{article_id}/files/{id}/ - Update file
    - DELETE /api/v1/internal/articles/{article_id}/files/{id}/ - Delete file
    - POST /api/v1/internal/articles/{article_id}/files/reorder/ - Reorder files
    """
    serializer_class = None  # Will be set in get_serializer_class
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter files by article_id from URL."""
        article_id = self.kwargs.get('article_id')
        if article_id:
            return File.objects.filter(
                article_id=article_id
            ).select_related('article', 'uploaded_by').order_by('order_index')
        return File.objects.none()
    
    def get_serializer_class(self):
        """Return serializer class."""
        return FileSerializer
    
    def get_article(self):
        """Get article from URL parameter and check permissions."""
        article_id = self.kwargs.get('article_id')
        article = Article.objects.get(id=article_id)
        
        # Check if user is author or editor
        user = self.request.user
        if article.author != user and not (user.is_editor() or user.is_admin()):
            self.permission_denied(self.request)
        
        return article
    
    def perform_create(self, serializer):
        """Set article when creating file."""
        article = self.get_article()
        serializer.save(article=article)
    
    def perform_destroy(self, instance):
        """Delete file from storage before removing from DB."""
        # Delete file from storage
        if instance.file:
            instance.file.delete(save=False)
        instance.delete()
    
    @action(detail=False, methods=['post'])
    def reorder(self, request, article_id=None):
        """
        Reorder files for an article.
        
        Expected request body:
        {
            "file_ids": [3, 1, 2]
        }
        """
        article = self.get_article()
        file_ids = request.data.get('file_ids', [])
        
        if not isinstance(file_ids, list):
            return Response(
                {'error': 'file_ids must be a list'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update order_index for each file
        for index, file_id in enumerate(file_ids):
            try:
                file_obj = File.objects.get(id=file_id, article=article)
                file_obj.order_index = index
                file_obj.save()
            except File.DoesNotExist:
                return Response(
                    {'error': f'File {file_id} not found or does not belong to this article'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Return updated files
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

