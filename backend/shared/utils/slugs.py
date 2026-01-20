"""Slug generation utilities."""
from django.utils.text import slugify
import uuid


def generate_unique_slug(base_text, model_class, field_name='slug', exclude_id=None):
    """
    Generate a unique slug from text.
    
    Args:
        base_text: Text to slugify
        model_class: Django model class to check uniqueness against
        field_name: Field name to check (default: 'slug')
        exclude_id: ID to exclude from uniqueness check (for updates)
    
    Returns:
        Unique slug string
    """
    slug = slugify(base_text)
    
    # Check uniqueness
    queryset = model_class.objects.filter(**{f'{field_name}': slug})
    if exclude_id:
        queryset = queryset.exclude(id=exclude_id)
    
    if queryset.exists():
        # Add UUID suffix if slug exists
        slug = f"{slug}-{uuid.uuid4().hex[:8]}"
    
    return slug


def generate_slug_from_title(title):
    """Simple slug generation from title."""
    return slugify(title)
