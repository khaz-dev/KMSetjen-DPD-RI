"""Data migration to backfill creator metadata for existing articles."""
from django.db import migrations

def backfill_creators(apps, schema_editor):
    Article = apps.get_model('content', 'Article')
    for a in Article.objects.all():
        name = ''
        if a.author:
            name = f"{a.author.first_name} {a.author.last_name}".strip() or a.author.username
        if not name:
            name = 'Setjen DPD RI'
        a.creator_name = name
        a.creator_type = 'internal'
        a.creator_user = a.author
        a.save(update_fields=['creator_name', 'creator_type', 'creator_user'])

def reverse_backfill(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('content', '0016_externalauthor_article_creator_name_and_more'),
    ]

    operations = [
        migrations.RunPython(backfill_creators, reverse_backfill),
    ]
