"""
Admin API Tests
===============

Tests for all admin endpoints:
- User management (CRUD, set password, activate/deactivate)
- Role management (CRUD, add/remove permissions)
- Permission listing
- Audit log viewing and filtering
- System statistics
"""

import json
from datetime import timedelta
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.models import Role
from apps.content.models import Article, Category
from apps.audit.models import AuditLog

User = get_user_model()


class AdminUserManagementTest(APITestCase):
    """Tests for admin user management endpoints."""
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data."""
        # Create roles
        cls.admin_role = Role.objects.create(code='ADMIN', name='Administrator')
        cls.editor_role = Role.objects.create(code='EDITOR', name='Editor')
        
        # Create admin user
        cls.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            is_staff=True
        )
        cls.admin_user.roles.add(cls.admin_role)
        
        # Create contributor user
        cls.contributor_user = User.objects.create_user(
            username='contributor',
            email='contributor@test.com',
            password='pass123',
            nip='123456'
        )
    
    def setUp(self):
        """Set up for each test."""
        self.client = APIClient()
        
        # Get admin token
        refresh = RefreshToken.for_user(self.admin_user)
        self.admin_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
    
    def test_list_users(self):
        """Test listing all users."""
        response = self.client.get('/api/v1/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_create_user(self):
        """Test creating new user."""
        data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'nip': '987654',
            'department': 'Testing'
        }
        response = self.client.post('/api/v1/admin/users/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'newuser')
        self.assertEqual(response.data['email'], 'newuser@test.com')
        
        # Verify user was created
        self.assertTrue(User.objects.filter(username='newuser').exists())
    
    def test_create_user_duplicate_username(self):
        """Test creating user with duplicate username fails."""
        data = {
            'username': 'admin',
            'email': 'duplicate@test.com',
            'password': 'pass123',
            'password_confirm': 'pass123'
        }
        response = self.client.post('/api/v1/admin/users/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_get_user_detail(self):
        """Test getting user detail."""
        response = self.client.get(f'/api/v1/admin/users/{self.contributor_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'contributor')
        self.assertEqual(response.data['nip'], '123456')
    
    def test_update_user(self):
        """Test updating user."""
        data = {
            'first_name': 'Updated',
            'email': 'updated@test.com'
        }
        response = self.client.patch(
            f'/api/v1/admin/users/{self.contributor_user.id}/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Updated')
        self.assertEqual(response.data['email'], 'updated@test.com')
    
    def test_add_role_to_user(self):
        """Test adding role to user."""
        data = {
            'roles': [self.editor_role.id]
        }
        response = self.client.patch(
            f'/api/v1/admin/users/{self.contributor_user.id}/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contributor_user.refresh_from_db()
        self.assertIn(self.editor_role, self.contributor_user.roles.all())
    
    def test_set_password(self):
        """Test admin setting user password."""
        data = {
            'password': 'newpass123',
            'password_confirm': 'newpass123'
        }
        response = self.client.post(
            f'/api/v1/admin/users/{self.contributor_user.id}/set-password/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was changed
        self.contributor_user.refresh_from_db()
        self.assertTrue(self.contributor_user.check_password('newpass123'))
    
    def test_activate_user(self):
        """Test activating inactive user."""
        self.contributor_user.is_active = False
        self.contributor_user.save()
        
        response = self.client.post(
            f'/api/v1/admin/users/{self.contributor_user.id}/activate/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contributor_user.refresh_from_db()
        self.assertTrue(self.contributor_user.is_active)
    
    def test_deactivate_user(self):
        """Test deactivating active user."""
        response = self.client.post(
            f'/api/v1/admin/users/{self.contributor_user.id}/deactivate/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contributor_user.refresh_from_db()
        self.assertFalse(self.contributor_user.is_active)
    
    def test_delete_user(self):
        """Test deleting user."""
        response = self.client.delete(
            f'/api/v1/admin/users/{self.contributor_user.id}/'
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(id=self.contributor_user.id).exists())


class AdminRoleManagementTest(APITestCase):
    """Tests for admin role management endpoints."""
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data."""
        cls.admin_role = Role.objects.create(code='ADMIN', name='Administrator')
        
        cls.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='adminpass123',
            is_staff=True
        )
        cls.admin_user.roles.add(cls.admin_role)
        
        cls.edit_permission = Permission.objects.create(
            code='EDIT_ARTICLES',
            name='Edit Articles'
        )
        cls.delete_permission = Permission.objects.create(
            code='DELETE_ARTICLES',
            name='Delete Articles'
        )
    
    def setUp(self):
        """Set up for each test."""
        self.client = APIClient()
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.admin_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
    
    def test_list_roles(self):
        """Test listing all roles."""
        response = self.client.get('/api/v1/admin/roles/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
    
    def test_create_role(self):
        """Test creating new role."""
        data = {
            'code': 'REVIEWER',
            'name': 'Article Reviewer',
            'description': 'Can review articles',
            'permissions': [self.edit_permission.id]
        }
        response = self.client.post('/api/v1/admin/roles/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 'REVIEWER')
        self.assertTrue(Role.objects.filter(code='REVIEWER').exists())
    
    def test_create_role_duplicate_code(self):
        """Test creating role with duplicate code fails."""
        data = {
            'code': 'ADMIN',
            'name': 'Another Admin'
        }
        response = self.client.post('/api/v1/admin/roles/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_get_role_detail(self):
        """Test getting role detail."""
        response = self.client.get(f'/api/v1/admin/roles/{self.admin_role.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 'ADMIN')
    
    def test_update_role(self):
        """Test updating role."""
        data = {
            'name': 'System Administrator'
        }
        response = self.client.patch(
            f'/api/v1/admin/roles/{self.admin_role.id}/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.admin_role.refresh_from_db()
        self.assertEqual(self.admin_role.name, 'System Administrator')
    
    def test_add_permission_to_role(self):
        """Test adding permission to role."""
        data = {
            'permission_id': self.edit_permission.id
        }
        response = self.client.post(
            f'/api/v1/admin/roles/{self.admin_role.id}/add-permission/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.admin_role.refresh_from_db()
        self.assertIn(self.edit_permission, self.admin_role.permissions.all())
    
    def test_remove_permission_from_role(self):
        """Test removing permission from role."""
        self.admin_role.permissions.add(self.edit_permission)
        
        data = {
            'permission_id': self.edit_permission.id
        }
        response = self.client.post(
            f'/api/v1/admin/roles/{self.admin_role.id}/remove-permission/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.admin_role.refresh_from_db()
        self.assertNotIn(self.edit_permission, self.admin_role.permissions.all())


class AdminAuditLogTest(APITestCase):
    """Tests for admin audit log endpoints."""
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data."""
        cls.admin_role = Role.objects.create(code='ADMIN', name='Administrator')
        
        cls.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='adminpass123',
            is_staff=True
        )
        cls.admin_user.roles.add(cls.admin_role)
        
        cls.test_user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='pass123'
        )
        
        # Create test audit logs
        cls.audit_log1 = AuditLog.objects.create(
            action='CREATE',
            resource_type='Article',
            resource_id=1,
            user=cls.test_user,
            ip_address='127.0.0.1',
            user_agent='Test Agent'
        )
        
        cls.audit_log2 = AuditLog.objects.create(
            action='UPDATE',
            resource_type='Article',
            resource_id=1,
            user=cls.test_user,
            ip_address='127.0.0.1',
            user_agent='Test Agent',
            changes={'title': ['Old Title', 'New Title']}
        )
    
    def setUp(self):
        """Set up for each test."""
        self.client = APIClient()
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.admin_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
    
    def test_list_audit_logs(self):
        """Test listing all audit logs."""
        response = self.client.get('/api/v1/admin/audit-logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertGreaterEqual(len(response.data['results']), 2)
    
    def test_get_audit_log_detail(self):
        """Test getting audit log detail."""
        response = self.client.get(f'/api/v1/admin/audit-logs/{self.audit_log1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['action'], 'CREATE')
    
    def test_filter_audit_logs_by_action(self):
        """Test filtering audit logs by action."""
        response = self.client.get(
            '/api/v1/admin/audit-logs/?action=CREATE'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['action'], 'CREATE')
    
    def test_filter_audit_logs_by_resource_type(self):
        """Test filtering audit logs by resource type."""
        response = self.client.get(
            '/api/v1/admin/audit-logs/?resource_type=Article'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_filter_audit_logs_by_user(self):
        """Test filtering audit logs by user."""
        response = self.client.get(
            f'/api/v1/admin/audit-logs/?user_id={self.test_user.id}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_advanced_filter(self):
        """Test advanced filtering."""
        data = {
            'action': 'CREATE',
            'resource_type': 'Article'
        }
        response = self.client.post(
            '/api/v1/admin/audit-logs/filter/',
            data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class AdminStatisticsTest(APITestCase):
    """Tests for admin statistics endpoints."""
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data."""
        cls.admin_role = Role.objects.create(code='ADMIN', name='Administrator')
        
        cls.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='adminpass123',
            is_staff=True
        )
        cls.admin_user.roles.add(cls.admin_role)
        
        # Create test users
        for i in range(3):
            User.objects.create_user(
                username=f'user{i}',
                email=f'user{i}@test.com',
                password='pass123'
            )
        
        # Create test articles
        cls.category = Category.objects.create(name_en='Test', name_id='Test')
        
        for i in range(5):
            Article.objects.create(
                title_en=f'Article {i}',
                title_id=f'Artikel {i}',
                content_en='Content',
                content_id='Konten',
                category=cls.category,
                author=cls.admin_user,
                status='PUBLISHED' if i < 3 else 'DRAFT',
                is_published=i < 3
            )
    
    def setUp(self):
        """Set up for each test."""
        self.client = APIClient()
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.admin_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
    
    def test_system_statistics(self):
        """Test system statistics endpoint."""
        response = self.client.get('/api/v1/admin/statistics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertEqual(data['total_users'], 4)  # 3 test users + 1 admin
        self.assertEqual(data['total_articles'], 5)
        self.assertEqual(data['published_articles'], 3)
        self.assertEqual(data['draft_articles'], 2)
    
    def test_user_statistics(self):
        """Test user statistics endpoint."""
        response = self.client.get('/api/v1/admin/statistics/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertEqual(data['total'], 4)
        self.assertEqual(data['active'], 4)
    
    def test_article_statistics(self):
        """Test article statistics endpoint."""
        response = self.client.get('/api/v1/admin/statistics/articles/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertEqual(data['total'], 5)
        self.assertEqual(data['published'], 3)
        self.assertEqual(data['draft'], 2)
    
    def test_audit_statistics(self):
        """Test audit statistics endpoint."""
        response = self.client.get('/api/v1/admin/statistics/audit/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertIn('total_logs', data)


class AdminPermissionTest(APITestCase):
    """Tests for admin permission restrictions."""
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data."""
        cls.admin_role = Role.objects.create(code='ADMIN', name='Administrator')
        
        cls.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='adminpass123',
            is_staff=True
        )
        cls.admin_user.roles.add(cls.admin_role)
        
        cls.normal_user = User.objects.create_user(
            username='normal',
            email='normal@test.com',
            password='pass123'
        )
    
    def test_non_admin_cannot_access_users_endpoint(self):
        """Test that non-admin users cannot access user management."""
        client = APIClient()
        refresh = RefreshToken.for_user(self.normal_user)
        token = str(refresh.access_token)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = client.get('/api/v1/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_non_admin_cannot_access_roles_endpoint(self):
        """Test that non-admin users cannot access role management."""
        client = APIClient()
        refresh = RefreshToken.for_user(self.normal_user)
        token = str(refresh.access_token)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        response = client.get('/api/v1/admin/roles/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_non_authenticated_cannot_access_admin_endpoints(self):
        """Test that unauthenticated users cannot access admin endpoints."""
        client = APIClient()
        
        response = client.get('/api/v1/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
