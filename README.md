# KMSetjen DPD RI - Knowledge Management System

**Status**: ✅ Backend Complete | ✅ Frontend Complete | ✅ OAuth Implemented | 🚀 GitHub Ready

![version](https://img.shields.io/badge/version-1.0.0-blue) ![license](https://img.shields.io/badge/license-Open%20Source-green) ![python](https://img.shields.io/badge/python-3.10%2B-blue) ![react](https://img.shields.io/badge/react-18.2.0-blue)

---

## 📋 Overview

**KMSetjen DPD RI** is an enterprise-grade **Knowledge Management System** designed for the Secretariat General of DPD RI (Dewan Perwakilan Daerah - Regional Representative Council). A fully open-source, government-ready platform featuring:

### Core Features
- 🌍 **Bilingual Interface** (Bahasa Indonesia + English)
- 🎨 **Light/Dark Mode** with persistent user preferences
- 🔐 **Role-Based Access Control** (Admin, Editor, Contributor, Reader, Public)
- 🔒 **OAuth 2.0 Integration** (Google Login, extensible to other providers)
- 📝 **Content Management** with versioning and audit trails
- 📎 **File Attachments** with preview support (PDF, images, documents)
- 👥 **User Management** with profiles and permissions
- 📊 **Article Analytics** (views, likes, engagement metrics)
- 🏷️ **Categorization & Tagging** system
- 📱 **Responsive Design** (mobile, tablet, desktop)

### Technical Highlights
- ✅ **Zero Cost** - All open-source, self-hosted
- ✅ **No Vendor Lock-in** - Full source code access
- ✅ **Government Grade** - Security, audit trails, role-based access
- ✅ **API-First Architecture** - RESTful backend, flexible frontend
- ✅ **Containerized** - Docker support for easy deployment
- ✅ **Production Ready** - Tested and documented

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+ & Node.js 16+
- PostgreSQL (or SQLite for development)
- Git

### Installation (5 minutes)

**1. Clone the repository:**
```bash
git clone https://github.com/khaz-dev/KMSetjen-DPD-RI.git
cd KMSetjen-DPD-RI
```

**2. Backend setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**3. Frontend setup (new terminal):**
```bash
cd frontend
npm install
npm run dev
```

**4. Access the application:**
- Frontend: http://localhost:3769
- Backend API: http://localhost:8000/api
- Admin panel: http://localhost:8000/admin

👉 **[Full installation guide →](INSTALLATION.md)**

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [INSTALLATION.md](INSTALLATION.md) | Complete setup instructions for development and production |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute, coding standards, pull request process |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment with Docker and Gunicorn |
| [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) | Complete project organization and file structure |
| [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | All API endpoints and usage |
| [docs/OAUTH_FLOW_DIAGRAM.md](docs/OAUTH_FLOW_DIAGRAM.md) | OAuth 2.0 authentication flow |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Data models and database design |
| [docs/README.md](docs/README.md) | Complete documentation index |

---

## 🛠️ Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + React Bootstrap | 18.2.0 + 2.10.0 |
| **State** | Context API + Hooks | Native React |
| **Build** | Vite | 4.5.0+ |
| **Styling** | CSS3 + Bootstrap 5 | Native + 5.2 |
| **Backend** | Django + DRF | 4.2.8 + 3.14.0 |
| **Auth** | JWT + OAuth 2.0 | djangorestframework-simplejwt + Google |
| **Database** | PostgreSQL / SQLite | 12+ / 3.x |
| **Deployment** | Docker + Docker Compose | Latest |
| **Web Server** | Nginx + Gunicorn | Latest |
| **API Client** | Axios | 1.6.2+ |
| **Internationalization** | react-i18next | Latest |

---

## 📊 Architecture

---

## 📊 System Architecture

```
┌──────────────────────────────────────────────────┐
│               Frontend (React)                   │
│  ├─ HomePage (Public articles)                   │
│  ├─ LoginPage (OAuth 2.0)                        │
│  ├─ Dashboard (Protected routes)                 │
│  └─ ArticleEditor (Markdown + Bilingual)         │
└────────────────────┬─────────────────────────────┘
                     │
        ┌────────────▼────────────┐
        │   API Client (Axios)    │
        │ ├─ publicClient         │
        │ └─ apiClient (+ JWT)    │
        └────────────┬────────────┘
                     │
     ┌───────────────▼───────────────┐
     │    Backend (Django + DRF)     │
     │  ├─ /api/auth/ (OAuth)        │
     │  ├─ /api/articles/ (CRUD)     │
     │  ├─ /api/categories/          │
     │  ├─ /api/likes/               │
     │  └─ /api/users/               │
     └───────────────┬───────────────┘
                     │
        ┌────────────▼────────────┐
        │  Database (PostgreSQL)  │
        │  ├─ articles            │
        │  ├─ categories          │
        │  ├─ users               │
        │  ├─ attachments         │
        │  └─ audit_logs          │
        └─────────────────────────┘
```

### Authentication Flow
```
User → Google Login → OAuth Callback → JWT Token → Protected Routes
```

---

## 🔐 Security Features

- ✅ **OAuth 2.0 Authentication** - Secure, no password storage
- ✅ **JWT Token-based API** - Stateless, scalable
- ✅ **CORS Protection** - Prevents unauthorized requests
- ✅ **CSRF Tokens** - OAuth state parameter validation
- ✅ **Role-Based Access** - Fine-grained permissions
- ✅ **Environment Secrets** - .env protection with .gitignore
- ✅ **Password Hashing** - PBKDF2 default
- ✅ **Audit Logging** - All user actions tracked

---

## ✨ Key Features

### Content Management
- 📄 **Articles with Markdown** - Rich text with code highlighting
- 🏷️ **Categories & Tags** - Organize knowledge
- 📎 **File Attachments** - Upload PDFs, images, documents
- 👁️ **View Tracking** - Analytics on article usage
- ❤️ **Like System** - User engagement metrics
- 📝 **Versioning** - Track content changes
- 🔍 **Full-Text Search** - Find articles quickly

### User Experience
- 🌍 **Bilingual** - Indonesian & English interface
- 🎨 **Dark Mode** - Comfortable reading, reduced eye strain
- 📱 **Responsive** - Works on desktop, tablet, mobile
- ⚡ **Fast Loading** - Optimized API responses
- 🔄 **Real-time Updates** - Live notifications

### Administration
- 👥 **User Management** - Create, edit, delete users
- 🔐 **Permissions** - Granular access control
- 📊 **Analytics** - User activity, content metrics
- 🔍 **Audit Trail** - Compliance logging
- 🛠️ **Maintenance** - Backups, migrations, monitoring

---

## 🚀 Getting Started (Development)

### Option 1: Local Development (Recommended)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
# Access at http://localhost:3769
```

**Admin Panel:**
```bash
# Create superuser
cd backend
python manage.py createsuperuser

# Access at http://localhost:8000/admin
```

### Option 2: Docker Deployment

```bash
# One command to start everything
docker-compose up -d

# Access at:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8000
# - Admins: http://localhost:8000/admin
```

👉 **[Full installation guide →](INSTALLATION.md)**
👉 **[Deployment guide →](DEPLOYMENT.md)**

---

## 📦 Project Structure

```
.
├── README.md                 # You are here
├── INSTALLATION.md           # Setup guide
├── CONTRIBUTING.md           # Contribution guidelines
├── DEPLOYMENT.md             # Production deployment
│
├── backend/                  # Django backend
│   ├── apps/                # Django apps (articles, auth, etc.)
│   ├── scripts/             # Utility scripts (36 Python files)
│   ├── manage.py            # Django CLI
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Backend container
│
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API clients
│   │   ├── contexts/       # Auth context
│   │   └── locales/        # Translations (EN/ID)
│   ├── package.json        # npm dependencies
│   └── Dockerfile          # Frontend container
│
├── docs/                    # 📚 Complete documentation
│   ├── PROJECT_STRUCTURE.md
│   ├── API_DOCUMENTATION.md
│   ├── OAUTH_FLOW_DIAGRAM.md
│   ├── DATABASE_SCHEMA.md
│   ├── PHASE_*.md          # Implementation phases
│   └── [225+ more docs]
│
└── .github/                # GitHub workflows
    └── workflows/          # CI/CD pipelines
```

👉 **[Complete project structure →](docs/PROJECT_STRUCTURE.md)**

---

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

👉 **[Contribution guidelines →](CONTRIBUTING.md)**

---

## 📋 API Endpoints

### Public Endpoints
- `GET /api/articles/` - List all public articles
- `GET /api/articles/{id}/` - Get article detail
- `GET /api/categories/` - List categories
- `POST /api/auth/google/callback/` - Google OAuth callback

### Protected Endpoints
- `GET /api/me/` - Current user info
- `POST /api/articles/` - Create article
- `PUT /api/articles/{id}/` - Update article
- `DELETE /api/articles/{id}/` - Delete article
- `POST /api/likes/` - Like article

👉 **[Full API documentation →](docs/API_DOCUMENTATION.md)**

---

## 🐛 Troubleshooting

### OAuth Login Not Working?
- Check `.env` file has valid Google OAuth credentials
- Verify redirect URI matches Google Cloud Console settings
- See [OAuth Setup Guide](docs/GOOGLE_LOGIN_SETUP_COMPLETE.md)

### Database Connection Error?
- Ensure PostgreSQL is running (or using SQLite for dev)
- Check DATABASE_URL in `.env`
- Run `python manage.py migrate`

### Frontend Not Loading?
- Clear browser cache (`Ctrl+Shift+Delete`)
- Check network tab for API errors
- Verify backend is running on port 8000

👉 **[Full troubleshooting guide →](docs/TROUBLESHOOTING.md)**

---

## 📝 License

This project is **100% Open Source** under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🙌 Support

- 📖 **Documentation**: Check [docs/README.md](docs/README.md)
- 🐛 **Report Bugs**: [GitHub Issues](https://github.com/khaz-dev/KMSetjen-DPD-RI/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/khaz-dev/KMSetjen-DPD-RI/discussions)
- 📧 **Email**: support@example.com

---

## 🎯 Roadmap
- ✅ **Role-Based Access** (Admin, Editor, Contributor, Reader)
- ✅ **Audit Trail** (all changes logged)

### Phase 2+: Future
- Comment system
- Notification system (email/in-app)
- Advanced workflows
- Analytics dashboard
- Mobile app

---

## Getting Started

### Prerequisites
```
Python 3.11+
Node.js 18+ LTS
PostgreSQL 12+
Git
```

### Quick Start (30 minutes)

**1. Backend Setup**
```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**2. Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

**3. Access the System**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1/
- Django Admin: http://localhost:8000/admin/

See [docs/04_INITIAL_SCAFFOLDING.md](docs/04_INITIAL_SCAFFOLDING.md) for detailed setup.

---

## Project Structure

```
KMSetjen-DPD-RI/
├── docs/                          # Complete architecture documentation
│   ├── 01_SYSTEM_ARCHITECTURE.md
│   ├── 02_DATABASE_SCHEMA.md
│   ├── 03_FOLDER_STRUCTURE.md
│   ├── 04_INITIAL_SCAFFOLDING.md
│   └── 05_IMPLEMENTATION_CHECKLIST.md
│
├── backend/                       # Django REST Framework backend
│   ├── config/                    # Django settings
│   ├── apps/                      # Django apps (core, content, api, auth, audit)
│   ├── shared/                    # Reusable utilities
│   ├── tests/                     # Test suite
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/                      # React + Vite frontend
│   ├── public/                    # Static files
│   ├── src/
│   │   ├── pages/                 # Route-level components
│   │   ├── components/            # Reusable components
│   │   ├── i18n/                  # Internationalization
│   │   ├── context/               # Global state
│   │   ├── services/              # API client
│   │   └── styles/                # CSS (Bootstrap + custom)
│   ├── package.json
│   └── vite.config.js
│
└── scripts/                       # Utility scripts (setup, backup, deploy)
```

See [docs/03_FOLDER_STRUCTURE.md](docs/03_FOLDER_STRUCTURE.md) for detailed structure.

---

## Development Phases

Total effort: **~30-40 days** (solo developer)

| Phase | Task | Days |
|-------|------|------|
| ✅ 1 | Planning & Architecture | 3 |
| ⏳ 2 | Backend Setup | 2-3 |
| ⏳ 3 | Public API | 1-2 |
| ⏳ 4 | Auth & Internal API | 2-3 |
| ⏳ 5 | Admin API | 1-2 |
| ⏳ 6 | File Handling | 1 |
| ⏳ 7 | Frontend Setup | 1-2 |
| ⏳ 8 | Public Pages | 2-3 |
| ⏳ 9 | Internal Pages | 3-4 |
| ⏳ 10 | Admin Pages | 2-3 |
| ⏳ 11 | I18N | 1-2 |
| ⏳ 12 | Dark Mode | 1 |
| ⏳ 13 | Testing & QA | 2-3 |
| ⏳ 14 | Deployment | 2-3 |

See [docs/05_IMPLEMENTATION_CHECKLIST.md](docs/05_IMPLEMENTATION_CHECKLIST.md) for detailed phase breakdown.

---

## Database Schema

**Core Models**:
- `User` (extended Django user with SSO support)
- `Role` (admin, editor, contributor, reader, public)
- `Article` (bilingual, versioned, with status workflow)
- `Category` (hierarchical, translatable)
- `Tag` (flexible, bilingual)
- `File` (article attachments)
- `AuditLog` (immutable audit trail)
- `Language` (ID, EN)

See [docs/02_DATABASE_SCHEMA.md](docs/02_DATABASE_SCHEMA.md) for ERD and detailed schema.

---

## API Endpoints

### Public API (No Auth)
```
GET  /api/v1/public/articles/              # List public articles (paginated)
GET  /api/v1/public/articles/{id}/         # Get article details
GET  /api/v1/public/categories/            # List categories
GET  /api/v1/public/tags/                  # List tags
```

### Internal API (Auth Required)
```
GET    /api/v1/internal/articles/          # List articles (role-filtered)
POST   /api/v1/internal/articles/          # Create article (draft)
PATCH  /api/v1/internal/articles/{id}/     # Update article
POST   /api/v1/internal/articles/{id}/review/      # Submit for review
POST   /api/v1/internal/articles/{id}/publish/     # Publish (editor+)
GET    /api/v1/internal/me/                # Get user profile
GET    /api/auth/login/                    # SSO login
```

### Admin API (Admin Only)
```
GET    /api/v1/admin/users/                # List all users
POST   /api/v1/admin/users/                # Create user
PATCH  /api/v1/admin/users/{id}/           # Update user
GET    /api/v1/admin/audit-logs/           # View audit logs
GET    /api/v1/admin/settings/             # System settings
```

See [docs/01_SYSTEM_ARCHITECTURE.md](docs/01_SYSTEM_ARCHITECTURE.md) for full API specification.

---

## User Roles & Permissions

| Role | Can View | Can Create | Can Edit | Can Approve | Can Manage |
|------|----------|-----------|----------|------------|-----------|
| **Public** | Public only | ❌ | ❌ | ❌ | ❌ |
| **Reader** | Public + Internal | ❌ | ❌ | ❌ | ❌ |
| **Contributor** | All | Own drafts | Own articles | ❌ | ❌ |
| **Editor** | All | All | All | ✅ | Users |
| **Admin** | All | All | All | ✅ | All |

---

## Security Highlights

✅ **Implemented**:
- Role-based access control (RBAC)
- Audit trail for all changes
- CSRF protection (Django)
- SQL injection prevention (ORM)
- Input validation (DRF)
- Secure password hashing
- Token-based authentication

⚠️ **To Configure**:
- SSL/TLS (Nginx)
- CORS whitelist
- Rate limiting
- Firewall rules
- Database backups

---

## Performance

| Metric | Target |
|--------|--------|
| API response | <200ms (p95) |
| Page load | <2s (p95) |
| Concurrent users | 1000+ |
| Database size | 10,000+ articles |

**Optimizations**:
- Database indexes on critical queries
- Pagination (20 items/page)
- Caching (categories, tags)
- Static file CDN (optional)

---

## Deployment

### Development
```bash
# Backend
python manage.py runserver

# Frontend
npm run dev
```

### Production
```bash
# Build frontend
npm run build

# Serve with Nginx + Gunicorn
gunicorn config.wsgi:application --workers 4 --bind 0.0.0.0:8000
```

See [docs/04_INITIAL_SCAFFOLDING.md](docs/04_INITIAL_SCAFFOLDING.md) for detailed deployment instructions.

---

## Testing

**Target Coverage**:
- Backend: 80%+
- Frontend: 70%+

**Running Tests**:
```bash
# Backend
pytest backend/tests/

# Frontend
npm test
```

---

## Internationalization (i18n)

Fully bilingual system:
- **Bahasa Indonesia** (default)
- **English**

Language switcher in header, preference saved to localStorage.

All UI text, menus, buttons, labels use translation keys.

See [docs/04_INITIAL_SCAFFOLDING.md](docs/04_INITIAL_SCAFFOLDING.md) for i18n setup.

---

## Dark Mode

User-toggleable theme with localStorage persistence.

CSS variables (--color-bg, --color-text, etc.) switch between light/dark palettes.

Bootstrap classes work seamlessly in both modes.

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting code.

**Guidelines**:
- Follow PEP 8 (Python) / Prettier (JavaScript)
- Write tests for new features
- Update documentation
- Keep commits atomic and descriptive

---

## License

[Open Source License - Determine with team]

This project is 100% open-source and suitable for government use.

---

## FAQ

**Q: Can we integrate with existing SSO?**  
A: Yes, architecture is SSO-ready. See auth backend documentation.

**Q: What if we need more content languages?**  
A: Easy to add. Extend Language model, add bilingual fields to Article.

**Q: How do we scale to 10,000+ users?**  
A: Architecture supports it. Add caching layer (Redis), CDN, DB replication.

**Q: Can we add comments/discussions later?**  
A: Yes, extend Article model, create Comment model. No breaking changes.

**Q: What about mobile app?**  
A: API is REST-friendly. Can build React Native or native app.

**Q: How's the backup/disaster recovery?**  
A: PostgreSQL hot backup, regular snapshots. See deployment guide.

See [docs/ARCHITECTURE_SUMMARY.md](docs/ARCHITECTURE_SUMMARY.md) for more FAQs.

---

## Support

- **Architecture Questions**: See [docs/01_SYSTEM_ARCHITECTURE.md](docs/01_SYSTEM_ARCHITECTURE.md)
- **Database Questions**: See [docs/02_DATABASE_SCHEMA.md](docs/02_DATABASE_SCHEMA.md)
- **Setup Questions**: See [docs/04_INITIAL_SCAFFOLDING.md](docs/04_INITIAL_SCAFFOLDING.md)
- **Implementation Questions**: See [docs/05_IMPLEMENTATION_CHECKLIST.md](docs/05_IMPLEMENTATION_CHECKLIST.md)

---

## Changelog

### Version 1.0 (5 Jan 2026)
- ✅ Complete architecture documentation
- ✅ Database schema with Django models
- ✅ Folder structure and organization
- ✅ Configuration and scaffolding guide
- ✅ Implementation checklist (14 phases)

---

## Team

- **Architect**: You (Senior Full-Stack Engineer)
- **Frontend Developer**: [To be assigned]
- **Backend Developer**: [To be assigned]
- **DevOps**: [To be assigned]
- **QA**: [To be assigned]

---

## Next Steps

1. ✅ **Review architecture** (this README + docs/)
2. ⏳ **Discuss with team** (alignment on tech stack, timeline)
3. ⏳ **Phase 2**: Backend Setup (create Django project)
4. ⏳ **Phase 3-6**: Build APIs (public, internal, admin)
5. ⏳ **Phase 7-12**: Build UI (public pages, internal pages, admin)
6. ⏳ **Phase 13-14**: Testing, deployment, launch

---

**Siap untuk memulai?** 🚀

Baca [docs/ARCHITECTURE_SUMMARY.md](docs/ARCHITECTURE_SUMMARY.md) untuk quick start dan FAQ.

---

*Last Updated: 5 Januari 2026*
