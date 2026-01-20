"""
Audit app signals - Auto-log changes.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from apps.content.models import Article, Category, Tag
import logging

logger = logging.getLogger('audit')


@receiver(post_save, sender=Article)
def log_article_changes(sender, instance, created, **kwargs):
    """
    Log article creation and updates.
    """
    if created:
        # Log article creation (detailed logging in views)
        logger.info(f"Article created: {instance.uuid} by {instance.author}")
    else:
        logger.info(f"Article updated: {instance.uuid}")
