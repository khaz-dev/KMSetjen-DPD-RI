"""
Application constants and configuration.
"""

# Application name
APP_NAME = 'KMSetjenDPDRI'
APP_VERSION = '1.0.0'

# Environment
DJANGO_ENV = 'dev'  # Will be overridden by settings

# Pagination
DEFAULT_PAGE_SIZE = 20

# File upload
MAX_FILE_SIZE = 52428800  # 50MB
ALLOWED_EXTENSIONS = ('pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif')

# Article status
ARTICLE_STATUS_DRAFT = 'draft'
ARTICLE_STATUS_REVIEW = 'review'
ARTICLE_STATUS_REJECTED = 'rejected'
ARTICLE_STATUS_APPROVED = 'approved'
ARTICLE_STATUS_PUBLISHED = 'published'
ARTICLE_STATUS_SCHEDULED = 'scheduled'
ARTICLE_STATUS_ARCHIVED = 'archived'

ARTICLE_STATUS_CHOICES = [
    (ARTICLE_STATUS_DRAFT, 'Draft'),
    (ARTICLE_STATUS_REVIEW, 'Dalam Review'),
    (ARTICLE_STATUS_REJECTED, 'Ditolak'),
    (ARTICLE_STATUS_APPROVED, 'Disetujui'),
    (ARTICLE_STATUS_PUBLISHED, 'Dipublikasikan'),
    (ARTICLE_STATUS_SCHEDULED, 'Terjadwal'),
    (ARTICLE_STATUS_ARCHIVED, 'Diarsipkan'),
]

# Article access levels
ACCESS_LEVEL_PUBLIC = 'public'
ACCESS_LEVEL_INTERNAL = 'internal'
ACCESS_LEVEL_ROLE_BASED = 'role_based'

ACCESS_LEVEL_CHOICES = [
    (ACCESS_LEVEL_PUBLIC, 'Public (tanpa login)'),
    (ACCESS_LEVEL_INTERNAL, 'Internal (semua ASN)'),
    (ACCESS_LEVEL_ROLE_BASED, 'Role-based (specific roles)'),
]

# Audit actions
AUDIT_ACTION_CREATE = 'create'
AUDIT_ACTION_UPDATE = 'update'
AUDIT_ACTION_DELETE = 'delete'
AUDIT_ACTION_PUBLISH = 'publish'
AUDIT_ACTION_UNPUBLISH = 'unpublish'
AUDIT_ACTION_REVIEW = 'review'
AUDIT_ACTION_APPROVE = 'approve'
AUDIT_ACTION_REJECT = 'reject'

AUDIT_ACTION_CHOICES = [
    (AUDIT_ACTION_CREATE, 'Create'),
    (AUDIT_ACTION_UPDATE, 'Update'),
    (AUDIT_ACTION_DELETE, 'Delete'),
    (AUDIT_ACTION_PUBLISH, 'Publish'),
    (AUDIT_ACTION_UNPUBLISH, 'Unpublish'),
    (AUDIT_ACTION_REVIEW, 'Submit to Review'),
    (AUDIT_ACTION_APPROVE, 'Approve'),
    (AUDIT_ACTION_REJECT, 'Reject'),
]
