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
        
        For admin/editors: Show ONLY draft versions
        - Draft articles are the editable, working versions
        - Published versions are read-only snapshots managed by the publish endpoint
        - Admin/dashboard should show what's being worked on, not archived published versions
        - This prevents duplicate articles appearing in admin/dashboard lists
        
        For authors: Show ONLY their DRAFT articles
        - Authors can only edit their own drafts
        - Published versions are not shown (they're read-only snapshots)
        """
        user = self.request.user
        
        if user.is_editor() or user.is_admin():
            # Editors see ONLY draft articles (the editable versions)
            # Published versions (version_type='published') are read-only snapshots
            # and should not clutter the admin/dashboard lists
            return Article.objects.filter(
                version_type=Article.VERSION_DRAFT
            ).select_related('author', 'category').prefetch_related('tags', 'allowed_roles', 'files')
        else:
            # Authors see only their DRAFT articles
            return Article.objects.filter(
                author=user,
                version_type=Article.VERSION_DRAFT
            ).select_related('author', 'category').prefetch_related('tags', 'allowed_roles', 'files')
    
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
        Override to support lookup by SLUG or ID + version parameter.
        
        Version Parameter Handling:
        - ?version=draft → Returns draft version (for editing/preview)
        - No parameter → Returns published if exists, else draft (for viewing)
        - This ensures correct version display regardless of how article is accessed
        
        Lookup Modes:
        - First tries numeric ID lookup
        - Falls back to slug lookup
        - Applies version preference to both lookups
        """
        lookup_value = self.kwargs.get(self.lookup_field)
        
        if not lookup_value:
            raise ValueError("No lookup value provided")
        
        # Check for version parameter
        version_param = self.request.query_params.get('version', '').lower()
        prefer_published = version_param != 'draft'  # Default to published unless version=draft
        
        # Use select_related and prefetch_related for performance
        queryset = Article.objects.select_related('author', 'category').prefetch_related('tags', 'allowed_roles', 'files')
        
        # Try to parse as integer (ID lookup)
        try:
            lookup_id = int(lookup_value)
            # Look for article by ID with version preference
            if prefer_published:
                # Try published first, then draft
                try:
                    return queryset.get(id=lookup_id, version_type=Article.VERSION_PUBLISHED)
                except Article.DoesNotExist:
                    try:
                        return queryset.get(id=lookup_id, version_type=Article.VERSION_DRAFT)
                    except Article.DoesNotExist:
                        pass
            else:
                # Looking for draft specifically
                try:
                    return queryset.get(id=lookup_id, version_type=Article.VERSION_DRAFT)
                except Article.DoesNotExist:
                    pass
        except (ValueError, TypeError):
            pass
        
        # Try to find by slug with version preference
        if prefer_published:
            # Try published first, then draft
            try:
                return queryset.get(slug=lookup_value, version_type=Article.VERSION_PUBLISHED)
            except Article.DoesNotExist:
                try:
                    return queryset.get(slug=lookup_value, version_type=Article.VERSION_DRAFT)
                except Article.DoesNotExist:
                    pass
        else:
            # Looking for draft specifically
            try:
                return queryset.get(slug=lookup_value, version_type=Article.VERSION_DRAFT)
            except Article.DoesNotExist:
                pass
        
        # If we get here, article not found
        # Let the default behavior handle the 404
        return get_object_or_404(Article, pk=lookup_value)
    
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
        
        With versioning:
        - Creates a published version from draft (version_type='published', status='published')
        - Updates draft status to 'published' to reflect publication state
        - Draft remains editable for future updates
        - Public API shows published version (version_type='published', status='published')
        - Published article is accessible by slug and shows live content
        """
        article = self.get_object()
        
        # Can only publish from draft version
        if article.version_type != Article.VERSION_DRAFT:
            return Response(
                {'error': 'Can only publish from draft version'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if published version already exists
        existing_published = Article.objects.filter(
            draft_article=article,
            version_type=Article.VERSION_PUBLISHED
        ).first()
        
        if existing_published:
            # Update existing published version with latest draft content
            existing_published.title_id = article.title_id
            existing_published.title_en = article.title_en
            existing_published.content_id = article.content_id
            existing_published.content_en = article.content_en
            existing_published.summary_id = article.summary_id
            existing_published.summary_en = article.summary_en
            existing_published.category = article.category
            existing_published.tags.set(article.tags.all())
            existing_published.access_level = article.access_level
            existing_published.allowed_roles.set(article.allowed_roles.all())
            existing_published.image_url = article.image_url
            existing_published.is_bilingual = article.is_bilingual
            existing_published.language = article.language
            existing_published.reviewer = article.reviewer
            existing_published.status = 'published'
            existing_published.is_published = True
            existing_published.published_at = timezone.now()
            existing_published.publisher = request.user
            existing_published.save()
            
            # Copy featured image file from draft to published
            if article.image:
                self._copy_featured_image(article, existing_published)
            
            # Copy file attachments from draft to published (creates independent copies)
            self._copy_article_files(article, existing_published)
            
            published_article = existing_published
        else:
            # Create new published version from draft
            published_article = Article.objects.create(
                title_id=article.title_id,
                title_en=article.title_en,
                content_id=article.content_id,
                content_en=article.content_en,
                summary_id=article.summary_id,
                summary_en=article.summary_en,
                category=article.category,
                access_level=article.access_level,
                image_url=article.image_url,
                is_bilingual=article.is_bilingual,
                language=article.language,
                slug=article.slug,
                author=article.author,
                reviewer=article.reviewer,
                publisher=request.user,
                status='published',
                is_published=True,
                published_at=timezone.now(),
                version_type=Article.VERSION_PUBLISHED,
                draft_article=article,  # Link to draft
            )
            published_article.tags.set(article.tags.all())
            published_article.allowed_roles.set(article.allowed_roles.all())
            
            # Copy featured image file from draft to published
            if article.image:
                self._copy_featured_image(article, published_article)
            
            # Copy file attachments from draft to published (creates independent copies)
            self._copy_article_files(article, published_article)
        
        # CRITICAL: Update draft status to 'published' to reflect that it has been published
        # This ensures:
        # 1. Draft article reflects publication state
        # 2. Admin moderation page shows it in "Dipublikasikan" tab (filters by status='published')
        # 3. Users can see publication history
        article.status = 'published'
        article.is_published = True  # Mark draft as published (for reference)
        article.publisher = request.user
        article.published_at = timezone.now()
        article.save()
        
        # Log publication
        try:
            AuditService.log_action(
                user=request.user,
                action='publish',
                content_type='Article',
                content_id=article.id,
                content_display=article.title_en,
                changes={'status': 'published', 'is_published': True, 'version_created': published_article.id},
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
        except Exception:
            pass
        
        serializer = InternalArticleDetailSerializer(
            article,  # Return the draft (which now has status='published')
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
        Check if a slug is available (not used by any article in the same version).
        GET /api/v1/internal/articles/check-slug/?slug=my-article&exclude_id=123&version_type=draft
        
        Parameters:
        - slug: The slug to check (required)
        - exclude_id: Article ID to exclude from check (optional, used when editing)
        - version_type: 'draft' or 'published' (optional, defaults to 'draft')
        
        Returns:
        - available: boolean (true if slug is available, false if already in use)
        - message: string (explains the result)
        
        Note: With versioning system:
        - Draft articles can use same slug as published articles
        - Each version_type has its own slug namespace
        """
        slug = request.query_params.get('slug', '').strip()
        exclude_id = request.query_params.get('exclude_id')
        version_type = request.query_params.get('version_type', Article.VERSION_DRAFT)
        
        if not slug:
            return Response(
                {
                    'available': False,
                    'message': 'Slug is required'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if slug exists in the same version_type
        query = Article.objects.filter(slug=slug, version_type=version_type)
        
        # If editing, exclude the current article (convert exclude_id to int for proper comparison)
        exclude_id_int = None
        if exclude_id:
            try:
                exclude_id_int = int(exclude_id)
                query = query.exclude(id=exclude_id_int)
            except (ValueError, TypeError):
                # Invalid exclude_id, treat as no exclusion but log it
                pass
        
        slug_exists = query.exists()
        
        # Debug logging for slug issues
        if slug_exists:
            conflicting = query.first()
            pass  # Could add logging here
        
        return Response({
            'available': not slug_exists,
            'slug': slug,
            'version_type': version_type,
            'exclude_id': exclude_id_int,
            'message': 'Slug is already in use' if slug_exists else 'Slug is available'
        })

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get user's dashboard data (statistics and recent articles).
        GET /api/v1/internal/articles/dashboard/
        
        With versioning:
        - Only shows DRAFT articles (version_type='draft')
        - Published versions are not shown in dashboard
        - Authors see only their draft articles
        """
        user = request.user
        
        # Get user's DRAFT articles only
        articles = Article.objects.filter(
            author=user,
            version_type=Article.VERSION_DRAFT
        )
        
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
    
    def _copy_featured_image(self, draft_article, published_article):
        """
        Copy featured image file from draft to published version.
        Creates a separate copy of the file for the published version
        so they are independent (deleting draft image won't affect published).
        
        Uses the article_image_upload_to callable to generate proper paths.
        """
        if not draft_article.image:
            return
        
        try:
            from django.core.files.base import ContentFile
            import os
            
            # Read image content from draft
            draft_image = draft_article.image
            image_content = draft_image.read()
            
            # Get filename and extension
            original_filename = os.path.basename(draft_image.name)
            name, ext = os.path.splitext(original_filename)
            
            # Save as new file to published article
            # The article_image_upload_to function will generate: articles/article_{published_id}_image.ext
            published_article.image.save(
                original_filename,
                ContentFile(image_content),
                save=True
            )
        except Exception as e:
            # Log but don't fail if image copy fails - article content is more important
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Failed to copy featured image for article {draft_article.id}: {str(e)}')
    
    def _copy_article_files(self, draft_article, published_article):
        """
        Copy file attachments from draft to published version.
        Creates independent copies so each version has its own files.
        Deleting draft attachments won't affect published version attachments.
        """
        from django.core.files.base import ContentFile
        from apps.content.models import File
        
        # Delete all existing files in published version first
        published_article.files.all().delete()
        
        # Copy files from draft to published version
        draft_files = File.objects.filter(article=draft_article)
        for file_obj in draft_files:
            try:
                # Read file content from draft
                file_content = file_obj.file.read()
                
                # Get filename to preserve extension
                import os
                original_filename = os.path.basename(file_obj.file.name)
                
                # Create new file for published version
                new_file = File.objects.create(
                    article=published_article,
                    original_filename=file_obj.original_filename,
                    file_size=file_obj.file_size,
                    mime_type=file_obj.mime_type,
                    description_id=file_obj.description_id,
                    description_en=file_obj.description_en,
                    uploaded_by=file_obj.uploaded_by,
                    order_index=file_obj.order_index,
                )
                
                # Save file content
                new_file.file.save(
                    original_filename,
                    ContentFile(file_content),
                    save=True
                )
            except Exception as e:
                # Log but continue with other files
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Failed to copy file {file_obj.original_filename} for article {draft_article.id}: {str(e)}')


class FileViewSet(viewsets.ModelViewSet):
    """
    Internal API for file attachments (authenticated users).
    
    - GET /api/v1/internal/articles/{article_id}/files/ - List files
    - POST /api/v1/internal/articles/{article_id}/files/ - Upload file
    - GET /api/v1/internal/articles/{article_id}/files/{id}/ - File detail
    - PATCH /api/v1/internal/articles/{article_id}/files/{id}/ - Update file
    - DELETE /api/v1/internal/articles/{article_id}/files/{id}/ - Delete file
    - POST /api/v1/internal/articles/{article_id}/files/reorder/ - Reorder files
    """
    permission_classes = [IsAuthenticated]
    queryset = File.objects.all()
    serializer_class = FileSerializer

    def get_queryset(self):
        """Return files for the article from URL."""
        article_id = self.kwargs.get('article_id')
        if article_id:
            return File.objects.filter(article_id=article_id).order_by('order_index')
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

