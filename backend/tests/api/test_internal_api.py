"""Tests for internal (authenticated) API endpoints."""
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from apps.content.models import Article, Category
from apps.core.models import Role

User = get_user_model()


@pytest.fixture
def api_client():
    """Return API client."""
    return APIClient()


@pytest.fixture
def contributor_user(db):
    """Create contributor user."""
    user = User.objects.create_user(
        username='contributor',
        email='contributor@test.com',
        password='pass123'
    )
    role = Role.objects.get_or_create(code='CONTRIBUTOR')[0]
    user.roles.add(role)
    return user


@pytest.fixture
def editor_user(db):
    """Create editor user."""
    user = User.objects.create_user(
        username='editor',
        email='editor@test.com',
        password='pass123'
    )
    role = Role.objects.get_or_create(code='EDITOR')[0]
    user.roles.add(role)
    return user


@pytest.fixture
def authenticated_client(api_client, contributor_user):
    """Return authenticated API client."""
    refresh = RefreshToken.for_user(contributor_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def editor_client(api_client, editor_user):
    """Return authenticated client for editor."""
    refresh = RefreshToken.for_user(editor_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def category(db):
    """Create a category."""
    return Category.objects.create(
        name_id='Test Category',
        name_en='Test Category'
    )


@pytest.fixture
def user_article(db, contributor_user, category):
    """Create article owned by user."""
    return Article.objects.create(
        title_id='User Article',
        title_en='User Article',
        content_id='Content',
        content_en='Content',
        author=contributor_user,
        category=category,
        status='DRAFT',
        access_level='PUBLIC',
        is_published=False,
    )


class TestArticleCreateAPI:
    """Test article creation endpoints."""
    
    @pytest.mark.django_db
    def test_create_article(self, authenticated_client, category):
        """Test creating a new article."""
        data = {
            'title_id': 'New Article',
            'title_en': 'New Article',
            'content_id': 'Content in Indonesian',
            'content_en': 'Content in English',
            'summary_id': 'Summary',
            'summary_en': 'Summary',
            'category': category.id,
            'status': 'DRAFT',
            'access_level': 'PUBLIC',
            'is_bilingual': True,
            'language': 'id',
        }
        
        response = authenticated_client.post('/api/v1/internal/articles/', data, format='json')
        assert response.status_code == 201
        assert response.data['title_en'] == 'New Article'
    
    @pytest.mark.django_db
    def test_create_article_anonymous_fails(self, api_client, category):
        """Test that anonymous users cannot create articles."""
        data = {
            'title_id': 'New Article',
            'title_en': 'New Article',
            'content_id': 'Content',
            'content_en': 'Content',
            'category': category.id,
        }
        
        response = api_client.post('/api/v1/internal/articles/', data, format='json')
        assert response.status_code == 401


class TestArticleUpdateAPI:
    """Test article update endpoints."""
    
    @pytest.mark.django_db
    def test_update_article(self, authenticated_client, user_article):
        """Test updating own article."""
        data = {
            'title_en': 'Updated Title',
        }
        
        response = authenticated_client.patch(
            f'/api/v1/internal/articles/{user_article.id}/',
            data,
            format='json'
        )
        assert response.status_code == 200
        assert response.data['title_en'] == 'Updated Title'
    
    @pytest.mark.django_db
    def test_update_other_user_article_fails(self, authenticated_client, db, category):
        """Test that user cannot update another user's article."""
        other_user = User.objects.create_user(
            username='other',
            email='other@test.com',
            password='pass123'
        )
        
        article = Article.objects.create(
            title_id='Other Article',
            title_en='Other Article',
            content_id='Content',
            content_en='Content',
            author=other_user,
            category=category,
            status='DRAFT',
            access_level='PUBLIC',
        )
        
        data = {'title_en': 'Hacked!'}
        response = authenticated_client.patch(
            f'/api/v1/internal/articles/{article.id}/',
            data,
            format='json'
        )
        assert response.status_code == 403
    
    @pytest.mark.django_db
    def test_editor_can_update_any_article(self, editor_client, db, category):
        """Test that editor can update any article."""
        author = User.objects.create_user(
            username='author',
            email='author@test.com',
            password='pass123'
        )
        
        article = Article.objects.create(
            title_id='Article',
            title_en='Article',
            content_id='Content',
            content_en='Content',
            author=author,
            category=category,
            status='DRAFT',
            access_level='PUBLIC',
        )
        
        data = {'title_en': 'Editor Updated'}
        response = editor_client.patch(
            f'/api/v1/internal/articles/{article.id}/',
            data,
            format='json'
        )
        assert response.status_code == 200


class TestArticleDeleteAPI:
    """Test article deletion endpoints."""
    
    @pytest.mark.django_db
    def test_delete_article(self, authenticated_client, user_article):
        """Test deleting own article."""
        response = authenticated_client.delete(
            f'/api/v1/internal/articles/{user_article.id}/'
        )
        assert response.status_code == 204
        assert not Article.objects.filter(id=user_article.id).exists()
    
    @pytest.mark.django_db
    def test_delete_other_user_article_fails(self, authenticated_client, db, category):
        """Test that user cannot delete another user's article."""
        other_user = User.objects.create_user(
            username='other',
            email='other@test.com',
            password='pass123'
        )
        
        article = Article.objects.create(
            title_id='Other Article',
            title_en='Other Article',
            content_id='Content',
            content_en='Content',
            author=other_user,
            category=category,
            status='DRAFT',
            access_level='PUBLIC',
        )
        
        response = authenticated_client.delete(
            f'/api/v1/internal/articles/{article.id}/'
        )
        assert response.status_code == 403


class TestArticleWorkflowAPI:
    """Test article workflow endpoints."""
    
    @pytest.mark.django_db
    def test_submit_for_review(self, authenticated_client, user_article):
        """Test submitting article for review."""
        data = {'comment': 'Ready for review'}
        
        response = authenticated_client.post(
            f'/api/v1/internal/articles/{user_article.id}/submit-review/',
            data,
            format='json'
        )
        assert response.status_code == 200
        assert response.data['status'] == 'REVIEW'
    
    @pytest.mark.django_db
    def test_approve_article(self, editor_client, db, category):
        """Test approving article (editor only)."""
        author = User.objects.create_user(
            username='author',
            email='author@test.com',
            password='pass123'
        )
        
        article = Article.objects.create(
            title_id='Article',
            title_en='Article',
            content_id='Content',
            content_en='Content',
            author=author,
            category=category,
            status='REVIEW',
            access_level='PUBLIC',
        )
        
        response = editor_client.post(
            f'/api/v1/internal/articles/{article.id}/approve/'
        )
        assert response.status_code == 200
        assert response.data['status'] == 'APPROVED'
    
    @pytest.mark.django_db
    def test_publish_article(self, editor_client, db, category):
        """Test publishing article (editor only)."""
        author = User.objects.create_user(
            username='author',
            email='author@test.com',
            password='pass123'
        )
        
        article = Article.objects.create(
            title_id='Article',
            title_en='Article',
            content_id='Content',
            content_en='Content',
            author=author,
            category=category,
            status='APPROVED',
            access_level='PUBLIC',
        )
        
        response = editor_client.post(
            f'/api/v1/internal/articles/{article.id}/publish/'
        )
        assert response.status_code == 200
        assert response.data['status'] == 'PUBLISHED'
        assert response.data['is_published'] is True
    
    @pytest.mark.django_db
    def test_reject_article(self, editor_client, db, category):
        """Test rejecting article (editor only)."""
        author = User.objects.create_user(
            username='author',
            email='author@test.com',
            password='pass123'
        )
        
        article = Article.objects.create(
            title_id='Article',
            title_en='Article',
            content_id='Content',
            content_en='Content',
            author=author,
            category=category,
            status='REVIEW',
            access_level='PUBLIC',
        )
        
        data = {'reason': 'Needs more detail'}
        response = editor_client.post(
            f'/api/v1/internal/articles/{article.id}/reject/',
            data,
            format='json'
        )
        assert response.status_code == 200
        assert response.data['status'] == 'REJECTED'
    
    @pytest.mark.django_db
    def test_archive_article(self, authenticated_client, user_article):
        """Test archiving own article."""
        response = authenticated_client.post(
            f'/api/v1/internal/articles/{user_article.id}/archive/'
        )
        assert response.status_code == 200
        assert response.data['status'] == 'ARCHIVED'


class TestArticleListAPI:
    """Test article list endpoints."""
    
    @pytest.mark.django_db
    def test_list_own_articles(self, authenticated_client, user_article):
        """Test listing user's articles."""
        response = authenticated_client.get('/api/v1/internal/articles/')
        assert response.status_code == 200
        assert response.data['count'] == 1
    
    @pytest.mark.django_db
    def test_list_all_articles_as_editor(self, editor_client, db, category):
        """Test that editor sees all articles."""
        author = User.objects.create_user(
            username='author',
            email='author@test.com',
            password='pass123'
        )
        
        # Create articles by different authors
        Article.objects.create(
            title_id='Article 1',
            title_en='Article 1',
            content_id='Content',
            content_en='Content',
            author=author,
            category=category,
            status='DRAFT',
            access_level='PUBLIC',
        )
        
        response = editor_client.get('/api/v1/internal/articles/')
        assert response.status_code == 200
        assert response.data['count'] >= 1


class TestDashboardAPI:
    """Test dashboard endpoint."""
    
    @pytest.mark.django_db
    def test_get_dashboard(self, authenticated_client, contributor_user):
        """Test getting user dashboard."""
        response = authenticated_client.get('/api/v1/internal/articles/dashboard/')
        assert response.status_code == 200
        assert 'user' in response.data
        assert 'statistics' in response.data
        assert 'recent_articles' in response.data
        assert response.data['user']['username'] == 'contributor'
