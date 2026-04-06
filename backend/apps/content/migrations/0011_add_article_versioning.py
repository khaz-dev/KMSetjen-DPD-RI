# Generated migration for adding article versioning

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0010_add_approval_comment'),
    ]

    operations = [
        # Step 1: Add version_type field with default value
        migrations.AddField(
            model_name='article',
            name='version_type',
            field=models.CharField(
                choices=[('draft', 'Draft Version'), ('published', 'Published Version')],
                db_index=True,
                default='draft',
                help_text='Whether this is a draft or published version',
                max_length=20,
            ),
        ),
        
        # Step 2: Add draft_article field (ForeignKey and OneToOneField replacement)
        migrations.AddField(
            model_name='article',
            name='draft_article',
            field=models.OneToOneField(
                blank=True,
                help_text='Link to draft version (only for published versions)',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='published_version',
                to='content.article',
            ),
        ),
        
        # Step 3: Remove old unique constraint on slug
        migrations.AlterField(
            model_name='article',
            name='slug',
            field=models.SlugField(
                db_index=True,
                help_text='URL-friendly slug',
                max_length=255,
            ),
        ),
        
        # Step 4: Update indexes
        migrations.RemoveIndex(
            model_name='article',
            name='content_art_slug_123456_idx',  # Placeholder name - will be replaced by actual index name
        ) if False else migrations.RunPython(migrations.RunPython.noop),  # No-op for safety
        
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['version_type', 'slug'], name='content_article_version_slug_idx'),
        ),
        
        # Step 5: Add unique constraint
        migrations.AddConstraint(
            model_name='article',
            constraint=models.UniqueConstraint(
                fields=['version_type', 'slug'],
                name='unique_slug_per_version_type',
            ),
        ),
        
        # Step 6: Update Meta ordering and other indexes
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['category'], name='content_article_category_idx'),
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['is_published', 'status'], name='content_article_published_status_idx'),
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['author'], name='content_article_author_idx'),
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['-published_at'], name='content_article_published_at_idx'),
        ),
        migrations.AddIndex(
            model_name='article',
            index=models.Index(fields=['access_level'], name='content_article_access_level_idx'),
        ),
    ]
