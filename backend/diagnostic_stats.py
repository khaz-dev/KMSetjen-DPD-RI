#!/usr/bin/env python
"""
Detailed diagnostic of the statistics API
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.audit.models import AuditLog
from apps.api.v1.admin.serializers import (
    SystemStatisticsSerializer, AuditLogSerializer
)
from django.contrib.auth import get_user_model

User = get_user_model()

print("=" * 70)
print("DIAGNOSTIC: Checking AuditLog Serialization")
print("=" * 70)

# Check if there are any audit logs
audit_logs = AuditLog.objects.all()[:5]
print(f"\n✓ Found {audit_logs.count()} audit logs (showing first 5)")

# Try serializing individual audit logs
print("\n--- Individual AuditLog Serialization ---")
for i, log in enumerate(audit_logs, 1):
    try:
        serializer = AuditLogSerializer(log)
        print(f"{i}. ✓ Log ID {log.id}: {log.action} on {log.resource_type}")
    except Exception as e:
        print(f"{i}. ✗ Log ID {log.id}: ERROR - {type(e).__name__}: {e}")

# Try the full statistics
print("\n--- Full SystemStatistics Serialization ---")
print("Building stats dictionary...")

from apps.content.models import Article
from django.db.models import Count

try:
    stats = {
        'total_users': User.objects.count(),
        'active_users': User.objects.filter(is_active=True).count(),
        'total_articles': Article.objects.count(),
        'published_articles': Article.objects.filter(is_published=True).count(),
        'draft_articles': Article.objects.filter(status='DRAFT').count(),
        'in_review_articles': Article.objects.filter(status='REVIEW').count(),
        'total_audit_logs': AuditLog.objects.count(),
        'users_by_role': dict(
            User.objects.filter(roles__isnull=False)
                .values('roles__code')
                .annotate(count=Count('id'))
                .values_list('roles__code', 'count')
        ),
        'articles_by_status': dict(
            Article.objects.values('status')
                .annotate(count=Count('id'))
                .values_list('status', 'count')
        ),
        'audit_logs_by_action': dict(
            AuditLog.objects.values('action')
                .annotate(count=Count('id'))
                .values_list('action', 'count')
        ),
        'recent_audit_logs': AuditLog.objects.all()[:10]
    }
    print("✓ Stats dict built successfully")
    
    print("\nAttempting to serialize...")
    serializer = SystemStatisticsSerializer(stats)
    print("✓ Serializer initialized")
    
    print("\nAttempting to access serializer.data...")
    data = serializer.data
    print("✓ SUCCESS! Serializer.data retrieved")
    
    print("\n--- Serialized Data Summary ---")
    for key in data.keys():
        if key == 'recent_audit_logs':
            print(f"  {key}: {len(data[key])} items")
        else:
            print(f"  {key}: {type(data[key]).__name__}")
            
except Exception as e:
    import traceback
    print(f"\n✗ ERROR: {type(e).__name__}")
    print(f"Message: {e}")
    print("\nTraceback:")
    traceback.print_exc()
