from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework.reverse import reverse
from apps.content.models import Article, Category, Tag, AuditLog
from apps.auth.models import Role

User = get_user_model()


class ArticleAPITests(APITestCase):
    """Test Article API endpoints"""

    def setUp(self):
        self.role = Role.objects.create(
            code="editor",
            name_en="Editor",
            name_id="Editor"
        )
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            role=self.role
        )
        self.category = Category.objects.create(
            name_en="Technology",
            name_id="Teknologi",
            slug="technology"
        )
        
        # Create test articles
        for i in range(3):
            Article.objects.create(
                title_en=f"Article {i}",
                title_id=f"Artikel {i}",
                author=self.user,
                category=self.category,
                content_en=f"Content {i}",
                content_id=f"Konten {i}",
                status="published"
            )

    def test_article_list(self):
        """Verify article list endpoint works"""
        url = reverse("article-list")
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get("results", [])), 3)

    def test_article_detail(self):
        """Verify article detail endpoint works"""
        article = Article.objects.first()
        url = reverse("article-detail", kwargs={"pk": article.id})
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title_en"], article.title_en)

    def test_article_not_found(self):
        """Verify 404 for nonexistent article"""
        url = reverse("article-detail", kwargs={"pk": 9999})
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class CategoryAPITests(APITestCase):
    """Test Category API endpoints"""

    def setUp(self):
        for i in range(3):
            Category.objects.create(
                name_en=f"Category {i}",
                name_id=f"Kategori {i}",
                slug=f"category-{i}"
            )

    def test_category_list(self):
        """Verify category list endpoint works"""
        url = reverse("category-list")
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get("results", [])), 3)


class StatisticsAPITests(APITestCase):
    """Test Statistics API endpoint"""

    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpass123"
        )
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        self.category = Category.objects.create(
            name_en="News",
            name_id="Berita",
            slug="news"
        )
        
        Article.objects.create(
            title_en="Published",
            title_id="Dipublikasikan",
            author=self.user,
            category=self.category,
            content_en="Content",
            content_id="Konten",
            status="published"
        )
        Article.objects.create(
            title_en="Draft",
            title_id="Draft",
            author=self.user,
            category=self.category,
            content_en="Content",
            content_id="Konten",
            status="draft"
        )

    def test_statistics_requires_auth(self):
        """Verify statistics endpoint requires authentication"""
        url = reverse("admin-statistics")
        response = self.client.get(url, format="json")
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_statistics_with_auth(self):
        """Verify statistics endpoint returns data when authenticated"""
        self.client.force_authenticate(user=self.admin)
        url = reverse("admin-statistics")
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_users", response.data)
        self.assertIn("total_articles", response.data)

    def test_statistics_counts(self):
        """Verify statistics counts are correct"""
        self.client.force_authenticate(user=self.admin)
        url = reverse("admin-statistics")
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_articles"], 2)
        self.assertEqual(response.data["published_articles"], 1)


class AuditLogAPITests(APITestCase):
    """Test AuditLog API endpoint"""

    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpass123"
        )
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123"
        )
        
        for i in range(5):
            AuditLog.objects.create(
                user=self.user,
                action=f"action_{i}",
                description=f"Test action {i}",
                status="success"
            )

    def test_audit_log_list_requires_auth(self):
        """Verify audit log list requires authentication"""
        url = reverse("auditlog-list")
        response = self.client.get(url, format="json")
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_audit_log_list_with_auth(self):
        """Verify audit log list returns data when authenticated"""
        self.client.force_authenticate(user=self.admin)
        url = reverse("auditlog-list")
        response = self.client.get(url, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data.get("results", [])), 5)
