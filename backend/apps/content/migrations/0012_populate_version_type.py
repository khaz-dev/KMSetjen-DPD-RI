# Migration to set existing articles to draft version

from django.db import migrations
from apps.content.models import Article


def set_to_draft(apps, schema_editor):
    """Set all existing articles to draft version."""
    Article = apps.get_model('content', 'Article')
    Article.objects.all().update(version_type='draft')


def reverse(apps, schema_editor):
    """Reverse migration (no-op)."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0011_add_article_versioning'),
    ]

    operations = [
        migrations.RunPython(set_to_draft, reverse),
    ]
