#!/usr/bin/env python
"""Update articles with varied view counts and like counts for testing sort functionality."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.content.models import Article

# Article slug -> (view_count, like_count) mapping
articles_metrics = [
    ('panduan-lengkap-penggunaan-knowledge-management-system', 234, 45),
    ('kebijakan-data-privacy-dan-keamanan-informasi', 1567, 89),
    ('pengumuman-pembaruan-sistem-kms-v20', 523, 156),
    ('tips-produktivitas-manajemen-waktu-efektif', 892, 267),
    ('laporan-evaluasi-program-transformasi-digital-q4-2025', 445, 98),
    ('berita-kolaborasi-strategis-dengan-universitas-terkemuka', 678, 203),
]

print("=" * 70)
print("UPDATING ARTICLES WITH VARIED METRICS")
print("=" * 70)

updated = 0
for slug, view_count, like_count in articles_metrics:
    article = Article.objects.filter(slug=slug).first()
    if article:
        article.view_count = view_count
        article.like_count = like_count
        article.save()
        print(f"✓ {article.title_id}")
        print(f"  👁  Views: {view_count}")
        print(f"  ❤️  Likes: {like_count}")
        updated += 1
    else:
        print(f"✗ Article not found: {slug}")

print("\n" + "=" * 70)
print(f"COMPLETED: Updated {updated} articles with varied metrics!")
print("=" * 70)
print("\nYou can now test sorting by:")
print("  1. Most Viewed (Paling Banyak Dilihat) - Views vary from 234 to 1567")
print("  2. Most Liked (Paling Banyak Disukai) - Likes vary from 45 to 267")
print("  3. Newest/Oldest - Already have varied dates")
print("\nVisit: http://localhost:3000/articles")
