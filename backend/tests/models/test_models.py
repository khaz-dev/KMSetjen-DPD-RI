"""Test models."""
import pytest
from django.test import TestCase
from apps.core.models import User, Role, Language
from apps.content.models import Article, Category, Tag


# ============================================================================
# ROLE MODEL TESTS
# ============================================================================

class RoleModelTest(TestCase):
    """Test Role model."""
    
    def setUp(self):
        """Set up test data."""
        self.admin_role = Role.objects.create(
            code='admin',
            name_id='Administrator',
            name_en='Administrator',
            description_id='Full system access',
            description_en='Full system access',
            is_active=True
        )
        self.editor_role = Role.objects.create(
            code='editor',
            name_id='Editor',
            name_en='Editor',
            description_id='Content editing',
            description_en='Content editing',
            is_active=True
        )
    
    def test_role_creation(self):
        """Test role creation."""
        self.assertEqual(self.admin_role.code, 'admin')
        self.assertEqual(self.admin_role.name_id, 'Administrator')
        self.assertTrue(self.admin_role.is_active)
    
    def test_role_str_representation(self):
        """Test role string representation."""
        self.assertEqual(str(self.admin_role), 'admin - Administrator')
    
    def test_role_with_permissions(self):
        """Test role with permissions JSON."""
        permissions = ['read', 'write', 'delete']
        role = Role.objects.create(
            code='custom',
            name_id='Custom Role',
            name_en='Custom Role',
            permissions=permissions,
            is_active=True
        )
        self.assertEqual(role.permissions, permissions)
    
    def test_role_inactive(self):
        """Test inactive role."""
        role = Role.objects.create(
            code='inactive',
            name_id='Inactive Role',
            name_en='Inactive Role',
            is_active=False
        )
        self.assertFalse(role.is_active)


# ============================================================================
# LANGUAGE MODEL TESTS
# ============================================================================

class LanguageModelTest(TestCase):
    """Test Language model."""
    
    def test_language_creation(self):
        """Test language creation."""
        lang = Language.objects.create(
            code='id',
            name='Bahasa Indonesia',
            is_default=True,
            is_active=True
        )
        self.assertEqual(lang.code, 'id')
        self.assertEqual(lang.name, 'Bahasa Indonesia')
        self.assertTrue(lang.is_default)
    
    def test_language_str_representation(self):
        """Test language string representation."""
        lang = Language.objects.create(
            code='en',
            name='English',
            is_default=False,
            is_active=True
        )
        self.assertEqual(str(lang), 'en - English')


# ============================================================================
# USER MODEL TESTS
# ============================================================================

class UserModelTest(TestCase):
    """Test User model."""
    
    def setUp(self):
        """Set up test data."""
        self.admin_role = Role.objects.create(
            code='admin',
            name_id='Administrator',
            name_en='Administrator',
            is_active=True
        )
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_user_creation(self):
        """Test user creation."""
        self.assertEqual(self.user.username, 'testuser')
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertFalse(self.user.is_sso_user)
    
    def test_user_with_nip(self):
        """Test user with NIP (government ID)."""
        user = User.objects.create_user(
            username='asnuser',
            email='asn@example.com',
            password='pass123',
            nip='123456789'
        )
        self.assertEqual(user.nip, '123456789')
    
    def test_user_with_department(self):
        """Test user with department."""
        user = User.objects.create_user(
            username='deptuser',
            email='dept@example.com',
            password='pass123',
            department='DPD RI'
        )
        self.assertEqual(user.department, 'DPD RI')
    
    def test_user_language_preference(self):
        """Test user language preference."""
        self.user.preferred_language = 'en'
        self.user.save()
        self.assertEqual(self.user.preferred_language, 'en')
    
    def test_user_theme_preference(self):
        """Test user theme preference."""
        self.user.theme_mode = 'dark'
        self.user.save()
        self.assertEqual(self.user.theme_mode, 'dark')
    
    def test_user_add_role(self):
        """Test adding role to user."""
        self.user.roles.add(self.admin_role)
        self.assertIn(self.admin_role, self.user.roles.all())
    
    def test_user_multiple_roles(self):
        """Test user with multiple roles."""
        editor_role = Role.objects.create(
            code='editor',
            name_id='Editor',
            name_en='Editor',
            is_active=True
        )
        self.user.roles.add(self.admin_role, editor_role)
        self.assertEqual(self.user.roles.count(), 2)
    
    def test_user_sso_login(self):
        """Test SSO login tracking."""
        from django.utils import timezone
        now = timezone.now()
        self.user.is_sso_user = True
        self.user.last_sso_login = now
        self.user.save()
        
        self.assertTrue(self.user.is_sso_user)
        self.assertEqual(self.user.last_sso_login, now)


# ============================================================================
# CATEGORY MODEL TESTS
# ============================================================================

class CategoryModelTest(TestCase):
    """Test Category model."""
    
    def setUp(self):
        """Set up test data."""
        self.category = Category.objects.create(
            name_id='Kebijakan',
            name_en='Policy',
            description_id='Kategori kebijakan',
            description_en='Policy category',
            icon='folder'
        )
    
    def test_category_creation(self):
        """Test category creation."""
        self.assertEqual(self.category.name_id, 'Kebijakan')
        self.assertEqual(self.category.name_en, 'Policy')
    
    def test_category_slug_generation(self):
        """Test slug auto-generation."""
        self.assertIsNotNone(self.category.slug)
        self.assertEqual(self.category.slug, 'kebijakan')
    
    def test_category_slug_uniqueness(self):
        """Test slug uniqueness."""
        with self.assertRaises(Exception):  # IntegrityError
            Category.objects.create(
                name_id='Kebijakan2',
                name_en='Policy',
                slug='kebijakan'
            )
    
    def test_category_parent_child_relationship(self):
        """Test parent-child category relationship."""
        parent = Category.objects.create(
            name_id='Parent Category',
            name_en='Parent Category'
        )
        child = Category.objects.create(
            name_id='Child Category',
            name_en='Child Category',
            parent=parent
        )
        self.assertEqual(child.parent, parent)
        self.assertIn(child, parent.children.all())
    
    def test_category_ordering(self):
        """Test category ordering by index."""
        # Clear all categories first to ensure isolated test
        Category.objects.all().delete()
        
        cat1 = Category.objects.create(
            name_id='First',
            name_en='First',
            order_index=1
        )
        cat2 = Category.objects.create(
            name_id='Second',
            name_en='Second',
            order_index=2
        )
        categories = list(Category.objects.all().order_by('order_index'))
        self.assertEqual(categories[0], cat1)
        self.assertEqual(categories[1], cat2)


# ============================================================================
# TAG MODEL TESTS
# ============================================================================

class TagModelTest(TestCase):
    """Test Tag model."""
    
    def test_tag_creation(self):
        """Test tag creation."""
        tag = Tag.objects.create(
            name_id='Penting',
            name_en='Important'
        )
        self.assertEqual(tag.name_id, 'Penting')
        self.assertEqual(tag.name_en, 'Important')
    
    def test_tag_slug_generation(self):
        """Test tag slug generation."""
        tag = Tag.objects.create(
            name_id='Penting',
            name_en='Important'
        )
        self.assertIsNotNone(tag.slug)
        self.assertEqual(tag.slug, 'penting')


# ============================================================================
# ARTICLE MODEL TESTS
# ============================================================================

class ArticleModelTest(TestCase):
    """Test Article model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='author',
            email='author@example.com',
            password='pass123'
        )
        self.category = Category.objects.create(
            name_id='Test Category',
            name_en='Test Category'
        )
        self.article = Article.objects.create(
            title_id='Test Article',
            title_en='Test Article',
            summary_id='Summary ID',
            summary_en='Summary EN',
            content_id='Test content',
            content_en='Test content',
            author=self.user,
            category=self.category,
            status='DRAFT',
            access_level='PUBLIC'
        )
    
    def test_article_creation(self):
        """Test article creation."""
        self.assertEqual(self.article.title_id, 'Test Article')
        self.assertEqual(self.article.author, self.user)
        self.assertEqual(self.article.status, 'DRAFT')
    
    def test_article_slug_generation(self):
        """Test slug auto-generation."""
        self.assertIsNotNone(self.article.slug)
    
    def test_article_view_tracking(self):
        """Test article view count."""
        self.assertEqual(self.article.view_count, 0)
        self.article.view_count += 1
        self.article.save()
        self.assertEqual(self.article.view_count, 1)
    
    def test_article_status_transitions(self):
        """Test article status transitions."""
        self.article.status = 'REVIEW'
        self.article.save()
        self.assertEqual(self.article.status, 'REVIEW')
        
        self.article.status = 'PUBLISHED'
        self.article.save()
        self.assertEqual(self.article.status, 'PUBLISHED')
    
    def test_article_access_levels(self):
        """Test different article access levels."""
        access_levels = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL']
        for level in access_levels:
            article = Article.objects.create(
                title_id=f'Article {level}',
                title_en=f'Article {level}',
                content_id='Content',
                content_en='Content',
                author=self.user,
                category=self.category,
                access_level=level
            )
            self.assertEqual(article.access_level, level)
    
    def test_article_with_tags(self):
        """Test article with tags."""
        tag1 = Tag.objects.create(name_id='Tag1', name_en='Tag1')
        tag2 = Tag.objects.create(name_id='Tag2', name_en='Tag2')
        self.article.tags.add(tag1, tag2)
        self.assertEqual(self.article.tags.count(), 2)
