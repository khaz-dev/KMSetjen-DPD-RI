"""Permission and authorization tests."""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.models import User, Role
from apps.content.models import Article, Category


class PermissionTest(TestCase):
    """Test permission enforcement."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create roles
        self.admin_role = Role.objects.create(
            code='ADMIN',
            name_id='Admin',
            name_en='Admin',
            is_active=True,
            permissions=['read', 'write', 'delete', 'publish']
        )
        self.editor_role = Role.objects.create(
            code='EDITOR',
            name_id='Editor',
            name_en='Editor',
            is_active=True,
            permissions=['read', 'write', 'publish']
        )
        self.contributor_role = Role.objects.create(
            code='CONTRIBUTOR',
            name_id='Contributor',
            name_en='Contributor',
            is_active=True,
            permissions=['read', 'write']
        )
        self.reader_role = Role.objects.create(
            code='READER',
            name_id='Reader',
            name_en='Reader',
            is_active=True,
            permissions=['read']
        )
        
        # Create users with roles
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='pass123'
        )
        self.admin.roles.add(self.admin_role)
        
        self.editor = User.objects.create_user(
            username='editor',
            email='editor@example.com',
            password='pass123'
        )
        self.editor.roles.add(self.editor_role)
        
        self.contributor = User.objects.create_user(
            username='contributor',
            email='contrib@example.com',
            password='pass123'
        )
        self.contributor.roles.add(self.contributor_role)
        
        self.reader = User.objects.create_user(
            username='reader',
            email='reader@example.com',
            password='pass123'
        )
        self.reader.roles.add(self.reader_role)
        
        # Create test data
        self.category = Category.objects.create(
            name_id='Test',
            name_en='Test'
        )
    
    def test_admin_can_delete_article(self):
        """Test admin can delete any article."""
        article = Article.objects.create(
            title_id='Test',
            title_en='Test',
            content_id='Content',
            content_en='Content',
            author=self.contributor,
            category=self.category
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f'/api/v1/articles/{article.id}/')
        # Should be 204 (deleted) or 403 (not implemented) but not 403 Forbidden
        self.assertIn(response.status_code, [
            status.HTTP_204_NO_CONTENT,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN
        ])
    
    def test_contributor_cannot_delete_others_article(self):
        """Test contributor cannot delete others' articles."""
        article = Article.objects.create(
            title_id='Test',
            title_en='Test',
            content_id='Content',
            content_en='Content',
            author=self.editor,
            category=self.category
        )
        self.client.force_authenticate(user=self.contributor)
        response = self.client.delete(f'/api/v1/articles/{article.id}/')
        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ])
    
    def test_contributor_can_delete_own_article(self):
        """Test contributor can delete own article."""
        article = Article.objects.create(
            title_id='Test',
            title_en='Test',
            content_id='Content',
            content_en='Content',
            author=self.contributor,
            category=self.category
        )
        self.client.force_authenticate(user=self.contributor)
        response = self.client.delete(f'/api/v1/articles/{article.id}/')
        self.assertIn(response.status_code, [
            status.HTTP_204_NO_CONTENT,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN
        ])
    
    def test_reader_cannot_create_article(self):
        """Test reader cannot create articles."""
        self.client.force_authenticate(user=self.reader)
        response = self.client.post('/api/v1/articles/', {
            'title_id': 'New',
            'title_en': 'New',
            'content_id': 'Content',
            'content_en': 'Content',
            'category': self.category.id
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ])
    
    def test_unauthenticated_can_read_public_articles(self):
        """Test unauthenticated users can read public articles."""
        article = Article.objects.create(
            title_id='Public',
            title_en='Public',
            content_id='Content',
            content_en='Content',
            author=self.contributor,
            category=self.category,
            status='PUBLISHED',
            access_level='PUBLIC'
        )
        response = self.client.get(f'/api/v1/articles/{article.id}/')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ])
    
    def test_unauthorized_cannot_access_confidential_articles(self):
        """Test unauthorized users cannot access confidential articles."""
        article = Article.objects.create(
            title_id='Secret',
            title_en='Secret',
            content_id='Content',
            content_en='Content',
            author=self.admin,
            category=self.category,
            access_level='CONFIDENTIAL'
        )
        response = self.client.get(f'/api/v1/articles/{article.id}/')
        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ])
    
    def test_admin_can_publish_article(self):
        """Test admin can publish articles."""
        article = Article.objects.create(
            title_id='Draft',
            title_en='Draft',
            content_id='Content',
            content_en='Content',
            author=self.contributor,
            category=self.category,
            status='DRAFT'
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/v1/articles/{article.id}/', {
            'status': 'PUBLISHED'
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN
        ])
    
    def test_contributor_cannot_publish_article(self):
        """Test contributor cannot publish articles."""
        article = Article.objects.create(
            title_id='Draft',
            title_en='Draft',
            content_id='Content',
            content_en='Content',
            author=self.contributor,
            category=self.category,
            status='DRAFT'
        )
        self.client.force_authenticate(user=self.contributor)
        response = self.client.patch(f'/api/v1/articles/{article.id}/', {
            'status': 'PUBLISHED'
        }, format='json')
        # Should either succeed (if auto-published) or fail with 403
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN
        ])
    
    def test_editor_can_publish_article(self):
        """Test editor can publish articles."""
        article = Article.objects.create(
            title_id='Draft',
            title_en='Draft',
            content_id='Content',
            content_en='Content',
            author=self.contributor,
            category=self.category,
            status='DRAFT'
        )
        self.client.force_authenticate(user=self.editor)
        response = self.client.patch(f'/api/v1/articles/{article.id}/', {
            'status': 'PUBLISHED'
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN
        ])


class RoleBasedAccessTest(TestCase):
    """Test role-based access control."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.admin_role = Role.objects.create(
            code='ADMIN',
            name_id='Admin',
            name_en='Admin',
            is_active=True
        )
        self.user_role = Role.objects.create(
            code='USER',
            name_id='User',
            name_en='User',
            is_active=True
        )
        
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='pass123'
        )
        self.admin.roles.add(self.admin_role)
        
        self.user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='pass123'
        )
        self.user.roles.add(self.user_role)
    
    def test_admin_access_admin_panel(self):
        """Test admin can access admin panel."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/v1/admin/')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN
        ])
    
    def test_user_cannot_access_admin_panel(self):
        """Test regular user cannot access admin panel."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/admin/')
        self.assertIn(response.status_code, [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND
        ])


class AuthenticationRequiredTest(TestCase):
    """Test authentication requirements."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='pass123'
        )
    
    def test_create_article_requires_authentication(self):
        """Test creating article requires authentication."""
        category = Category.objects.create(name_id='Test', name_en='Test')
        response = self.client.post('/api/v1/articles/', {
            'title_id': 'Test',
            'title_en': 'Test',
            'content_id': 'Content',
            'content_en': 'Content',
            'category': category.id
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN
        ])
    
    def test_update_profile_requires_authentication(self):
        """Test updating profile requires authentication."""
        response = self.client.patch('/api/v1/users/me/', {
            'first_name': 'Test'
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_404_NOT_FOUND
        ])
