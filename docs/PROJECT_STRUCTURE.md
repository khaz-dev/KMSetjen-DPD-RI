# Project Structure Guide

**Last Updated:** January 20, 2026 (Phase 4 Code Organization)

---

## Directory Layout

```
d:\Project\KMSetjen DPD RI\
│
├── README.md                          # ⭐ Project overview (you are here)
├── docker-compose.yml                 # Docker container orchestration
├── deploy.ps1                         # PowerShell deployment script
├── .gitignore                         # Git ignore rules
├── db.sqlite3                         # SQLite database (dev only)
├── .env.example                       # Environment variables template
│
├── .github/                           # GitHub workflows
│   ├── workflows/
│   │   └── ci.yml                    # CI/CD pipeline
│
├── docs/                              # 📚 PROJECT DOCUMENTATION
│   ├── README.md                      # Docs index
│   ├── ARCHITECTURE_SUMMARY.md        # System design overview
│   ├── PHASE_1_*.md                   # Security & credentials setup
│   ├── PHASE_2_*.md                   # OAuth & authentication
│   ├── PHASE_3_*.md                   # Advanced OAuth & state management
│   ├── PHASE_4_*.md                   # Code organization
│   ├── PHASE_5_*.md                   # Documentation (Coming soon)
│   ├── TESTING_GUIDE.md               # Testing procedures
│   ├── API_DOCUMENTATION.md           # API endpoints reference
│   ├── DEPLOYMENT_GUIDE.md            # Production deployment
│   ├── OAUTH_FLOW_DIAGRAM.md          # OAuth 2.0 flow visual
│   ├── DATABASE_SCHEMA.md             # Data model documentation
│   ├── CONTRIBUTING.md                # Contribution guidelines
│   ├── ISSUE_TEMPLATES/               # GitHub issue templates
│   └── [226+ more documentation]      # All project documentation
│
├── backend/                           # 🔙 DJANGO BACKEND
│   │
│   ├── manage.py                      # Django CLI
│   ├── requirements.txt               # Python dependencies
│   ├── .env                           # ⚠️  Credentials (NOT in git)
│   ├── .env.example                   # Environment template
│   ├── Dockerfile                     # Docker image definition
│   ├── .gitignore                     # Backend git ignore
│   │
│   ├── apps/                          # Django applications
│   │   ├── __init__.py
│   │   ├── articles/                  # Article management
│   │   │   ├── models.py             # Article, Category models
│   │   │   ├── views.py              # REST API views
│   │   │   ├── serializers.py        # JSON serializers
│   │   │   ├── urls.py               # URL routing
│   │   │   └── admin.py
│   │   │
│   │   ├── likes/                     # Likes functionality
│   │   │   ├── models.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   │
│   │   └── ...other apps...
│   │
│   ├── auth/                          # OAuth & Authentication
│   │   ├── __init__.py
│   │   ├── models.py                  # OAuth token storage
│   │   ├── views.py                   # OAuth callback, JWT issuance
│   │   ├── serializers.py             # Auth serializers
│   │   ├── urls.py                    # Auth endpoints
│   │   └── admin.py
│   │
│   ├── config/                        # Django configuration
│   │   ├── __init__.py
│   │   ├── settings.py                # Main Django settings
│   │   ├── settings_base.py           # Base settings (imported)
│   │   ├── settings_production.py     # Production overrides
│   │   ├── urls.py                    # Main URL routing
│   │   └── wsgi.py                    # WSGI server entry
│   │
│   ├── shared/                        # Shared utilities
│   │   ├── __init__.py
│   │   ├── pagination.py              # Custom pagination
│   │   ├── permissions.py             # DRF permission classes
│   │   ├── decorators.py              # Custom decorators
│   │   └── utils.py                   # Helper functions
│   │
│   ├── tests/                         # Django test suite
│   │   ├── __init__.py
│   │   ├── test_articles.py
│   │   ├── test_auth.py
│   │   └── ...test files...
│   │
│   ├── scripts/                       # 🆕 Python utility scripts
│   │   ├── debug_*.py                 # Debug utilities
│   │   ├── test_*.py                  # Test scripts
│   │   ├── fix_*.py                   # Data fix scripts
│   │   ├── verify_*.py                # Verification scripts
│   │   ├── populate_*.py              # Data population
│   │   └── [36 total scripts]
│   │
│   ├── media/                         # User uploaded files
│   │   ├── articles/
│   │   │   ├── article_1/
│   │   │   │   ├── image1.jpg
│   │   │   │   └── document.pdf
│   │   │   └── ...article folders...
│   │   └── profiles/
│   │
│   ├── staticfiles/                   # Static files (CSS, JS from frontend)
│   │   └── dist/                      # Built React app files
│   │
│   ├── logs/                          # Application logs
│   │   ├── access.log
│   │   ├── error.log
│   │   └── debug.log
│   │
│   └── htmlcov/                       # Coverage reports (git ignored)
│
├── frontend/                          # ⚛️  REACT FRONTEND
│   │
│   ├── package.json                   # Dependencies & scripts
│   ├── vite.config.js                 # Vite build config
│   ├── .env.local                     # ⚠️  Local env (NOT in git)
│   ├── .env.example                   # Environment template
│   ├── Dockerfile                     # Docker image definition
│   │
│   ├── src/                           # React source code
│   │   ├── index.jsx                  # React entry point
│   │   ├── App.jsx                    # Main App component
│   │   │
│   │   ├── components/                # Reusable components
│   │   │   ├── Header.jsx             # Navigation header
│   │   │   ├── Footer.jsx             # Footer
│   │   │   ├── Navbar.jsx             # Navigation bar
│   │   │   ├── LanguageToggle.jsx     # Language switcher
│   │   │   ├── ThemeToggle.jsx        # Dark mode switcher
│   │   │   ├── ArticleCard.jsx        # Article card display
│   │   │   ├── ProtectedRoute.jsx     # Route guard
│   │   │   └── ...other components...
│   │   │
│   │   ├── pages/                     # Page components (React Router)
│   │   │   ├── HomePage.jsx           # Public home page
│   │   │   ├── LoginPage.jsx          # Login & OAuth entry
│   │   │   ├── GoogleCallbackPage.jsx # OAuth callback handler
│   │   │   ├── DashboardPage.jsx      # Private dashboard
│   │   │   ├── ArticlesPage.jsx       # Articles list
│   │   │   ├── ArticleDetailPage.jsx  # Article detail view
│   │   │   ├── ArticleEditorPage.jsx  # Article editor
│   │   │   ├── ProfilePage.jsx        # User profile
│   │   │   └── ...other pages...
│   │   │
│   │   ├── contexts/                  # React Context API
│   │   │   ├── AuthContext.js         # 🔐 Authentication state
│   │   │   ├── ThemeContext.js        # Dark/light mode state
│   │   │   ├── LanguageContext.js     # Bilingual state
│   │   │   └── ...other contexts...
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useAuth.js             # Auth context hook
│   │   │   ├── useTheme.js            # Theme context hook
│   │   │   ├── useLanguage.js         # Language context hook
│   │   │   └── ...other hooks...
│   │   │
│   │   ├── services/                  # API & external services
│   │   │   ├── api.js                 # Axios HTTP clients
│   │   │   │                          # - apiClient (with auth)
│   │   │   │                          # - publicClient (no auth)
│   │   │   ├── authService.js         # Auth operations
│   │   │   ├── articleService.js      # Article operations
│   │   │   └── ...other services...
│   │   │
│   │   ├── styles/                    # CSS stylesheets
│   │   │   ├── index.css              # Global styles
│   │   │   ├── App.css                # App component styles
│   │   │   ├── dark-mode.css          # Dark mode overrides
│   │   │   ├── responsive.css         # Mobile responsive
│   │   │   ├── components/
│   │   │   │   ├── Header.css
│   │   │   │   ├── ArticleCard.css
│   │   │   │   └── ...component styles...
│   │   │   └── pages/
│   │   │       ├── HomePage.css
│   │   │       ├── LoginPage.css
│   │   │       └── ...page styles...
│   │   │
│   │   ├── locales/                   # 🌍 Bilingual translations
│   │   │   ├── en.json                # English translations
│   │   │   └── id.json                # Indonesian translations
│   │   │
│   │   └── App.jsx                    # Main application component
│   │
│   ├── public/                        # Static assets
│   │   ├── index.html                 # HTML entry point
│   │   ├── favicon.ico
│   │   ├── logo.png
│   │   └── ...other static files...
│   │
│   └── node_modules/                  # npm packages (git ignored)
│
└── .venv/                             # Python virtual environment (git ignored)
```

---

## Key Files at a Glance

### Root Level
- **README.md** - Project overview
- **docker-compose.yml** - Full stack deployment (backend + frontend + database)
- **deploy.ps1** - One-command deployment on Windows
- **.env.example** - Template for environment variables
- **.gitignore** - Protects sensitive files (.env, node_modules, etc.)

### Backend Core
- **backend/manage.py** - Django CLI (database, migrations, server)
- **backend/config/settings.py** - Main configuration
- **backend/config/urls.py** - API routing
- **backend/auth/views.py** - OAuth 2.0 implementation
- **backend/apps/articles/models.py** - Data models
- **backend/requirements.txt** - Python dependencies

### Frontend Core
- **frontend/src/App.jsx** - Main React component
- **frontend/src/contexts/AuthContext.js** - Global auth state
- **frontend/src/services/api.js** - API client with interceptors
- **frontend/src/pages/GoogleCallbackPage.jsx** - OAuth callback handler
- **frontend/src/locales/\*.json** - Translations
- **frontend/package.json** - npm dependencies

### OAuth Implementation
- **backend/auth/views.py** - OAuth 2.0 backend (code exchange, token issuance)
- **frontend/src/pages/GoogleCallbackPage.jsx** - OAuth frontend (callback handling)
- **frontend/src/pages/LoginPage.jsx** - Login entry point with redirect
- **frontend/src/services/api.js** - HTTP clients (publicClient for OAuth)

---

## Important Notes

### ⚠️ Sensitive Files (Not in Git)
- **backend/.env** - Django secret key, OAuth credentials
- **frontend/.env.local** - API URLs, debug flags
- **.venv/** - Python virtual environment
- **node_modules/** - npm packages
- **media/** - User uploads

See **.gitignore** for complete list of excluded files.

### 📱 Frontend Organization (React Best Practices)
- Components are reusable, feature-specific
- Pages are full-page components (mapped to routes)
- Contexts handle global state (auth, theme, language)
- Services handle API communication
- Styles are scoped to components

### 🔙 Backend Organization (Django Best Practices)
- Apps are modular (articles, likes, auth, etc.)
- Models define data structure
- Views handle API logic
- Serializers handle JSON conversion
- URLs route requests to views

### 🔐 OAuth 2.0 Flow
1. User clicks "Login with Google"
2. Redirected to Google authentication
3. Google redirects back to `/google/callback` with code
4. Frontend exchanges code for tokens (calls backend)
5. Backend validates code with Google, issues JWT
6. Frontend stores JWT, updates auth context
7. All subsequent API calls use JWT in Authorization header

---

## Development Workflow

### Running the Project

```bash
# Backend (terminal 1)
cd backend
python manage.py runserver 0.0.0.0:8002

# Frontend (terminal 2)
cd frontend
npm run dev  # Vite dev server on port 3769

# Database/Services (optional)
docker-compose up  # Starts all services
```

### Adding a New Feature

1. **Backend**: Create model in `apps/*/models.py`
2. **Backend**: Create serializer and view
3. **Backend**: Add API route in `config/urls.py`
4. **Frontend**: Create service in `services/`
5. **Frontend**: Create component/page
6. **Frontend**: Integrate with Auth context if needed
7. **Tests**: Add tests to verify functionality

### Code Organization Tips

- Keep components focused and small (< 200 lines)
- Use hooks instead of class components
- Extract business logic to services
- Use context for global state only
- Keep styles scoped to components
- Use TypeScript for new code (if transitioning)

---

## Documentation Files

| File | Purpose |
|------|---------|
| docs/PHASE_4_CODE_ORGANIZATION_COMPLETE.md | This organization structure |
| docs/ARCHITECTURE_SUMMARY.md | System design overview |
| docs/API_DOCUMENTATION.md | All API endpoints |
| docs/OAUTH_FLOW_DIAGRAM.md | OAuth 2.0 visual flow |
| docs/DATABASE_SCHEMA.md | Data model documentation |
| docs/TESTING_GUIDE.md | Testing procedures |
| docs/DEPLOYMENT_GUIDE.md | Production deployment |
| docs/CONTRIBUTING.md | How to contribute (Coming soon) |

---

## Next Phase: Documentation Updates

In Phase 5, we'll update:
- [ ] Main README.md with setup instructions
- [ ] CONTRIBUTING.md with contribution guidelines
- [ ] API documentation with endpoint details
- [ ] Deployment guide for production
- [ ] README files in each directory

---

**Status**: ✅ Phase 4 Complete | Code organized and ready for GitHub

**Next**: Phase 5 - Documentation Updates (1-2 hours remaining)
