from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.content.models import Article, Category, Tag, AuditLog
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
        self.assertEqual(str(self.category), "Technology")

    def test_category_absolute_url(self):
        """Test category absolute URL"""
        url = self.category.get_absolute_url()
        self.assertIn("technology", url)

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
        self.assertIn("Test Article", str(self.article))

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
            action="article_created",
            description="User created an article",
            status="success"
        )
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.action, "article_created")

    def test_audit_log_with_metadata(self):
        """Test audit log with metadata"""
        metadata = {"article_id": 1, "title": "Test"}
        log = AuditLog.objects.create(
            user=self.user,
            action="article_modified",
            description="Article modified",
            metadata=metadata,
            status="success"
        )
        self.assertEqual(log.metadata["article_id"], 1)

    def test_audit_log_timestamp(self):
        """Test audit log timestamp"""
        log = AuditLog.objects.create(
            user=self.user,
            action="login",
            description="User logged in",
            status="success"
        )
        self.assertIsNotNone(log.created_at)

    def test_audit_log_status_choices(self):
        """Test audit log status choices"""
        success_log = AuditLog.objects.create(
            user=self.user,
            action="test",
            status="success"
        )
        failure_log = AuditLog.objects.create(
            user=self.user,
            action="test",
            status="failure"
        )
        self.assertEqual(success_log.status, "success")
        self.assertEqual(failure_log.status, "failure")
