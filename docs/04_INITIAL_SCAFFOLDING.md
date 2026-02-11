# KMSetjenDPDRI - Initial Scaffolding & Configuration Plan

**Versi**: 1.0  
**Tanggal**: 5 Januari 2026

---

## 1. BACKEND SCAFFOLDING

### 1.1 Backend Stack

```
Python 3.11+
Django 4.2+ (LTS)
Django REST Framework 3.14+
PostgreSQL 12+
Gunicorn (production WSGI server)
```

### 1.2 Backend Dependencies (requirements.txt)

```txt
# Core
Django==4.2.8
djangorestframework==3.14.0
django-cors-headers==4.3.1
django-filter==23.5
django-extensions==3.2.3

# Database & ORM
psycopg2-binary==2.9.9
django-models-audit==0.1.0  # or custom audit logging

# Authentication & Security
djangorestframework-simplejwt==5.3.2
django-environ==0.21.0
cryptography==41.0.7

# File handling & storage
Pillow==10.1.0
python-magic==0.4.27

# Search & FTS
django-postgres-searchvector==0.1.0

# Utilities
python-dateutil==2.8.2
pytz==2023.3.post1
celery==5.3.4  # For async tasks (optional but recommended)
redis==5.0.1   # Cache backend & Celery broker

# Development
black==23.12.0
flake8==6.1.0
isort==5.13.2
pytest==7.4.3
pytest-django==4.7.0
pytest-cov==4.1.0
factory-boy==3.3.0

# Production
whitenoise==6.6.0  # Static file serving

# YAML/Config
pyyaml==6.0.1
```

### 1.3 Backend Initial Setup Commands

```bash
# Create virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env from example
cp .env.example .env

# Create Django project structure
django-admin startproject config backend
cd backend
python manage.py startapp core
python manage.py startapp content
python manage.py startapp auth
python manage.py startapp audit
mkdir -p apps/api/v1/{public,internal,admin}
mkdir -p shared/{middleware,permissions,serializers,utils,validators}
mkdir -p tests/{api,models,auth,services}

# Initialize database
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Create test data
python manage.py shell
# ... create initial roles, languages

# Run development server
python manage.py runserver
```

### 1.4 Backend Key Configuration Files

#### `config/settings.py` (base)

```python
"""
Django settings for KMSetjen DPD RI project.
"""
import os
from pathlib import Path
from datetime import timedelta
import environ

env = environ.Env()
environ.Env.read_env()

BASE_DIR = Path(__file__).resolve().parent.parent

# Security
SECRET_KEY = env('SECRET_KEY', default='unsafe-dev-key-change-in-prod')
DEBUG = env.bool('DEBUG', default=True)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

# Apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party
    'rest_framework',
    'corsheaders',
    'django_filters',
    'django_extensions',
    
    # Local
    'apps.core',
    'apps.content',
    'apps.auth',
    'apps.audit',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'shared.middleware.audit_middleware.AuditMiddleware',
]

ROOT_URLCONF = 'config.urls'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME', default='kmsdb'),
        'USER': env('DB_USER', default='kms_user'),
        'PASSWORD': env('DB_PASSWORD', default=''),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
    }
}

# Auth
AUTH_USER_MODEL = 'core.User'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# CORS
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:5175', 'http://localhost:5175']
)

# Language & Timezone
LANGUAGE_CODE = 'id-ID'
TIME_ZONE = 'Asia/Jakarta'
USE_I18N = True
USE_TZ = True

# Static & Media
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'django.log'),
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'audit': {
            'handlers': ['file'],
            'level': 'INFO',
        },
    },
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ALGORITHM': 'HS256',
}
```

#### `config/urls.py`

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API v1
    path('api/v1/', include('apps.api.v1.urls')),
    
    # Auth
    path('api/auth/', include('apps.auth.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
```

#### `config/.env.example`

```env
# Django
DJANGO_ENV=dev
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,example.com

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kmsdb
DB_USER=kms_user
DB_PASSWORD=secure_password
DB_HOST=localhost
DB_PORT=5432

# CORS (frontend URLs)
CORS_ALLOWED_ORIGINS=http://localhost:5175,http://localhost:5175,https://kms.example.com

# SSO Configuration
SSO_ENABLED=False
SSO_URL=https://sso.server.com
SSO_CALLBACK_URL=http://localhost:8002/api/auth/sso/callback

# Email (for notifications)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password

# Redis (cache & sessions)
REDIS_URL=redis://localhost:6382/0

# File uploads
MAX_UPLOAD_SIZE=52428800  # 50MB in bytes
ALLOWED_FILE_EXTENSIONS=pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/django.log
```

---

## 2. FRONTEND SCAFFOLDING

### 2.1 Frontend Stack

```
Node.js 18+ LTS
React 18+
Vite (build tool)
Bootstrap 5 (CSS framework)
react-i18next (internationalization)
TailwindCSS (optional, for utility CSS)
Axios (HTTP client)
```

### 2.2 Frontend Setup Commands

```bash
# Create React + Vite project
npm create vite@latest frontend -- --template react
cd frontend
npm install

# Install additional dependencies
npm install \
  bootstrap \
  react-bootstrap \
  axios \
  i18next \
  react-i18next \
  react-router-dom \
  zustand \
  @react-icons/all-files

# Development dependencies
npm install --save-dev \
  eslint \
  eslint-config-react \
  prettier \
  @vitejs/plugin-react

# Create folder structure
mkdir -p src/{config,i18n/locales,context,hooks,services,utils,pages,components,styles,assets}
```

### 2.3 Frontend Key Configuration Files

#### `frontend/package.json`

```json
{
  "name": "kmsetjen-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src",
    "format": "prettier --write src"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "bootstrap": "^5.3.0",
    "react-bootstrap": "^2.10.0",
    "i18next": "^23.7.0",
    "react-i18next": "^13.5.0",
    "@react-icons/all-files": "^4.1.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "eslint": "^8.54.0",
    "prettier": "^3.1.0"
  }
}
```

#### `frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
```

#### `frontend/src/config/api.js`

```javascript
import axios from 'axios'

const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:8002'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

#### `frontend/src/i18n/i18n.js`

```javascript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import idTranslations from './locales/id.json'
import enTranslations from './locales/en.json'

i18n.use(initReactI18next).init({
  resources: {
    id: { translation: idTranslations },
    en: { translation: enTranslations },
  },
  lng: localStorage.getItem('language') || 'id',
  fallbackLng: 'id',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
```

#### `frontend/src/i18n/locales/id.json`

```json
{
  "common": {
    "home": "Beranda",
    "about": "Tentang",
    "search": "Cari",
    "language": "Bahasa",
    "theme": "Tema",
    "login": "Masuk",
    "logout": "Keluar",
    "loading": "Memuat...",
    "error": "Terjadi kesalahan",
    "notFound": "Tidak ditemukan"
  },
  "article": {
    "title": "Judul",
    "content": "Konten",
    "category": "Kategori",
    "tags": "Tag",
    "author": "Penulis",
    "published": "Dipublikasikan",
    "views": "Tayangan"
  }
}
```

#### `frontend/src/i18n/locales/en.json`

```json
{
  "common": {
    "home": "Home",
    "about": "About",
    "search": "Search",
    "language": "Language",
    "theme": "Theme",
    "login": "Login",
    "logout": "Logout",
    "loading": "Loading...",
    "error": "An error occurred",
    "notFound": "Not found"
  },
  "article": {
    "title": "Title",
    "content": "Content",
    "category": "Category",
    "tags": "Tags",
    "author": "Author",
    "published": "Published",
    "views": "Views"
  }
}
```

#### `frontend/.env.example`

```env
REACT_APP_API_URL=http://localhost:8002
REACT_APP_ENV=dev
```

#### `frontend/src/styles/themes.css`

```css
:root {
  /* Light mode (default) */
  --color-bg: #ffffff;
  --color-text: #000000;
  --color-border: #e9ecef;
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --color-success: #28a745;
  --color-danger: #dc3545;
  --color-warning: #ffc107;
  --color-info: #17a2b8;
}

[data-theme="dark"] {
  --color-bg: #1a1a1a;
  --color-text: #e9ecef;
  --color-border: #444;
  --color-primary: #0d6efd;
  --color-secondary: #adb5bd;
  --color-success: #198754;
  --color-danger: #dc3545;
  --color-warning: #ffc107;
  --color-info: #0dcaf0;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.card {
  border-color: var(--color-border);
}

.btn-primary {
  background-color: var(--color-primary);
}
```

---

## 3. DATABASE SETUP

### 3.1 PostgreSQL Installation

```bash
# Windows: Use PostgreSQL installer
# macOS: brew install postgresql
# Linux (Ubuntu): sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE kmsdb;
CREATE USER kms_user WITH PASSWORD 'secure_password';
ALTER ROLE kms_user SET client_encoding TO 'utf8';
ALTER ROLE kms_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE kms_user SET default_transaction_deferrable TO on;
ALTER ROLE kms_user SET default_transaction_read_committed TO on;
GRANT ALL PRIVILEGES ON DATABASE kmsdb TO kms_user;
\q
```

### 3.2 Initial Data Fixtures

Create `backend/fixtures/initial_data.json`:

```json
[
  {
    "model": "core.role",
    "pk": 1,
    "fields": {
      "code": "admin",
      "name_id": "Administrator",
      "name_en": "Administrator",
      "description_id": "Akses penuh ke sistem",
      "description_en": "Full system access",
      "permissions": ["view_all", "edit_all", "delete_all", "manage_users"]
    }
  },
  {
    "model": "core.role",
    "pk": 2,
    "fields": {
      "code": "editor",
      "name_id": "Editor",
      "name_en": "Editor",
      "description_id": "Dapat meninjau dan mempublikasikan konten",
      "description_en": "Can review and publish content",
      "permissions": ["view_all", "edit_own", "publish_all"]
    }
  },
  {
    "model": "core.role",
    "pk": 3,
    "fields": {
      "code": "contributor",
      "name_id": "Kontributor",
      "name_en": "Contributor",
      "description_id": "Dapat membuat dan mengedit konten sendiri",
      "description_en": "Can create and edit own content",
      "permissions": ["view_all", "edit_own", "create_content"]
    }
  },
  {
    "model": "core.role",
    "pk": 4,
    "fields": {
      "code": "reader",
      "name_id": "Pembaca (ASN)",
      "name_en": "Reader (ASN)",
      "description_id": "Akses membaca konten internal",
      "description_en": "Can read internal content",
      "permissions": ["view_internal"]
    }
  },
  {
    "model": "core.role",
    "pk": 5,
    "fields": {
      "code": "public",
      "name_id": "Publik",
      "name_en": "Public",
      "description_id": "Akses publik tanpa login",
      "description_en": "Public access without login",
      "permissions": ["view_public"]
    }
  },
  {
    "model": "core.language",
    "pk": 1,
    "fields": {
      "code": "id",
      "name": "Bahasa Indonesia",
      "is_default": true,
      "is_active": true
    }
  },
  {
    "model": "core.language",
    "pk": 2,
    "fields": {
      "code": "en",
      "name": "English",
      "is_default": false,
      "is_active": true
    }
  }
]
```

Load with:
```bash
python manage.py loaddata fixtures/initial_data.json
```

---

## 4. DOCKER SETUP (OPTIONAL BUT RECOMMENDED)

### 4.1 `backend/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code
COPY . .

# Create logs directory
RUN mkdir -p /app/logs

# Run migrations and start server
CMD ["sh", "-c", "python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:8002"]
```

### 4.2 `frontend/Dockerfile`

```dockerfile
FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# Serve with static server
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "5175"]
```

### 4.3 `docker-compose.yml`

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: kmsdb
      POSTGRES_USER: kms_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6382:6382"

  backend:
    build: ./backend
    command: sh -c "python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:8002"
    volumes:
      - ./backend:/app
    ports:
      - "8002:8002"
    environment:
      - DB_HOST=db
      - REDIS_URL=redis://redis:6382/0
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "5175:5175"
    depends_on:
      - backend

volumes:
  postgres_data:
```

Run with: `docker-compose up`

---

## 5. DEPLOYMENT CHECKLIST

### 5.1 Pre-deployment

- [ ] All tests pass
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Static files collected
- [ ] HTTPS/SSL certificate installed
- [ ] CORS settings configured
- [ ] Firewall rules set up

### 5.2 Deployment Commands

```bash
# Backend
cd backend
python manage.py migrate
python manage.py collectstatic --noinput
gunicorn config.wsgi:application --workers 4 --bind 0.0.0.0:8002

# Frontend
cd frontend
npm run build
# Serve dist/ folder via Nginx
```

### 5.3 Nginx Configuration (Example)

```nginx
upstream django {
    server 127.0.0.1:8002;
}

server {
    listen 80;
    server_name kms.example.com;
    client_max_body_size 50M;

    # Frontend
    location / {
        root /var/www/kms/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Django Admin
    location /admin {
        proxy_pass http://django;
        proxy_set_header Host $host;
    }

    # Static files
    location /static {
        alias /var/www/kms/backend/staticfiles;
    }

    # Media uploads
    location /media {
        alias /var/www/kms/backend/media;
    }
}
```

---

## 6. SCRIPT TEMPLATES

### 6.1 `scripts/setup_dev.sh`

```bash
#!/bin/bash

echo "Setting up development environment..."

# Backend
echo "Setting up backend..."
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Ask for database setup
read -p "Setup database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python manage.py makemigrations
    python manage.py migrate
    python manage.py createsuperuser
fi

cd ..

# Frontend
echo "Setting up frontend..."
cd frontend
npm install
cp .env.example .env
cd ..

echo "Development setup complete!"
echo "Run 'python manage.py runserver' in backend/"
echo "Run 'npm run dev' in frontend/"
```

---

## NEXT STEPS

1. ✅ System Architecture
2. ✅ Database Schema
3. ✅ Folder Structure
4. ✅ Configuration Plan (THIS DOCUMENT)
5. ⏳ Implementation Checklist (05_IMPLEMENTATION_CHECKLIST.md)

---

**Scaffolding siap. Tinggal eksekusi perintah setup dan mulai development!**
