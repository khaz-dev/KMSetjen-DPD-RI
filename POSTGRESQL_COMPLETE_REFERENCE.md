# PostgreSQL Database Configuration - Complete Reference

**Date:** April 2, 2026  
**Project:** KMSetjen DPD RI  
**Scope:** Complete PostgreSQL information discovered from project-wide scan

---

## 📋 PostgreSQL Configuration Summary

### Local Development Environment

```
DATABASE ENGINE: PostgreSQL 15+
HOST: localhost
PORT: 5432
DATABASE NAME: kmsdb
USER: postgres
PASSWORD: postgres
```

**File Location:** `.env` (lines 32-39)

### Production/Staging Environment

```
DATABASE ENGINE: PostgreSQL (django.db.backends.postgresql)
HOST: localhost (or configured in .env.production)
PORT: 5432
DATABASE NAME: kmsdb_prod
USER: kms_user
PASSWORD: w6nPlZbRv6fYDFfuHDhP
```

**File Location:** `.env.production` (lines 25-31)

### Docker Compose Configuration

When running with Docker containers, PostgreSQL connection requires:
```
DB_ENGINE: django.db.backends.postgresql
DB_NAME: kmsdb (or from .env)
DB_USER: postgres (or from .env)
DB_PASSWORD: Okkdpdri@2026 (or from .env)
DB_HOST: host.docker.internal (IMPORTANT: NOT localhost for Docker)
DB_PORT: 5432 (or from .env)
```

**File Location:** `docker-compose.yml` (lines 44-49)

---

## 🔑 Environment Files Overview

### 1. `.env` - Local Development (Current File)

**Purpose:** Local development environment configuration  
**Status:** ✅ Currently configured for local development

**Key Database Settings:**
```
ENVIRONMENT=development
DEBUG=True
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kmsdb
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

**Other Services (Local Dev):**
- REDIS_HOST=localhost
- REDIS_PORT=6379
- REDIS_PASSWORD=YxUVAk0raKzBKunD

### 2. `.env.example` - Template File

**Purpose:** Reference template for new installations  
**Credentials:** Placeholder values (requires replacement)

```
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kmsdb
DB_USER=postgres
DB_PASSWORD=your-secure-database-password
DB_HOST=localhost
DB_PORT=5432
```

### 3. `.env.production` - Production Environment

**Purpose:** Production server configuration (Ubuntu 24.04 LTS, 143.198.200.57)  
**Credentials:** Production database user and password

```
ENVIRONMENT=production
DEBUG=False
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kmsdb_prod
DB_USER=kms_user
DB_PASSWORD=SecureDBPassword2026Change (template) OR w6nPlZbRv6fYDFfuHDhP (actual)
DB_HOST=localhost
DB_PORT=5432
```

**Additional Details:**
- Redis: SecureRedisPassword2026Change (template)
- Domain: khaz.app
- Subpath: /kmsetjendpdri

---

## 🐳 Docker Compose Configuration

**File:** `docker-compose.yml`

### Important Notes:
1. **PostgreSQL is NOT a Docker service** - It runs on the host machine (localhost)
2. **Docker Django container connects to host PostgreSQL** using `host.docker.internal`
3. **Redis runs in Docker** as a service

### Docker Environment Variables for PostgreSQL:
```yaml
DB_ENGINE: django.db.backends.postgresql
DB_NAME: ${DB_NAME:-kmsdb}
DB_USER: ${DB_USER:-postgres}
DB_PASSWORD: ${DB_PASSWORD:-Okkdpdri@2026}
DB_HOST: host.docker.internal  # CRITICAL: NOT localhost
DB_PORT: ${DB_PORT:-5432}
```

**The Django container accesses PostgreSQL via:**
```
postgresql://postgres:Okkdpdri@2026@host.docker.internal:5432/kmsdb
```

---

## 🚀 Deployment Scripts

### 1. `deploy-final.sh` - Production Deployment Script

**Purpose:** Automated server deployment on Ubuntu 24.04 LTS

**Database Setup Section** (lines 123-145):
```bash
# Checks if PostgreSQL is running
# Creates database and user if they don't exist
# Uses credentials from .env file:
#   - DB_PASSWORD=$(grep "^DB_PASSWORD=" "$PROJECT_DIR/.env" | cut -d= -f2)
#   - DB_USER=$(grep "^DB_USER=" "$PROJECT_DIR/.env" | cut -d= -f2 || echo "kms_user")
#   - DB_NAME=$(grep "^DB_NAME=" "$PROJECT_DIR/.env" | cut -d= -f2 || echo "kmsdb_prod")

# Creates PostgreSQL database and user:
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$PGPASSWORD';
ALTER ROLE $DB_USER SET client_encoding TO 'utf8';
ALTER ROLE $DB_USER SET default_transaction_isolation TO 'read committed';
ALTER ROLE $DB_USER SET default_transaction_deferrable TO on;
ALTER ROLE $DB_USER SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
```

### 2. `deploy-helper.ps1` - Windows PowerShell Helper

**Purpose:** Windows-based deployment automation  
**Usage:** Remote deployment from Windows machines

---

## 📊 Database Credentials by Environment

| Property | Local Dev | Production |
|----------|-----------|------------|
| **Engine** | PostgreSQL | PostgreSQL |
| **Database** | kmsdb | kmsdb_prod |
| **User** | postgres | kms_user |
| **Password** | postgres | w6nPlZbRv6fYDFfuHDhP |
| **Host** | localhost | localhost (or remote) |
| **Port** | 5432 | 5432 |
| **Mode** | ENVIRONMENT=development | ENVIRONMENT=production |
| **DEBUG** | True | False |

---

## 🔗 Connection Strings

### Local Development (Direct)
```
postgresql://postgres:postgres@localhost:5432/kmsdb
```

### Local Development (Django)
```python
{
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': 'kmsdb',
    'USER': 'postgres',
    'PASSWORD': 'postgres',
    'HOST': 'localhost',
    'PORT': '5432',
}
```

### Docker Container (to Host PostgreSQL)
```
postgresql://postgres:Okkdpdri@2026@host.docker.internal:5432/kmsdb
```

### Production (Server)
```
postgresql://kms_user:w6nPlZbRv6fYDFfuHDhP@localhost:5432/kmsdb_prod
```

---

## 🔧 Django Settings Configuration

**File:** `backend/config/settings.py` (lines 103-134)

### Current Logic:
```python
IS_DEVELOPMENT = env.bool('DEBUG', default=True) or env('ENVIRONMENT', default='development') == 'development'

if IS_DEVELOPMENT:
    # Uses SQLite for local development (ADDED by recent fix)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
            'ATOMIC_REQUESTS': True,
        }
    }
else:
    # Uses PostgreSQL for production
    DATABASES = {
        'default': {
            'ENGINE': env('DB_ENGINE', default='django.db.backends.postgresql'),
            'NAME': env('DB_NAME', default='kmsdb'),
            'USER': env('DB_USER', default='postgres'),
            'PASSWORD': env('DB_PASSWORD', default='Okkdpdri@2026'),
            'HOST': env('DB_HOST', default='localhost'),
            'PORT': env('DB_PORT', default='5432'),
            'CONN_MAX_AGE': 0,
            'OPTIONS': {'connect_timeout': 10},
            'ATOMIC_REQUESTS': True,
        }
    }
```

---

## 🔍 GitHub Actions CI/CD Configuration

**File:** `.github/workflows/ci-cd.yml`

**Test PostgreSQL Configuration:**
```yaml
services:
  postgres:
    image: postgres:15-alpine
    env:
      POSTGRES_DB: test_kmsdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    options: >-
      --health-cmd pg_isready -U postgres
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

**Test Environment:**
```
DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_kmsdb
```

---

## 📝 Database Setup Requirements

### For Local Development (Current):
1. PostgreSQL must be installed and running on localhost:5432
2. Default PostgreSQL user `postgres` with password `postgres` must exist
3. Database `kmsdb` can be auto-created OR must exist
4. Migrations will create/update all tables

### For Production:
1. PostgreSQL must be installed and running on localhost:5432
2. User `kms_user` must be created with password `w6nPlZbRv6fYDFfuHDhP`
3. Database `kmsdb_prod` must be created with appropriate permissions
4. Deployer script (`deploy-final.sh`) can automate this

### For Docker:
1. PostgreSQL must run on host machine (not in container)
2. Django container connects via `host.docker.internal:5432`
3. Redis runs as a Docker service
4. Network communication: Django container → Host PostgreSQL

---

## ⚠️ Known Issues & Important Notes

### 1. **Recent SQLite Addition (April 2, 2026)**
- Settings were modified to use SQLite for development automatically
- Original configuration was PostgreSQL for both dev and production
- This can be reverted to pure PostgreSQL if needed
- Two-tier database selection now active based on `DEBUG` flag

### 2. **Docker Host Access**
- Docker containers MUST use `host.docker.internal` to reach host PostgreSQL
- NOT `localhost` (which would refer to container's localhost)
- docker-compose.yml already configured correctly for this

### 3. **Production Password**
- Current actual production password: `w6nPlZbRv6fYDFfuHDhP`
- Template shows: `SecureDBPassword2026Change`
- Should be stored securely and rotated regularly

### 4. **Connection Timeouts**
- PostgreSQL connection timeout set to 10 seconds in Django settings
- CONN_MAX_AGE set to 0 (disable persistent connections)

---

## 🛠️ How to Switch Back to PostgreSQL-Only

If you want to remove the SQLite fallback and use PostgreSQL everywhere:

**File:** `backend/config/settings.py`

Replace lines 103-134 with:
```python
# ============================================================================
# DATABASE
# ============================================================================
DATABASES = {
    'default': {
        'ENGINE': env('DB_ENGINE', default='django.db.backends.postgresql'),
        'NAME': env('DB_NAME', default='kmsdb'),
        'USER': env('DB_USER', default='postgres'),
        'PASSWORD': env('DB_PASSWORD', default='Okkdpdri@2026'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 0,
        'OPTIONS': {'connect_timeout': 10},
        'ATOMIC_REQUESTS': True,
    }
}
```

Then ensure PostgreSQL is running locally with appropriate credentials from `.env`.

---

## 📞 Quick Reference Commands

### Check PostgreSQL Status
```bash
systemctl status postgresql
```

### Connect to PostgreSQL (Production)
```bash
psql -h localhost -U kms_user -d kmsdb_prod
```

### Connect to PostgreSQL (Local Dev)
```bash
psql -h localhost -U postgres -d kmsdb
```

### Create PostgreSQL User (Manual)
```bash
sudo -u postgres createuser kms_user
sudo -u postgres psql -c "ALTER USER kms_user WITH PASSWORD 'w6nPlZbRv6fYDFfuHDhP';"
sudo -u postgres createdb -O kms_user kmsdb_prod
```

### Run Django Migrations
```bash
cd backend
python manage.py migrate
```

---

## 📁 File Locations Reference

| Information | File | Lines |
|-------------|------|-------|
| Local dev config | `.env` | 28-39 |
| Production config | `.env.production` | 25-31 |
| Django settings | `backend/config/settings.py` | 103-134 |
| Docker config | `docker-compose.yml` | 1-80+ |
| Deployment script | `deploy-final.sh` | 123-145 |
| CI/CD config | `.github/workflows/ci-cd.yml` | 54-98 |
| Example template | `.env.example` | 15-22 |

---

**Status:** ✅ All PostgreSQL configuration documented and verified  
**Last Updated:** April 2, 2026
