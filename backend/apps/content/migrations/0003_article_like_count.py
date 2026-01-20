# Generated migration to add like_count field to Article model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='article',
            name='like_count',
            field=models.IntegerField(
                default=0,
                db_index=True,
                help_text='Total likes'
            ),
        ),
    ]
