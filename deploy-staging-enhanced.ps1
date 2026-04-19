#!/usr/bin/env pwsh
<#
.SYNOPSIS
    KMSetjen DPD RI - Enhanced Deployment Script for Staging (Windows to Linux)
    
.DESCRIPTION
    Comprehensive deployment script with 3 flexible deployment modes:
    1. CLEAN - Fresh build with no data (for testing/development)
    2. UPDATE-WITH-DATA - Sync local database and media files to remote
    3. UPDATE-ONLY - Update code only, keep existing remote data
    
    Supports local → staging deployment via SSH with automated:
    - Database export/import
    - Media file synchronization
    - Docker image building
    - Health checks and verification
    
.PARAMETER Environment
    Target environment: staging or production (default: staging)
    
.PARAMETER Mode
    Deployment mode (default: update-only):
    - clean: Fresh build, no data migration
    - update-with-data: Sync local DB and media to remote
    - update-only: Code update only, existing data preserved
    
.PARAMETER Verbose
    Enable verbose output and logging
    
.PARAMETER DryRun
    Show what would happen without making changes
    
.EXAMPLE
    # Fresh deployment with clean build
    .\deploy-staging-enhanced.ps1 -Mode clean
    
    # Sync local database and media to staging
    .\deploy-staging-enhanced.ps1 -Mode update-with-data
    
    # Update code only (production-safe)
    .\deploy-staging-enhanced.ps1 -Mode update-only
    
    # Verbose output and dry-run
    .\deploy-staging-enhanced.ps1 -Mode update-with-data -Verbose -DryRun
    
.NOTES
    Requirements:
    - SSH key: c:\Users\khair\khaz or c:\Users\khair\.ssh\id_rsa
    - Environment file: .env.staging in project root
    - PostgreSQL client tools (pg_dump, psql)
    - SSH/SCP access to remote server
    
    For update-with-data mode:
    - Local PostgreSQL database must be accessible
    - Media files in D:\Project\KMSetjen DPD RI\media will be synced
#>

param(
    [ValidateSet('staging', 'production')]
    [string]$Environment = 'staging',
    
    [ValidateSet('clean', 'update-with-data', 'update-only')]
    [string]$Mode = 'update-only',
    
    [switch]$Verbose,
    [switch]$DryRun,
    [switch]$SkipHealthCheck,
    [switch]$SkipSSLVerification
)

# ============================================================================
# ENVIRONMENT CONFIGURATION
# ============================================================================

$EnvironmentConfig = @{
    staging = @{
        Enabled = $true
        ServerIP = "165.245.191.216"
        ServerUser = "root"
        ServerProjectPath = "/var/www/html/kms"
        SSHKeyPath = "c:\Users\khair\khaz"
        EnvFile = ".env.staging"
        Description = "Staging environment (khaz.app)"
        DockerComposePath = "/var/www/html/kms/docker-compose.yml"
    }
    production = @{
        Enabled = $false
        ServerIP = "PRODUCTION_IP_HERE"
        ServerUser = "root"
        ServerProjectPath = "/var/www/html/production"
        SSHKeyPath = "c:\Users\khair\.ssh\production_key"
        EnvFile = ".env.production"
        Description = "Production environment (dpd.go.id)"
        DockerComposePath = "/var/www/html/production/docker-compose.yml"
    }
}

$Config = $EnvironmentConfig[$Environment]

# Validate environment
if (-not $Config.Enabled) {
    Write-Host "✗ ERROR: $Environment environment is not enabled" -ForegroundColor Red
    Write-Host "  Configure $Environment in script and set Enabled = true" -ForegroundColor Yellow
    exit 1
}

# ============================================================================
# CONFIGURATION VARIABLES
# ============================================================================

$ProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$LocalEnvFile = "$ProjectPath\$($Config.EnvFile)"
$LocalMediaPath = "$ProjectPath\media"
$LocalBackendPath = "$ProjectPath\backend"
$BackupPath = "$ProjectPath\backups"
$DeployLogPath = "$ProjectPath\deployment_logs"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$LogFile = "$DeployLogPath\deploy_${Timestamp}.log"

$ServerIP = $Config.ServerIP
$ServerUser = $Config.ServerUser
$ServerProjectPath = $Config.ServerProjectPath
$SSHKeyPath = $Config.SSHKeyPath
$ServerMediaPath = "$ServerProjectPath/media"
$ServerDBDumpPath = "$ServerProjectPath/db_dump_${Timestamp}.sql"

# Database configuration (from .env)
$LocalDBName = "kmsdb"
$LocalDBUser = "postgres"
$LocalDBHost = "localhost"
$LocalDBPort = "5432"
$LocalDBDumpFile = "$BackupPath\db_export_${Timestamp}.sql"

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

Ensure-Directory $BackupPath
Ensure-Directory $DeployLogPath

function Log-Message {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logLine = "[$timestamp] [$Level] $Message"
    
    Write-Host $logLine
    Add-Content -Path $LogFile -Value $logLine
}

function Write-Header {
    param([string]$Text)
    Log-Message "═══════════════════════════════════════════════════════════════"
    Log-Message $Text
    Log-Message "═══════════════════════════════════════════════════════════════"
}

function Write-Step {
    param([string]$Text, [int]$Number)
    Log-Message "[$Number] $Text" "STEP"
}

function Write-Success {
    param([string]$Text)
    Log-Message "✓ $Text" "SUCCESS"
    Write-Host "  ✓ $Text" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Text)
    Log-Message "✗ $Text" "ERROR"
    Write-Host "  ✗ $Text" -ForegroundColor Red
    exit 1
}

function Write-Warning-Custom {
    param([string]$Text)
    Log-Message "⚠ $Text" "WARNING"
    Write-Host "  ⚠ $Text" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Text)
    Log-Message "ℹ $Text" "INFO"
    Write-Host "  ℹ $Text" -ForegroundColor Cyan
}

function Write-DryRun {
    param([string]$Text)
    Log-Message "[DRY RUN] $Text" "DRY-RUN"
    Write-Host "  [DRY RUN] $Text" -ForegroundColor Magenta
}

# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

function Test-Prerequisites {
    Write-Step "Checking prerequisites" 1
    
    $missing = @()
    
    # Check .env file
    if (-not (Test-Path $LocalEnvFile)) {
        $missing += "$($Config.EnvFile) not found"
    } else {
        Write-Success "$($Config.EnvFile) found"
    }
    
    # Check SSH key
    if (-not (Test-Path $SSHKeyPath)) {
        $missing += "SSH key not found at: $SSHKeyPath"
    } else {
        Write-Success "SSH key found"
    }
    
    # Check PostgreSQL tools for data migration
    if ($Mode -eq "update-with-data") {
        try {
            $null = & pg_dump --version 2>$null
            Write-Success "pg_dump available"
        } catch {
            $missing += "pg_dump not found (install PostgreSQL client tools)"
        }
        
        try {
            $null = & psql --version 2>$null
            Write-Success "psql available"
        } catch {
            $missing += "psql not found (install PostgreSQL client tools)"
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Error-Custom ("Missing requirements:`n" + ($missing -join "`n"))
    }
    
    # Test SSH connection
    Write-Info "Testing server connectivity..."
    $sshTest = & ssh -i "$SSHKeyPath" -o ConnectTimeout=5 "$ServerUser@$ServerIP" "echo OK" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Cannot connect to $($ServerIP): $sshTest"
    }
    Write-Success "Server is reachable"
}

# ============================================================================
# DATABASE MIGRATION FUNCTIONS
# ============================================================================

function Export-LocalDatabase {
    Write-Step "Exporting local database" 2
    
    $pgPassword = $env:PGPASSWORD
    $env:PGPASSWORD = "Okkdpdri@2026"
    
    try {
        if ($DryRun) {
            Write-DryRun "Would export: pg_dump -h $LocalDBHost -U $LocalDBUser $LocalDBName > $LocalDBDumpFile"
        } else {
            Write-Info "Exporting database: $LocalDBName..."
            & pg_dump -h $LocalDBHost -U $LocalDBUser -v $LocalDBName | Out-File -FilePath $LocalDBDumpFile -Encoding UTF8 -Force
            
            if ($LASTEXITCODE -ne 0 -or -not (Test-Path $LocalDBDumpFile)) {
                Write-Error-Custom "Database export failed"
            }
            
            $fileSize = (Get-Item $LocalDBDumpFile).Length / 1MB
            Write-Success "Database exported successfully ($('{0:F2}' -f $fileSize) MB)"
        }
    } finally {
        $env:PGPASSWORD = $pgPassword
    }
}

function Transfer-DatabaseDump {
    Write-Step "Transferring database dump to server" 3
    
    if ($DryRun) {
        Write-DryRun "Would SCP: $LocalDBDumpFile to $ServerUser@$($ServerIP):$ServerProjectPath/"
    } else {
        Write-Info "Uploading database dump (~0.63 MB)..."
        
        # Verify file exists locally first
        if (-not (Test-Path $LocalDBDumpFile)) {
            Write-Error-Custom "Local dump file not found: $LocalDBDumpFile"
        }
        
        $dumpFileName = Split-Path -Leaf $LocalDBDumpFile
        $remoteDumpFile = "$ServerProjectPath/$dumpFileName"
        
        Write-Info "Local file: $LocalDBDumpFile"
        Write-Info "Remote destination: $ServerUser@$($ServerIP):$remoteDumpFile"
        
        # Transfer with verbose output
        Write-Info "Executing: scp -i `"$SSHKeyPath`" `"$LocalDBDumpFile`" `"$ServerUser@$($ServerIP):$remoteDumpFile`""
        $result = & scp -i "$SSHKeyPath" "$LocalDBDumpFile" "$ServerUser@$($ServerIP):$remoteDumpFile" 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Failed to upload database dump. Exit code: $LASTEXITCODE. Output: $result"
        }
        
        Write-Info "SCP transfer completed, verifying file on remote..."
        
        # Verify file exists on remote server
        $verifyCmd = "ls -lh '$remoteDumpFile' 2>&1"
        $remoteVerify = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" $verifyCmd 2>&1
        
        if ($LASTEXITCODE -ne 0 -or -not ($remoteVerify -match $dumpFileName)) {
            Write-Error-Custom "File verification failed on remote server. File may not have uploaded. Output: $remoteVerify"
        }
        
        Write-Success "Database dump uploaded and verified on remote server"
    }
}

function Import-RemoteDatabase {
    Write-Step "Importing database on remote server" 4
    
    $dumpFileName = Split-Path -Leaf $LocalDBDumpFile
    $remoteDumpFile = "$ServerProjectPath/$dumpFileName"
    
    if ($DryRun) {
        Write-DryRun "Would import database on remote server using: $remoteDumpFile"
    } else {
        Write-Info "Importing database on remote server..."
        
        # First, verify the file exists on remote server
        Write-Info "Verifying dump file on remote server: $remoteDumpFile"
        $fileCheck = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "test -f '$remoteDumpFile' && echo 'EXISTS' || echo 'MISSING'" 2>&1
        
        if ($fileCheck -ne "EXISTS") {
            Write-Error-Custom "Database dump file not found on remote server: $remoteDumpFile"
        }
        
        Write-Info "Dump file verified. Starting database import..."
        
        # Database import with proper error handling and verification
        # CRITICAL: Use 'sudo -E' to preserve PGPASSWORD environment variable
        $remoteCmd = @"
set -e
cd '$ServerProjectPath'
export PGPASSWORD='Okkdpdri@2026'

echo '[1] Verifying dump file exists'
if [ ! -f '$remoteDumpFile' ]; then
  echo 'ERROR: Dump file not found: $remoteDumpFile'
  ls -la . | head -20
  exit 1
fi
ls -lh '$remoteDumpFile'

echo '[2] Dropping existing database...'
sudo -E -u postgres psql -h localhost -c 'DROP DATABASE IF EXISTS kmsdb;' 2>/dev/null || true

sleep 1

echo '[3] Creating new database...'
sudo -E -u postgres psql -h localhost -c 'CREATE DATABASE kmsdb;' 2>/dev/null
if [ `$? -ne 0 ]; then echo 'ERROR: Failed to create database'; exit 1; fi

echo '[4] Importing data from dump file...'
if ! sudo -E -u postgres psql -h localhost kmsdb < '$remoteDumpFile' 2>/dev/null; then
  echo 'ERROR: Database import failed'
  exit 1
fi

echo '[5] Verifying import success...'
ARTICLE_COUNT=\`sudo -E -u postgres psql -h localhost kmsdb -t -c 'SELECT COUNT(*) FROM content_article;' 2>/dev/null\`
if [ -z "\$ARTICLE_COUNT" ]; then
  echo 'ERROR: Could not verify article count'
  exit 1
fi
echo "Imported articles: \$ARTICLE_COUNT"
if [ "\$ARTICLE_COUNT" -eq 0 ]; then
  echo 'ERROR: No articles found after import'
  exit 1
fi

echo '[6] Verifying categories...'
CATEGORY_COUNT=\`sudo -E -u postgres psql -h localhost kmsdb -t -c 'SELECT COUNT(*) FROM content_category;' 2>/dev/null\`
echo "Imported categories: \$CATEGORY_COUNT"

echo '[7] Cleaning up dump file...'
rm -f '$remoteDumpFile'

echo 'Database import completed successfully'
"@
        
        $result = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" ($remoteCmd -replace "`r`n", "`n") 2>&1
        
        Write-Info "Import output:"
        Write-Info ($result | Out-String)
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Database import failed with exit code $LASTEXITCODE"
        }
        
        # Verify data actually made it
        if ($result -match "Imported articles: 0|ERROR") {
            Write-Error-Custom "Database import verification failed"
        }
        
        Write-Success "Database imported on remote server"
    }
}

# ============================================================================
# MEDIA SYNCHRONIZATION FUNCTIONS
# ============================================================================

function Sync-MediaFiles {
    Write-Step "Synchronizing media files" 3.5
    
    if (-not (Test-Path $LocalMediaPath)) {
        Write-Warning-Custom "Local media directory not found: $LocalMediaPath"
        return
    }
    
    $mediaCount = @(Get-ChildItem -Path $LocalMediaPath -Recurse -File).Count
    
    if ($mediaCount -eq 0) {
        Write-Info "No media files to sync"
        return
    }
    
    if ($DryRun) {
        Write-DryRun "Would sync $mediaCount media files to remote server"
    } else {
        Write-Info "Syncing $mediaCount media files with SCP..."
        
        # Use SCP to sync media files (rsync may not be available on Windows)
        Get-ChildItem -Path $LocalMediaPath -Recurse -File | ForEach-Object {
            $relativePath = $_.FullName.Substring($LocalMediaPath.Length + 1)
            $remoteDir = Split-Path -Parent "$ServerProjectPath/media/$relativePath"
            
            # Create remote directory if needed
            & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "mkdir -p '$remoteDir'" 2>&1 | Out-Null
            
            # Transfer file via SCP
            $result = & scp -i "$SSHKeyPath" "$($_.FullName)" "$ServerUser@$($ServerIP)`:$ServerProjectPath/media/$relativePath" 2>&1
            
            if ($LASTEXITCODE -ne 0) {
                Write-Warning-Custom "Failed to sync: $($_.Name) - $result"
            }
        }
        
        Write-Success "Media files synced ($mediaCount files)"
    }
}

# ============================================================================
# DEPLOYMENT FUNCTIONS
# ============================================================================

function Deploy-Mode-Clean {
    Write-Header "DEPLOYMENT MODE: CLEAN BUILD"
    Write-Info "Fresh build with no data migration"
    
    # Step 1: Copy environment file
    Write-Step "Preparing environment" 1
    Copy-EnvFile
    
    # Step 2: Update code
    Write-Step "Updating code from Git" 2
    Update-Repository
    
    # Step 3: Build images
    Write-Step "Building Docker images (clean)" 3
    Build-DockerImages -CleanBuild
    
    # Step 4: Stop and remove old containers
    Write-Step "Stopping old containers" 4
    Stop-RemoteContainers
    
    # Step 5: Start fresh containers
    Write-Step "Starting fresh containers" 5
    Start-RemoteContainers
    
    # Step 6: Run migrations
    Write-Step "Running database migrations" 6
    Run-RemoteMigrations
}

function Deploy-Mode-UpdateWithData {
    Write-Header "DEPLOYMENT MODE: UPDATE WITH DATA MIGRATION"
    Write-Info "Syncing local database and media files to remote"
    
    # Step 1: Copy environment file
    Write-Step "Preparing environment" 1
    Copy-EnvFile
    
    # Step 2: Export local database
    Export-LocalDatabase
    
    # Step 3: Transfer database dump
    Transfer-DatabaseDump
    
    # Step 4: Update code
    Write-Step "Updating code from Git" 2
    Update-Repository
    
    # Step 5: Stop containers for data migration
    Write-Step "Stopping containers for migration" 3
    Stop-RemoteContainers
    
    # Step 6: Import remote database
    Import-RemoteDatabase
    
    # Step 7: Sync media files
    Sync-MediaFiles
    
    # Step 8: Build images
    Write-Step "Building Docker images" 4
    Build-DockerImages
    
    # Step 9: Start containers
    Write-Step "Starting containers" 5
    Start-RemoteContainers
    
    # Step 10: Run migrations (if any new migrations exist)
    Write-Step "Running database migrations" 6
    Run-RemoteMigrations
}

function Deploy-Mode-UpdateOnly {
    Write-Header "DEPLOYMENT MODE: UPDATE ONLY"
    Write-Info "Code update only, existing data preserved"
    
    # Step 1: Copy environment file
    Write-Step "Preparing environment" 1
    Copy-EnvFile
    
    # Step 2: Update code
    Write-Step "Updating code from Git" 2
    Update-Repository
    
    # Step 3: Build images
    Write-Step "Building Docker images" 3
    Build-DockerImages
    
    # Step 4: Restart containers (docker-compose restart)
    Write-Step "Restarting containers with new images" 4
    Restart-RemoteContainers
    
    # Step 5: Run migrations (if any new migrations exist)
    Write-Step "Running database migrations" 5
    Run-RemoteMigrations
}

function Copy-EnvFile {
    if ($DryRun) {
        Write-DryRun "Would copy: $LocalEnvFile to $ServerUser@$($ServerIP):$ServerProjectPath/.env"
    } else {
        Write-Info "Copying environment file..."
        $result = & scp -i "$SSHKeyPath" "$LocalEnvFile" "$ServerUser@$($ServerIP):$ServerProjectPath/.env" 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Failed to copy .env file: $result"
        }
        
        # Set secure permissions
        $result = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "chmod 600 $ServerProjectPath/.env" 2>&1
        
        Write-Success ".env file copied and secured"
    }
}

function Update-Repository {
    if ($DryRun) {
        Write-DryRun "Would pull: git pull origin main"
    } else {
        Write-Info "Pulling latest code..."
        
        $remoteCmd = @"
            set -e
            cd $ServerProjectPath
            git fetch origin
            git reset --hard origin/main
            git clean -fd
"@
        
        $result = & ssh -i $SSHKeyPath "$ServerUser@$ServerIP" ($remoteCmd -replace "`r`n", "`n") 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Warning-Custom "Git update had issues: $result"
        } else {
            Write-Success "Code updated from Git"
        }
    }
}

function Build-DockerImages {
    param([switch]$CleanBuild)
    
    if ($DryRun) {
        $flag = if ($CleanBuild) { "--no-cache" } else { "" }
        Write-DryRun "Would build: docker-compose build $flag"
    } else {
        Write-Info "Building Docker images..."
        
        $cleanFlag = if ($CleanBuild) { "--no-cache" } else { "" }
        
        $remoteCmd = @"
            set -e
            cd $ServerProjectPath
            docker-compose build $cleanFlag
"@
        
        $result = & ssh -i $SSHKeyPath "$ServerUser@$ServerIP" ($remoteCmd -replace "`r`n", "`n") 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Docker build failed: $result"
        }
        
        Write-Success "Docker images built successfully"
    }
}

function Stop-RemoteContainers {
    if ($DryRun) {
        Write-DryRun "Would stop: docker-compose down"
    } else {
        Write-Info "Stopping containers..."
        
        $remoteCmd = @"
            set -e
            cd $ServerProjectPath
            docker-compose down || true
"@
        
        & ssh -i $SSHKeyPath "$ServerUser@$ServerIP" ($remoteCmd -replace "`r`n", "`n") 2>&1 | Out-Null
        Write-Success "Containers stopped"
    }
}

function Start-RemoteContainers {
    if ($DryRun) {
        Write-DryRun "Would start: docker-compose up -d"
    } else {
        Write-Info "Starting containers..."
        
        $remoteCmd = @"
            set -e
            cd $ServerProjectPath
            docker-compose up -d
            sleep 3
"@
        
        $result = & ssh -i $SSHKeyPath "$ServerUser@$ServerIP" ($remoteCmd -replace "`r`n", "`n") 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Failed to start containers: $result"
        }
        
        Write-Success "Containers started"
    }
}

function Restart-RemoteContainers {
    if ($DryRun) {
        Write-DryRun "Would restart: docker-compose restart"
    } else {
        Write-Info "Restarting containers..."
        
        $remoteCmd = @"
            set -e
            cd $ServerProjectPath
            docker-compose down || true
            docker-compose up -d
            sleep 3
"@
        
        $result = & ssh -i $SSHKeyPath "$ServerUser@$ServerIP" ($remoteCmd -replace "`r`n", "`n") 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Failed to restart containers: $result"
        }
        
        Write-Success "Containers restarted"
    }
}

function Run-RemoteMigrations {
    if ($DryRun) {
        Write-DryRun "Would run: docker-compose exec django python manage.py migrate"
    } else {
        Write-Info "Running migrations..."
        
        $remoteCmd = @"
            set -e
            cd $ServerProjectPath
            docker-compose exec -T django python manage.py migrate --noinput || true
"@
        
        $result = & ssh -i $SSHKeyPath "$ServerUser@$ServerIP" ($remoteCmd -replace "`r`n", "`n") 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Warning-Custom "Migrations had issues: $result"
        } else {
            Write-Success "Migrations completed"
        }
    }
}

# ============================================================================
# VERIFICATION FUNCTIONS
# ============================================================================

function Verify-Deployment {
    if ($DryRun -or $SkipHealthCheck) {
        return
    }
    
    Write-Header "DEPLOYMENT VERIFICATION"
    
    Write-Info "Checking containers status..."
    $result = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "cd $ServerProjectPath && docker-compose ps" 2>&1
    Write-Host $result
    
    Write-Info "Testing API endpoint..."
    $apiTest = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8002/health/" 2>&1
    
    if ($apiTest -eq "200") {
        Write-Success "API responding with HTTP 200"
    } else {
        Write-Warning-Custom "API returned HTTP $apiTest (may still be starting up)"
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Header "KMSetjen DPD RI - Enhanced Deployment"

Write-Info "Environment: $Environment"
Write-Info "Mode: $Mode"
Write-Info "Server: $($ServerIP) ($($Config.Description))"
Write-Info "Project Path: $ServerProjectPath"
Write-Info "Log File: $LogFile"

if ($DryRun) {
    Write-Host "`n[DRY RUN MODE] - No changes will be made`n" -ForegroundColor Yellow
}

if ($Verbose) {
    Write-Host "`n[VERBOSE MODE] - Detailed output enabled`n" -ForegroundColor Yellow
}

# Test prerequisites
Test-Prerequisites

# Execute deployment mode
switch ($Mode) {
    "clean" {
        Deploy-Mode-Clean
    }
    "update-with-data" {
        Deploy-Mode-UpdateWithData
    }
    "update-only" {
        Deploy-Mode-UpdateOnly
    }
}

# Verify deployment
Verify-Deployment

# Success message
Write-Header "DEPLOYMENT COMPLETED"

if ($DryRun) {
    Write-Host "DRY RUN MODE - No actual changes were made" -ForegroundColor Yellow
    Write-Host "To execute: .\deploy-staging-enhanced.ps1 -Mode $Mode (without -DryRun)" -ForegroundColor Cyan
} else {
    Write-Success "Application deployed to: $($Config.Description)"
    Write-Info "Frontend: https://kms.$($Config.ServerIP.Split('.')[-1]).app/"
    Write-Info "Backend: https://kms-be.khaz.app/"
    Write-Info "`nNext steps:"
    Write-Info "1. Verify: Visit https://kms.khaz.app/"
    Write-Info "2. Monitor: ssh -i '$SSHKeyPath' $ServerUser@$ServerIP"
    Write-Info "3. Logs: cd $ServerProjectPath && docker-compose logs -f"
}

Write-Host ""
Log-Message "Deployment completed successfully"
