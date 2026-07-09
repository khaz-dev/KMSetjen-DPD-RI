#!/usr/bin/env python
"""
Script to check and create dummy tags
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils.text import slugify
from apps.content.models import Tag, Article

# Define dummy tags
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

print("Creating dummy tags...")
created_tags = []

for tag_data in dummy_tags:
    slug = slugify(tag_data['name_id'])
    tag, created = Tag.objects.update_or_create(
        slug=slug,
        defaults={
            'name_id': tag_data['name_id'],
            'name_en': tag_data['name_en'],
            'description_id': tag_data['description_id'],
            'description_en': tag_data['description_en'],
            'color': tag_data['color'],
            'is_active': True,
        }
    )
    created_tags.append(tag)
    status = "✓ Created" if created else "→ Updated"
    print(f"{status}: {tag.name_id} ({tag.name_en}) - {tag.color}")

print(f"\nTotal tags: {len(created_tags)}")

# Assign tags to all published articles
print("\nAssigning tags to articles...")
articles = Article.objects.filter(
    is_published=True,
    status='published'
)

if articles.exists():
    # Get first 3 tags to assign
    tags_to_assign = created_tags[:3]
    
    for article in articles:
        article.tags.clear()
        article.tags.add(*tags_to_assign)
    
    print(f"✓ Assigned {len(tags_to_assign)} tags to {articles.count()} articles")
else:
    print("⚠ No published articles found")

print("\n✅ Dummy tags populated successfully!")
