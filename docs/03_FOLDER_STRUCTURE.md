# KMSetjenDPDRI - Folder Structure & Project Organization

**Versi**: 1.0  
**Tanggal**: 5 Januari 2026

---

## 1. OVERALL PROJECT STRUCTURE

```
KMSetjen-DPD-RI/
├── docs/                          # Documentation
│   ├── 01_SYSTEM_ARCHITECTURE.md
│   ├── 02_DATABASE_SCHEMA.md
│   ├── 03_FOLDER_STRUCTURE.md
│   ├── 04_INITIAL_SCAFFOLDING.md
│   ├── 05_IMPLEMENTATION_CHECKLIST.md
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── CONTRIBUTING.md
│
├── backend/                       # Django Backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── .gitignore
│   │
│   ├── config/                    # Django project settings
│   │   ├── __init__.py
│   │   ├── settings.py            # Main settings
│   │   ├── settings_dev.py        # Development overrides
│   │   ├── settings_prod.py       # Production overrides
│   │   ├── urls.py                # Root URL routing
│   │   ├── wsgi.py
│   │   ├── asgi.py
│   │   └── constants.py           # App-wide constants
│   │
│   ├── apps/
│   │   │
│   │   ├── core/                  # Core app (models, shared logic)
│   │   │   ├── migrations/
│   │   │   ├── __init__.py
│   │   │   ├── admin.py           # Django admin
│   │   │   ├── apps.py
│   │   │   ├── models.py          # User, Role, Language
│   │   │   ├── managers.py        # Custom managers
│   │   │   └── constants.py       # App constants
│   │   │
│   │   ├── content/               # Content management app
│   │   │   ├── migrations/
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py          # Article, Category, Tag, etc.
│   │   │   ├── managers.py
│   │   │   ├── constants.py
│   │   │   └── signals.py         # Auto-update view_count, etc.
│   │   │
│   │   ├── api/                   # REST API endpoints
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── urls.py        # Route all API endpoints
│   │   │   │   │
│   │   │   │   ├── public/        # Public API (no auth)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── views.py
│   │   │   │   │   ├── serializers.py
│   │   │   │   │   ├── filters.py
│   │   │   │   │   └── urls.py
│   │   │   │   │
│   │   │   │   ├── internal/      # Internal API (auth required)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── views.py
│   │   │   │   │   ├── serializers.py
│   │   │   │   │   ├── permissions.py
│   │   │   │   │   ├── filters.py
│   │   │   │   │   └── urls.py
│   │   │   │   │
│   │   │   │   └── admin/         # Admin API
│   │   │   │       ├── __init__.py
│   │   │   │       ├── views.py
│   │   │   │       ├── serializers.py
│   │   │   │       ├── permissions.py
│   │   │   │       └── urls.py
│   │   │   │
│   │   │   └── __init__.py
│   │   │
│   │   ├── auth/                  # Authentication app
│   │   │   ├── __init__.py
│   │   │   ├── views.py           # Login/logout
│   │   │   ├── serializers.py
│   │   │   ├── permissions.py     # Custom permission classes
│   │   │   ├── backends.py        # SSO backend
│   │   │   ├── tokens.py          # Token generation
│   │   │   └── urls.py
│   │   │
│   │   └── audit/                 # Audit logging app
│   │       ├── __init__.py
│   │       ├── models.py          # AuditLog
│   │       ├── signals.py         # Auto-log changes
│   │       ├── services.py        # Audit logging service
│   │       └── utils.py
│   │
│   ├── shared/                    # Shared utilities
│   │   ├── __init__.py
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   ├── audit_middleware.py    # Capture IP, user-agent
│   │   │   └── cors_middleware.py
│   │   │
│   │   ├── permissions/
│   │   │   ├── __init__.py
│   │   │   ├── base.py            # Base permission classes
│   │   │   ├── role_based.py
│   │   │   └── object_level.py
│   │   │
│   │   ├── serializers/
│   │   │   ├── __init__.py
│   │   │   └── base.py            # Base serializers
│   │   │
│   │   ├── exceptions/
│   │   │   ├── __init__.py
│   │   │   └── custom.py          # Custom exception classes
│   │   │
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   ├── datetime_utils.py
│   │   │   ├── slug_utils.py
│   │   │   ├── file_utils.py
│   │   │   └── decorators.py
│   │   │
│   │   └── validators/
│   │       ├── __init__.py
│   │       └── custom.py          # DRF validators
│   │
│   ├── tests/                     # Test suite
│   │   ├── __init__.py
│   │   ├── conftest.py            # Pytest config
│   │   ├── factories.py           # Factory Boy models
│   │   │
│   │   ├── api/
│   │   │   ├── test_public_articles.py
│   │   │   ├── test_internal_articles.py
│   │   │   └── test_admin_users.py
│   │   │
│   │   ├── models/
│   │   │   ├── test_user.py
│   │   │   └── test_article.py
│   │   │
│   │   └── auth/
│   │       └── test_authentication.py
│   │
│   ├── static/                    # Static files (if needed)
│   │   └── admin_custom.css
│   │
│   └── media/                     # User uploads
│       └── .gitkeep
│
├── frontend/                      # React Frontend
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   ├── .prettierrc
│   ├── .eslintrc.js
│   ├── tsconfig.json              # TypeScript config
│   ├── vite.config.js             # Vite bundler config
│   │
│   ├── public/                    # Static public files
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json          # PWA manifest
│   │
│   ├── src/
│   │   │
│   │   ├── index.jsx              # App entry
│   │   ├── App.jsx                # Root component
│   │   │
│   │   ├── config/
│   │   │   ├── constants.js       # App-wide constants
│   │   │   ├── api.js             # API base URL config
│   │   │   └── theme.js           # Bootstrap/theme config
│   │   │
│   │   ├── i18n/                  # Internationalization
│   │   │   ├── i18n.js            # i18next config
│   │   │   ├── locales/
│   │   │   │   ├── id.json        # Bahasa Indonesia
│   │   │   │   └── en.json        # English
│   │   │   │
│   │   │   └── useTranslation.js  # Custom hook
│   │   │
│   │   ├── context/               # React Context (global state)
│   │   │   ├── AuthContext.jsx    # User auth state
│   │   │   ├── ThemeContext.jsx   # Light/dark mode
│   │   │   ├── LanguageContext.jsx # Language selection
│   │   │   └── NotificationContext.jsx
│   │   │
│   │   ├── hooks/                 # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useTheme.js
│   │   │   ├── useLanguage.js
│   │   │   ├── useFetch.js        # API calls
│   │   │   └── useLocalStorage.js
│   │   │
│   │   ├── services/              # API client layer
│   │   │   ├── api.js             # Axios instance
│   │   │   ├── articleService.js  # Article API calls
│   │   │   ├── authService.js
│   │   │   └── userService.js
│   │   │
│   │   ├── utils/                 # Utility functions
│   │   │   ├── formatters.js
│   │   │   ├── validators.js
│   │   │   ├── dateUtils.js
│   │   │   └── helpers.js
│   │   │
│   │   ├── pages/                 # Page components (route-level)
│   │   │   ├── HomePage.jsx
│   │   │   ├── ArticleDetailPage.jsx
│   │   │   ├── SearchPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   │
│   │   │   ├── dashboard/         # Internal dashboard
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   ├── MyArticlesPage.jsx
│   │   │   │   ├── CreateArticlePage.jsx
│   │   │   │   └── EditArticlePage.jsx
│   │   │   │
│   │   │   ├── admin/             # Admin pages
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── ManageUsersPage.jsx
│   │   │   │   ├── AuditLogsPage.jsx
│   │   │   │   └── SettingsPage.jsx
│   │   │   │
│   │   │   └── NotFoundPage.jsx
│   │   │
│   │   ├── components/            # Reusable components
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx     # Top nav with theme/lang toggle
│   │   │   │   ├── Sidebar.jsx    # Left nav (internal)
│   │   │   │   ├── Footer.jsx
│   │   │   │   └── Layout.jsx     # Main layout wrapper
│   │   │   │
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── ErrorBoundary.jsx
│   │   │   │   ├── Pagination.jsx
│   │   │   │   └── Alert.jsx
│   │   │   │
│   │   │   ├── article/
│   │   │   │   ├── ArticleCard.jsx       # Article preview card
│   │   │   │   ├── ArticleList.jsx       # List with filters
│   │   │   │   ├── ArticleDetail.jsx     # Full article view
│   │   │   │   ├── ArticleForm.jsx       # Create/edit form
│   │   │   │   ├── ArticleEditor.jsx     # WYSIWYG editor
│   │   │   │   └── RichTextEditor.jsx    # Reusable editor
│   │   │   │
│   │   │   ├── search/
│   │   │   │   ├── SearchBar.jsx
│   │   │   │   ├── FilterPanel.jsx       # Category, tag, year filters
│   │   │   │   └── SearchResults.jsx
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── ProtectedRoute.jsx    # Route guard
│   │   │   │   └── RoleBasedRoute.jsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── UserTable.jsx
│   │   │       ├── AuditTable.jsx
│   │   │       └── SystemStats.jsx
│   │   │
│   │   ├── styles/                # Global styles
│   │   │   ├── index.css
│   │   │   ├── themes.css         # Light/dark mode CSS vars
│   │   │   ├── responsive.css
│   │   │   └── utilities.css
│   │   │
│   │   └── assets/                # Images, fonts, etc.
│   │       ├── icons/
│   │       ├── images/
│   │       └── fonts/
│   │
│   └── tests/                     # React tests
│       ├── components/
│       └── utils/
│
├── .gitignore                    # Git ignore rules
├── README.md                      # Project overview
├── LICENSE                        # Open source license
│
└── scripts/                       # Utility scripts
    ├── setup_dev.sh               # Development setup
    ├── setup_prod.sh              # Production setup
    ├── backup_db.sh               # Database backup
    └── deploy.sh                  # Deployment script
```

---

## 2. BACKEND STRUCTURE DETAILS

### 2.1 Django Apps Organization

```
backend/apps/

core/              ← Contains User, Role, Language, shared models
content/           ← Contains Article, Category, Tag, File, ArticleVersion
api/v1/            ← REST API (public, internal, admin)
auth/              ← Authentication & authorization
audit/             ← Audit logging
```

**Why this structure?**
- `core` holds all models
- `api` is separated by API tier (public, internal, admin)
- `auth` handles authentication logic
- `audit` is self-contained, easy to extend
- Easy to find what you need
- Supports adding `api/v2/` in future

### 2.2 Django Apps Responsibilities

| App | Responsibility |
|-----|-----------------|
| `core` | User, Role, Language models; shared managers |
| `content` | Article, Category, Tag, File; signal handlers |
| `api.v1.public` | Public API views (no auth) |
| `api.v1.internal` | Internal API views (auth required) |
| `api.v1.admin` | Admin API views (admin only) |
| `auth` | Login, token generation, SSO backend |
| `audit` | AuditLog model, auto-logging via signals |
| `shared` | Reusable middleware, permissions, utilities |

---

## 3. FRONTEND STRUCTURE DETAILS

### 3.1 Component Hierarchy

```
App
├── Header
│   ├── Logo/Brand
│   ├── Navigation (main menu)
│   ├── Search bar
│   ├── Theme Toggle (light/dark)
│   ├── Language Selector
│   └── User Menu (profile, logout)
│
├── Layout (Router inside)
│   ├── Public Routes
│   │   ├── HomePage
│   │   ├── ArticleDetailPage
│   │   ├── SearchPage
│   │   ├── CategoryBrowsePage
│   │   └── LoginPage
│   │
│   ├── Internal Routes (ProtectedRoute)
│   │   ├── DashboardPage
│   │   ├── MyArticlesPage
│   │   ├── CreateArticlePage
│   │   └── EditArticlePage
│   │
│   └── Admin Routes (RoleBasedRoute)
│       ├── AdminDashboard
│       ├── ManageUsersPage
│       ├── AuditLogsPage
│       └── SettingsPage
│
└── Footer
```

### 3.2 Styling Strategy

```
src/styles/
├── index.css               # Global imports
│
├── themes.css              # CSS custom properties for light/dark
│   :root {
│     --color-bg: #ffffff;
│     --color-text: #000000;
│   }
│   [data-theme="dark"] {
│     --color-bg: #1a1a1a;
│     --color-text: #ffffff;
│   }
│
├── responsive.css          # Media queries for Bootstrap breakpoints
│   (Bootstrap already does this, just extend if needed)
│
└── utilities.css           # Helper classes
```

**Bootstrap Integration:**
- Use Bootstrap classes for layout, components
- Override CSS variables for dark mode
- Custom CSS only for KMS-specific styling
- Keep it simple and maintainable

---

## 4. CONFIGURATION FILES

### 4.1 Backend Config Hierarchy

```
config/
├── settings.py             # Base settings
├── settings_dev.py         # Development overrides
└── settings_prod.py        # Production overrides

# Usage:
# export DJANGO_SETTINGS_MODULE=config.settings_dev
# python manage.py runserver
```

### 4.2 Frontend Config

```
src/config/
├── constants.js            # Feature flags, pagination size, etc.
├── api.js                  # API base URL (from .env)
└── theme.js                # Bootstrap theme customizations
```

---

## 5. TESTING STRUCTURE

### 5.1 Backend Tests

```
tests/
├── conftest.py             # Pytest config, fixtures
├── factories.py            # Factory Boy objects for testing
│
├── api/                    # API endpoint tests
│   ├── test_public_*.py
│   ├── test_internal_*.py
│   └── test_admin_*.py
│
├── models/                 # Model tests
│   ├── test_user.py
│   ├── test_article.py
│   └── test_category.py
│
├── auth/                   # Auth tests
│   └── test_authentication.py
│
└── services/               # Service/utility tests
    └── test_audit_logging.py
```

**Testing pyramid:**
- Unit tests (models, utils): 70%
- Integration tests (API endpoints): 25%
- E2E tests (critical flows): 5%

### 5.2 Frontend Tests

```
tests/
├── components/             # Component unit tests
│   ├── test_ArticleCard.jsx
│   └── test_SearchBar.jsx
│
├── pages/                  # Page integration tests
│   └── test_HomePage.jsx
│
└── utils/                  # Utility function tests
    └── test_formatters.jsx
```

---

## 6. ENVIRONMENT SEPARATION

### 6.1 .env Files

```
.env.example              # Committed to repo, shows all vars
.env                      # Not committed, local development
.env.production           # Server deployment
```

### 6.2 Critical Environment Variables

**Backend:**
```
DJANGO_ENV=dev|prod
SECRET_KEY=xxxxx
DEBUG=True|False
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgres://...
SSO_URL=https://sso.server.com
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://kms.server.com
```

**Frontend:**
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=dev|prod
```

---

## 7. NAMING CONVENTIONS

### 7.1 Files & Folders

- **Python files**: `snake_case.py`
- **Python classes**: `PascalCase`
- **Python functions**: `snake_case()`
- **React components**: `PascalCase.jsx`
- **React hooks**: `useMyHook.js`
- **Folders**: `lowercase`
- **Constants**: `UPPER_SNAKE_CASE`

### 7.2 Django Models & URLs

```python
# Models: Always singular
class Article(models.Model):
    pass

# URLs: Plural for list views
# /api/public/articles/           (GET - list, POST - create)
# /api/public/articles/{id}/      (GET - detail, PATCH - update)
# /api/public/articles/{id}/publish/  (POST - custom action)

# API Version in URL
# /api/v1/public/articles/
# /api/v2/public/articles/        (in future)
```

### 7.3 API Response Format

```json
{
  "data": {
    "id": 1,
    "title": "...",
    ...
  },
  "meta": {
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100
    }
  }
}
```

---

## 8. IMPORTANT PATHS

| What | Path | Note |
|------|------|------|
| Django `manage.py` | `backend/` | Run from here |
| Django settings | `backend/config/settings.py` | Main config |
| React build output | `frontend/dist/` | Served by Nginx |
| Database migrations | `backend/apps/*/migrations/` | Auto-generated |
| API tests | `backend/tests/api/` | Integration tests |
| Static files | `backend/static/` | Admin CSS, etc. |
| Media uploads | `backend/media/` | User uploads |
| Translations | `frontend/src/i18n/locales/` | JSON files |
| Tests | Run from root with `pytest` | Full coverage |

---

## 9. GIT STRUCTURE

```
.gitignore                 # Python, Node, system files
README.md                  # Project overview
backend/.gitignore         # Backend-specific ignores
frontend/.gitignore        # Frontend-specific ignores

# Branches strategy:
main                       # Production-ready, stable
develop                    # Integration branch
feature/*                  # Feature branches (feature/xyz)
fix/*                      # Bug fix branches (fix/xyz)
```

---

## 10. DOCUMENTATION LOCATIONS

| Document | Location | Purpose |
|----------|----------|---------|
| System Architecture | `docs/01_SYSTEM_ARCHITECTURE.md` | High-level design |
| Database Schema | `docs/02_DATABASE_SCHEMA.md` | Data model |
| Folder Structure | `docs/03_FOLDER_STRUCTURE.md` | This file |
| Initial Setup | `docs/04_INITIAL_SCAFFOLDING.md` | Getting started |
| API Docs | `docs/API_DOCUMENTATION.md` | API endpoints |
| Deployment | `docs/DEPLOYMENT_GUIDE.md` | Server setup |
| Contributing | `docs/CONTRIBUTING.md` | Dev guidelines |
| README | `README.md` | Quick overview |

---

## NEXT STEPS

1. ✅ System Architecture
2. ✅ Database Schema
3. ✅ Folder Structure (THIS DOCUMENT)
4. ⏳ Configuration Plan (04_INITIAL_SCAFFOLDING.md)
5. ⏳ Implementation Checklist (05_IMPLEMENTATION_CHECKLIST.md)

---

**Struktur siap untuk diimplementasikan.**
