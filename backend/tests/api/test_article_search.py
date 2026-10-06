"""
Tests for comprehensive article search across:
- article-title
- article-excerpt / article-summary
- article-content
- meta-name dibuat oleh (creator)
- meta-name diterbitkan oleh (publisher/author)
- meta-date-text (published_at date, month name, year)
- article-meta mb-3 (category & tags)
- article-attachments (files)
"""
import pytest
from datetime import datetime
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.content.models import Article, Category, Tag, File
from apps.content.search import search_articles_queryset

User = get_user_model()


@pytest.fixture
def search_test_data(db):
    author_user = User.objects.create_user(
        username='publisher_asn',
        first_name='Khairil',
        last_name='Ashari',
        email='khairil@dpd.go.id',
        password='password123'
    )
    creator_user = User.objects.create_user(
        username='creator_asn',
        first_name='Fahri',
        last_name='Syakban',
        email='fahri@dpd.go.id',
        password='password123'
    )

    category = Category.objects.create(
        name_id='Praktik Terbaik & Inovasi',
        name_en='Best Practices & Innovation',
        slug='praktik-terbaik'
    )

    tag = Tag.objects.create(
        name_id='Transformasi Digital',
        name_en='Digital Transformation',
        slug='transformasi-digital'
    )

    # Article published in October 2026
    published_date = timezone.make_aware(datetime(2026, 10, 6, 10, 0, 0))

    article = Article.objects.create(
        title_id='Pedoman Tata Kelola Knowledge Management',
        title_en='Knowledge Management Governance Guidelines',
        summary_id='Ringkasan panduan implementasi tata kelola KM di lingkungan Setjen',
        summary_en='Summary of KM governance guidelines in Secretariat General',
        content_id='<p>Konten lengkap mengenai arsitektur sistem dan alur kerja informasi.</p>',
        content_en='<p>Full content regarding system architecture and information workflow.</p>',
        category=category,
        author=author_user,
        creator_name='Dr. Markus Mietzner',
        creator_user=creator_user,
        creator_type='mixed',
        creators_data=[
            {'name': 'Dr. Markus Mietzner', 'type': 'external', 'institution': 'ANU'},
            {'name': 'Fahri Syakban', 'type': 'internal', 'user_id': creator_user.id}
        ],
        status='published',
        is_published=True,
        version_type='published',
        access_level='public',
        published_at=published_date
    )
    article.tags.add(tag)

    # Attachment file
    File.objects.create(
        article=article,
        original_filename='Paparan_Cerita_Kita_Kabag_Setkom_I.pdf',
        description_id='Dokumen paparan materi sosialisasi',
        description_en='Socialization material presentation document',
        file_size=102400,
        mime_type='application/pdf'
    )

    return article


@pytest.mark.django_db
class TestComprehensiveArticleSearch:
    """Test full-text and metadata search in public API and search service."""

    def test_search_by_title(self, search_test_data):
        qs = search_articles_queryset(Article.objects.all(), 'Pedoman')
        assert qs.filter(id=search_test_data.id).exists()

    def test_search_by_excerpt(self, search_test_data):
        qs = search_articles_queryset(Article.objects.all(), 'panduan implementasi')
        assert qs.filter(id=search_test_data.id).exists()

    def test_search_by_content(self, search_test_data):
        qs = search_articles_queryset(Article.objects.all(), 'arsitektur sistem')
        assert qs.filter(id=search_test_data.id).exists()

    def test_search_by_creator_name(self, search_test_data):
        # Search external creator name
        qs = search_articles_queryset(Article.objects.all(), 'Markus Mietzner')
        assert qs.filter(id=search_test_data.id).exists()

        # Search internal creator full name
        qs2 = search_articles_queryset(Article.objects.all(), 'Fahri Syakban')
        assert qs2.filter(id=search_test_data.id).exists()

    def test_search_by_publisher_name(self, search_test_data):
        # Search publisher / uploader name
        qs = search_articles_queryset(Article.objects.all(), 'Khairil Ashari')
        assert qs.filter(id=search_test_data.id).exists()

    def test_search_by_category_name(self, search_test_data):
        # Search category (article-meta mb-3)
        qs = search_articles_queryset(Article.objects.all(), 'Praktik Terbaik')
        assert qs.filter(id=search_test_data.id).exists()

    def test_search_by_tag_name(self, search_test_data):
        # Search tag (article-meta mb-3)
        qs = search_articles_queryset(Article.objects.all(), 'Transformasi Digital')
        assert qs.filter(id=search_test_data.id).exists()

    def test_search_by_attachment_filename(self, search_test_data):
        # Search attachment filename (article-attachments)
        qs = search_articles_queryset(Article.objects.all(), 'Paparan_Cerita')
        assert qs.filter(id=search_test_data.id).exists()

    def test_search_by_date_components(self, search_test_data):
        # Search by year
        qs_year = search_articles_queryset(Article.objects.all(), '2026')
        assert qs_year.filter(id=search_test_data.id).exists()

        # Search by month name (Indonesian)
        qs_month = search_articles_queryset(Article.objects.all(), 'Oktober')
        assert qs_month.filter(id=search_test_data.id).exists()

        # Search by month name (English)
        qs_month_en = search_articles_queryset(Article.objects.all(), 'October')
        assert qs_month_en.filter(id=search_test_data.id).exists()

        # Search by full date
        qs_full_date = search_articles_queryset(Article.objects.all(), '6 Oktober 2026')
        assert qs_full_date.filter(id=search_test_data.id).exists()

    def test_cross_field_combined_search(self, search_test_data):
        # Title + Creator
        qs1 = search_articles_queryset(Article.objects.all(), 'Pedoman Markus')
        assert qs1.filter(id=search_test_data.id).exists()

        # Attachment + Date
        qs2 = search_articles_queryset(Article.objects.all(), 'Paparan 2026')
        assert qs2.filter(id=search_test_data.id).exists()

    def test_public_api_endpoint_search(self, search_test_data):
        client = APIClient()
        response = client.get('/api/v1/public/articles/', {'search': 'Markus'})
        assert response.status_code == 200
        results = response.data.get('results', [])
        assert any(item['id'] == search_test_data.id for item in results)

        # Search attachment via public API
        response_att = client.get('/api/v1/public/articles/', {'search': 'Paparan'})
        assert response_att.status_code == 200
        results_att = response_att.data.get('results', [])
        assert any(item['id'] == search_test_data.id for item in results_att)
