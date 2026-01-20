#!/usr/bin/env python
"""Update articles with more varied publication dates."""
import os
import django
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from apps.content.models import Article

# Article slug -> days offset from now
# Using more varied time offsets so each article has distinctly different date
articles_dates = [
    # Very recent
    ('panduan-lengkap-penggunaan-knowledge-management-system', timedelta(hours=3)),     # 3 hours ago
    ('kebijakan-data-privacy-dan-keamanan-informasi', timedelta(hours=12)),             # 12 hours ago
    ('pengumuman-pembaruan-sistem-kms-v20', timedelta(hours=24)),                       # 1 day ago
    ('tips-produktivitas-manajemen-waktu-efektif', timedelta(days=3)),                  # 3 days ago
    ('laporan-evaluasi-program-transformasi-digital-q4-2025', timedelta(days=7)),       # 1 week ago
    ('berita-kolaborasi-strategis-dengan-universitas-terkemuka', timedelta(days=14)),   # 2 weeks ago
]

print("=" * 70)
print("UPDATING ARTICLES WITH MORE VARIED PUBLICATION DATES")
print("=" * 70)

updated = 0
now = timezone.now()

for slug, time_offset in articles_dates:
    article = Article.objects.filter(slug=slug).first()
    if article:
        article.published_at = now - time_offset
        article.save()
        
        # Calculate days for display
        days = time_offset.days
        if days == 0:
            hours = time_offset.total_seconds() / 3600
            time_str = f"{int(hours)} jam yang lalu"
        elif days == 1:
            time_str = "1 hari yang lalu"
        else:
            time_str = f"{days} hari yang lalu"
        
        print(f"✓ {article.title_id}")
        print(f"  📅 Published: {time_str}")
        print(f"  👁  Views: {article.view_count}")
        print(f"  ❤️  Likes: {article.like_count}")
        updated += 1
    else:
        print(f"✗ Article not found: {slug}")

print("\n" + "=" * 70)
print(f"COMPLETED: Updated {updated} articles with varied dates!")
print("=" * 70)
print("\nDate variation for first 3 articles (shown on page 1):")
print("  1. Article 1: 3 jam yang lalu (3 hours ago)")
print("  2. Article 2: 12 jam yang lalu (12 hours ago)")
print("  3. Article 3: 1 hari yang lalu (1 day ago)")
print("\nNow each article on the first page shows a DIFFERENT date!")
print("\nVisit: http://localhost:3000/articles?sort=date&page=1")
