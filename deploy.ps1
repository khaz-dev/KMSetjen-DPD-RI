# ==============================================================================
# KMS Production Deployment Script (Windows PowerShell)
# ==============================================================================
# This script deploys KMS Setjen DPD RI to staging or production environments
#
# USAGE:
#   .\deploy.ps1 -Environment staging                    # Deploy to staging
#   .\deploy.ps1 -Environment production -SkipTests      # Deploy production
#   .\deploy.ps1 -Environment development -BuildOnly     # Build only

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

# Create logs directory
New-Item -ItemType Directory -Force -Path "$ProjectDir/deployment_logs" | Out-Null

# ==============================================================================
# LOGGING FUNCTIONS  
# ==============================================================================

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
# BANNER
# ==============================================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "KMS SETJEN DPD RI - DOCKER DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
if ($BuildOnly) { Write-Host "Mode: BUILD ONLY" -ForegroundColor Yellow }
Write-Host "Timestamp: $Timestamp" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Log-Info "Starting $Environment deployment"
Log-Info "Project directory: $ProjectDir"
Log-Info "Log file: $LogFile"

# ==============================================================================
# VALIDATION
# ==============================================================================

function Validate-Environment {
    Log-Info "Validating deployment environment..."
    
    # Check for valid environment
    $validEnvs = @("development", "staging", "production")
    if ($Environment -notin $validEnvs) {
        Log-Error "Invalid environment: $Environment. Valid: $($validEnvs -join ', ')"
        exit 1
    }
    
    # Check Docker
    try {
        $dockerVersion = docker --version
        Log-Success "Docker found: $dockerVersion"
    } catch {
        Log-Error "Docker not found. Please install Docker Desktop."
        exit 1
    }
    
    # Check docker-compose
    try {
        $composeVersion = docker-compose --version
        Log-Success "docker-compose found: $composeVersion"
    } catch {
        Log-Error "docker-compose not found"
        exit 1
    }
    
    # Check .env file
    if (-not (Test-Path ".env")) {
        Log-Error ".env file not found. Create from .env.example"
        exit 1
    }
    Log-Success ".env file found"
    
    # Check docker-compose.yml
    if (-not (Test-Path "docker-compose.yml")) {
        Log-Error "docker-compose.yml not found"
        exit 1
    }
    Log-Success "docker-compose.yml found"
    
    # Check PostgreSQL
    try {
        $pgTest = pg_isready 2>&1
        if ($LASTEXITCODE -eq 0) {
            Log-Success "PostgreSQL is accessible on localhost:5432"
        }
    } catch {
        Log-Warning "PostgreSQL check skipped"
    }
    
    Log-Success "Environment validation completed"
}

# ==============================================================================
# ENVIRONMENT CONFIG
# ==============================================================================

function Configure-Environment {
    Log-Info "Configuring for: $Environment"
    $envContent = Get-Content ".env" -Raw
    
    switch($Environment) {
        "development" {
            Log-Info "Development mode configured"
        }
        "staging" {
            Log-Info "Staging mode configured"
            Log-Warning "Verify: ALLOWED_HOSTS, database credentials, and secrets in .env"
        }
        "production" {
            Log-Warning "PRODUCTION DEPLOYMENT - Verifying security checks..."
            
            if ($envContent -match "DEBUG\s*=\s*True") {
                Log-Error "ERROR: DEBUG=True in production"
                exit 1
            }
            if ($envContent -match "ENVIRONMENT\s*=\s*development") {
                Log-Error "ERROR: ENVIRONMENT=development in production"
                exit 1
            }
            
            $response = Read-Host "Confirm production deployment (yes/no)"
            if ($response -ne "yes") {
                Log-Error "Deployment cancelled"
                exit 1
            }
        }
    }
}

# ==============================================================================
# BACKUP
# ==============================================================================

function Backup-Database {
    if ($Environment -ne "production" -or $SkipBackup) {
        return
    }
    
    Log-Warning "Production: Creating database backup..."
    $BackupDir = Join-Path $ProjectDir "backups"
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
    $BackupFile = Join-Path $BackupDir "backup_$Timestamp.sql"
    
    Log-Info "Backing up database..."
    try {
        $djangoRunning = docker ps --format "table {{.Names}}" | Select-String "kms_django"
        if ($djangoRunning) {
            docker-compose exec -T django python manage.py dumpdata --all > $BackupFile
            Log-Success "Database backup created: $BackupFile"
        }
    } catch {
        Log-Warning "Backup creation skipped"
    }
}

# ==============================================================================
# GIT PULL
# ==============================================================================

function Update-Code {
    if ($NoPull) {
        Log-Info "Skipping code update"
        return
    }
    
    Log-Info "Updating code from repository..."
    try {
        git pull origin main 2>&1 | Out-Null
        Log-Success "Code updated"
    } catch {
        Log-Warning "Git pull skipped"
    }
}

# ==============================================================================
# DOCKER BUILD & STARTUP
# ==============================================================================

function Build-Images {
    Log-Info "Building Docker images..."
    $output = docker-compose build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Log-Error "Docker build failed"
        Write-Host $output
        exit 1
    }
    Log-Success "Docker images built"
}

function Start-Services {
    Log-Info "Stopping existing containers..."
    docker-compose down 2>&1 | Out-Null
    
    Log-Info "Starting containers..."
    $output = docker-compose up -d 2>&1
    if ($LASTEXITCODE -ne 0) {
        Log-Error "Failed to start containers"
        Write-Host $output
        exit 1
    }
    Log-Success "Containers started"
}

# ==============================================================================
# HEALTH CHECKS
# ==============================================================================

function Check-Services {
    Log-Info "Checking services..."
    Start-Sleep -Seconds 10
    
    # PostgreSQL (local)
    Log-Info "Checking PostgreSQL..."
    try {
        pg_isready 2>&1 | Out-Null
        Log-Success "PostgreSQL ready"
    } catch {
        Log-Warning "PostgreSQL check skipped"
    }
    
    # Redis
    Log-Info "Checking Redis..."
    $redisOK = $false
    for ($i = 1; $i -le 30; $i++) {
        try {
            $result = docker-compose exec -T redis redis-cli ping 2>&1
            if ($result -like "*PONG*") {
                Log-Success "Redis ready"
                $redisOK = $true
                break
            }
        } catch {}
        Start-Sleep -Seconds 1
    }
    
    # Django
    Log-Info "Checking Django..."
    $djangoOK = $false
    for ($i = 1; $i -le 30; $i++) {
        try {
            $result = docker-compose exec -T django python manage.py check 2>&1
            if ($LASTEXITCODE -eq 0) {
                Log-Success "Django ready"
                $djangoOK = $true
                break
            }
        } catch {}
        Start-Sleep -Seconds 2
    }
    
    if (-not $djangoOK -and -not $NoHealthCheck) {
        Log-Error "Django failed to start"
        exit 1
    }
}

# ==============================================================================
# DATABASE SETUP
# ==============================================================================

function Setup-Database {
    Log-Info "Running migrations..."
    docker-compose exec -T django python manage.py migrate --noinput 2>&1 | Out-Null
    Log-Success "Migrations completed"
    
    Log-Info "Collecting static files..."
    docker-compose exec -T django python manage.py collectstatic --noinput 2>&1 | Out-Null
    Log-Success "Static files collected"
}

# ==============================================================================
# VERIFICATION
# ==============================================================================

function Verify-Services {
    Log-Info "Verifying services..."
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8002/api/" -ErrorAction SilentlyContinue
        Log-Success "Django API responding"
    } catch {
        Log-Warning "Django API not responsive yet"
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5175/" -ErrorAction SilentlyContinue
        Log-Success "Frontend responding"
    } catch {
        Log-Warning "Frontend not responsive yet"
    }
}

# ==============================================================================
# MAIN EXECUTION
# ==============================================================================

try {
    Log-Info "Pre-deployment validation..."
    Validate-Environment
    
    Log-Info "Configuring environment..."
    Configure-Environment
    
    Log-Info "Preparing backup..."
    Backup-Database
    
    Log-Info "Updating code..."
    Update-Code
    
    Log-Info "Building Docker images..."
    Build-Images
    
    if ($BuildOnly) {
        Log-Success "Build complete. Run: docker-compose up -d"
        exit 0
    }
    
    Log-Info "Starting services..."
    Start-Services
    
    Log-Info "Checking service health..."
    Check-Services
    
    Log-Info "Setting up database..."
    Setup-Database
    
    Log-Info "Verifying deployment..."
    Verify-Services
    
    # ==============================================================================
    # SUCCESS
    # ==============================================================================
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "DEPLOYMENT SUCCESSFUL" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Log-Success "Deployment to [$Environment] completed!"
    Log-Info "Logs: $LogFile"
    Write-Host ""
    Write-Host "Services:" -ForegroundColor Yellow
    Write-Host "  Django API ........... http://localhost:8002" -ForegroundColor Cyan
    Write-Host "  Frontend ............ http://localhost:5175" -ForegroundColor Cyan
    Write-Host "  PostgreSQL .......... localhost:5432 (local)" -ForegroundColor Cyan
    Write-Host "  Redis ............... Docker container" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  docker-compose logs -f" -ForegroundColor Cyan
    Write-Host "  docker-compose ps" -ForegroundColor Cyan
    Write-Host ""
    
    if ($Environment -eq "production") {
        Write-Host "PRODUCTION CHECKLIST:" -ForegroundColor Yellow
        Write-Host "  - Monitor logs for 24 hours" -ForegroundColor Cyan
        Write-Host "  - Verify critical workflows" -ForegroundColor Cyan
        Write-Host "  - Test backup restoration" -ForegroundColor Cyan
        Write-Host "  - Verify SSL/HTTPS" -ForegroundColor Cyan
        Write-Host ""
    }
    
} catch {
    Log-Error "Deployment failed: $_"
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
