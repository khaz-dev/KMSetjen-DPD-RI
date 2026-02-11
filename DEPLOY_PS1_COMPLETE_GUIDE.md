# 📋 Deploy.ps1 - Complete User Guide

**Last Updated**: February 11, 2026  
**Status**: ✅ Fully Functional & Tested  
**Script Version**: 2.0  
**Compatibility**: Windows PowerShell 5.1+, Docker Desktop 29.1+, Git 2.30+

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Script Overview](#script-overview)
3. [Prerequisites](#prerequisites)
4. [Parameters & Options](#parameters--options)
5. [Usage Examples](#usage-examples)
6. [Detailed Workflow](#detailed-workflow)
7. [Environment Modes](#environment-modes)
8. [Troubleshooting](#troubleshooting)
9. [Technical Analysis](#technical-analysis)
10. [Known Limitations](#known-limitations)

---

## Quick Start

### 30-Second Deployment

```powershell
# 1. Navigate to project directory
cd "d:\Project\KMSetjen DPD RI"

# 2. Run deployment for staging
.\deploy.ps1 -Environment staging

# Done! Services available at:
# - Frontend: http://localhost:5175
# - API: http://localhost:8002/api
# - Health: http://localhost:8002/health

# 3. View logs
docker-compose logs -f
```

---

## Script Overview

### What the script does:

The `deploy.ps1` is a comprehensive automated deployment orchestrator for KMSetjen DPD RI. It handles:

```
Validation Phase
    ↓
Environment Config
    ↓
Database Backup (production only)
    ↓
Code Update (git pull)
    ↓
Docker Build
    ↓
Service Startup
    ↓
Health Checks
    ↓
Database Setup (migrations)
    ↓
Service Verification
    ↓
Success Report
```

### Script Statistics

| Aspect | Details |
|--------|---------|
| **Total Lines** | 411 |
| **Functions** | 9 main functions |
| **Parameters** | 6 optional parameters |
| **Logging** | File + Console (color-coded) |
| **Error Handling** | Try/catch with exit codes |
| **Execution Time** | 2-5 minutes (depending on mode) |

---

## Prerequisites

### Required Software

```powershell
# 1. Docker Desktop
# - Version: 29.1.5 or higher
# - Download: https://www.docker.com/products/docker-desktop
# - Verify: docker --version

# 2. Docker Compose
# - Included in Docker Desktop v2.0+
# - Verify: docker-compose --version

# 3. Git
# - Version: 2.30 or higher
# - Download: https://git-scm.com/
# - Verify: git --version

# 4. PostgreSQL (Local Development)
# - Version: 15+ (for local development)
# - Must be running on localhost:5432
# - Database: kmsdb
# - User: postgres
# - Verify: psql -U postgres -c "SELECT 1;"
```

### Required Files & Directories

**Must Exist in Project Root:**
```
✅ deploy.ps1                 (this script)
✅ docker-compose.yml         (service configuration)
✅ .env                        (environment configuration)
✅ .env.example               (reference template)
✅ backend/                   (Django application)
✅ frontend/                  (React application)
✅ backend/Dockerfile         (Django Docker image)
✅ frontend/Dockerfile        (React Docker image)
```

### Required Configuration

The script expects these files to be properly configured:

**`.env` file (required)**
```env
ENVIRONMENT=development
DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=kmsdb
DB_USER=postgres
DB_PASSWORD=your-password
REDIS_PASSWORD=redis123
```

**`docker-compose.yml` (required)**
- Must define redis, django, and frontend services
- Must specify volumes, networks, and health checks

---

## Parameters & Options

### 1. `-Environment` (Default: "staging")

Specifies deployment target environment.

```powershell
.\deploy.ps1 -Environment development   # Development (localhost)
.\deploy.ps1 -Environment staging       # Staging (test server)
.\deploy.ps1 -Environment production    # Production (REQUIRES CONFIRMATION)
```

**Behavior by Environment:**

| Environment | DEBUG | Backup | Confirmation | Use Case |
|-------------|-------|--------|------------------|----------|
| **development** | True | No | No | Local development |
| **staging** | True | No | No | Testing before prod |
| **production** | Must be False | Yes | Yes (interactive) | Live deployment |

### 2. `-BuildOnly` (Switch)

Builds Docker images without starting containers.

```powershell
# Build only (useful for CI/CD or testing builds)
.\deploy.ps1 -Environment staging -BuildOnly

# Output: Docker images built, containers NOT started
# Next step: docker-compose up -d
```

**Use Cases:**
- Test Docker builds before full deployment
- CI/CD pipelines that separate builds from startups
- Debugging build-time issues

### 3. `-NoPull` (Switch)

Skips git pull (code update).

```powershell
# Don't update code from git
.\deploy.ps1 -Environment staging -NoPull

# Use when: Already at correct version, git unavailable
```

**Use Cases:**
- Offline deployments
- Testing without code changes
- Manual git control

### 4. `-SkipBackup` (Switch)

Skips database backup (production only).

```powershell
# Skip backup even in production
.\deploy.ps1 -Environment production -SkipBackup

# ⚠️ NOT RECOMMENDED - Always backup production!
```

**Danger Level**: 🔴 High  
**Use Cases**: Emergency redeploys (backup already made)

### 5. `-SkipTests` (Switch)

Reserved for future test execution (not currently used).

```powershell
.\deploy.ps1 -Environment staging -SkipTests
```

### 6. `-NoHealthCheck` (Switch)

Skips service health checks.

```powershell
# Don't wait for services to be healthy
.\deploy.ps1 -Environment staging -NoHealthCheck

# Use when: Running in CI/CD with custom health checks
```

**Use Cases:**
- CI/CD pipelines
- Environments without PostgreSQL access
- Custom monitoring systems

---

## Usage Examples

### Example 1: Development Deployment

```powershell
cd "d:\Project\KMSetjen DPD RI"
.\deploy.ps1 -Environment development
```

**What happens:**
1. Validates Docker/docker-compose
2. Configures for development
3. Pulls latest code
4. Builds Docker images (no cache)
5. Starts containers
6. Runs health checks (skips PostgreSQL check)
7. Runs migrations
8. Collects static files
9. Verifies endpoints

**Time**: ~2-3 minutes  
**Output**: Deployment logs in `deployment_logs/deploy_YYYYMMDD_HHMMSS.log`

### Example 2: Staging Deployment

```powershell
# Standard staging deployment
.\deploy.ps1 -Environment staging

# With code that's already updated
.\deploy.ps1 -Environment staging -NoPull

# Build only without starting
.\deploy.ps1 -Environment staging -BuildOnly
```

**What happens:**
1. Same as development
2. Issues warning about verifying .env settings

**Time**: ~2-3 minutes

### Example 3: Production Deployment (With Backup)

```powershell
# Full production deployment with all safeguards
.\deploy.ps1 -Environment production
```

**What happens:**
1. Validates all prerequisites
2. Checks: `DEBUG=False`, `ENVIRONMENT=production`
3. Backs up database: `backups/backup_YYYYMMDD_HHMMSS.sql`
4. Pulls latest code
5. Builds images
6. Stops old containers
7. Starts new containers
8. **Requires YOU to type "yes"** to confirm deployment
9. Runs full health checks
10. Runs migrations
11. Collects static files
12. Shows production checklist

**Safety Features**:
- ✅ Prevents deployment with `DEBUG=True`
- ✅ Prevents deployment with `ENVIRONMENT=development`
- ✅ Requires manual confirmation
- ✅ Automatic database backup
- ✅ Full health verification
- ✅ Post-deployment monitoring reminders

**Time**: ~2-5 minutes (plus confirmation dialog)

### Example 4: Build & Manual Start

```powershell
# Build images only
.\deploy.ps1 -Environment staging -BuildOnly

# Later, manually start:
docker-compose up -d

# Or with bash:
docker-compose up -d
docker-compose exec -T django python manage.py migrate --noinput
```

### Example 5: Deploy Without Code Changes

```powershell
# Useful when code is already updated
.\deploy.ps1 -Environment staging -NoPull
```

### Example 6: Quick Redeploy (Emergency Fix)

```powershell
# Skip backup since already made
.\deploy.ps1 -Environment production -SkipBackup

# Or without git pull
.\deploy.ps1 -Environment production -SkipBackup -NoPull
```

---

## Detailed Workflow

### Phase 1: Validation (1-2 seconds)

```powershell
[INFO] Pre-deployment validation...
[SUCCESS] Docker found: Docker version 29.1.5, build 0e6fee6
[SUCCESS] docker-compose found: Docker Compose version v5.0.1
[SUCCESS] .env file found
[SUCCESS] docker-compose.yml found
[WARNING] PostgreSQL check skipped  # (Normal in CI/CD)
[SUCCESS] Environment validation completed
```

**Validates:**
- ✅ Used environment is valid (development/staging/production)
- ✅ Docker is installed and accessible
- ✅ docker-compose is installed
- ✅ `.env` file exists
- ✅ `docker-compose.yml` exists
- ✅ PostgreSQL is accessible (warning if not)

**Exit if:** Any check fails → Script stops with error

---

### Phase 2: Environment Configuration (1 second)

```powershell
[INFO] Configuring for: staging
[INFO] Staging mode configured
[WARNING] Verify: ALLOWED_HOSTS, database credentials, and secrets in .env
```

**For Development:**
- No special checks

**For Staging:**
- Warns about verifying configuration

**For Production:**
- ❌ Fails if `DEBUG=True` in `.env`
- ❌ Fails if `ENVIRONMENT=development` in `.env`
- ⚠️ Requires interactive "yes" confirmation

---

### Phase 3: Database Backup (Production Only, 5-10 seconds)

```powershell
[WARNING] Production: Creating database backup...
[INFO] Backing up database...
[SUCCESS] Database backup created: backups/backup_20260211_083000.sql
```

**What happens:**
- Only runs when `-Environment production`
- Creates `backups/` directory if missing
- Executes: `django-admin dumpdata --all`
- Saves as: `backup_YYYYMMDD_HHMMSS.sql`

**Note**: Skip with `-SkipBackup` flag (not recommended)

---

### Phase 4: Code Update (5-10 seconds)

```powershell
[INFO] Updating code from repository...
[SUCCESS] Code updated
```

**What happens:**
- Runs: `git pull origin main`
- Fetches latest from GitHub
- Updates working directory

**Skip with:** `-NoPull` flag

---

### Phase 5: Docker Build (2-5 minutes)

```powershell
[INFO] Building Docker images...

# Building frontend
Step 1/20 : FROM node:20-alpine
 ---> f894a8e4c28d
Step 2/20 : WORKDIR /app
 ---> Using cache
 ---> e4c3d8a5f1b2
...
[+] Building 145.2s (42/42) FINISHED                    
 => => writing image sha256:f9b179a5db... 0.0s
 => => naming to kmsetjendpdri-frontend

# Building backend  
Step 1/25 : FROM python:3.11-slim
 ---> a1b2c3d4e5f6
...
[+] Building 89.3s (25/25) FINISHED
 => => naming to kmsetjendpdri-django

[SUCCESS] Docker images built
```

**What happens:**
- Runs: `docker-compose build` (without cache)
- Builds 3 images:
  1. `kmsetjendpdri-frontend` (Node.js 20-alpine)
  2. `kmsetjendpdri-django` (Python 3.11-slim)
  3. `redis:7-alpine` (pulled from registry)

**Time**: 1-2 minutes (first build) or 30-45 seconds (cached)

**For BuildOnly Mode:**
```powershell
# If -BuildOnly used:
[SUCCESS] Build complete. Run: docker-compose up -d
[INFO] Logs: deployment_logs/deploy_20260211_083000.log
# Script exits here - containers NOT started
```

---

### Phase 6: Service Startup (10-15 seconds)

```powershell
[INFO] Stopping existing containers...
[INFO] Starting containers...

Network kmsetjendpdri_kms_network Creating
Network kmsetjendpdri_kms_network Created
Container kms_redis Creating
Container kms_redis Created
Container kms_django Creating
Container kms_django Created
Container kms_frontend Creating
Container kms_frontend Created

Container kms_redis Starting
Container kms_redis Started
Container kms_redis Waiting
Container kms_redis Healthy

Container kms_django Starting
Container kms_django Started
Container kms_frontend Starting
Container kms_frontend Started

[SUCCESS] Containers started
```

**What happens:**
- Runs: `docker-compose down` (stops old containers)
- Runs: `docker-compose up -d` (starts new containers)
- Creates bridge network: `kms_network`
- Starts 3 containers in order:
  1. Redis (no dependencies)
  2. Django (depends on Redis healthy)
  3. Frontend (depends on Django)

---

### Phase 7: Health Checks (30-60 seconds)

```powershell
[INFO] Checking services...
Start-Sleep -Seconds 10  # Wait for startup

[INFO] Checking PostgreSQL...
[SUCCESS] PostgreSQL ready  # or [WARNING] if not available

[INFO] Checking Redis...
# Tries up to 30 times, 1 second apart
 Attempt 1/30: PONG ✓
[SUCCESS] Redis ready

[INFO] Checking Django...
# Tries up to 30 times, 2 seconds apart
 Attempt 1/30: Django check OK ✓
[SUCCESS] Django ready
```

**What happens:**
- Waits 10 seconds for containers to initialize
- **PostgreSQL Check** (skipped if unavailable)
- **Redis Health** (retries 30 times, 1s intervals)
  - Command: `redis-cli ping`
  - Expected: PONG response
- **Django Check** (retries 30 times, 2s intervals)
  - Command: `manage.py check`
  - Expected: Exit code 0

**With -NoHealthCheck:**
- Skips all health checks
- Useful in CI/CD environments

---

### Phase 8: Database Setup (10-15 seconds)

```powershell
[INFO] Running migrations...
Operations to perform:
  Apply all migrations: admin, audit, auth, content, contenttype, core, sessions

Running migrations:
  Rendering model states... DONE
  Applying admin.0001_initial... OK
  Applying auth.0001_initial... OK
  ...
  
[SUCCESS] Migrations completed

[INFO] Collecting static files...
165 static files collected, 475 post-processed.
[SUCCESS] Static files collected
```

**What happens:**
- Runs: `manage.py migrate --noinput`
  - Creates database tables
  - Applies migrations
  - Sets up schema
- Runs: `manage.py collectstatic --noinput`
  - Gathers static files
  - Optimizes CSS/JS
  - Prepares for serving

---

### Phase 9: Service Verification (5-10 seconds)

```powershell
[INFO] Verifying services...

[SUCCESS] Django API responding
[SUCCESS] Frontend responding
```

**What happens:**
- Tests Django API: `http://localhost:8002/api/`
- Tests Frontend: `http://localhost:5175/`
- Issues warnings if not responding yet (normal during startup)

---

### Phase 10: Success Report

```powershell
========================================
DEPLOYMENT SUCCESSFUL
========================================

[SUCCESS] Deployment to [staging] completed!
[INFO] Logs: deployment_logs/deploy_20260211_083000.log

Services:
  Django API ........... http://localhost:8002
  Frontend ............ http://localhost:5175
  PostgreSQL .......... localhost:5432 (local)
  Redis ............... Docker container

Next steps:
  docker-compose logs -f
  docker-compose ps
```

**For Production:**
```powershell
PRODUCTION CHECKLIST:
  - Monitor logs for 24 hours
  - Verify critical workflows
  - Test backup restoration
  - Verify SSL/HTTPS
```

---

## Environment Modes

### Development Mode

```powershell
ENVIRONMENT=development
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,django,kms_django
```

**Characteristics:**
- ✅ Verbose logging
- ✅ No SSL required
- ✅ Local PostgreSQL on `localhost:5432`
- ✅ Console email backend (development)
- ✅ Fast startup
- ⚠️ No backups
- ⚠️ No production checks

**Use When:** Developing locally, testing features

### Staging Mode

```powershell
ENVIRONMENT=staging
DEBUG=True  # Change to False for production-like testing
ALLOWED_HOSTS=staging.server.com,...  # Update for staging domain
```

**Characteristics:**
- ✅ Similar to production setup
- ✅ Can test with real database
- ✅ Can test SSL/HTTPS
- ✅ Production-grade monitoring
- ⚠️ NO automatic backups
- ⚠️ Warnings issued

**Use When:** Pre-production testing, UAT, integration testing

**Note:** Best practice is to set `DEBUG=False` for staging

### Production Mode

```powershell
ENVIRONMENT=production
DEBUG=False
ALLOWED_HOSTS=kms.server.com,...
SECRET_KEY=<unique-production-key>
DB_HOST=<production-postgres-host>
```

**Characteristics:**
- ✅ Automatic database backups
- ✅ Safety checks (DEBUG must be False)
- ✅ Requires manual confirmation
- ✅ Full health verification
- ✅ Post-deployment monitoring checklist
- ✅ error reporting enabled
- 🔴 Breaking changes likely fatal

**Use When:** Deploying to production servers

**Setup Required:**
```env
# Before production deployment, update .env:
ENVIRONMENT=production
DEBUG=False                    # CRITICAL
SECRET_KEY=your-production-key
ALLOWED_HOSTS=your-domain.com
DB_HOST=prod-postgres.server.com
DB_PASSWORD=<secure-password>
REDIS_PASSWORD=<secure-password>
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=your-smtp-server.com
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=<smtp-password>
```

---

## Troubleshooting

### Common Issues & Solutions

#### ❌ "Docker not found"

```powershell
ERROR: Docker not found. Please install Docker Desktop.
```

**Solution:**
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install and restart
3. Verify: `docker --version`
4. Retry deployment

#### ❌ "docker-compose not found"

```powershell
ERROR: docker-compose not found
```

**Solution:**
1. Update Docker Desktop to v2.0+ (includes compose)
2. Or install: `pip install docker-compose`
3. Verify: `docker-compose --version`
4. Retry deployment

#### ❌ ".env file not found"

```powershell
ERROR: .env file not found. Create from .env.example
```

**Solution:**
```powershell
# Copy template
Copy-Item .env.example .env

# Edit with your values
notepad .env

# Retry deployment
.\deploy.ps1 -Environment staging
```

#### ❌ "Docker build failed"

```powershell
ERROR: Docker build failed
[... build errors ...]
```

**Solutions:**
1. Check Docker is running:
   ```powershell
   docker ps
   ```

2. Check available disk space (minimum 5GB recommended)

3. Clear Docker cache and rebuild:
   ```powershell
   docker system prune -a
   .\deploy.ps1 -Environment staging
   ```

4. View full build logs:
   ```powershell
   docker-compose build --no-cache 2>&1 | Tee-Object build.log
   ```

5. Check internet connection (pulling images)

#### ❌ "PostgreSQL check skipped"

```powershell
WARNING: PostgreSQL check skipped
```

**This is NORMAL if:**
- `pg_isready` not installed
- PostgreSQL not running locally
- Running in CI/CD without local database

**Not critical** - Docker will override `DB_HOST` to `host.docker.internal`

#### ❌ "Django failed to start"

```powershell
ERROR: Django failed to start
```

**Debug steps:**
```powershell
# View Django logs
docker-compose logs django -n 50

# Try to fix common issues
docker-compose exec django python manage.py check

# Restart Django
docker-compose restart django

# Check database connection
docker-compose exec django python manage.py dbshell
```

**Common causes:**
- Database not accessible
- Missing migrations
- Incorrect SECRET_KEY
- Missing environment variables

#### ❌ "Redis connection failed"

```powershell
ERROR: Redis failed to connect
```

**Solutions:**
```powershell
# Check Redis logs
docker-compose logs redis -n 20

# Restart Redis
docker-compose restart redis

# Verify Redis is running
docker ps | Select-String redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

#### ❌ "Confirmation required" (Production)

```powershell
[WARNING] PRODUCTION DEPLOYMENT - Verifying security checks...
Confirm production deployment (yes/no): _
```

**What to do:**
- Type: `yes` (exactly) + Enter to proceed
- Type anything else to cancel

```powershell
Confirm production deployment (yes/no): yes
# ✅ Deployment continues

Confirm production deployment (yes/no): no
# ❌ Deployment cancelled
```

#### ❌ Port already in use

```powershell
ERROR: bind: address already in use
```

**Solutions:**
```powershell
# Find what's using the port
netstat -ano | Select-String ":8002"

# Kill the process (replace PID)
taskkill /PID 1234 /F

# Or change ports in docker-compose.yml
# Change: "8002:8002" to "8003:8002"
# Then retry deployment
```

#### ❌ Out of disk space

```powershell
ERROR: no space left on device
```

**Solutions:**
```powershell
# Check disk usage
Get-PSDrive C

# Clean Docker
docker system prune -a

# Delete old logs
Remove-Item deployment_logs\* -Force

# Try deployment again
.\deploy.ps1 -Environment staging
```

#### ❌ Script won't run

```powershell
. : File d:\path\deploy.ps1 cannot be loaded because running
scripts is disabled on this system.
```

**Solution:**
```powershell
# Allow script execution (one-time)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then run the script
.\deploy.ps1 -Environment staging
```

---

## Technical Analysis

### Script Architecture

```
┌─────────────────────────────────────────┐
│         DEPLOY.PS1 ARCHITECTURE         │
├─────────────────────────────────────────┤
│                                         │
│  Parameters & Configuration             │
│          ↓                              │
│  Banners & Logging Setup               │
│          ↓                              │
│  Validation Phase                       │
│  ├─ Docker check                        │
│  ├─ docker-compose check                │
│  ├─ Files check (.env, yml)             │
│  └─ PostgreSQL check                    │
│          ↓                              │
│  Environment Configuration              │
│  ├─ Parse .env                          │
│  ├─ Validate environment                │
│  └─ Apply security checks (prod)        │
│          ↓                              │
│  Pre-Deployment Phase                   │
│  ├─ Backup Database (prod only)         │
│  └─ Update Code (git pull)              │
│          ↓                              │
│  Docker Phase                           │
│  ├─ Build Images                        │
│  ├─ START SERVICES OR EXIT (BuildOnly)  │
│  └─ Start Containers                    │
│          ↓                              │
│  Verification Phase                     │
│  ├─ Service Health Checks               │
│  ├─ Database Setup (migrations)         │
│  └─ Endpoint Verification               │
│          ↓                              │
│  Success & Reporting                    │
│  ├─ Display Summary                     │
│  ├─ Show Service URLs                   │
│  └─ Production Checklist (prod only)    │
│                                         │
└─────────────────────────────────────────┘
```

### Logging System

**Log File Location:**
```
deployment_logs/deploy_YYYYMMDD_HHMMSS.log

Example: deployment_logs/deploy_20260211_083000.log
```

**Log Levels:**
- `[INFO]` - Cyan - Informational messages
- `[SUCCESS]` - Green - Successful operations
- `[WARNING]` - Yellow - Non-fatal issues
- `[ERROR]` - Red - Fatal errors (stops execution)

**Log Output:**
```
[2026-02-11 08:30:00] [INFO] Starting staging deployment
[2026-02-11 08:30:00] [SUCCESS] Docker found: Docker version 29.1.5, build 0e6fee6
[2026-02-11 08:30:00] [INFO] Building Docker images...
...
[2026-02-11 08:33:12] [SUCCESS] Deployment to [staging] completed!
```

### Error Handling

**Script Exit Codes:**
```
Exit 0   = Success
Exit 1   = Fatal error (validation, build, or deployment failure)
```

**Exception Handling:**
```powershell
try {
    # Main execution
    Invoke-Deployment
} catch {
    Log-Error "Deployment failed: $_"
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
```

**All errors in functions:**
- Logged to file and console
- Logged with timestamp
- Exit script immediately
- Display error message

### Docker Integration

**Services Orchestrated:**

| Service | Image | Port | Role |
|---------|-------|------|------|
| **Redis** | redis:7-alpine | 6379 | Cache & sessions |
| **Django** | kmsetjendpdri-django | 8002 | API backend |
| **Frontend** | kmsetjendpdri-frontend | 5175 | Web UI |

**Docker Compose Usage:**
```powershell
# Build images
docker-compose build

# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Health status
docker-compose ps
```

---

## Known Limitations

### 1. PostgreSQL Dependency (Development)

**Issue:** Script requires PostgreSQL running on `localhost:5432`

**Limitation:** 
- Check failure if PostgreSQL not installed
- Docker will override with `host.docker.internal`
- Not actually blocking deployment

**Workaround:**
```powershell
# Skip health check
.\deploy.ps1 -Environment staging -NoHealthCheck

# Or ensure PostgreSQL is running
# Start PostgreSQL service before deployment
```

### 2. Windows PowerShell Only

**Issue:** Script uses PS-specific cmdlets and syntax

**Limitation:**
- Cannot run on Linux/macOS
- Requires Windows PowerShell 5.1+

**Workaround:**
```bash
# On macOS/Linux, use regular shell:
docker-compose build
docker-compose up -d
docker-compose exec django python manage.py migrate --noinput
```

### 3. `pg_isready` Availability (Windows)

**Issue:** PostgreSQL tools may not be in PATH

**Limitation:**
- PostgreSQL check may fail on Windows
- False negative warning issued

**Not Critical:** Docker overrides DB_HOST to `host.docker.internal`

### 4. Interactive Confirmation (Production)

**Issue:** `-Environment production` requires manual "yes" confirmation

**Cannot:**
- Run unattended in CI/CD
- Use with `-NoConfirmation` flag

**Workaround:**
```bash
# In CI/CD, pipe confirmation:
echo "yes" | .\deploy.ps1 -Environment production

# Or use alternative scripting
```

### 5. Build Time

**Issue:** First Docker build takes 2-5 minutes

**Limitation:**
- Installing all dependencies
- Downloading base images
- Compiling Python packages

**Workaround:**
```powershell
# Cached builds are much faster
# Subsequent runs: 30-60 seconds

# Build only without starting
.\deploy.ps1 -Environment staging -BuildOnly
```

### 6. No Automatic Rollback

**Issue:** Failed deployment doesn't rollback to previous version

**Limitation:**
- Old containers stopped before new ones verified
- Failure may leave system in inconsistent state

**Mitigation:**
```powershell
# Always backup before production
# Use database backups for recovery
# Have previous image tags available

# Manual recovery:
docker-compose down
docker-compose up -d  # Restarts previous images
```

### 7. Static File Collection

**Issue:** Collected during Docker build and deployment

**Limitation:**
- Changes require rebuild
- Slow iteration during development

**Workaround:**
```powershell
# For development, use Django dev server locally:
cd backend
python manage.py runserver
```

### 8. No Health Check for Frontend

**Issue:** Frontend health check uses `wget`, may not be available

**Limitation:**
- Check failure if `wget` not installed in container
- But frontend still serves correctly

**Impact:** Warnings only, not blocking

---

## Advanced Usage

### Custom Docker Build

```powershell
# Skip automatic build, use custom image
docker-compose build django --no-cache
.\deploy.ps1 -Environment staging
```

### Debug Mode

```powershell
# See all commands being executed
Set-PSDebug -Trace 1
.\deploy.ps1 -Environment staging
Set-PSDebug -Trace 0
```

### Logfile Analysis

```powershell
# View full deployment log
Get-Content deployment_logs/deploy_*.log | Select-Object -Last 50

# Search for errors
Select-String "ERROR" deployment_logs/deploy_*.log

# Real-time log watching
Get-Content deployment_logs/deploy_*.log -Wait  # Ctrl+C to stop
```

### Manual Service Management

```powershell
# After deployment, manual control:

# View service status
docker-compose ps

# View real-time logs
docker-compose logs -f django

# Execute commands in container
docker-compose exec django python manage.py createsuperuser

# Stop services
docker-compose down

# Restart specific service
docker-compose restart frontendend
```

---

## Best Practices

### ✅ DO's

```powershell
# ✅ Read the log file after deployment
Get-Content deployment_logs/deploy_*.log

# ✅ Test deployments in staging first
.\deploy.ps1 -Environment staging

# ✅ Backup production before updates
# (done automatically, but verify)
Get-ChildItem backups/

# ✅ Monitor services after deployment
docker-compose logs -f

# ✅ Document your environment
# (ALLOWED_HOSTS, secrets, database info)

# ✅ Use version control
git commit -am "pre-deployment snapshot"
git push origin main
```

### ❌ DON'Ts

```powershell
# ❌ Run production deployment without backup verification
# (Backup is automatic, but verify it exists)

# ❌ Deploy to production from branch
git checkout main
.\deploy.ps1 -Environment production

# ❌ Skip git pull in CICD
# (Code must be up-to-date)

# ❌ Leave DEBUG=True in production
# (Script checks for this and fails gracefully)

# ❌ Expose secrets in scripts
# (Keep them in .env, never in git)

# ❌ Run as Admin unnecessarily
# (Normal user permissions sufficient)
```

---

## Summary

### What `deploy.ps1` Does Well ✅

- **Comprehensive Validation**: Checks all prerequisites
- **Multi-Environment Support**: dev/staging/production modes
- **Production Safety**: Prevents dangerous configurations
- **Detailed Logging**: File + console with timestamps
- **Health Checks**: Verifies all services start correctly
- **Automatic Backups**: Database backups before production deployment
- **Error Handling**: Clear error messages and exit codes
- **Easy to Use**: Single command deploys everything
- **Flexible**: Parameters for different scenarios
- **Interactive**: Confirms production deployments

### What To Watch Out For ⚠️

- ⚠️ Requires PostgreSQL for full validation
- ⚠️ First build takes time (5-10 minutes)
- ⚠️ Production requires manual confirmation
- ⚠️ No automatic rollback on failure
- ⚠️ Windows-only (PowerShell script)

### Quick Reference Card

```powershell
# Development
.\deploy.ps1 -Environment development

# Staging
.\deploy.ps1 -Environment staging

# Production
.\deploy.ps1 -Environment production

# Build only
.\deploy.ps1 -Environment staging -BuildOnly

# Without code update
.\deploy.ps1 -Environment staging -NoPull

# View logs
Get-Content deployment_logs/deploy_*.log -Wait

# Check service status
docker-compose ps

# View service logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart
```

---

## Getting Help

### Check Logs First

```powershell
# View detailed error information
Get-Content deployment_logs/deploy_*.log | Select-String "ERROR"
```

### Common Commands for Troubleshooting

```powershell
# Docker status
docker --version
docker ps
docker-compose ps

# Service logs
docker-compose logs django
docker-compose logs frontend
docker-compose logs redis

# Database check
docker-compose exec django python manage.py check

# Manual migration
docker-compose exec -T django python manage.py migrate --noinput
```

### Performance Monitoring

```powershell
# Resource usage
docker stats

# Build time analysis
Measure-Command { .\deploy.ps1 -Environment staging -BuildOnly }
```

---

**Last Updated**: February 11, 2026  
**Tested On**: Docker 29.1.5, PowerShell 5.1, Windows 10/11  
**Status**: Production Ready ✅

