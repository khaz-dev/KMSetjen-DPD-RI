# PostgreSQL Database Structure - Complete Inventory

**Date:** April 2, 2026  
**Scan Date:** April 2, 2026  
**Project:** KMSetjen DPD RI  
**Status:** ✅ Complete thorough scan completed

---

## 📋 Executive Summary

This document contains the **complete inventory** of all PostgreSQL-related information found through a comprehensive project-wide scan. It covers:

1. ✅ All database credentials
2. ✅ All configuration files
3. ✅ Database setup procedures
4. ✅ Connection parameters
5. ✅ Docker integration
6. ✅ Deployment scripts
7. ✅ CI/CD configuration
8. ✅ Environment management

---

## 🔐 Database Credentials Inventory

### Configuration Set 1: Production/Staging (Currently Active)

**Database Name:** `kmsdb_prod`  
**User:** `kms_user`  
**Password:** `w6nPlZbRv6fYDFfuHDhP`  
**Host:** `localhost`  
**Port:** `5432`  
**Engine:** PostgreSQL  

**Where Used:**
- `.env` (current) - lines 35-40
- `.env.production` - lines 27-32
- `00_DEPLOYMENT_READY_NOW.md` - line 75
- `deploy-final.sh` - lines 123-145
- `docker-compose.yml` - lines 44-49

**Django Connection String:**
```python
'ENGINE': 'django.db.backends.postgresql'
'NAME': 'kmsdb_prod'
'USER': 'kms_user'
'PASSWORD': 'w6nPlZbRv6fYDFfuHDhP'
'HOST': 'localhost'
'PORT': '5432'
'CONN_MAX_AGE': 0
'OPTIONS': {'connect_timeout': 10}
```

---

### Configuration Set 2: Local Development (Template)

**Database Name:** `kmsdb`  
**User:** `postgres`  
**Password:** `postgres` (or custom)  
**Host:** `localhost`  
**Port:** `5432`  
**Engine:** PostgreSQL  

**Where Used:**
- `.env.example` - lines 18-22
- `deploy-final.sh` - lines 133-135 (default fallback)

**Django Connection String:**
```python
'ENGINE': 'django.db.backends.postgresql'
'NAME': 'kmsdb'
'USER': 'postgres'
'PASSWORD': 'postgres'
'HOST': 'localhost'
'PORT': '5432'
```

---

### Configuration Set 3: Docker/Default Values

**Database Name:** `kmsdb` (default)  
**User:** `postgres` (default)  
**Password:** `Okkdpdri@2026` (Docker default)  
**Host:** `host.docker.internal` (for Docker containers)  
**Port:** `5432`  

**Where Used:**
- `docker-compose.yml` - lines 44-49
- `.env.example` comments

**Docker Connection String:**
```
postgresql://postgres:Okkdpdri@2026@host.docker.internal:5432/kmsdb
```

**Important Note:** Docker containers use `host.docker.internal` instead of `localhost` to reach the host machine's PostgreSQL.

---

### Configuration Set 4: CI/CD Testing

**Database Name:** `test_kmsdb`  
**User:** `postgres`  
**Password:** `postgres`  
**Host:** `localhost`  
**Port:** `5432`  
**Engine:** PostgreSQL (15-alpine Docker image)  

**Where Used:**
- `.github/workflows/ci-cd.yml` - lines 54-98

**CI Connection String:**
```
postgresql://postgres:postgres@localhost:5432/test_kmsdb
```

---

## 📂 Files Containing PostgreSQL Information

### Environment Files (3 files)

1. **`.env`** - Current active configuration
   - Location: `d:\Project\KMSetjen DPD RI\.env`
   - Lines 28-40: Database configuration section
   - Current: Production credentials (kmsdb_prod, kms_user)
   - Updated: April 2, 2026

2. **`.env.production`** - Production server configuration
   - Location: `d:\Project\KMSetjen DPD RI\.env.production`
   - Lines 25-31: Database configuration section
   - Status: Template with placeholders
   - Actual values: Same as `.env`

3. **`.env.example`** - Installation template
   - Location: `d:\Project\KMSetjen DPD RI\.env.example`
   - Lines 15-22: Database configuration section
   - Status: Reference template
   - Purpose: Guide for new installations

---

### Configuration Files (2 files)

1. **`backend/config/settings.py`** - Django database configuration
   - Location: `d:\Project\KMSetjen DPD RI\backend\config\settings.py`
   - Lines 103-119: Database settings
   - Current: PostgreSQL-only (SQLite fallback removed)
   - Connection timeout: 10 seconds
   - Persistent connections: Disabled

2. **`docker-compose.yml`** - Docker service configuration
   - Location: `d:\Project\KMSetjen DPD RI\docker-compose.yml`
   - Lines 1-80+: Service definitions
   - Database notes: PostgreSQL not in container
   - Django service uses: `host.docker.internal` for DB host

---

### Deployment Scripts (2 files)

1. **`deploy-final.sh`** - Production deployment automation
   - Location: `d:\Project\KMSetjen DPD RI\deploy-final.sh`
   - Lines 123-145: Database setup section
   - Operations: Checks if DB exists, creates if needed
   - User configuration: Reads from `.env`
   - Default user: `kms_user`
   - Default DB: `kmsdb_prod`

2. **`deploy-helper.ps1`** - Windows deployment helper
   - Location: `d:\Project\KMSetjen DPD RI\deploy-helper.ps1`
   - Purpose: Windows-based deployment automation
   - Database setup: Leverages `deploy-final.sh` via SSH/remote exec

---

### CI/CD Configuration (1 file)

1. **`.github/workflows/ci-cd.yml`** - GitHub Actions workflow
   - Location: `d:\Project\KMSetjen DPD RI\.github/workflows/ci-cd.yml`
   - Lines 54-98: PostgreSQL service definition
   - Test database: `test_kmsdb`
   - Test credentials: `postgres:postgres`
   - Docker image: `postgres:15-alpine`

---

### Documentation Files (3 files)

1. **`00_DEPLOYMENT_READY_NOW.md`** - Deployment readiness report
   - Location: `d:\Project\KMSetjen DPD RI\00_DEPLOYMENT_READY_NOW.md`
   - Line 75: Shows `DB_PASSWORD=w6nPlZbRv6fYDFfuHDhP`
   - Status: Production deployment checklist

2. **`POSTGRESQL_COMPLETE_REFERENCE.md`** - Created by scan
   - Location: `d:\Project\KMSetjen DPD RI\POSTGRESQL_COMPLETE_REFERENCE.md`
   - Content: Comprehensive PostgreSQL reference
   - Date created: April 2, 2026

3. **`POSTGRESQL_SETUP_AND_TROUBLESHOOTING.md`** - Created by scan
   - Location: `d:\Project\KMSetjen DPD RI\POSTGRESQL_SETUP_AND_TROUBLESHOOTING.md`
   - Content: Setup procedures and diagnostic steps
   - Date created: April 2, 2026

---

## 🔗 Connection Strings by Context

### Local Development (PostgreSQL)
```
psql -U postgres -h localhost -d kmsdb
```
```
postgresql://postgres:postgres@localhost:5432/kmsdb
```

### Production/Staging
```
psql -U kms_user -h localhost -d kmsdb_prod
```
```
postgresql://kms_user:w6nPlZbRv6fYDFfuHDhP@localhost:5432/kmsdb_prod
```

### Docker Container to Host
```
postgresql://postgres:Okkdpdri@2026@host.docker.internal:5432/kmsdb
```

### Docker Service (Redis example - not DB)
```
redis://:YxUVAk0raKzBKunD@redis:6382/0
```

### CI/CD Testing
```
postgresql://postgres:postgres@localhost:5432/test_kmsdb
```

---

## 📊 Database Setup Timeline

| Event | Date | Database | User | Status |
|-------|------|----------|------|--------|
| Project initiated | ~Jan 2026 | kmsdb | postgres | ✓ |
| Staging config setup | Jan 2026 | kmsdb_prod | kms_user | ✓ |
| Production ready | Apr 1, 2026 | kmsdb_prod | kms_user | ✓ |
| Credentials in .env | Jan 31, 2026 | kmsdb_prod | kms_user | ✓ |
| PostgreSQL scan | Apr 2, 2026 | (inventory) | (all) | ✓ |

---

## 🐘 PostgreSQL Server Information

### Local Machine (Windows)

**Expected Installation:**
- **Host:** `localhost` or `127.0.0.1`
- **Port:** `5432` (default)
- **Service Name:** `postgresql-x64-15` (on Windows)
- **Default User:** `postgres`
- **Installation Path:** `C:\Program Files\PostgreSQL\15\` (typical)

### Production Server (Ubuntu 24.04 LTS)

**Server Details:**
- **IP:** `143.198.200.57`
- **Domain:** `khaz.app`
- **OS:** Ubuntu 24.04 LTS
- **Service:** `postgresql` (systemd)
- **Port:** `5432`

---

## 🔄 Database Parameter Configuration

**Set in PostgreSQL for kms_user role:**

```sql
ALTER ROLE kms_user SET client_encoding TO 'utf8';
ALTER ROLE kms_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE kms_user SET default_transaction_deferrable TO on;
ALTER ROLE kms_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE kmsdb_prod TO kms_user;
```

---

## 📋 Django Database Settings Details

**File:** `backend/config/settings.py` (lines 103-119)

**Current Configuration:**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'kmsdb_prod',           # From .env DB_NAME
        'USER': 'kms_user',             # From .env DB_USER
        'PASSWORD': 'w6nPlZbRv6fYDFfuHDhP', # From .env DB_PASSWORD
        'HOST': 'localhost',            # From .env DB_HOST
        'PORT': '5432',                 # From .env DB_PORT
        'CONN_MAX_AGE': 0,              # Disable persistent connections
        'OPTIONS': {
            'connect_timeout': 10,      # 10-second timeout
        },
        'ATOMIC_REQUESTS': True,        # All requests are atomic
    }
}
```

---

## 🚀 Deployment Database Setup Process

**From `deploy-final.sh` (lines 123-145):**

1. **Check PostgreSQL Service:**
   ```bash
   systemctl is-active --quiet postgresql
   ```

2. **Start PostgreSQL if needed:**
   ```bash
   systemctl start postgresql
   ```

3. **Read credentials from .env:**
   ```bash
   DB_PASSWORD=$(grep "^DB_PASSWORD=" .env | cut -d= -f2)
   DB_USER=$(grep "^DB_USER=" .env | cut -d= -f2 || echo "kms_user")
   DB_NAME=$(grep "^DB_NAME=" .env | cut -d= -f2 || echo "kmsdb_prod")
   ```

4. **Check if database exists:**
   ```bash
   sudo -u postgres psql -lqt | grep -qw "$DB_NAME"
   ```

5. **If NOT exists - Create database and user:**
   ```sql
   CREATE DATABASE $DB_NAME;
   CREATE USER $DB_USER WITH PASSWORD '$PGPASSWORD';
   ALTER ROLE $DB_USER SET client_encoding TO 'utf8';
   ALTER ROLE $DB_USER SET default_transaction_isolation TO 'read committed';
   ALTER ROLE $DB_USER SET default_transaction_deferrable TO on;
   ALTER ROLE $DB_USER SET timezone TO 'UTC';
   GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
   ```

---

## 🔍 Discovery Summary

### PostgreSQL Information Found:
- ✅ 4 different database configurations (local dev, production, docker, CI/CD)
- ✅ 3 environment files with credentials
- ✅ 2 deployment scripts with database setup
- ✅ 2 main configuration files with database settings
- ✅ 1 CI/CD workflow with test database
- ✅ Multiple documentation files
- ✅ Complete connection parameters
- ✅ Database setup procedures
- ✅ User role configurations
- ✅ Timeout and connection settings

### Credentials Discovered:
- ✅ Production user: `kms_user` (password: `w6nPlZbRv6fYDFfuHDhP`)
- ✅ Dev user: `postgres` (password: varies)
- ✅ Test user: `postgres` (password: `postgres`)
- ✅ Docker user: `postgres` (password: `Okkdpdri@2026`)

### Connection Methods Found:
- ✅ Direct psql command
- ✅ Python psycopg2 library
- ✅ Django ORM (via settings)
- ✅ Docker container to host access
- ✅ CI/CD service-to-service access

---

## 📊 Database Comparison Matrix

| Aspect | Local Dev | Production | Docker | CI/CD |
|--------|-----------|------------|--------|-------|
| **Database** | kmsdb | kmsdb_prod | kmsdb | test_kmsdb |
| **User** | postgres | kms_user | postgres | postgres |
| **Password** | postgres | w6nPlZbRv6fYDFfuHDhP | Okkdpdri@2026 | postgres |
| **Host** | localhost | localhost | host.docker.internal | localhost |
| **Port** | 5432 | 5432 | 5432 | 5432 |
| **Engine** | PostgreSQL | PostgreSQL | PostgreSQL | PostgreSQL 15-alpine |
| **Source** | Manual setup | Deploy script | docker-compose | GitHub Actions |
| **Purpose** | Development | Production | Container dev | Automated tests |

---

## 🛠️ Next Actions

**To get PostgreSQL working:**

1. **Find PostgreSQL Installation:**
   ```powershell
   psql --version
   ```

2. **Check if running:**
   ```powershell
   Get-Service -Name postgresql*
   ```

3. **Start if needed:**
   ```powershell
   Start-Service -Name postgresql-x64-15
   ```

4. **Create database/user** (use instructions in `POSTGRESQL_SETUP_AND_TROUBLESHOOTING.md`)

5. **Test connection:**
   ```powershell
   psql -U kms_user -h localhost -d kmsdb_prod -c "SELECT 1;"
   ```

6. **Run Django:**
   ```powershell
   cd backend
   python manage.py runserver 8002
   ```

---

**Document Scope:** Complete PostgreSQL inventory  
**Last Updated:** April 2, 2026  
**Files Updated:** 2 (settings.py, .env)  
**Files Created:** 3 documentation files
