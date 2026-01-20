"""Base permission classes for DRF views."""
from rest_framework import permissions
from apps.core.constants import ROLE_ADMIN, ROLE_EDITOR, ROLE_CONTRIBUTOR


class IsPublic(permissions.BasePermission):
    """Allow any access (public endpoint)."""
    def has_permission(self, request, view):
        return True


class IsAuthenticated(permissions.IsAuthenticated):
    """Require authentication."""
    pass


class IsAdmin(permissions.BasePermission):
    """Require admin role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin()

    def has_object_permission(self, request, view, obj):
        return request.user and request.user.is_admin()


class IsEditor(permissions.BasePermission):
    """Require editor role or higher."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_editor()

    def has_object_permission(self, request, view, obj):
        return request.user and request.user.is_editor()


class IsContributor(permissions.BasePermission):
    """Require contributor role or higher."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_contributor()

    def has_object_permission(self, request, view, obj):
        return request.user and request.user.is_contributor()


class IsAuthorOrEditor(permissions.BasePermission):
    """Allow author to edit own content, or editor/admin."""
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user is author
        if hasattr(obj, 'author') and obj.author == request.user:
            return True
        
        # Check if user is editor or admin
        return request.user.is_editor()


class CanPublishArticle(permissions.BasePermission):
    """Require permission to publish articles (editor/admin only)."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.can_publish_article()

    def has_object_permission(self, request, view, obj):
        return request.user and request.user.can_publish_article()


class CanManageUsers(permissions.BasePermission):
    """Require admin permission to manage users."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.can_manage_users()

    def has_object_permission(self, request, view, obj):
        return request.user and request.user.can_manage_users()
