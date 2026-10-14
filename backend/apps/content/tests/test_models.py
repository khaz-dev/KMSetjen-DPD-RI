from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.content.models import Article, Category, Tag, File, InfographicImage
from apps.audit.models import AuditLog
from datetime import datetime, timedelta
import json

User = get_user_model()


class CategoryModelTest(TestCase):
    """Test cases for Category model"""

    def setUp(self):
        """Create test category"""
        self.category = Category.objects.create(
            name_en="Technology",
            name_id="Teknologi",
            slug="technology"
        )

    def test_category_creation(self):
        """Test category can be created"""
        self.assertEqual(self.category.name_en, "Technology")
        self.assertEqual(self.category.name_id, "Teknologi")
        self.assertEqual(self.category.slug, "technology")

    def test_category_str(self):
        """Test category string representation"""
        self.assertEqual(str(self.category), "Teknologi")

    def test_category_slug(self):
        """Test category slug"""
        self.assertEqual(self.category.slug, "technology")

    def test_category_duplicate_slug(self):
        """Test category with duplicate slug is rejected"""
        with self.assertRaises(Exception):
            Category.objects.create(
                name_en="Tech",
                name_id="Tech",
                slug="technology"
            )


class TagModelTest(TestCase):
    """Test cases for Tag model"""

    def setUp(self):
        """Create test tag"""
        self.tag = Tag.objects.create(
            name_en="Python",
            name_id="Python",
            slug="python"
        )

    def test_tag_creation(self):
        """Test tag can be created"""
        self.assertEqual(self.tag.name_en, "Python")
        self.assertEqual(self.tag.slug, "python")

    def test_tag_str(self):
        """Test tag string representation"""
        self.assertEqual(str(self.tag), "Python")

    def test_multiple_tags(self):
        """Test creating multiple tags"""
        tag2 = Tag.objects.create(name_en="Django", name_id="Django", slug="django")
        self.assertEqual(Tag.objects.count(), 2)
        self.assertNotEqual(self.tag.id, tag2.id)


class ArticleModelTest(TestCase):
    """Test cases for Article model"""

    def setUp(self):
        """Create test user, category, and article"""
        self.user = User.objects.create_user(
            username="testauthor",
            email="author@test.com",
            password="testpass123"
        )
        self.category = Category.objects.create(
            name_en="News",
            name_id="Berita",
            slug="news"
        )
        self.article = Article.objects.create(
            title_en="Test Article",
            title_id="Artikel Uji",
            author=self.user,
            category=self.category,
            content_en="Test content in English",
            content_id="Konten uji dalam bahasa Indonesia",
            status="published"
        )

    def test_article_creation(self):
        """Test article can be created"""
        self.assertEqual(self.article.title_en, "Test Article")
        self.assertEqual(self.article.author, self.user)
        self.assertEqual(self.article.status, "published")

    def test_article_slug_generation(self):
        """Test article slug is generated"""
        self.assertIsNotNone(self.article.slug)
        self.assertTrue(len(self.article.slug) > 0)

    def test_article_str(self):
        """Test article string representation"""
        self.assertIn("Artikel Uji", str(self.article))

    def test_article_knowledge_type_persekjen(self):
        """Test article knowledge_type compliant with Persekjen No. 8/2026"""
        # Default is 'artikel'
        self.assertEqual(self.article.knowledge_type, 'artikel')
        self.assertEqual(self.article.get_knowledge_cluster(), 'c')
        self.assertEqual(self.article.get_knowledge_type_display_id(), 'Artikel Pengetahuan')
        self.assertEqual(self.article.get_knowledge_type_display_en(), 'Knowledge Article')

        # Test cluster a: kajian
        kajian_art = Article.objects.create(
            title_en="Strategic Study",
            title_id="Kajian Strategis",
            author=self.user,
            category=self.category,
            knowledge_type="kajian",
            content_en="Content",
            content_id="Konten",
            status="published"
        )
        self.assertEqual(kajian_art.knowledge_type, 'kajian')
        self.assertEqual(kajian_art.get_knowledge_cluster(), 'a')
        self.assertEqual(kajian_art.get_knowledge_type_display_id(), 'Kajian')

        # Test cluster b: policy_brief
        policy_art = Article.objects.create(
            title_en="Policy Brief 2026",
            title_id="Policy Brief 2026",
            author=self.user,
            category=self.category,
            knowledge_type="policy_brief",
            content_en="Content",
            content_id="Konten",
            status="published"
        )
        self.assertEqual(policy_art.get_knowledge_cluster(), 'b')
        self.assertEqual(policy_art.get_knowledge_type_display_id(), 'Ringkasan Kebijakan (Policy Brief)')

        # Test cluster d: infografis
        info_art = Article.objects.create(
            title_en="Infographic 2026",
            title_id="Infografis 2026",
            author=self.user,
            category=self.category,
            knowledge_type="infografis",
            content_en="Content",
            content_id="Konten",
            status="published"
        )
        self.assertEqual(info_art.get_knowledge_cluster(), 'd')
        self.assertEqual(info_art.get_knowledge_type_display_id(), 'Infografis')

    def test_article_status_choices(self):
        """Test article status choices"""
        self.assertEqual(self.article.status, "published")

        # Test draft article
        draft_article = Article.objects.create(
            title_en="Draft Article",
            title_id="Artikel Draft",
            author=self.user,
            category=self.category,
            content_en="Draft content",
            content_id="Konten draft",
            status="draft"
        )
        self.assertEqual(draft_article.status, "draft")

    def test_article_timestamps(self):
        """Test article timestamps"""
        self.assertIsNotNone(self.article.created_at)
        self.assertIsNotNone(self.article.updated_at)

    def test_article_add_tags(self):
        """Test adding tags to article"""
        tag = Tag.objects.create(name_en="Important", name_id="Penting", slug="important")
        self.article.tags.add(tag)
        self.assertIn(tag, self.article.tags.all())

    def test_article_view_count(self):
        """Test article view count"""
        initial_views = self.article.view_count
        self.article.view_count += 1
        self.article.save()
        self.assertEqual(self.article.view_count, initial_views + 1)


class AuditLogModelTest(TestCase):
    """Test cases for AuditLog model"""

    def setUp(self):
        """Create test user and audit log"""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@test.com",
            password="testpass123"
        )

    def test_audit_log_creation(self):
        """Test audit log can be created"""
        log = AuditLog.objects.create(
            user=self.user,
            action="create",
            content_type="Article",
            content_id="1"
        )
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.action, "create")

    def test_audit_log_with_metadata(self):
        """Test audit log with metadata"""
        changes = {"title": ["Old Title", "New Title"]}
        log = AuditLog.objects.create(
            user=self.user,
            action="update",
            content_type="Article",
            content_id="1",
            changes=changes
        )
        self.assertEqual(log.changes["title"], ["Old Title", "New Title"])

    def test_audit_log_timestamp(self):
        """Test audit log timestamp"""
        log = AuditLog.objects.create(
            user=self.user,
            action="create",
            content_type="Article",
            content_id="1"
        )
        self.assertIsNotNone(log.timestamp)

    def test_audit_log_status_choices(self):
        """Test audit log with different actions"""
        create_log = AuditLog.objects.create(
            user=self.user,
            action="create",
            content_type="Article",
            content_id="1"
        )
        delete_log = AuditLog.objects.create(
            user=self.user,
            action="delete",
            content_type="Article",
            content_id="1"
        )
        self.assertEqual(create_log.action, "create")
        self.assertEqual(delete_log.action, "delete")


class FileModelTest(TestCase):
    """Test cases for File model including link attachment functionality"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="filetestuser",
            email="filetest@test.com",
            password="testpass123"
        )
        self.category = Category.objects.create(
            name_en="General",
            name_id="Umum",
            slug="general"
        )
        self.article = Article.objects.create(
            title_en="Article with Attachments",
            title_id="Artikel dengan Lampiran",
            author=self.user,
            category=self.category,
            content_en="Content",
            content_id="Konten",
            media_url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        )

    def test_article_media_url_field(self):
        """Test Article media_url field for audiovisual knowledge"""
        self.assertEqual(self.article.media_url, "https://www.youtube.com/watch?v=dQw4w9WgXcQ")

    def test_file_link_attachment(self):
        """Test File model as external link attachment (no physical file uploaded)"""
        link_file = File.objects.create(
            article=self.article,
            link_url="https://drive.google.com/file/d/12345/view",
            original_filename="Bahan Paparan Rapat Sidang",
            mime_type="link",
            description_id="Dokumen Google Drive",
            uploaded_by=self.user
        )
        self.assertTrue(link_file.is_link)
        self.assertEqual(link_file.link_url, "https://drive.google.com/file/d/12345/view")
        self.assertEqual(link_file.file_size, 0)
        self.assertEqual(link_file.original_filename, "Bahan Paparan Rapat Sidang")


class InfographicImageModelTest(TestCase):
    """Test cases for InfographicImage multi-slide model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="infouser",
            email="info@test.com",
            password="testpass123"
        )
        self.category = Category.objects.create(
            name_en="Infographic",
            name_id="Infografis",
            slug="infografis"
        )
        self.article = Article.objects.create(
            title_en="Sequential Infographic 2026",
            title_id="Infografis Berantai 2026",
            author=self.user,
            category=self.category,
            knowledge_type="infografis",
            content_en="Content",
            content_id="Konten"
        )

    def test_infographic_slides_order(self):
        """Test creating multiple slides with sequential ordering"""
        slide1 = InfographicImage.objects.create(
            article=self.article,
            image_url="https://example.com/slide1.png",
            caption="Halaman 1: Latar Belakang",
            order_index=0
        )
        slide2 = InfographicImage.objects.create(
            article=self.article,
            image_url="https://example.com/slide2.png",
            caption="Halaman 2: Data dan Metrik",
            order_index=1
        )
        slide3 = InfographicImage.objects.create(
            article=self.article,
            image_url="https://example.com/slide3.png",
            caption="Halaman 3: Kesimpulan & Rekomendasi",
            order_index=2
        )

        slides = list(self.article.infographic_images.all())
        self.assertEqual(len(slides), 3)
        self.assertEqual(slides[0].caption, "Halaman 1: Latar Belakang")
        self.assertEqual(slides[1].caption, "Halaman 2: Data dan Metrik")
        self.assertEqual(slides[2].caption, "Halaman 3: Kesimpulan & Rekomendasi")


