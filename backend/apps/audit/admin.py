"""
Audit app admin configuration.
"""
from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'action', 'content_type', 'content_display',
        'timestamp'
    )
    list_filter = ('action', 'content_type', 'timestamp')
    search_fields = ('user__username', 'content_display', 'content_id')
    readonly_fields = (
        'user', 'action', 'content_type', 'content_id',
        'content_display', 'changes', 'ip_address', 'user_agent',
        'timestamp'
    )
    
    def has_add_permission(self, request):
        """Audit logs are created automatically, not manually."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Audit logs are immutable."""
        return False
    
    fieldsets = (
        ('User & Action', {
            'fields': ('user', 'action')
        }),
        ('Content', {
            'fields': ('content_type', 'content_id', 'content_display')
        }),
        ('Changes', {
            'fields': ('changes',)
        }),
        ('Request Context', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
        ('Timestamp', {
            'fields': ('timestamp',),
            'classes': ('collapse',)
        }),
    )
