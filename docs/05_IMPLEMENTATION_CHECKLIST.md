# KMSetjenDPDRI - Implementation Checklist & Roadmap

**Versi**: 1.0  
**Tanggal**: 5 Januari 2026

---

## PHASE 1: FOUNDATION ✅ PLANNING COMPLETE

### Project Architecture (✅ DONE)
- [x] System architecture design
- [x] Access control matrix
- [x] API separation strategy (public/internal/admin)
- [x] Data flow diagrams

### Database Schema (✅ DONE)
- [x] Entity Relationship Diagram (ERD)
- [x] Django models definition
- [x] Relationships & constraints
- [x] Database indexes planning

### Folder Structure (✅ DONE)
- [x] Backend folder organization
- [x] Frontend component hierarchy
- [x] Configuration hierarchy
- [x] Test structure

### Configuration & Scaffolding (✅ DONE)
- [x] Backend requirements.txt
- [x] Django settings structure
- [x] Frontend setup & Vite config
- [x] i18n configuration
- [x] Docker setup (optional)
- [x] Deployment configuration

---

## PHASE 2: BACKEND SETUP (NEXT)

### Initial Project Structure
- [ ] Create Django project with `django-admin startproject config backend`
- [ ] Create Django apps: `core`, `content`, `api`, `auth`, `audit`
- [ ] Create shared utilities: `middleware`, `permissions`, `utils`
- [ ] Set up folder structure per spec

### Core Models Implementation
- [ ] Implement `User` model (extend AbstractUser)
- [ ] Implement `Role` model
- [ ] Implement `Language` model
- [ ] Set up M2M relationships
- [ ] Create migrations
- [ ] Test model creation & relationships

### Content Models
- [ ] Implement `Article` model (with bilingual support)
- [ ] Implement `ArticleVersion` model
- [ ] Implement `Category` model
- [ ] Implement `Tag` model
- [ ] Implement `File` model
- [ ] Create migrations
- [ ] Add indexes for performance

### Audit & Security
- [ ] Implement `AuditLog` model
- [ ] Set up signal handlers for auto-logging
- [ ] Implement permission classes (base permission structure)
- [ ] Set up custom authentication backend (SSO-ready)

### Configuration & Settings
- [ ] Create `settings_dev.py` and `settings_prod.py`
- [ ] Configure PostgreSQL connection
- [ ] Set up Django REST Framework config
- [ ] Configure CORS
- [ ] Set up logging
- [ ] Create `.env.example` with all required vars
- [ ] Test settings in both dev and prod modes

### Database Setup
- [ ] Create PostgreSQL database and user
- [ ] Run migrations (`makemigrations` → `migrate`)
- [ ] Load initial data (roles, languages)
- [ ] Create superuser for testing
- [ ] Set up backup strategy

**Estimated**: 2-3 days

---

## PHASE 3: BACKEND API (PUBLIC)

### Public API Endpoints
- [ ] Implement `ArticleListView` (GET /api/v1/public/articles/)
  - [ ] Pagination
  - [ ] Filtering (category, tag, language, year)
  - [ ] Full-text search
  - [ ] Ordering (date, views, relevance)

- [ ] Implement `ArticleDetailView` (GET /api/v1/public/articles/{id}/)
  - [ ] Increment view count
  - [ ] Return bilingual content if available

- [ ] Implement `CategoryListView` (GET /api/v1/public/categories/)
- [ ] Implement `TagListView` (GET /api/v1/public/tags/)

### Serializers
- [ ] Create `ArticleListSerializer` (minimal fields)
- [ ] Create `ArticleDetailSerializer` (full content)
- [ ] Create `CategorySerializer`
- [ ] Create `TagSerializer`

### Permissions & Filtering
- [ ] Allow public (unauthenticated) access
- [ ] Filter only `is_published=true` articles
- [ ] Filter only `access_level=public` or `access_level=internal` (fallback)
- [ ] Implement search filters

### Testing
- [ ] Write tests for all public endpoints
- [ ] Test search functionality
- [ ] Test pagination
- [ ] Test filtering

**Estimated**: 1-2 days

---

## PHASE 4: BACKEND API (AUTHENTICATION & INTERNAL)

### Authentication System
- [ ] Implement SSO-ready authentication backend
- [ ] Create login endpoint (POST /api/auth/login/)
- [ ] Create logout endpoint (POST /api/auth/logout/)
- [ ] Create token refresh endpoint
- [ ] Implement JWT tokens (or session-based)
- [ ] Set up HTTPS-ready secure cookies

### User Management
- [ ] Get user profile (GET /api/internal/me/)
- [ ] Update user preferences (language, theme)
- [ ] List users (admin only)

### Internal API Endpoints
- [ ] Implement `InternalArticleListView` (GET /api/v1/internal/articles/)
  - [ ] Filter by user's role & access level
  - [ ] Show draft + published articles (if author)
  - [ ] Show all published articles (if reader+)

- [ ] Implement `CreateArticleView` (POST /api/v1/internal/articles/)
  - [ ] Create as DRAFT
  - [ ] Log creation in audit trail

- [ ] Implement `UpdateArticleView` (PATCH /api/v1/internal/articles/{id}/)
  - [ ] Update as DRAFT
  - [ ] Log changes in audit trail

- [ ] Implement `SubmitForReviewView` (POST /api/v1/internal/articles/{id}/review/)
  - [ ] Change status to REVIEW
  - [ ] Only author can submit own articles

- [ ] Implement `PublishArticleView` (POST /api/v1/internal/articles/{id}/publish/)
  - [ ] Editor+ only
  - [ ] Change status to PUBLISHED
  - [ ] Set published_at timestamp

- [ ] Implement `ArchiveArticleView` (POST /api/v1/internal/articles/{id}/archive/)
  - [ ] Editor+ only
  - [ ] Change status to ARCHIVED

### Serializers
- [ ] Create `InternalArticleSerializer`
- [ ] Create `ArticleCreateUpdateSerializer`
- [ ] Create `UserSerializer` (without password)
- [ ] Create `UserDetailSerializer` (with preferences)

### Permissions
- [ ] Implement `IsAuthenticated` check
- [ ] Implement `IsAuthorOrEditor` for article editing
- [ ] Implement `IsEditor` for publishing
- [ ] Implement `CanAccessArticle` (check access_level + allowed_roles)

### Testing
- [ ] Test login/logout flow
- [ ] Test create article as contributor
- [ ] Test submit for review
- [ ] Test approval/publish as editor
- [ ] Test permission denials

**Estimated**: 2-3 days

---

## PHASE 5: BACKEND API (ADMIN)

### Admin API Endpoints
- [ ] Implement user management (CRUD)
- [ ] Implement role assignment
- [ ] Implement audit log queries
- [ ] Implement system settings management
- [ ] Implement content moderation queue

### Admin Serializers
- [ ] Create `UserAdminSerializer` (with all fields)
- [ ] Create `AuditLogSerializer`
- [ ] Create `SettingsSerializer`

### Admin Permissions
- [ ] Implement `IsAdmin` permission class
- [ ] Implement `IsEditor` for moderate content

### Testing
- [ ] Test admin endpoints for non-admins (deny)
- [ ] Test user creation/deletion
- [ ] Test role assignment
- [ ] Test audit log filtering

**Estimated**: 1-2 days

---

## PHASE 6: FILE HANDLING & STORAGE

### File Upload
- [ ] Implement file upload endpoint
- [ ] Validate file type & size
- [ ] Store in `media/articles/{year}/{month}/`
- [ ] Generate thumbnail for images

### File Management
- [ ] Link files to articles
- [ ] Delete files when article deleted
- [ ] Serve files with authentication check

### Testing
- [ ] Test file upload validation
- [ ] Test large file handling
- [ ] Test file deletion

**Estimated**: 1 day

---

## PHASE 7: FRONTEND - SETUP & CONFIGURATION

### Project Initialization
- [ ] Create React project with Vite
- [ ] Install dependencies (React, Bootstrap, i18next, Axios, etc.)
- [ ] Set up folder structure per spec

### Configuration
- [ ] Set up environment variables (.env)
- [ ] Configure API base URL
- [ ] Configure i18n (i18next)

### Global State Management
- [ ] Create `AuthContext` (user login state)
- [ ] Create `ThemeContext` (light/dark mode)
- [ ] Create `LanguageContext` (i18n language selection)
- [ ] Create custom hooks: `useAuth()`, `useTheme()`, `useLanguage()`

### API Layer
- [ ] Create Axios instance with interceptors
- [ ] Create `articleService.js`
- [ ] Create `authService.js`
- [ ] Create `userService.js`

### Styling
- [ ] Set up Bootstrap 5 integration
- [ ] Create theme CSS with dark mode support
- [ ] Create responsive breakpoint utilities

**Estimated**: 1-2 days

---

## PHASE 8: FRONTEND - PUBLIC PAGES

### Home Page
- [ ] Display featured articles
- [ ] Display article categories
- [ ] Display recent articles
- [ ] Language switcher (top-right)
- [ ] Theme switcher (top-right)

### Navigation & Layout
- [ ] Create Header component (responsive)
- [ ] Create Footer component
- [ ] Create Layout wrapper

### Article Detail Page
- [ ] Fetch article from API
- [ ] Display content (HTML from WYSIWYG)
- [ ] Display bilingual versions (if available)
- [ ] Display metadata (author, date, category, tags)
- [ ] Display attachments / files
- [ ] Increment view count

### Search Page
- [ ] Create search bar with autocomplete
- [ ] Create filter panel (category, tag, year, language)
- [ ] Display search results with pagination
- [ ] Show "no results" message

### Category Browse Page
- [ ] Display articles by category
- [ ] Show category description
- [ ] Filter & search within category

**Estimated**: 2-3 days

---

## PHASE 9: FRONTEND - AUTHENTICATION & INTERNAL PAGES

### Login Page
- [ ] Create login form
- [ ] Handle SSO token flow
- [ ] Store token in localStorage
- [ ] Redirect to dashboard on success

### Protected Routes
- [ ] Create `ProtectedRoute` wrapper
- [ ] Create `RoleBasedRoute` wrapper (for role-specific pages)
- [ ] Redirect unauthenticated users to login

### Dashboard
- [ ] Display user profile card
- [ ] Display user's draft articles
- [ ] Display "create new article" button
- [ ] Show recent activity / audit log

### My Articles Page
- [ ] List user's articles (all statuses)
- [ ] Filter by status (draft, review, published, rejected)
- [ ] Show edit/delete buttons
- [ ] Show submission status

### Create/Edit Article Page
- [ ] Create rich text editor (WYSIWYG)
- [ ] Form fields: title_id, title_en, content_id, content_en
- [ ] Category & tag selection
- [ ] File upload
- [ ] Save as draft
- [ ] Submit for review
- [ ] Bilingual toggle
- [ ] Access level selector
- [ ] Preview before submit

### Notifications/Messages
- [ ] Create notification component
- [ ] Show approval/rejection messages
- [ ] Show validation errors

**Estimated**: 3-4 days

---

## PHASE 10: FRONTEND - ADMIN PAGES

### Admin Dashboard
- [ ] Display system stats (articles, users, recent activity)
- [ ] Show pending reviews
- [ ] Show system health

### Manage Users Page
- [ ] List all users
- [ ] Search/filter users
- [ ] Create new user
- [ ] Edit user details
- [ ] Assign roles
- [ ] Deactivate user

### Content Moderation
- [ ] Show articles pending review
- [ ] Preview article
- [ ] Approve/reject with message
- [ ] Publish approved articles

### Audit Logs Page
- [ ] Display audit log entries
- [ ] Filter by user, action, content type, date
- [ ] Show details of changes

### Settings Page
- [ ] Manage categories
- [ ] Manage tags
- [ ] System configuration
- [ ] Backup/restore options

**Estimated**: 2-3 days

---

## PHASE 11: I18N (INTERNATIONALIZATION)

### Translation Files
- [ ] Create complete translation dictionaries (id.json, en.json)
  - [ ] Common UI text (buttons, labels, menus)
  - [ ] Page titles & descriptions
  - [ ] Form labels & placeholders
  - [ ] Error messages
  - [ ] Success messages

### Component Implementation
- [ ] Update all text to use `useTranslation()` hook
- [ ] Wrap dynamic text in `<Trans>` component if needed
- [ ] Test language switching across all pages

### URL-based Language Handling
- [ ] Option: Prefix URLs with language (/id/article, /en/article)
- [ ] Or store in localStorage + state

**Estimated**: 1-2 days

---

## PHASE 12: DARK MODE / THEME

### CSS Variables Setup
- [x] Create `themes.css` with CSS custom properties
- [x] Light mode colors (default)
- [x] Dark mode colors (in [data-theme="dark"])

### Implementation
- [ ] Create `useTheme()` hook
- [ ] Create theme toggle button in Header
- [ ] Save preference to localStorage
- [ ] Apply theme on page load
- [ ] Smooth transition between themes

### Bootstrap Override
- [ ] Override Bootstrap CSS variables for dark mode
- [ ] Test all components in both themes

**Estimated**: 1 day

---

## PHASE 13: TESTING & QA

### Backend Testing
- [ ] Unit tests: Models, managers, serializers
- [ ] Integration tests: All API endpoints
- [ ] Permission tests: All role-based access scenarios
- [ ] Audit trail tests: Verify logging works
- [ ] Search tests: Full-text search functionality
- [ ] File upload tests: File validation & storage

Target coverage: **80%+**

### Frontend Testing
- [ ] Component tests: Rendering, state changes
- [ ] Integration tests: Page flows (login → create → submit)
- [ ] Accessibility tests: Keyboard navigation, screen readers
- [ ] Theme tests: Light/dark mode switching
- [ ] i18n tests: Language switching
- [ ] Responsive tests: Mobile, tablet, desktop

Target coverage: **70%+**

### Manual QA
- [ ] Test all user flows:
  - [ ] Public user browsing
  - [ ] Login & access internal content
  - [ ] Create & publish article (contributor → editor)
  - [ ] Admin: Create users, assign roles, audit logs

- [ ] Browser compatibility: Chrome, Firefox, Safari, Edge
- [ ] Mobile responsiveness: iOS, Android
- [ ] Performance: API response times, page load times
- [ ] Security: Test input validation, SQL injection, XSS

**Estimated**: 2-3 days

---

## PHASE 14: DEPLOYMENT & DOCUMENTATION

### Backend Deployment
- [ ] Finalize production settings
- [ ] Set up PostgreSQL on server
- [ ] Set up Gunicorn + Nginx reverse proxy
- [ ] Set up SSL/TLS certificate
- [ ] Configure firewall & security rules
- [ ] Set up backup strategy
- [ ] Set up monitoring/logging

### Frontend Deployment
- [ ] Build optimized React bundle
- [ ] Configure Nginx to serve React + API proxy
- [ ] Set up CDN (optional)
- [ ] Configure caching headers

### Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Deployment guide
- [ ] Maintenance guide
- [ ] Contributing guide
- [ ] User manual (internal)
- [ ] Admin manual

### Launch
- [ ] Smoke tests in production
- [ ] Monitor logs for errors
- [ ] Gather user feedback
- [ ] Fix critical issues

**Estimated**: 2-3 days

---

## TIMELINE SUMMARY

| Phase | Task | Days |
|-------|------|------|
| 1 | Planning & Architecture | ✅ 3 |
| 2 | Backend Setup | 2-3 |
| 3 | Public API | 1-2 |
| 4 | Auth & Internal API | 2-3 |
| 5 | Admin API | 1-2 |
| 6 | File Handling | 1 |
| 7 | Frontend Setup | 1-2 |
| 8 | Public Pages | 2-3 |
| 9 | Internal Pages | 3-4 |
| 10 | Admin Pages | 2-3 |
| 11 | I18N | 1-2 |
| 12 | Dark Mode | 1 |
| 13 | Testing & QA | 2-3 |
| 14 | Deployment | 2-3 |
| **TOTAL** | | **~30-40 days** |

---

## QUICK REFERENCE

### Key Decision Points
- [ ] SSO vs. Django auth (currently SSO-ready but optional)
- [ ] Comment system (future feature, not in MVP)
- [ ] Mobile app (future, uses same API)
- [ ] Full-text search engine (PostgreSQL FTS is sufficient)

### Critical Success Factors
- ✅ Bilingual i18n working across all pages
- ✅ Light/dark mode persistent across sessions
- ✅ Role-based access control strictly enforced
- ✅ Audit trail captures all changes
- ✅ Public & internal APIs clearly separated
- ✅ Performance: API responses <200ms
- ✅ Security: No SQL injection, XSS, CSRF vulnerabilities

### Open Source Stack
- ✅ 0 Rupiah budget: All tools are free & open-source
- ✅ No vendor lock-in: Everything self-hosted
- ✅ Scalable: Can handle thousands of concurrent users
- ✅ Maintainable: Clear structure, well-documented

---

## DOCUMENTATION INDEX

| Document | Purpose |
|----------|---------|
| [01_SYSTEM_ARCHITECTURE.md](01_SYSTEM_ARCHITECTURE.md) | High-level design, access control, data flows |
| [02_DATABASE_SCHEMA.md](02_DATABASE_SCHEMA.md) | Data model, Django models, ERD |
| [03_FOLDER_STRUCTURE.md](03_FOLDER_STRUCTURE.md) | Directory organization, naming conventions |
| [04_INITIAL_SCAFFOLDING.md](04_INITIAL_SCAFFOLDING.md) | Setup commands, configuration files |
| [05_IMPLEMENTATION_CHECKLIST.md](05_IMPLEMENTATION_CHECKLIST.md) | THIS FILE - step-by-step tasks |

---

## NEXT IMMEDIATE STEPS

Once you're ready to start development:

1. **Choose**: Backend first or Frontend first?
   - Recommend: **Backend first** (API-driven approach)

2. **Set Up Environment**:
   - Install Python 3.11+, Node.js 18+, PostgreSQL 12+
   - Run: `scripts/setup_dev.sh` or manual commands from 04_INITIAL_SCAFFOLDING.md

3. **Start Phase 2: Backend Setup**
   - Create Django project
   - Implement models
   - Set up database

4. **Then Phase 3: Public API**
   - Build public endpoints
   - Test with Postman/curl

5. **Parallelize**: Frontend team can start Phase 7 while backend does Phase 4-5

---

**Arsitektur lengkap siap. Tinggal eksekusi fase per fase. Mau dimulai dari mana?**
