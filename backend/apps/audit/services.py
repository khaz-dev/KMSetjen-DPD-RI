"""
Audit logging service and utilities.
"""
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from .models import AuditLog
import json


class AuditService:
    """Service for creating audit logs."""
    
    @staticmethod
    def log_action(
        user,
        action,
        content_type,
        content_id,
        changes=None,
        content_display='',
        ip_address='',
        user_agent='',
    ):
        """
        Create an audit log entry.
        
        Args:
            user: User object (or None for anonymous users)
            action: Action type (create, update, delete, etc.)
            content_type: Type of content (Article, User, etc.)
            content_id: ID of content
            changes: Dict of {field: [old_value, new_value]}
            content_display: Display name for content
            ip_address: IP address of requester
            user_agent: User agent string
        """
        # Convert AnonymousUser to None
        if isinstance(user, AnonymousUser) or not user or not hasattr(user, 'id'):
            user = None
        
        AuditLog.objects.create(
            user=user,
            action=action,
            content_type=content_type,
            content_id=str(content_id),
            content_display=content_display,
            changes=changes or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    @staticmethod
    def log_article_created(user, article, ip_address='', user_agent=''):
        """Log article creation."""
        AuditService.log_action(
            user=user,
            action=AuditLog.ACTION_CREATE,
            content_type='Article',
            content_id=article.id,
            content_display=article.title_id,
            changes={'status': [None, article.status]},
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    @staticmethod
    def log_article_updated(user, article, changes, ip_address='', user_agent=''):
        """Log article update."""
        AuditService.log_action(
            user=user,
            action=AuditLog.ACTION_UPDATE,
            content_type='Article',
            content_id=article.id,
            content_display=article.title_id,
            changes=changes,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    
    @staticmethod
    def log_article_published(user, article, ip_address='', user_agent=''):
        """Log article publication."""
        AuditService.log_action(
            user=user,
            action=AuditLog.ACTION_PUBLISH,
            content_type='Article',
            content_id=article.id,
            content_display=article.title_id,
            changes={'status': ['draft', 'published']},
            ip_address=ip_address,
            user_agent=user_agent,
        )
