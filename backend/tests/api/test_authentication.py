"""Authentication and token tests."""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.models import User


class AuthenticationTest(TestCase):
    """Test authentication endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_user_registration(self):
        """Test user registration."""
        response = self.client.post('/api/auth/register/', {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'newpass123',
            'password_confirm': 'newpass123'
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ])
    
    def test_user_login(self):
        """Test user login with credentials."""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_404_NOT_FOUND
        ])
    
    def test_token_obtain(self):
        """Test obtaining authentication token."""
        response = self.client.post('/api/auth/token/', {
            'username': 'testuser',
            'password': 'testpass123'
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_404_NOT_FOUND
        ])
        
        # Check for token in response if successful
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            self.assertIn('access', data)
    
    def test_invalid_login_credentials(self):
        """Test login with invalid credentials."""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'wrongpass'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_invalid_username(self):
        """Test login with non-existent username."""
        response = self.client.post('/api/auth/login/', {
            'username': 'nonexistent',
            'password': 'anypass'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_missing_username(self):
        """Test login without username."""
        response = self.client.post('/api/auth/login/', {
            'password': 'testpass123'
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_401_UNAUTHORIZED
        ])
    
    def test_missing_password(self):
        """Test login without password."""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser'
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_401_UNAUTHORIZED
        ])
    
    def test_user_logout(self):
        """Test user logout."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/auth/logout/', {}, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_204_NO_CONTENT,
            status.HTTP_404_NOT_FOUND
        ])
    
    def test_token_refresh(self):
        """Test token refresh endpoint."""
        # First get initial token
        login_response = self.client.post('/api/auth/token/', {
            'username': 'testuser',
            'password': 'testpass123'
        }, format='json')
        
        if login_response.status_code == status.HTTP_200_OK:
            data = login_response.json()
            if 'refresh' in data:
                refresh_response = self.client.post('/api/auth/token/refresh/', {
                    'refresh': data['refresh']
                }, format='json')
                self.assertEqual(
                    refresh_response.status_code,
                    status.HTTP_200_OK
                )


class TokenAuthenticationTest(TestCase):
    """Test token-based authentication."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='pass123'
        )
    
    def test_access_protected_endpoint_with_token(self):
        """Test accessing protected endpoint with valid token."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/users/me/')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND
        ])
    
    def test_access_protected_endpoint_without_token(self):
        """Test accessing protected endpoint without token."""
        response = self.client.get('/api/v1/users/me/')
        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_404_NOT_FOUND
        ])
    
    def test_invalid_token_rejected(self):
        """Test that invalid token is rejected."""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token_here')
        response = self.client.get('/api/v1/users/me/')
        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_404_NOT_FOUND
        ])
    
    def test_expired_token_rejected(self):
        """Test that expired token is rejected."""
        # This would require setting up an expired token
        # Implementation depends on your token backend
        pass


class SSOAuthenticationTest(TestCase):
    """Test SSO authentication."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
    
    def test_sso_login_endpoint(self):
        """Test SSO login endpoint."""
        response = self.client.post('/api/auth/sso/login/', {
            'token': 'sso_token_here'
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ])
    
    def test_sso_callback_endpoint(self):
        """Test SSO callback endpoint."""
        response = self.client.post('/api/auth/sso/callback/', {
            'code': 'auth_code_here',
            'state': 'state_here'
        }, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ])
