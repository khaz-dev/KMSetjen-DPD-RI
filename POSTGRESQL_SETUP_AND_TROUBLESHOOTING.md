# PostgreSQL Setup & Troubleshooting Guide

**Date:** April 2, 2026  
**Project:** KMSetjen DPD RI  
**Status:** PostgreSQL connection not working - requires setup/verification

---

## ⚠️ Current Situation

Django is configured to use PostgreSQL but cannot connect:
- **Database:** `kmsdb_prod`
- **User:** `kms_user`
- **Password:** `w6nPlZbRv6fYDFfuHDhP`
- **Host:** `localhost`
- **Port:** `5432`
- **Error:** `psycopg2.OperationalError` (connection failed)

---

## 🔍 Diagnosis Steps

### Step 1: Check if PostgreSQL is Installed

**Windows (PowerShell):**
```powershell
psql --version
```

**Expected Output:**
```
psql (PostgreSQL) 15.x
```

**If NOT installed:** Download from https://www.postgresql.org/download/windows/

---

### Step 2: Check if PostgreSQL Service is Running

**Windows (PowerShell):**
```powershell
Get-Service -Name postgresql*
```

**Expected Output:**
```
Status   Name               DisplayName
------   ----               -----------
Running  postgresql-x64     PostgreSQL Server x64
```

**If Status = "Stopped":**
```powershell
Start-Service -Name postgresql-x64-15
# Wait 3-5 seconds for it to start
Get-Service -Name postgresql-x64-15
```

---

### Step 3: Test Direct PostgreSQL Connection

**Windows (PowerShell):**

First, verify the default `postgres` user exists:
```powershell
psql -U postgres -h localhost -c "SELECT 1"
```

If that works, proceed to check if the staging user exists:
```powershell
psql -U postgres -h localhost -c "SELECT * FROM pg_user WHERE usename='kms_user';"
```

---

## 🛠️ Setup Instructions

If PostgreSQL is running but the database/user don't exist, follow these steps:

### Option A: Using PowerShell (Windows)

```powershell
# Connect as default postgres user
$env:PGPASSWORD = 'postgres'  # Default password on Windows PostgreSQL

# Check if kmsdb_prod database exists
psql -U postgres -h localhost -c "\l" | Select-String "kmsdb_prod"

# If database doesn't exist, create it:
# First create the user
psql -U postgres -h localhost -c "CREATE USER kms_user WITH PASSWORD 'w6nPlZbRv6fYDFfuHDhP';"

# Then create the database
psql -U postgres -h localhost -c "CREATE DATABASE kmsdb_prod OWNER kms_user;"

# Set proper permissions
psql -U postgres -h localhost -c "ALTER ROLE kms_user SET client_encoding TO 'utf8';"
psql -U postgres -h localhost -c "ALTER ROLE kms_user SET default_transaction_isolation TO 'read committed';"
psql -U postgres -h localhost -c "ALTER ROLE kms_user SET default_transaction_deferrable TO on;"
psql -U postgres -h localhost -c "ALTER ROLE kms_user SET timezone TO 'UTC';"
psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE kmsdb_prod TO kms_user;"
```

### Option B: Using SQL Script

Create a file `setup_kms_db.sql`:
```sql
-- Create user kms_user
CREATE USER kms_user WITH PASSWORD 'w6nPlZbRv6fYDFfuHDhP';

-- Create database
CREATE DATABASE kmsdb_prod OWNER kms_user;

-- Configure user
ALTER ROLE kms_user SET client_encoding TO 'utf8';
ALTER ROLE kms_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE kms_user SET default_transaction_deferrable TO on;
ALTER ROLE kms_user SET timezone TO 'UTC';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE kmsdb_prod TO kms_user;
```

Then run:
```powershell
$env:PGPASSWORD = 'postgres'
psql -U postgres -h localhost -f setup_kms_db.sql
```

---

## ✅ Verification

After setup, verify the connection works:

### Test 1: Connect as kms_user
```powershell
$env:PGPASSWORD = 'w6nPlZbRv6fYDFfuHDhP'
psql -U kms_user -h localhost -d kmsdb_prod -c "SELECT 1;"
```

**Expected Output:**
```
 ?column?
----------
        1
(1 row)
```

### Test 2: Check Django Connection
```powershell
cd "d:\Project\KMSetjen DPD RI\backend"
python -c "import psycopg2; conn = psycopg2.connect(host='localhost', port=5432, user='kms_user', password='w6nPlZbRv6fYDFfuHDhP', database='kmsdb_prod'); print('✓ Connection successful'); conn.close()"
```

**Expected Output:**
```
✓ Connection successful
```

### Test 3: Running Django Server
```powershell
cd "d:\Project\KMSetjen DPD RI\backend"
python manage.py runserver 8002
```

**Expected Output:**
```
[OK] Backend running on port: 8002
[OK] URL: http://0.0.0.0:8002
Starting development server at http://127.0.0.1:8002/
```

---

## 📋 Environment Variables - Current Configuration

**File:** `d:\Project\KMSetjen DPD RI\.env`

**Current PostgreSQL Settings:**
```
ENVIRONMENT=production
DEBUG=False
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kmsdb_prod
DB_USER=kms_user
DB_PASSWORD=w6nPlZbRv6fYDFfuHDhP
DB_HOST=localhost
DB_PORT=5432
```

**If you want to use LOCAL development credentials instead:**
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

Then create `kmsdb` database:
```powershell
$env:PGPASSWORD = 'postgres'
psql -U postgres -h localhost -c "CREATE DATABASE kmsdb;"
```

---

## 🔗 PostgreSQL Connection String Formats

### For kms_user (Staging/Production)
```
postgresql://kms_user:w6nPlZbRv6fYDFfuHDhP@localhost:5432/kmsdb_prod
```

### For postgres user (Local Dev)
```
postgresql://postgres:postgres@localhost:5432/kmsdb
```

---

## 🛠️ Common PostgreSQL Operations

### View All Databases
```powershell
$env:PGPASSWORD = 'postgres'
psql -U postgres -h localhost -l
```

### View All Users
```powershell
$env:PGPASSWORD = 'postgres'
psql -U postgres -h localhost -c "\du"
```

### Drop Database (if you need to reset)
```powershell
$env:PGPASSWORD = 'postgres'
psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS kmsdb_prod;"
```

### Drop User
```powershell
$env:PGPASSWORD = 'postgres'
psql -U postgres -h localhost -c "DROP USER IF EXISTS kms_user;"
```

### Reset Database (delete data, keep schema)
```powershell
$env:PGPASSWORD = 'w6nPlZbRv6fYDFfuHDhP'
# First, switch to kmsdb_prod
psql -U kms_user -h localhost -d kmsdb_prod
# Then in psql:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

---

## 🐘 Default PostgreSQL Credentials (Windows Installation)

When PostgreSQL is installed on **Windows**, the default credentials are usually:

| Property | Value |
|----------|-------|
| User | `postgres` |
| Password | (leave blank or you set it during installation) |
| Host | `localhost` |
| Port | `5432` |
| Database | `postgres` (default system database) |

**To reset postgres password (if you forgot it):**
```powershell
# Run as Administrator
net stop postgresql-x64-15
# Then restart psql in single-user mode (advanced - consult PostgreSQL docs)
```

---

## 📊 Quick Reference Checklist

Use this checklist to verify your PostgreSQL setup:

```
[ ] PostgreSQL is installed (psql --version works)
[ ] PostgreSQL service is running (Get-Service returns Running)
[ ] Default postgres user can connect: psql -U postgres -h localhost works
[ ] User kms_user exists: psql -U postgres -h localhost -c "\du" shows kms_user
[ ] Database kmsdb_prod exists: psql -U postgres -h localhost -l shows kmsdb_prod
[ ] kms_user can connect: psql -U kms_user -h localhost -d kmsdb_prod works
[ ] Password is correct: psql command accepts password w6nPlZbRv6fYDFfuHDhP
[ ] Django connection test passes (see Verification section)
```

---

## 🚀 Next Steps

1. **Verify PostgreSQL is running** - Use diagnostic commands above
2. **Create database and user** - Follow setup instructions
3. **Test connections** - Run verification commands
4. **Start Django** - Run `python manage.py runserver 8002`
5. **Apply migrations** - Run `python manage.py migrate` if first time
6. **Access application** - Open http://127.0.0.1:8002

---

## 📞 If You Still Get Errors

### Error: "could not connect to server: Connection refused"
- PostgreSQL service is not running
- Use `Start-Service -Name postgresql-x64-15` to start it

### Error: "FATAL: Ident authentication failed for user"
- This means PostgreSQL version/config issue with authentication method
- Check postgresql.conf in your PostgreSQL installation directory

### Error: "FATAL: password authentication failed for user"
- Password is wrong
- Username doesn't exist
- Try connecting as default `postgres` user first to verify setup

### Error: "FATAL: database does not exist"
- Database kmsdb_prod hasn't been created yet
- Follow setup instructions above

### Error: "FATAL: role does not exist"
- User kms_user hasn't been created yet
- Follow setup instructions above

---

## 📁 Important Files Reference

| File | Purpose | Current Value |
|------|---------|----------------|
| `.env` | Local configuration | Uses kmsdb_prod credentials |
| `.env.production` | Production server config | Uses kmsdb_prod credentials |
| `.env.example` | Template | Reference only |
| `backend/config/settings.py` | Django settings | PostgreSQL configured |
| `docker-compose.yml` | Docker config | PostgreSQL not in Docker |

---

## 🔒 Security Notes

1. **Password in .env:** The password `w6nPlZbRv6fYDFfuHDhP` is visible in `.env`
   - This is acceptable for local development
   - For production, use actual secure passwords and environment secrets

2. **Connection Timeout:** Set to 10 seconds in Django settings
   - Increase if you have slower connections

3. **Persistent Connections:** Disabled (CONN_MAX_AGE=0)
   - Ensures fresh connections for each request
   - Can be enabled for performance optimization

---

**Created:** April 2, 2026  
**Status:** Reference Guide - Use for PostgreSQL setup and troubleshooting
