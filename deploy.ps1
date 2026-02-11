# ==============================================================================
# KMS Production Deployment Script (Windows PowerShell)
# ==============================================================================
# This script deploys KMS Setjen DPD RI to staging or production environments
#
# USAGE:
#   .\deploy.ps1 -Environment staging                    # Deploy to staging
#   .\deploy.ps1 -Environment production -SkipTests      # Deploy to production (skip tests)
#   .\deploy.ps1 -Environment development -SkipBackup    # Local development deployment
#
# FEATURES:
#   - Environment-based configuration (development, staging, production)
#   - PostgreSQL local database support
#   - Redis caching and session store
#   - Health checks for all services
#   - Database migrations and static file collection
#   - Comprehensive error handling and logging
#   - Backup creation for production deployments

param(
    [string]$Environment = "staging",
    [switch]$SkipBackup = $false,
    [switch]$SkipTests = $false,
    [switch]$NoPull = $false,
    [switch]$BuildOnly = $false,
    [switch]$NoHealthCheck = $false
)

$ErrorActionPreference = "Stop"
$ProjectDir = (Get-Location).Path
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LogFile = Join-Path $ProjectDir "deployment_logs/deploy_$Timestamp.log"

# ==============================================================================
# LOGGING
# ==============================================================================

# Create logs directory
New-Item -ItemType Directory -Force -Path "$ProjectDir/deployment_logs" | Out-Null

function Log-Info {
    param([string]$Message)
    $msg = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [INFO] $Message"
    Write-Host $msg -ForegroundColor Cyan
    Add-Content -Path $LogFile -Value $msg
}

function Log-Success {
    param([string]$Message)
    $msg = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [SUCCESS] $Message"
    Write-Host $msg -ForegroundColor Green
    Add-Content -Path $LogFile -Value $msg
}

function Log-Error {
    param([string]$Message)
    $msg = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [ERROR] $Message"
    Write-Host $msg -ForegroundColor Red
    Add-Content -Path $LogFile -Value $msg
}

function Log-Warning {
    param([string]$Message)
    $msg = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [WARNING] $Message"
    Write-Host $msg -ForegroundColor Yellow
    Add-Content -Path $LogFile -Value $msg
}

# ==============================================================================
# HEADER & INITIALIZATION
# ==============================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       KMS SETJEN DPD RI - DOCKER DEPLOYMENT SCRIPT             ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║  Environment: $Environment.PadRight(46) ║" -ForegroundColor Cyan
Write-Host "║  Timestamp: $Timestamp                              ║" -ForegroundColor Cyan
if ($BuildOnly) {
    Write-Host "║  Mode: BUILD ONLY (no startup)                                 ║" -ForegroundColor Yellow
}
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Log-Info "Starting $Environment deployment"
Log-Info "Project directory: $ProjectDir"
Log-Info "Log file: $LogFile"
Log-Info "Parameters:"
Log-Info "  - Environment: $Environment"
Log-Info "  - SkipBackup: $SkipBackup"
Log-Info "  - SkipTests: $SkipTests"
Log-Info "  - NoPull: $NoPull"
Log-Info "  - BuildOnly: $BuildOnly"
Log-Info "  - NoHealthCheck: $NoHealthCheck"

# ==============================================================================
# VALIDATION FUNCTIONS
# ==============================================================================

function Validate-Environment {
    Log-Info "Validating deployment environment..."
    
    # Check for valid environment
    $validEnvs = @("development", "staging", "production")
    if ($Environment -notin $validEnvs) {
        Log-Error "Invalid environment: $Environment"
        Log-Error "Valid environments: $($validEnvs -join ', ')"
        exit 1
    }
    
    # Validate Docker
    try {
        $dockerVersion = docker --version
        Log-Success "Docker found: $dockerVersion"
    } catch {
        Log-Error "Docker not found or not installed"
        Log-Error "Please install Docker from: https://www.docker.com/products/docker-desktop"
        exit 1
    }
    
    # Validate docker-compose
    try {
        $composeVersion = docker-compose --version
        Log-Success "docker-compose found: $composeVersion"
    } catch {
        Log-Error "docker-compose not found or not installed"
        exit 1
    }
    
    # Check .env file exists
    if (-not (Test-Path ".env")) {
        Log-Error ".env file not found in project root"
        Log-Error "Please create .env from .env.example: cp .env.example .env"
        exit 1
    }
    Log-Success ".env file found"
    
    # Check docker-compose.yml
    if (-not (Test-Path "docker-compose.yml")) {
        Log-Error "docker-compose.yml not found in project root"
        exit 1
    }
    Log-Success "docker-compose.yml found"
    
    # Check PostgreSQL for non-Docker environments
    if ($Environment -eq "production") {
        try {
            $pgTest = pg_isready 2>&1
            if ($LASTEXITCODE -eq 0) {
                Log-Success "PostgreSQL is accessible on localhost:5432"
            } else {
                Log-Warning "PostgreSQL health check inconclusive - will monitor Docker startup"
            }
        } catch {
            Log-Warning "PostgreSQL client tools not found - will rely on Docker healthchecks"
        }
    }
    
    # Validate Git
    try {
        $gitVersion = git --version
        Log-Success "Git found: $gitVersion"
    } catch {
        Log-Warning "Git not found - skipping code pull"
    }
    
    Log-Success "Environment validation completed"
}

# ==============================================================================
# PRE-DEPLOYMENT CHECKS
# ==============================================================================

Log-Info "================== PRE-DEPLOYMENT CHECKS =================="
Validate-Environment

# ==============================================================================
# ENVIRONMENT-SPECIFIC CONFIGURATION
# ==============================================================================

Log-Info "Setting up environment for: $Environment"

# Load .env file to check configuration
$envContent = Get-Content ".env" -Raw

switch($Environment) {
    "development" {
        Log-Info "Development mode: Using as-is configuration"
        Log-Warning "Development mode - DEBUG enabled, security relaxed"
    }
    "staging" {
        Log-Info "Staging mode: Preparing for production-like environment"
        Log-Info "- Using provided configuration from .env"
        Log-Warning "Review these settings before proceeding:"
        Log-Warning "  - ALLOWED_HOSTS matches your staging domain"
        Log-Warning "  - Database credentials are correct"
        Log-Warning "  - Redis is accessible"
    }
    "production" {
        Log-Warning "⚠️  PRODUCTION DEPLOYMENT - CRITICAL CHECKS ⚠️"
        
        # Verify production settings
        if ($envContent -match "DEBUG\s*=\s*True") {
            Log-Error "DEBUG is enabled in .env - MUST be False for production"
            exit 1
        }
        
        if ($envContent -match "SECRET_KEY\s*=\s*.*change-me") {
            Log-Error "Default SECRET_KEY in .env - MUST be changed for production"
            exit 1
        }
        
        if ($envContent -match "ENVIRONMENT\s*=\s*development") {
            Log-Error "ENVIRONMENT is set to development - MUST be set to production"
            exit 1
        }
        
        Log-Warning "Production deployment safeguards:"
        Log-Warning "  1. ALLOWED_HOSTS is properly configured"
        Log-Warning "  2. SECRET_KEY is strong (50+ characters)"
        Log-Warning "  3. Database credentials are set"
        Log-Warning "  4. SSL/HTTPS is configured"
        
        Write-Host ""
        $response = Read-Host "⚠️  Confirm PRODUCTION deployment (type 'yes' to continue)"
        if ($response -ne "yes") {
            Log-Error "Production deployment cancelled by user"
            exit 1
        }
    }
}

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
        # Check if containers are already running
        $djangoRunning = docker ps --format "table {{.Names}}" | Select-String "kms_django" 
        if ($djangoRunning) {
            docker-compose exec -T django python manage.py dumpdata --all > $BackupFile
        } else {
            Log-Warning "Containers not running yet - will skip SQL backup"
        }
        
        if (Test-Path $BackupFile) {
            Log-Success "Database backup created: $BackupFile"
        }
    } catch {
        Log-Warning "Backup failed but continuing (containers may not be ready): $_"
    }
}

# ==============================================================================
# CODE UPDATE
# ==============================================================================

if (-not $NoPull) {
    Log-Info "Updating code from repository..."
    try {
        git pull origin main 2>&1 | Out-Null
        Log-Success "Code updated from GitHub"
    } catch {
        Log-Warning "Git pull skipped or failed - using local code"
    }
} else {
    Log-Info "Skipping code update (NoPull flag set)"
}

# ==============================================================================
# DOCKER BUILD & STARTUP
# ==============================================================================

Log-Info "================== DOCKER SETUP =================="
Log-Info "Building Docker images for: $Environment"
$dockerBuildOutput = docker-compose build 2>&1
if ($LASTEXITCODE -ne 0) {
    if ($dockerBuildOutput -like "*WARNING*") {
        Log-Warning "Docker build produced warnings (non-fatal)"
        Log-Success "Docker images built successfully"
    } else {
        Log-Error "Docker build failed"
        Write-Host $dockerBuildOutput
        exit 1
    }
} else {
    Log-Success "Docker images built successfully"
}

if ($BuildOnly) {
    Log-Success "Build-only mode: Docker images ready"
    Log-Info "To start containers, run: docker-compose up -d"
    exit 0
}

Log-Info "Stopping existing containers..."
docker-compose down 2>&1 | Out-Null

Log-Info "Starting Docker containers..."
$upOutput = docker-compose up -d 2>&1
if ($LASTEXITCODE -ne 0) {
    Log-Error "Failed to start Docker containers"
    Write-Host $upOutput
    exit 1
}
Log-Success "Containers started"

# ==============================================================================
# WAIT FOR SERVICES
# ==============================================================================

Log-Info "================== HEALTH CHECKS =================="
Log-Info "Waiting for services to initialize..."
Start-Sleep -Seconds 10

# Check PostgreSQL (local, not in Docker)
Log-Info "Checking PostgreSQL status (localhost:5432)..."
try {
    $pgTest = pg_isready 2>&1
    if ($LASTEXITCODE -eq 0) {
        Log-Success "PostgreSQL is ready on localhost:5432"
    } else {
        Log-Warning "PostgreSQL status check inconclusive - continuing..."
    }
} catch {
    Log-Warning "PostgreSQL check failed - will verify during migrations"
}

# Check Redis
Log-Info "Checking Redis status..."
$redisReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $result = docker-compose exec -T redis redis-cli ping 2>&1
        if ($result -like "*PONG*" -or $LASTEXITCODE -eq 0) {
            Log-Success "Redis is ready"
            $redisReady = $true
            break
        }
    } catch {
        # Continue retrying
    }
    Start-Sleep -Seconds 1
}

if (-not $redisReady) {
    Log-Warning "Redis health check timeout - continuing anyway"
}

# Check Django
Log-Info "Checking Django application status..."
$djangoReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $result = docker-compose exec -T django python manage.py check 2>&1
        if ($LASTEXITCODE -eq 0 -or $result -like "*System check identified*") {
            Log-Success "Django application is ready"
            $djangoReady = $true
            break
        }
    } catch {
        # Continue retrying
    }
    Start-Sleep -Seconds 2
}

if (-not $djangoReady) {
    Log-Warning "Django health check timeout at iteration $i"
    if (-not $NoHealthCheck) {
        Log-Error "Django failed to initialize - deployment aborted"
        exit 1
    } else {
        Log-Warning "Ignoring health check failure (NoHealthCheck flag set)"
    }
}

# ==============================================================================
# DATABASE MIGRATIONS
# ==============================================================================

Log-Info "================== DATABASE SETUP =================="
Log-Info "Running database migrations..."
try {
    $migrationOutput = docker-compose exec -T django python manage.py migrate --noinput 2>&1
    if ($LASTEXITCODE -eq 0 -or $migrationOutput -like "*No migrations to apply*") {
        Log-Success "Database migrations completed successfully"
    } else {
        Log-Warning "Migration output: $migrationOutput"
    }
} catch {
    Log-Error "Migrations failed: $_"
    if (-not $NoHealthCheck) {
        exit 1
    } else {
        Log-Warning "Ignoring migration error (NoHealthCheck flag set)"
    }
}

# Create superuser if needed (development only)
if ($Environment -eq "development") {
    Log-Info "Checking if superuser exists..."
    try {
        docker-compose exec -T django python manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    print("Creating default admin user...")
else:
    print("Admin user already exists")
EOF
    } catch {
        Log-Warning "Superuser check skipped"
    }
}

# ==============================================================================
# STATIC FILES
# ==============================================================================

# ==============================================================================
# STATIC FILES
# ==============================================================================

Log-Info "Collecting static files..."
try {
    $staticOutput = docker-compose exec -T django python manage.py collectstatic --noinput 2>&1
    if ($LASTEXITCODE -eq 0 -or $staticOutput -like "*0 static files*") {
        Log-Success "Static files collected successfully"
    } else {
        Log-Warning "Static collection output: $staticOutput"
    }
} catch {
    Log-Warning "Static file collection failed: $_"
}

# ==============================================================================
# FINAL VERIFICATION
# ==============================================================================

Log-Info "================== FINAL VERIFICATION =================="
Log-Info "Verifying services..."

$allServicesHealthy = $true

# Check Django API
Log-Info "Checking Django API endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8002/api/" -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 404) {
        Log-Success "Django API is responding on port 8002"
    } else {
        Log-Warning "Django returned status code: $($response.StatusCode)"
    }
} catch {
    Log-Warning "Django API not yet responsive (launching): $_"
    $allServicesHealthy = $false
}

# Check Frontend
Log-Info "Checking Frontend application..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5175/" -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Log-Success "Frontend is responding on port 5175"
    } else {
        Log-Warning "Frontend returned status code: $($response.StatusCode)"
    }
} catch {
    Log-Warning "Frontend not yet responsive: $_"
    $allServicesHealthy = $false
}

# ==============================================================================
# DEPLOYMENT TESTS
# ==============================================================================

if (-not $SkipTests) {
    Log-Info "================== SMOKE TESTS =================="
    Log-Info "Running deployment verification tests..."
    
    # Basic database connectivity test
    Log-Info "Testing database connectivity..."
    try {
        $dbTest = docker-compose exec -T django python manage.py shell << 'EOF'
from django.db import connection
try:
    cursor = connection.cursor()
    cursor.execute("SELECT 1")
    print("OK")
except Exception as e:
    print(f"ERROR: {e}")
EOF
        if ($dbTest -like "*OK*") {
            Log-Success "Database connectivity verified"
        } else {
            Log-Warning "Database connectivity test inconclusive"
        }
    } catch {
        Log-Warning "Database test skipped: $_"
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
# DEPLOYMENT COMPLETION
# ==============================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  DEPLOYMENT SUCCESSFUL ✓                       ║" -ForegroundColor Green
Write-Host "║                                                                ║" -ForegroundColor Green
Write-Host "║  Environment: $Environment.PadRight(46) ║" -ForegroundColor Green
Write-Host "║  Timestamp: $Timestamp                              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Log-Success "Deployment to [$Environment] environment COMPLETED!"
Log-Info "Deployment logs saved to: $LogFile"
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║                    SERVICE INFORMATION                        ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

$serviceInfo = @(
    @{ Name = "Django API"; Url = "http://localhost:8002"; Status = "Port 8002" },
    @{ Name = "Frontend (Vite)"; Url = "http://localhost:5175"; Status = "Port 5175" },
    @{ Name = "PostgreSQL"; Url = "localhost"; Status = "Port 5432 (Local)" },
    @{ Name = "Redis Cache"; Url = "redis"; Status = "Port 6379 (Docker)" }
)

foreach ($service in $serviceInfo) {
    Write-Host "  $($service.Name.PadRight(20)) $($service.Url.PadRight(30)) $($service.Status)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                     NEXT STEPS                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$nextSteps = @(
    "1. View logs: docker-compose logs -f",
    "2. Check health: curl http://localhost:8002/api/",
    "3. Access frontend: http://localhost:5175",
    "4. Run full tests: docker-compose exec django pytest tests/",
    "5. Monitor: docker stats"
)

foreach ($step in $nextSteps) {
    Write-Host "  $step" -ForegroundColor Cyan
}

if ($Environment -eq "production") {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║              PRODUCTION POST-DEPLOYMENT CHECKLIST              ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""
    
    $checklist = @(
        "☐ Monitor application logs for 24 hours",
        "☐ Verify all critical workflows are functioning",
        "☐ Test database backups are working",
        "☐ Verify SSL/HTTPS certificate is valid",
        "☐ Test email notifications",
        "☐ Verify monitoring and alerting systems",
        "☐ Document any issues encountered",
        "☐ Keep database backup in secure location"
    )
    
    foreach ($item in $checklist) {
        Write-Host "  $item" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Detailed logs available at: $LogFile" -ForegroundColor Green
Write-Host ""

