from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.content.models import Article, Category, Tag, AuditLog

User = get_user_model()


class CategoryTests(TestCase):
    """Test Category model"""

    def setUp(self):
        self.category = Category.objects.create(
            name_en="Technology",
            name_id="Teknologi",
            slug="technology"
        )

    def test_category_creation(self):
        """Verify category is created correctly"""
        self.assertEqual(self.category.name_en, "Technology")
        self.assertEqual(str(self.category), "Technology")

    def test_category_slug(self):
        """Verify category slug is set"""
        self.assertEqual(self.category.slug, "technology")


class ArticleTests(TestCase):
    """Test Article model"""

    def setUp(self):
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
            content_en="Test content",
            content_id="Konten uji",
            status="published"
        )

    def test_article_creation(self):
        """Verify article is created correctly"""
        self.assertEqual(self.article.title_en, "Test Article")
        self.assertEqual(self.article.status, "published")

    def test_article_slug(self):
        """Verify article slug is generated"""
        self.assertTrue(len(self.article.slug) > 0)

    def test_article_view_count(self):
        """Verify view count increments"""
        initial = self.article.view_count
        self.article.view_count += 1
        self.article.save()
        self.assertEqual(self.article.view_count, initial + 1)

    def test_article_add_tags(self):
        """Verify tags can be added to article"""
        tag = Tag.objects.create(name_en="Python", name_id="Python", slug="python")
        self.article.tags.add(tag)
        self.assertIn(tag, self.article.tags.all())


class TagTests(TestCase):
    """Test Tag model"""

    def test_tag_creation(self):
        """Verify tag is created correctly"""
        tag = Tag.objects.create(
            name_en="Python",
            name_id="Python",
            slug="python"
        )
        self.assertEqual(tag.name_en, "Python")
        self.assertEqual(tag.slug, "python")


class AuditLogTests(TestCase):
    """Test AuditLog model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@test.com",
            password="testpass123"
        )

    def test_audit_log_creation(self):
        """Verify audit log is created correctly"""
        log = AuditLog.objects.create(
            user=self.user,
            action="article_created",
            description="User created an article",
            status="success"
        )
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.action, "article_created")

    def test_audit_log_with_metadata(self):
        """Verify audit log can store metadata"""
        metadata = {"article_id": 1, "title": "Test"}
        log = AuditLog.objects.create(
            user=self.user,
            action="article_modified",
            description="Article modified",
            metadata=metadata,
            status="success"
        )
        self.assertEqual(log.metadata["article_id"], 1)

    def test_audit_log_status(self):
        """Verify audit log status options work"""
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
