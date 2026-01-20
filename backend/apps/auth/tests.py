from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.auth.models import Role
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework.reverse import reverse

User = get_user_model()


class RoleTests(TestCase):
    """Test Role model"""

    def setUp(self):
        self.role = Role.objects.create(
            code="editor",
            name_en="Editor",
            name_id="Editor"
        )

    def test_role_creation(self):
        """Verify role is created correctly"""
        self.assertEqual(self.role.code, "editor")
        self.assertEqual(self.role.name_en, "Editor")

    def test_role_str(self):
        """Verify role string representation"""
        self.assertEqual(str(self.role), "Editor")


class UserTests(TestCase):
    """Test User model"""

    def setUp(self):
        self.role = Role.objects.create(
            code="user",
            name_en="User",
            name_id="Pengguna"
        )
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            role=self.role
        )

    def test_user_creation(self):
        """Verify user is created correctly"""
        self.assertEqual(self.user.username, "testuser")
        self.assertEqual(self.user.email, "test@example.com")
        self.assertTrue(self.user.check_password("testpass123"))

    def test_user_is_active(self):
        """Verify user is active by default"""
        self.assertTrue(self.user.is_active)

    def test_superuser_creation(self):
        """Verify superuser creation"""
        admin = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpass123"
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_user_deactivation(self):
        """Verify user can be deactivated"""
        self.user.is_active = False
        self.user.save()
        self.assertFalse(self.user.is_active)


class AuthenticationTests(APITestCase):
    """Test authentication endpoints"""

    def setUp(self):
        self.role = Role.objects.create(
            code="user",
            name_en="User",
            name_id="Pengguna"
        )
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            role=self.role
        )

    def test_user_login(self):
        """Verify login endpoint works"""
        url = reverse("token_obtain_pair")
        data = {
            "username": "testuser",
            "password": "testpass123"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_invalid_login(self):
        """Verify login rejects invalid credentials"""
        url = reverse("token_obtain_pair")
        data = {
            "username": "testuser",
            "password": "wrongpassword"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
