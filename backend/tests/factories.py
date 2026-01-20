"""Factory Boy factories for testing."""
import factory
from factory.django import DjangoModelFactory
from django.contrib.auth import get_user_model
from apps.core.models import Role, Language
from apps.content.models import Article, Category, Tag

User = get_user_model()


class RoleFactory(DjangoModelFactory):
    """Factory for Role model."""
    class Meta:
        model = Role
    
    code = factory.Sequence(lambda n: f'ROLE_{n}')
    name_id = factory.Faker('word')
    name_en = factory.Faker('word')
    is_active = True


class LanguageFactory(DjangoModelFactory):
    """Factory for Language model."""
    class Meta:
        model = Language
    
    code = factory.Faker('language_code')
    name = factory.Faker('country')
    is_default = False
    is_active = True


class UserFactory(DjangoModelFactory):
    """Factory for User model."""
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.Faker('email')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    nip = factory.Sequence(lambda n: f'{n:010d}')
    department = factory.Faker('word')
    phone = factory.Faker('phone_number')
    is_active = True


class CategoryFactory(DjangoModelFactory):
    """Factory for Category model."""
    class Meta:
        model = Category
    
    name_id = factory.Faker('word')
    name_en = factory.Faker('word')
    description_id = factory.Faker('sentence')
    description_en = factory.Faker('sentence')
    icon = 'folder'
    color = '#3498db'
    order_index = 0


class TagFactory(DjangoModelFactory):
    """Factory for Tag model."""
    class Meta:
        model = Tag
    
    name_id = factory.Faker('word')
    name_en = factory.Faker('word')
    description_id = factory.Faker('sentence')
    description_en = factory.Faker('sentence')
    color = '#3498db'


class ArticleFactory(DjangoModelFactory):
    """Factory for Article model."""
    class Meta:
        model = Article
    
    title_id = factory.Faker('sentence')
    title_en = factory.Faker('sentence')
    content_id = factory.Faker('text')
    content_en = factory.Faker('text')
    summary_id = factory.Faker('sentence')
    summary_en = factory.Faker('sentence')
    author = factory.SubFactory(UserFactory)
    category = factory.SubFactory(CategoryFactory)
    status = 'DRAFT'
    access_level = 'PUBLIC'
    is_bilingual = True
    language = 'id'
