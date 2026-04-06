"""
Signals for content app (Article, Category, etc.)
Handles file cleanup, audit logging, and other model-level operations.
"""
from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
from django.core.files.storage import default_storage
import os
from django.conf import settings


@receiver(pre_save, sender=None)
def cleanup_old_image_on_update(sender, instance, **kwargs):
    """
    Delete old image file when an image field is updated to a new image or cleared.
    
    This signal handles:
    1. Replacing an image (user uploads a new image) → old file is deleted
    2. Deleting an image (user clears the field) → old file is deleted
    3. Keeps the new/empty state
    
    IMPORTANT: Works with callable upload_to functions. Compares actual file paths, not just field values,
    because Django's file storage might reuse filenames.
    
    Works for any model with an 'image' field.
    """
    # Only process Article and Category models that have image fields
    model_name = sender.__name__
    if model_name not in ['Article', 'Category']:
        return
    
    # Check if this model has an image field
    if not hasattr(instance, 'image'):
        return
    
    # Try to get the old instance from DB to compare
    try:
        old_instance = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        # New instance, no old image to delete
        return
    
    # Get old and new image values
    old_image = old_instance.image
    new_image = instance.image
    
    # Compare file paths, not just the field values
    # This ensures we delete the old file even if field values seem unchanged
    old_path = old_image.name if old_image else None
    new_path = new_image.name if new_image else None
    
    # If the file path has changed, delete the old file
    if old_path and old_path != new_path:
        # Delete the old file
        try:
            if default_storage.exists(old_path):
                default_storage.delete(old_path)
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"Deleted old image for {model_name} {instance.pk}: {old_path}")
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to delete old image for {model_name} {instance.pk}: {str(e)}")


@receiver(post_delete, sender=None)
def cleanup_image_on_delete(sender, instance, **kwargs):
    """
    Delete image file when model instance is deleted.
    
    This ensures no orphaned files are left in the media directory.
    
    IMPORTANT: Works with callable upload_to functions and proper error handling.
    """
    # Only process Article and Category models
    model_name = sender.__name__
    if model_name not in ['Article', 'Category']:
        return
    
    # Check if this model has an image field
    if not hasattr(instance, 'image'):
        return
    
    # Delete the image file
    try:
        if instance.image and instance.image.name:
            if default_storage.exists(instance.image.name):
                default_storage.delete(instance.image.name)
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"Deleted image for deleted {model_name} {instance.pk}: {instance.image.name}")
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to delete image for deleted {model_name} {instance.pk}: {str(e)}")


# Import specific signals for Article and Category models
# These will be registered in the app's ready() method
def register_article_signals():
    """Register signals for Article model."""
    from apps.content.models import Article
    pre_save.connect(cleanup_old_image_on_update, sender=Article, dispatch_uid='article_image_pre_save')
    post_delete.connect(cleanup_image_on_delete, sender=Article, dispatch_uid='article_image_post_delete')


def register_category_signals():
    """Register signals for Category model."""
    from apps.content.models import Category
    pre_save.connect(cleanup_old_image_on_update, sender=Category, dispatch_uid='category_image_pre_save')
    post_delete.connect(cleanup_image_on_delete, sender=Category, dispatch_uid='category_image_post_delete')
