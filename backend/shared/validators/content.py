"""Content validation utilities."""
from django.core.exceptions import ValidationError
import mimetypes


ALLOWED_FILE_TYPES = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def validate_file_upload(file_obj):
    """Validate uploaded file."""
    # Check file size
    if file_obj.size > MAX_FILE_SIZE:
        raise ValidationError(f'File size exceeds {MAX_FILE_SIZE / 1024 / 1024}MB limit')
    
    # Check file type
    mime_type, _ = mimetypes.guess_type(file_obj.name)
    if mime_type not in ALLOWED_FILE_TYPES:
        raise ValidationError(f'File type {mime_type} is not allowed')


def validate_bilingual_content(title_id, title_en):
    """Validate bilingual content."""
    if not title_id or not title_id.strip():
        raise ValidationError('Indonesian title is required')
    if not title_en or not title_en.strip():
        raise ValidationError('English title is required')
    
    if len(title_id) > 500:
        raise ValidationError('Indonesian title is too long (max 500 chars)')
    if len(title_en) > 500:
        raise ValidationError('English title is too long (max 500 chars)')


def validate_slug(slug):
    """Validate slug format."""
    if not slug or not slug.strip():
        raise ValidationError('Slug cannot be empty')
    
    # Only allow alphanumeric and hyphens
    if not all(c.isalnum() or c == '-' for c in slug):
        raise ValidationError('Slug can only contain alphanumeric characters and hyphens')
    
    if slug.startswith('-') or slug.endswith('-'):
        raise ValidationError('Slug cannot start or end with a hyphen')
