from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.auth.models import Role
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework.reverse import reverse

User = get_user_model()


class RoleModelTest(TestCase):
    """Test cases for Role model"""

    def setUp(self):
        """Create test role"""
        self.role = Role.objects.create(
            code="editor",
            name_en="Editor",
            name_id="Editor"
        )

    def test_role_creation(self):
        """Test role can be created"""
        self.assertEqual(self.role.code, "editor")
        self.assertEqual(self.role.name_en, "Editor")

    def test_role_str(self):
        """Test role string representation"""
        self.assertEqual(str(self.role), "Editor")

    def test_role_unique_code(self):
        """Test role code is unique"""
        with self.assertRaises(Exception):
            Role.objects.create(
                code="editor",
                name_en="Another Editor",
                name_id="Editor Lain"
            )

    def test_multiple_roles(self):
        """Test creating multiple roles"""
        admin_role = Role.objects.create(
            code="admin",
            name_en="Administrator",
            name_id="Administrator"
        )
        contributor_role = Role.objects.create(
            code="contributor",
            name_en="Contributor",
            name_id="Kontributor"
        )
        self.assertEqual(Role.objects.count(), 3)


class UserModelTest(TestCase):
    """Test cases for User model"""

    def setUp(self):
        """Create test user"""
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
        """Test user can be created"""
        self.assertEqual(self.user.username, "testuser")
        self.assertEqual(self.user.email, "test@example.com")
        self.assertEqual(self.user.role, self.role)

    def test_user_password_hashing(self):
        """Test user password is hashed"""
        self.assertNotEqual(self.user.password, "testpass123")
        self.assertTrue(self.user.check_password("testpass123"))

    def test_user_is_active_default(self):
        """Test user is active by default"""
        self.assertTrue(self.user.is_active)

    def test_user_str(self):
        """Test user string representation"""
        self.assertEqual(str(self.user), "testuser")

    def test_superuser_creation(self):
        """Test superuser can be created"""
        admin = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="adminpass123"
        )
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_user_full_name(self):
        """Test user full name"""
        self.user.first_name = "John"
        self.user.last_name = "Doe"
        self.user.save()
        full_name = f"{self.user.first_name} {self.user.last_name}".strip()
        self.assertEqual(full_name, "John Doe")

    def test_user_deactivation(self):
        """Test user can be deactivated"""
        self.assertTrue(self.user.is_active)
        self.user.is_active = False
        self.user.save()
        self.assertFalse(self.user.is_active)


class AuthenticationAPITest(APITestCase):
    """Test cases for authentication API"""

    def setUp(self):
        """Create test user"""
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
        """Test user login endpoint"""
        url = reverse("token_obtain_pair")
        data = {
            "username": "testuser",
            "password": "testpass123"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        url = reverse("token_obtain_pair")
        data = {
            "username": "testuser",
            "password": "wrongpassword"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_login_nonexistent_user(self):
        """Test login with nonexistent user"""
        url = reverse("token_obtain_pair")
        data = {
            "username": "nonexistent",
            "password": "password123"
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        """Test token refresh endpoint"""
        # First get tokens
        url = reverse("token_obtain_pair")
        data = {
            "username": "testuser",
            "password": "testpass123"
        }
        response = self.client.post(url, data, format="json")
        refresh_token = response.data["refresh"]

        # Now test refresh
        refresh_url = reverse("token_refresh")
        refresh_data = {"refresh": refresh_token}
        refresh_response = self.client.post(refresh_url, refresh_data, format="json")
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_response.data)
