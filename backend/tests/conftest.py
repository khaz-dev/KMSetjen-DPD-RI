"""Pytest configuration and fixtures."""
import pytest
import os
from django.conf import settings
from django.contrib.auth import get_user_model
from apps.core.models import Role

# Set Django settings module for testing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

User = get_user_model()


@pytest.fixture
def admin_user(db):
    """Create admin user."""
    user = User.objects.create_superuser(
        username='admin',
        email='admin@test.com',
        password='testpass123'
    )
    return user


@pytest.fixture
def editor_user(db):
    """Create editor user."""
    editor_role = Role.objects.get_or_create(code='EDITOR')[0]
    user = User.objects.create_user(
        username='editor',
        email='editor@test.com',
        password='testpass123'
    )
    user.roles.add(editor_role)
    return user


@pytest.fixture
def contributor_user(db):
    """Create contributor user."""
    contributor_role = Role.objects.get_or_create(code='CONTRIBUTOR')[0]
    user = User.objects.create_user(
        username='contributor',
        email='contributor@test.com',
        password='testpass123'
    )
    user.roles.add(contributor_role)
    return user


@pytest.fixture
def reader_user(db):
    """Create reader user."""
    reader_role = Role.objects.get_or_create(code='READER')[0]
    user = User.objects.create_user(
        username='reader',
        email='reader@test.com',
        password='testpass123'
    )
    user.roles.add(reader_role)
    return user


@pytest.fixture
def public_user(db):
    """Create public user."""
    public_role = Role.objects.get_or_create(code='PUBLIC')[0]
    user = User.objects.create_user(
        username='public',
        email='public@test.com',
        password='testpass123'
    )
    user.roles.add(public_role)
    return user


@pytest.fixture
def api_client():
    """Return API client."""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.mark.django_db
def test_fixtures(admin_user, editor_user):
    """Test that fixtures work."""
    assert admin_user.is_staff
    assert editor_user.username == 'editor'
