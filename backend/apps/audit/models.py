"""
Audit log model.
"""
from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    """
    Immutable audit trail for all content changes.
    """
    # Actions
    ACTION_CREATE = 'create'
    ACTION_UPDATE = 'update'
    ACTION_DELETE = 'delete'
    ACTION_PUBLISH = 'publish'
    ACTION_UNPUBLISH = 'unpublish'
    ACTION_REVIEW = 'review'
    ACTION_APPROVE = 'approve'
    ACTION_REJECT = 'reject'
    ACTION_VIEW = 'view'
    
    ACTION_CHOICES = [
        (ACTION_CREATE, 'Create'),
        (ACTION_UPDATE, 'Update'),
        (ACTION_DELETE, 'Delete'),
        (ACTION_PUBLISH, 'Publish'),
        (ACTION_UNPUBLISH, 'Unpublish'),
        (ACTION_REVIEW, 'Submit to Review'),
        (ACTION_APPROVE, 'Approve'),
        (ACTION_REJECT, 'Reject'),
        (ACTION_VIEW, 'View'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs',
        help_text='User yang melakukan action'
    )
    
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        db_index=True,
        help_text='Action type'
    )
    
    # What was changed
    content_type = models.CharField(
        max_length=50,
        db_index=True,
        help_text='Content type (e.g., "Article", "User")'
    )
    content_id = models.CharField(
        max_length=100,
        db_index=True,
        help_text='ID of the content being changed'
    )
    content_display = models.CharField(
        max_length=255,
        blank=True,
        help_text='Display name (untuk mudah identifikasi)'
    )
    
    # What changed (JSON)
    # Format: {"field_name": ["old_value", "new_value"], ...}
    changes = models.JSONField(
        default=dict,
        blank=True,
        help_text='Changes made (JSON format)'
    )
    
    # Request context
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
        help_text='IP address dari requester'
    )
    user_agent = models.TextField(
        blank=True,
        help_text='User agent dari browser'
    )
    
    # Timestamp
    timestamp = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text='Waktu action terjadi'
    )
    
    class Meta:
        db_table = 'audit_log'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['content_type', 'content_id', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user} {self.action} {self.content_type} #{self.content_id} @ {self.timestamp}"
