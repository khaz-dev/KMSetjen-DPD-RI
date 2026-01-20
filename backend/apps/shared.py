from rest_framework.permissions import BasePermission
from rest_framework.pagination import PageNumberPagination

class IsAdmin(BasePermission):
    """Custom permission to check if user is admin."""
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
