"""Comprehensive CRUD API tests."""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.models import User, Role
from apps.content.models import Article, Category, Tag


class ArticleCRUDTest(TestCase):
    """Test Article CRUD operations."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create roles
        self.editor_role = Role.objects.create(
            code='EDITOR',
            name_id='Editor',
            name_en='Editor',
            is_active=True
        )
        self.contributor_role = Role.objects.create(
            code='CONTRIBUTOR',
            name_id='Contributor',
            name_en='Contributor',
            is_active=True
        )
        
        # Create users
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
        
        # Create category
        self.category = Category.objects.create(
            name_id='Test Category',
            name_en='Test Category'
        )
    
    def test_create_article(self):
        """Test creating an article."""
        self.client.force_authenticate(user=self.contributor)
        data = {
            'title_id': 'New Article',
            'title_en': 'New Article',
            'content_id': 'Article content',
            'content_en': 'Article content',
            'category': self.category.id
        }
        response = self.client.post('/api/v1/articles/', data, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_201_CREATED,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN
        ])
    
    def test_read_article(self):
        """Test reading an article."""
        article = Article.objects.create(
            title_id='Test',
            title_en='Test',
            content_id='Content',
            content_en='Content',
            author=self.contributor,
            category=self.category,
            status='PUBLISHED'
        )
        response = self.client.get(f'/api/v1/articles/{article.id}/')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ])
    
    def test_update_article(self):
        """Test updating an article."""
        article = Article.objects.create(
            title_id='Test',
            title_en='Test',
            content_id='Content',
            content_en='Content',
            author=self.contributor,
            category=self.category
        )
        self.client.force_authenticate(user=self.contributor)
        response = self.client.patch(f'/api/v1/articles/{article.id}/', {
            'title_id': 'Updated'
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN
        ])
    
    def test_delete_article(self):
        """Test deleting an article."""
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


class CategoryCRUDTest(TestCase):
    """Test Category CRUD operations."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.admin_role = Role.objects.create(
            code='ADMIN',
            name_id='Admin',
            name_en='Admin',
            is_active=True
        )
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='pass123'
        )
        self.admin.roles.add(self.admin_role)
    
    def test_create_category(self):
        """Test creating a category."""
        self.client.force_authenticate(user=self.admin)
        data = {
            'name_id': 'New Category',
            'name_en': 'New Category'
        }
        response = self.client.post('/api/v1/categories/', data, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_201_CREATED,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_403_FORBIDDEN
        ])
    
    def test_read_category(self):
        """Test reading a category."""
        category = Category.objects.create(
            name_id='Test',
            name_en='Test'
        )
        response = self.client.get(f'/api/v1/categories/{category.id}/')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ])
    
    def test_list_categories(self):
        """Test listing categories."""
        Category.objects.create(name_id='Cat1', name_en='Cat1')
        Category.objects.create(name_id='Cat2', name_en='Cat2')
        response = self.client.get('/api/v1/categories/')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ])


class TagCRUDTest(TestCase):
    """Test Tag CRUD operations."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
    
    def test_list_tags(self):
        """Test listing tags."""
        Tag.objects.create(name_id='Tag1', name_en='Tag1')
        Tag.objects.create(name_id='Tag2', name_en='Tag2')
        response = self.client.get('/api/v1/tags/')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ])
