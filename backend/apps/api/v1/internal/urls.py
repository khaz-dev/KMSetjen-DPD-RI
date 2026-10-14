"""
Internal API URL configuration.

Endpoints:
- GET /api/v1/internal/articles/ - List user's articles
- POST /api/v1/internal/articles/ - Create article
- GET /api/v1/internal/articles/{id}/ - Article detail
- PUT /api/v1/internal/articles/{id}/ - Full update
- PATCH /api/v1/internal/articles/{id}/ - Partial update
- DELETE /api/v1/internal/articles/{id}/ - Delete article
- POST /api/v1/internal/articles/{id}/submit-review/ - Submit for review
- POST /api/v1/internal/articles/{id}/publish/ - Publish (editor only)
- POST /api/v1/internal/articles/{id}/approve/ - Approve (editor only)
- POST /api/v1/internal/articles/{id}/reject/ - Reject (editor only)
- POST /api/v1/internal/articles/{id}/archive/ - Archive article
- GET /api/v1/internal/articles/check-slug/ - Check slug availability
- GET /api/v1/internal/articles/dashboard/ - User dashboard

File endpoints:
- GET /api/v1/internal/articles/{article_id}/files/ - List files
- POST /api/v1/internal/articles/{article_id}/files/ - Upload file
- GET /api/v1/internal/articles/{article_id}/files/{id}/ - File detail
- PATCH /api/v1/internal/articles/{article_id}/files/{id}/ - Update file
- DELETE /api/v1/internal/articles/{article_id}/files/{id}/ - Delete file
- POST /api/v1/internal/articles/{article_id}/files/reorder/ - Reorder files
"""
from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet, FileViewSet, InfographicImageViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'articles', ArticleViewSet, basename='article')

# Internal API URLs
urlpatterns = [
    # Explicit URLs for actions that must come FIRST to take priority over router lookup
    path('articles/check-slug/', ArticleViewSet.as_view({'get': 'check_slug'}), name='article-check-slug'),
    path('articles/creators-internal/', ArticleViewSet.as_view({'get': 'creators_internal'}), name='article-creators-internal'),
    path('articles/creators-external/', ArticleViewSet.as_view({'get': 'creators_external'}), name='article-creators-external'),
    # Router for articles with detail actions (submit-review, publish, etc.)
    path('', include(router.urls)),
    # Nested file endpoints - use explicit re_path to properly capture article_id
    re_path(
        r'^articles/(?P<article_id>\d+)/files/$',
        FileViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='article-files-list'
    ),
    re_path(
        r'^articles/(?P<article_id>\d+)/files/(?P<pk>\d+)/$',
        FileViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}),
        name='article-files-detail'
    ),
    re_path(
        r'^articles/(?P<article_id>\d+)/files/reorder/$',
        FileViewSet.as_view({'post': 'reorder'}),
        name='article-files-reorder'
    ),
    # Nested infographic slide endpoints (gambar berantai)
    re_path(
        r'^articles/(?P<article_id>\d+)/infographics/$',
        InfographicImageViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='article-infographics-list'
    ),
    re_path(
        r'^articles/(?P<article_id>\d+)/infographics/(?P<pk>\d+)/$',
        InfographicImageViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}),
        name='article-infographics-detail'
    ),
    re_path(
        r'^articles/(?P<article_id>\d+)/infographics/reorder/$',
        InfographicImageViewSet.as_view({'post': 'reorder'}),
        name='article-infographics-reorder'
    ),
]
