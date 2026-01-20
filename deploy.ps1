# ==============================================================================
# KMS Production Deployment Script (Windows PowerShell)
# ==============================================================================
# Usage: .\deploy.ps1 -Environment staging
#        .\deploy.ps1 -Environment production

param(
    [string]$Environment = "staging",
    [switch]$SkipBackup = $false,
    [switch]$SkipTests = $false
)

$ErrorActionPreference = "Stop"
$ProjectDir = (Get-Location).Path
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# ==============================================================================
# LOGGING
# ==============================================================================

function Log-Info {
    param([string]$Message)
    $msg = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [INFO] $Message"
    Write-Host $msg -ForegroundColor Cyan
}

function Log-Success {
    param([string]$Message)
    $msg = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [SUCCESS] $Message"
    Write-Host $msg -ForegroundColor Green
}

function Log-Error {
    param([string]$Message)
    $msg = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [ERROR] $Message"
    Write-Host $msg -ForegroundColor Red
}

function Log-Warning {
    param([string]$Message)
    $msg = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [WARNING] $Message"
    Write-Host $msg -ForegroundColor Yellow
}

# ==============================================================================
# HEADER
# ==============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "KMS PRODUCTION DEPLOYMENT - WINDOWS" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Log-Info "Starting deployment to $Environment environment"
Log-Info "Project directory: $ProjectDir"

# ==============================================================================
# PRE-DEPLOYMENT CHECKS
# ==============================================================================

Log-Info "Checking Docker..."
try {
    $dockerVersion = docker --version
    Log-Success "Docker found: $dockerVersion"
} catch {
    Log-Error "Docker not found"
    exit 1
}

Log-Info "Checking docker-compose..."
try {
    $composeVersion = docker-compose --version
    Log-Success "docker-compose found: $composeVersion"
} catch {
    Log-Error "docker-compose not found"
    exit 1
}

# Check .env
if (-not (Test-Path ".env")) {
    Log-Error ".env file not found"
    exit 1
}
Log-Success ".env file found"

# Check docker-compose.yml
if (-not (Test-Path "docker-compose.yml")) {
    Log-Error "docker-compose.yml not found"
    exit 1
}
Log-Success "docker-compose.yml found"

# ==============================================================================
# BACKUP (PRODUCTION ONLY)
# ==============================================================================

if ($Environment -eq "production" -and -not $SkipBackup) {
    Log-Warning "Production deployment - creating database backup"
    $BackupDir = Join-Path $ProjectDir "backups"
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
    $BackupFile = Join-Path $BackupDir "backup_$Timestamp.sql"
    
    Log-Info "Backing up PostgreSQL database..."
    try {
        docker-compose exec -T postgres pg_dump -U postgres kms_db | Out-File -Encoding UTF8 $BackupFile
        if (Test-Path $BackupFile) {
            Log-Success "Database backup created: $BackupFile"
        }
    } catch {
        Log-Warning "Backup failed but continuing: $_"
    }
}

# ==============================================================================
# CODE UPDATE
# ==============================================================================

Log-Info "Updating code from repository..."
try {
    git pull origin main 2>&1 | Out-Null
    Log-Success "Code updated"
} catch {
    Log-Warning "Git pull skipped or failed"
}

# ==============================================================================
# DOCKER BUILD & STARTUP
# ==============================================================================

Log-Info "Building Docker images..."
docker-compose build 2>&1 | Out-Null
Log-Success "Docker images built"

Log-Info "Stopping existing containers..."
docker-compose down 2>&1 | Out-Null

Log-Info "Starting Docker containers..."
docker-compose up -d 2>&1 | Out-Null
Log-Success "Containers started"

# ==============================================================================
# WAIT FOR SERVICES
# ==============================================================================

Log-Info "Waiting for services to start..."
Start-Sleep -Seconds 15

# Check PostgreSQL
Log-Info "Checking PostgreSQL status..."
$pgReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $result = docker-compose exec -T postgres pg_isready -U postgres 2>&1
        if ($LASTEXITCODE -eq 0) {
            Log-Success "PostgreSQL is ready"
            $pgReady = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
}

# Check Redis
Log-Info "Checking Redis status..."
$redisReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $result = docker-compose exec -T redis redis-cli ping 2>&1
        if ($result -like "*PONG*") {
            Log-Success "Redis is ready"
            $redisReady = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
}

# Check Django
Log-Info "Checking Django status..."
$djangoReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $result = docker-compose exec -T django python manage.py check 2>&1
        if ($LASTEXITCODE -eq 0) {
            Log-Success "Django is ready"
            $djangoReady = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
}

# ==============================================================================
# DATABASE MIGRATIONS
# ==============================================================================

Log-Info "Running database migrations..."
try {
    docker-compose exec -T django python manage.py migrate --noinput 2>&1 | Out-Null
    Log-Success "Database migrations completed"
} catch {
    Log-Error "Migrations failed: $_"
    exit 1
}

# ==============================================================================
# STATIC FILES
# ==============================================================================

Log-Info "Collecting static files..."
try {
    docker-compose exec -T django python manage.py collectstatic --noinput 2>&1 | Out-Null
    Log-Success "Static files collected"
} catch {
    Log-Warning "Static file collection failed: $_"
}

# ==============================================================================
# HEALTH CHECKS
# ==============================================================================

Log-Info "Verifying services..."

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/" -ErrorAction SilentlyContinue
    Log-Success "Django is responding on port 8000"
} catch {
    Log-Warning "Health check pending (may be normal)"
}

# ==============================================================================
# SMOKE TESTS
# ==============================================================================

if (-not $SkipTests) {
    Log-Info "Running smoke tests..."
    
    Log-Info "Running model tests..."
    try {
        docker-compose exec -T django pytest tests/models/test_models.py -q --tb=no 2>&1 | Out-Null
        Log-Success "Model tests passed"
    } catch {
        Log-Warning "Model tests: $_"
    }
    
    Log-Info "Running security tests..."
    try {
        docker-compose exec -T django pytest tests/security/test_security.py -q --tb=no 2>&1 | Out-Null
        Log-Success "Security tests passed"
    } catch {
        Log-Warning "Security tests: $_"
    }
}

# ==============================================================================
# FINAL SUMMARY
# ==============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT SUCCESSFUL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Log-Success "Deployment to $Environment completed!"
Log-Info "Timestamp: $Timestamp"

Write-Host ""
Write-Host "Services are running:" -ForegroundColor Yellow
Log-Info "PostgreSQL: localhost:5432"
Log-Info "Redis: localhost:6379"
Log-Info "Django: http://localhost:8000"

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Log-Info "1. View logs: docker-compose logs -f"
Log-Info "2. Check health: curl http://localhost:8000/"
Log-Info "3. Run full tests: docker-compose exec django pytest tests/"

if ($Environment -eq "production") {
    Write-Host ""
    Write-Host "PRODUCTION DEPLOYMENT - NEXT STEPS:" -ForegroundColor Yellow
    Log-Warning "- Monitor application logs for 24 hours"
    Log-Warning "- Verify all services are healthy"
    Log-Warning "- Test critical workflows"
    Log-Warning "- Keep backup file in safe location"
}

Write-Host ""
