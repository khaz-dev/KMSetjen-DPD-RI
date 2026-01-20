# KMSetjenDPDRI - Sistem Arsitektur

**Versi**: 1.0  
**Tanggal**: 5 Januari 2026  
**Status**: Planning

---

## 1. RINGKASAN EKSEKUTIF

Sistem Knowledge Management berbasis web dengan:
- **Dual Access Model**: Public (tanpa login) + Internal (SSO)
- **Bilingual Support**: Bahasa Indonesia & English
- **Light/Dark Mode**: User preference-based
- **Role-Based Access Control**: Admin, Editor, Contributor, Reader, Public
- **Open Source Stack**: React + Django + PostgreSQL

---

## 2. ARSITEKTUR SISTEM KESELURUHAN

```
┌─────────────────────────────────────────────────────────────┐
│                   USERS / CLIENTS                           │
├──────────────────────────┬──────────────────────────────────┤
│   Public Users           │   Internal Users (ASN)           │
│   (No Auth Required)     │   (SSO Auth Required)            │
└──────────────────────────┴──────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   ┌─────────┐      ┌──────────┐      ┌──────────┐
   │   CDN   │      │  React   │      │  React   │
   │ (Static)│      │  Frontend│      │ Frontend │
   │ Public  │      │ (Public) │      │(Internal)│
   └────┬────┘      └────┬─────┘      └────┬─────┘
        │                │                  │
        └────────────────┼──────────────────┘
                         │
          ┌──────────────┼──────────────────┐
          │              │                  │
          ▼              ▼                  ▼
    ┌────────────┐ ┌──────────────┐ ┌────────────┐
    │  Public    │ │   Internal   │ │   Admin    │
    │    API     │ │     API      │ │    API     │
    │  (DRF)     │ │   (DRF)      │ │  (DRF)     │
    └────┬───────┘ └──────┬───────┘ └────┬───────┘
         │                │               │
         └────────────────┼───────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
    ┌──────────────┐             ┌────────────────┐
    │   Django     │             │  PostgreSQL    │
    │   Backend    │◄────────────►│  Database      │
    │   (DRF)      │             │                │
    └──────────────┘             └────────────────┘
          ▲
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
 ┌──────┐   ┌────────┐
 │ SSO  │   │Audit   │
 │Token │   │Logging │
 │Valid │   │        │
 └──────┘   └────────┘
```

---

## 3. ACCESS CONTROL MODEL

### 3.1 User Roles & Permissions

| Role | Login | Features | Access Level |
|------|-------|----------|--------------|
| **Public (Anon)** | No | Read public content, search, view categories | Public only |
| **Public (Registered)** | Optional | + Comment, like, subscribe to updates | Public + interactions |
| **Reader (ASN)** | Yes (SSO) | + View internal content per role | Public + Internal |
| **Contributor** | Yes (SSO) | + Create/edit drafts for own content | Full content creation |
| **Editor** | Yes (SSO) | + Review, approve, publish content | Full workflow |
| **Admin** | Yes (SSO) | + User management, settings, audit logs | Full system |

### 3.2 Akses Per Fitur

```
FITUR                   | PUBLIC | READER | CONTRIBUTOR | EDITOR | ADMIN
────────────────────────┼────────┼────────┼─────────────┼────────┼──────
View Public Articles    |   ✓    |   ✓    |      ✓      |   ✓    |  ✓
View Internal Articles  |   -    |   ✓    |      ✓      |   ✓    |  ✓
Search Content          |   ✓    |   ✓    |      ✓      |   ✓    |  ✓
Create Draft            |   -    |   -    |      ✓      |   ✓    |  ✓
Submit for Review       |   -    |   -    |      ✓      |   ✓    |  ✓
Approve/Publish         |   -    |   -    |      -      |   ✓    |  ✓
Manage Users            |   -    |   -    |      -      |   -    |  ✓
View Audit Logs         |   -    |   -    |      -      |   -    |  ✓
System Settings         |   -    |   -    |      -      |   -    |  ✓
```

---

## 4. DATA FLOW

### 4.1 Public User Flow (No Auth)

```
Public User
    │
    ├─ Browse Homepage (categories, featured articles)
    │
    ├─ View Article
    │   └─ GET /api/public/articles/{id}/
    │
    ├─ Search
    │   └─ GET /api/public/articles/?search=...
    │
    └─ Filter
        └─ GET /api/public/articles/?category=&language=&year=
```

### 4.2 Internal User Flow (SSO Auth)

```
ASN User
    │
    ├─ Login (SSO)
    │   └─ POST /api/auth/login/ {sso_token}
    │
    ├─ Get Token
    │   └─ Store in localStorage
    │
    ├─ Access Internal Content
    │   ├─ GET /api/internal/articles/ (with Auth header)
    │   └─ Only see articles with access_level matching role
    │
    ├─ Create/Edit Content (if Contributor+)
    │   ├─ POST /api/internal/articles/
    │   └─ PATCH /api/internal/articles/{id}/
    │
    ├─ Submit for Review
    │   └─ PATCH /api/internal/articles/{id}/ {status: "review"}
    │
    └─ View Audit Trail (if Editor+)
        └─ GET /api/internal/audit-logs/?content_id=
```

### 4.3 Admin Flow

```
Admin
    │
    ├─ Manage Users
    │   ├─ GET /api/admin/users/
    │   ├─ POST /api/admin/users/
    │   └─ PATCH /api/admin/users/{id}/
    │
    ├─ View System Logs
    │   └─ GET /api/admin/audit-logs/?date_range=
    │
    ├─ System Settings
    │   ├─ GET /api/admin/settings/
    │   └─ PATCH /api/admin/settings/
    │
    └─ Content Moderation
        └─ GET /api/admin/articles/?status=review
```

---

## 5. API STRUCTURE

### 5.1 Endpoint Organization

```
/api/
├── /public/
│   ├── /articles/           (GET, search, filter)
│   ├── /categories/         (GET)
│   ├── /tags/              (GET)
│   └── /articles/{id}/     (GET)
│
├── /internal/
│   ├── /auth/              (POST login)
│   ├── /articles/          (GET, POST, PATCH - role-based)
│   ├── /articles/{id}/     (GET, PATCH, DELETE - role-based)
│   ├── /drafts/            (GET, POST, PATCH - contributor+)
│   ├── /me/                (GET profile)
│   ├── /audit-logs/        (GET - editor+)
│   └── /notifications/     (GET)
│
└── /admin/
    ├── /users/             (GET, POST, PATCH, DELETE)
    ├── /audit-logs/        (GET)
    ├── /settings/          (GET, PATCH)
    └── /statistics/        (GET)
```

### 5.2 Security Principles

- **Public API**: No auth required, CORS enabled for CDN
- **Internal API**: Auth token required (Bearer token in header)
- **Admin API**: Admin role required + additional token
- **Permission Checks**: On every view (not just at route level)
- **Serializer Filtering**: Only expose fields based on user role
- **Audit Trail**: Log all create/update/delete operations

---

## 6. DATABASE ENTITIES

### 6.1 Core Entities (Detailed in 02_DATABASE_SCHEMA.md)

```
User ──────┐
           ├──► Role
           │
           └──► UserPermission

Article ──────┐
              ├──► ArticleVersion (versioning)
              ├──► ArticleTranslation (i18n)
              ├──► Category
              ├──► Tag
              ├──► File (attachments)
              └──► AuditLog (who changed what, when)

Category
Tag
Language
AccessLevel (PUBLIC, INTERNAL_ALL, INTERNAL_ROLE_BASED)
```

---

## 7. TECHNOLOGY DECISIONS & REASONING

| Component | Choice | Why | Alternatives Considered |
|-----------|--------|-----|-------------------------|
| **Frontend** | React + Bootstrap | Component-based, free, responsive | Vue, Angular (overkill) |
| **Backend** | Django + DRF | Rapid dev, built-in auth, ORM, free | FastAPI (less batteries), Flask |
| **Database** | PostgreSQL | JSONB support, free, powerful | MySQL (fine), SQLite (no scaling) |
| **i18n** | react-i18next | Standard, large community | i18next (more complex setup) |
| **Styling** | Bootstrap + CSS vars | Free, accessible, dark mode ready | Tailwind (paid), Material (heavy) |
| **Auth** | Django session + Token | SSO-ready, standard | JWT-only (reinvents wheel) |
| **API Format** | REST + JSON | Simple, industry standard | GraphQL (overkill for KMS) |
| **Deployment** | On-premise Linux | Government data sensitivity, zero cost | Cloud (costs, vendor lock-in) |

---

## 8. SECURITY ARCHITECTURE

### 8.1 Authentication

```
SSO Provider (LDAP/AD) ──► Django Backend
    │                          │
    └─ Validate token          ├─ Create/update User in DB
    └─ Return user info        ├─ Generate session token
                               └─ Return to frontend
```

### 8.2 Authorization

- **Frontend**: Hide buttons/pages for unauthorized users (UX)
- **Backend**: Validate EVERY request (security)
  - Middleware checks token validity
  - ViewSet permission classes check role
  - Serializer filters fields per user

### 8.3 Data Protection

- **Passwords**: Hashed (Django's default)
- **Tokens**: Stored in httpOnly cookies (frontend won't see)
- **HTTPS**: Mandatory in production
- **CORS**: Strict origin whitelisting
- **Input Validation**: DRF serializers validate all input
- **Rate Limiting**: Implement on API endpoints
- **Audit Trail**: Log all content modifications (who, what, when)

---

## 9. LANGUAGE & LOCALIZATION

### 9.1 Database Storage

```
Article
├── title_id: "Panduan KMS"
├── title_en: "KMS Guide"
├── slug: "panduan-kms"          (unique, language-agnostic)
├── language: "id"               (primary language)
├── is_bilingual: true
│
└── Translations (if needed)
    ├── lang: "en"
    ├── title: "KMS Guide"
    └── content: "English content..."
```

### 9.2 Frontend Handling

```
User selects language → Stored in localStorage
Page loads → Check localStorage or URL param (?lang=en)
All text comes from i18n JSON files
When viewing article → Show language version available
Search → Search across all languages (if bilingual=true)
```

---

## 10. DEPLOYMENT ARCHITECTURE

### 10.1 On-Premise Setup

```
┌─────────────────────────────────────┐
│   Government Server (Linux)         │
├─────────────────────────────────────┤
│                                     │
│  ┌────────────────────────────┐    │
│  │  Nginx (Reverse Proxy)     │    │
│  │  + HTTPS termination       │    │
│  │  + Static files (React)    │    │
│  └────────────┬───────────────┘    │
│               │                     │
│  ┌────────────▼───────────────┐    │
│  │  Django Gunicorn           │    │
│  │  + DRF API                 │    │
│  │  + Admin panel             │    │
│  └────────────┬───────────────┘    │
│               │                     │
│  ┌────────────▼───────────────┐    │
│  │  PostgreSQL                │    │
│  │  + Backup strategy         │    │
│  │  + Audit logs storage      │    │
│  └────────────────────────────┘    │
│                                     │
│  ┌────────────────────────────┐    │
│  │  Cron jobs (Celery alt)    │    │
│  │  - Notifications           │    │
│  │  - Backups                 │    │
│  │  - Cleanup old drafts      │    │
│  └────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## 11. CONTENT LIFECYCLE

```
DRAFT
  │ (Contributor submits)
  ▼
REVIEW
  │ (Editor checks)
  ├─── REJECTED ───► DRAFT (can edit and resubmit)
  │
  ├─── APPROVED
  │       │ (Editor publishes)
  │       ▼
  │    PUBLISHED
  │       │ (Visible to target audience)
  │       │
  │       ├─── UNPUBLISHED ──► DRAFT (for edits)
  │       │
  │       └─── ARCHIVED (kept for history, not visible)
  │
  └─── SCHEDULED (publish at specific date)
        │ (Auto-publish at scheduled time)
        ▼
      PUBLISHED
```

---

## 12. ERROR HANDLING & LOGGING

### 12.1 API Error Responses

```json
{
  "error": "error_code",
  "message": "User-friendly message in user's language",
  "details": {
    "field": ["error 1", "error 2"]
  },
  "timestamp": "2026-01-05T10:30:00Z"
}
```

### 12.2 Audit Log Entry

```json
{
  "timestamp": "2026-01-05T10:30:00Z",
  "user": "user_id",
  "action": "CREATE|UPDATE|DELETE|PUBLISH",
  "content_type": "Article",
  "content_id": 123,
  "changes": {
    "title": ["Old", "New"],
    "status": ["draft", "review"]
  },
  "ip_address": "192.168.1.100"
}
```

---

## 13. PERFORMANCE CONSIDERATIONS

- **Database Indexing**: On title, slug, category, language, is_published
- **Pagination**: 20 items per page (reduce payload)
- **Caching**: Cache categories, tags (rarely change)
- **Search**: Use PostgreSQL full-text search (built-in)
- **CDN**: Static files (React bundle) served via Nginx
- **API Response Time**: Target <200ms for 95th percentile

---

## 14. FUTURE EXTENSIBILITY

- **Comment System**: Add Comment model, reply threading
- **Notification System**: Email/in-app notifications
- **Advanced Workflow**: Multi-level approval chains
- **Analytics**: View count, user engagement metrics
- **Integration**: External data sources via webhooks
- **Mobile App**: React Native using same API

---

## NEXT STEPS

1. ✅ System Architecture (THIS DOCUMENT)
2. ⏳ Database Schema (02_DATABASE_SCHEMA.md)
3. ⏳ Folder Structure (03_FOLDER_STRUCTURE.md)
4. ⏳ Configuration Plan (04_INITIAL_SCAFFOLDING.md)
5. ⏳ Implementation Checklist (05_IMPLEMENTATION_CHECKLIST.md)

---

**Siap untuk fase berikutnya?** Database schema sudah siap dirancang berdasarkan arsitektur ini.
