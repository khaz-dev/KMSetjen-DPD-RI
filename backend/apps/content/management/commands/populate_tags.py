"""
Django management command to populate dummy tags and assign them to articles.
Usage: python manage.py populate_tags
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.content.models import Tag, Article


class Command(BaseCommand):
    help = 'Populate dummy tags and assign them to articles'

    def handle(self, *args, **options):
        # Define dummy tags (Indonesian and English)
        dummy_tags = [
            {
                'name_id': 'Berita',
                'name_en': 'News',
                'description_id': 'Berita terbaru dan perkembangan',
                'description_en': 'Latest news and updates',
                'color': '#007bff'
            },
            {
                'name_id': 'Tutorial',
                'name_en': 'Tutorial',
                'description_id': 'Panduan dan tutorial langkah demi langkah',
                'description_en': 'Step-by-step guides and tutorials',
                'color': '#28a745'
            },
            {
                'name_id': 'Teknologi',
                'name_en': 'Technology',
                'description_id': 'Artikel tentang teknologi dan inovasi',
                'description_en': 'Articles about technology and innovation',
                'color': '#17a2b8'
            },
            {
                'name_id': 'Kebijakan',
                'name_en': 'Policy',
                'description_id': 'Kebijakan dan peraturan pemerintah',
                'description_en': 'Government policies and regulations',
                'color': '#ffc107'
            },
            {
                'name_id': 'Pengumuman',
                'name_en': 'Announcement',
                'description_id': 'Pengumuman penting dari DPD RI',
                'description_en': 'Important announcements from DPD RI',
                'color': '#dc3545'
            },
            {
                'name_id': 'Edukasi',
                'name_en': 'Education',
                'description_id': 'Materi edukasi dan pembelajaran',
                'description_en': 'Educational materials and learning resources',
                'color': '#6f42c1'
            },
            {
                'name_id': 'Legislasi',
                'name_en': 'Legislation',
                'description_id': 'Proses legislasi dan RUU',
                'description_en': 'Legislation process and draft bills',
                'color': '#e83e8c'
            },
            {
                'name_id': 'Transparansi',
                'name_en': 'Transparency',
                'description_id': 'Transparansi pemerintah dan akuntabilitas',
                'description_en': 'Government transparency and accountability',
                'color': '#20c997'
            },
        ]

        created_tags = []
        for tag_data in dummy_tags:
            tag, created = Tag.objects.update_or_create(
                slug=slugify(tag_data['name_id']),
                defaults={
                    'name_id': tag_data['name_id'],
                    'name_en': tag_data['name_en'],
                    'description_id': tag_data['description_id'],
                    'description_en': tag_data['description_en'],
                    'color': tag_data['color'],
                    'is_active': True,
                }
            )
            created_tags.append((tag, created))
            status = "Created" if created else "Updated"
            self.stdout.write(
                self.style.SUCCESS(
                    f'{status}: {tag.name_id} ({tag.name_en}) - {tag.color}'
                )
            )

        # Assign tags to all published articles
        articles = Article.objects.filter(
            is_published=True,
            status='published'
        )

        if articles.exists():
            # Get first 3 tags to assign to articles
            tags_to_assign = Tag.objects.filter(is_active=True)[:3]
            
            assigned_count = 0
            for article in articles:
                # Clear existing tags
                article.tags.clear()
                # Add new tags
                article.tags.add(*tags_to_assign)
                assigned_count += 1
                
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nAssigned {len(tags_to_assign)} tags to {assigned_count} articles'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING('No published articles found to assign tags')
            )

        self.stdout.write(
            self.style.SUCCESS('\n✅ Dummy tags populated successfully!')
        )
