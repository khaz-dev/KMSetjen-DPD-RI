"""Custom permissions for PPTX preview endpoints."""
from rest_framework.permissions import BasePermission
from apps.content.models import Article


class IsAuthenticatedOrPublicArticleFile(BasePermission):
    """
    Allow authenticated users or unauthenticated users accessing files in published public articles.
    
    This permission is used for PPTX preview endpoints (pptx_info, thumbnails_all, thumbnail)
    to allow public users to preview presentations in public articles without authentication.
    
    Permissions:
    - Authenticated users: Full access
    - Unauthenticated users: Only access to files in published, public articles
    """
    
    def has_permission(self, request, view):
        """Check if user can access the endpoint."""
        # Authenticated users always have access
        if request.user and request.user.is_authenticated:
            return True
        
        # Unauthenticated users: Check if accessing public article file
        # We'll do detailed checking in has_object_permission
        return True
    
    def has_object_permission(self, request, view, obj):
        """Check if user can access the specific file object."""
        # Authenticated users always have access
        if request.user and request.user.is_authenticated:
            return True
        
        # Unauthenticated users: Only allow access to files in public articles
        try:
            article_id = view.kwargs.get('article_id')
            if not article_id:
                return False
            
            article = Article.objects.get(id=article_id)
            
            # Allow access only if article is published and public
            return (
                article.is_published and 
                article.status == 'published' and 
                article.access_level == 'public'
            )
        except Article.DoesNotExist:
            return False
        except Exception:
            return False
