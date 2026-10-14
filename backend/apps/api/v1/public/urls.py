"""
Public API URL configuration.

Endpoints:
- GET /api/v1/public/articles/ - List published articles
- GET /api/v1/public/articles/{id}/ - Article detail
- POST /api/v1/public/articles/{id}/view/ - Record article view
- GET /api/v1/public/articles/trending/ - Trending articles
- GET /api/v1/public/articles/latest/ - Latest articles
- GET /api/v1/public/articles/popular/ - Popular articles

- GET /api/v1/public/categories/ - List categories
- GET /api/v1/public/categories/{id}/ - Category detail

- GET /api/v1/public/tags/ - List tags
- GET /api/v1/public/tags/{id}/ - Tag detail
- GET /api/v1/public/tags/{id}/articles/ - Articles with tag

- POST /api/v1/public/contact/send-email/ - Send contact form email
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet, CategoryViewSet, TagViewSet, KnowledgeTypesView, preview_file
from .contact import send_contact_email

# Create router and register viewsets
router = DefaultRouter()
router.register(r'articles', ArticleViewSet, basename='article')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'tags', TagViewSet, basename='tag')

# Public API URLs
urlpatterns = [
    # Explicit article action routes must come before router detail routes.
    # Without these, /articles/popular/ and similar paths are captured as pk lookups.
    path('knowledge-types/', KnowledgeTypesView.as_view(), name='knowledge-types'),
    path('articles/trending/', ArticleViewSet.as_view({'get': 'trending'}), name='article-trending'),
    path('articles/latest/', ArticleViewSet.as_view({'get': 'latest'}), name='article-latest'),
    path('articles/popular/', ArticleViewSet.as_view({'get': 'popular'}), name='article-popular'),
    path('files/<int:file_id>/preview/', preview_file, name='file-preview'),
    path('', include(router.urls)),
    path('contact/send-email/', send_contact_email, name='send-contact-email'),
]
