"""
Custom storage backends for consistent file naming.
"""
import os
from django.core.files.storage import default_storage
from django.conf import settings


def article_image_path(instance, filename):
    """
    Generate consistent file path and name for article images.
    Format: articles/article_{article_id}_image.{ext}
    
    This ensures:
    - Each article always has the same filename
    - Re-uploading an image replaces the old one
    - Consistent, predictable URLs
    
    Args:
        instance: Article model instance
        filename: Original filename from upload
    
    Returns:
        str: Relative path for storing the file (e.g., 'articles/article_27_image.jpg')
    """
    if not instance.pk:
        # For new articles, use a temporary name (will be fixed on save)
        return f'articles/temp_{filename}'
    
    # Get file extension from original filename
    _, ext = os.path.splitext(filename)
    
    # Return consistent filename: articles/article_27_image.jpg
    return f'articles/article_{instance.pk}_image{ext}'


def category_image_path(instance, filename):
    """
    Generate consistent file path and name for category images.
    Format: categories/category_{category_id}_image.{ext}
    
    Args:
        instance: Category model instance
        filename: Original filename from upload
    
    Returns:
        str: Relative path for storing the file
    """
    if not instance.pk:
        return f'categories/temp_{filename}'
    
    _, ext = os.path.splitext(filename)
    return f'categories/category_{instance.pk}_image{ext}'


def delete_old_image(field_name, instance, old_value):
    """
    Delete old image file when it's replaced.
    
    Args:
        field_name: Name of the image field (e.g., 'image')
        instance: Model instance
        old_value: Old image field value before update
    
    Returns:
        bool: True if file was deleted, False otherwise
    """
    if not old_value or old_value == '':
        return False
    
    try:
        # Get the old file path
        if hasattr(old_value, 'path'):
            # It's a FieldFile object
            file_path = old_value.path
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        elif isinstance(old_value, str):
            # It's a string path
            full_path = os.path.join(settings.MEDIA_ROOT, old_value)
            if os.path.exists(full_path):
                os.remove(full_path)
                return True
    except Exception as e:
        # Log but don't fail if deletion fails
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to delete old {field_name}: {str(e)}")
        return False
    
    return False
