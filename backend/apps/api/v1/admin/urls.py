"""
Admin API URL Configuration
============================

Routes for admin API endpoints.
All endpoints require admin authentication.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, RoleViewSet, PermissionViewSet,
    AuditLogViewSet, SystemStatisticsViewSet
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='admin-users')
router.register(r'roles', RoleViewSet, basename='admin-roles')
router.register(r'permissions', PermissionViewSet, basename='admin-permissions')
router.register(r'audit-logs', AuditLogViewSet, basename='admin-audit-logs')
router.register(r'statistics', SystemStatisticsViewSet, basename='admin-statistics')

app_name = 'admin-api'

urlpatterns = [
    path('', include(router.urls)),
]
