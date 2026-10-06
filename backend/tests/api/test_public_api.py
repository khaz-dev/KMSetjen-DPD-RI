"""Tests for public API endpoints."""
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.content.models import Article, Category, Tag
from apps.core.models import Role

User = get_user_model()


@pytest.fixture
def api_client():
    """Return API client."""
    return APIClient()


@pytest.fixture
def published_article(db):
    """Create a published article."""
    user = User.objects.create_user(
        username='author',
        email='author@test.com',
        password='pass123'
    )
    category = Category.objects.create(
        name_id='Published Category',
        name_en='Published Category',
        slug='published-category'
    )
    article = Article.objects.create(
        title_id='Test Article',
        title_en='Test Article',
        content_id='Test content in Indonesian',
        content_en='Test content in English',
        summary_id='Summary in Indonesian',
        summary_en='Summary in English',
        author=user,
        category=category,
        status='published',
        access_level='public',
        is_published=True,
        version_type='published',
    )
    return article


@pytest.fixture
def draft_article(db):
    """Create a draft article (not published)."""
    user = User.objects.create_user(
        username='author2',
        email='author2@test.com',
        password='pass123'
    )
    category = Category.objects.create(
        name_id='Category 2',
        name_en='Category 2'
    )
    article = Article.objects.create(
        title_id='Draft Article',
        title_en='Draft Article',
        content_id='Draft content',
        content_en='Draft content',
        author=user,
        category=category,
        status='DRAFT',
        access_level='PUBLIC',
        is_published=False,
    )
    return article


@pytest.fixture
def category(db):
    """Create a category."""
    return Category.objects.create(
        name_id='Test Category',
        name_en='Test Category'
    )


@pytest.fixture
def tag(db):
    """Create a tag."""
    return Tag.objects.create(
        name_id='Test Tag',
        name_en='Test Tag'
    )


class TestArticlePublicAPI:
    """Test public article API endpoints."""
    
    @pytest.mark.django_db
    def test_list_articles(self, api_client, published_article):
        """Test listing published articles."""
        response = api_client.get('/api/v1/public/articles/')
        assert response.status_code == 200
        assert 'results' in response.data or 'count' in response.data
    
    @pytest.mark.django_db
    def test_list_excludes_draft_articles(self, api_client, published_article, draft_article):
        """Test that draft articles are excluded from listing."""
        response = api_client.get('/api/v1/public/articles/')
        assert response.status_code == 200
        titles = [item.get('title_en') for item in response.data.get('results', [])]
        assert 'Test Article' in titles
        assert 'Draft Article' not in titles
    
    @pytest.mark.django_db
    def test_article_detail(self, api_client, published_article):
        """Test article detail endpoint."""
        response = api_client.get(f'/api/v1/public/articles/{published_article.id}/')
        assert response.status_code == 200
        assert response.data['title_en'] == 'Test Article'
        assert response.data['content_en'] == 'Test content in English'
    
    @pytest.mark.django_db
    def test_article_search(self, api_client, published_article):
        """Test article search by title."""
        response = api_client.get('/api/v1/public/articles/?search=Test')
        assert response.status_code == 200
        results = response.data.get('results', [])
        assert len(results) > 0
    
    @pytest.mark.django_db
    def test_article_filter_by_category(self, api_client, published_article, category):
        """Test filtering articles by category."""
        response = api_client.get(f'/api/v1/public/articles/?category={category.id}')
        assert response.status_code == 200
    
    @pytest.mark.django_db
    def test_trending_articles(self, api_client, published_article):
        """Test trending articles endpoint."""
        # Update view count
        published_article.view_count = 10
        published_article.save()
        
        response = api_client.get('/api/v1/public/articles/trending/')
        assert response.status_code == 200
    
    @pytest.mark.django_db
    def test_latest_articles(self, api_client, published_article):
        """Test latest articles endpoint."""
        response = api_client.get('/api/v1/public/articles/latest/')
        assert response.status_code == 200

    @pytest.mark.django_db
    def test_popular_articles(self, api_client, published_article):
        """Test popular articles endpoint."""
        published_article.view_count = 25
        published_article.save()

        response = api_client.get('/api/v1/public/articles/popular/')
        assert response.status_code == 200
    
    @pytest.mark.django_db
    def test_record_view(self, api_client, published_article):
        """Test recording article view."""
        initial_count = published_article.view_count
        response = api_client.post(f'/api/v1/public/articles/{published_article.id}/view/')
        assert response.status_code == 200
        assert response.data['success'] is True


class TestCategoryPublicAPI:
    """Test public category API endpoints."""
    
    @pytest.mark.django_db
    def test_list_categories(self, api_client, category):
        """Test listing categories."""
        response = api_client.get('/api/v1/public/categories/')
        assert response.status_code == 200
        assert 'results' in response.data or 'count' in response.data
    
    @pytest.mark.django_db
    def test_category_detail(self, api_client, category):
        """Test category detail endpoint."""
        response = api_client.get(f'/api/v1/public/categories/{category.id}/')
        assert response.status_code == 200
        assert response.data['name_en'] == 'Test Category'


class TestTagPublicAPI:
    """Test public tag API endpoints."""
    
    @pytest.mark.django_db
    def test_list_tags(self, api_client, tag):
        """Test listing tags."""
        response = api_client.get('/api/v1/public/tags/')
        assert response.status_code == 200
        assert 'results' in response.data or 'count' in response.data
    
    @pytest.mark.django_db
    def test_tag_detail(self, api_client, tag):
        """Test tag detail endpoint."""
        response = api_client.get(f'/api/v1/public/tags/{tag.id}/')
        assert response.status_code == 200
        assert response.data['name_en'] == 'Test Tag'
