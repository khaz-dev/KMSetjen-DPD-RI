#!/usr/bin/env pwsh
<#
.SYNOPSIS
    KMSetjen DPD RI - Unified Deployment Script for Windows
    
.DESCRIPTION
    This script consolidates multiple deployment scripts into one unified interface.
    Handles deployment to staging and production environments.
    
    CONSOLIDATES:
    - deploy-helper.ps1 (old staging trigger)
    - deploy_fix.ps1 (old hotfix script)
    - DEPLOY_STAGING_NOW.ps1 (old quick deploy)
    - DEPLOY_STAGING_FIX.ps1 (old fix deploy)
    
.PARAMETER Environment
    Target environment: staging or production
    
.PARAMETER Verbose
    Enable verbose output
    
.PARAMETER DryRun
    Show what would happen without making changes
    
.EXAMPLE
    .\deploy-staging.ps1
    .\deploy-staging.ps1 -Verbose
    .\deploy-staging.ps1 -DryRun
    
.NOTES
    Requires:
    - SSH key configured (c:\Users\khair\khaz or c:\Users\khair\.ssh\id_rsa)
    - .env.staging file in project root
    - SSH access to remote server
#>

param(
    [ValidateSet('staging', 'production')]
    [string]$Environment = 'staging',
    
    [switch]$Verbose,
    [switch]$DryRun,
    [switch]$SkipHealthCheck
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
    }
    production = @{
        Enabled = $false
        ServerIP = "PRODUCTION_IP_HERE"
        ServerUser = "root"
        ServerProjectPath = "/var/www/html/production"
        SSHKeyPath = "c:\Users\khair\.ssh\production_key"
        EnvFile = ".env.production"
        Description = "Production environment (production.com)"
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
$ServerIP = $Config.ServerIP
$ServerUser = $Config.ServerUser
$ServerProjectPath = $Config.ServerProjectPath
$SSHKeyPath = $Config.SSHKeyPath

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

function Write-Header {
    param([string]$Text)
    Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $Text" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Text, [int]$Number)
    Write-Host "[$Number] $Text" -ForegroundColor Yellow
}

function Write-Ok {
    param([string]$Text)
    Write-Host "  ✓ $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "  ✗ ERROR: $Text" -ForegroundColor Red
    exit 1
}

function Write-Info {
    param([string]$Text)
    Write-Host "  → $Text" -ForegroundColor Cyan
}

# ============================================================================
# VALIDATION
# ============================================================================

Write-Header "DEPLOYMENT VALIDATOR - $($Config.Description)"

Write-Step "Checking prerequisites" 1

# Check .env file
if (-not (Test-Path $LocalEnvFile)) {
    Write-Error "$($Config.EnvFile) not found at: $LocalEnvFile"
}
Write-Ok "$($Config.EnvFile) found"

# Check SSH key
if (-not (Test-Path $SSHKeyPath)) {
    Write-Error "SSH key not found at: $SSHKeyPath"
}
Write-Ok "SSH key found"

# Test SSH connection
Write-Step "Testing server connectivity" 2
$sshTest = & ssh -i "$SSHKeyPath" -o ConnectTimeout=5 "$ServerUser@$ServerIP" "echo OK" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Cannot connect to $ServerIP: $sshTest"
}
Write-Ok "Server is reachable"

# ============================================================================
# PRE-DEPLOYMENT DISPLAY
# ============================================================================

Write-Header "DEPLOYMENT CONFIGURATION"

Write-Host "Environment:    $Environment" -ForegroundColor Cyan
Write-Host "Server:         $ServerIP ($ServerUser)" -ForegroundColor Cyan
Write-Host "Project Path:   $ServerProjectPath" -ForegroundColor Cyan
Write-Host "Local .env:     $LocalEnvFile" -ForegroundColor Cyan
Write-Host "SSH Key:        $SSHKeyPath" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "`n[DRY RUN MODE] - No changes will be made" -ForegroundColor Yellow
}

if ($Verbose) {
    Write-Host "`n[VERBOSE MODE] - Detailed output enabled" -ForegroundColor Yellow
}

# ============================================================================
# DEPLOYMENT STEPS
# ============================================================================

Write-Header "DEPLOYMENT EXECUTION"

# Step 1: Copy .env
Write-Step "Copying $($Config.EnvFile) to server" 1

if ($DryRun) {
    Write-Info "[DRY RUN] Would copy: $LocalEnvFile to $ServerUser@$ServerIP:$ServerProjectPath/.env"
}
else {
    $result = & scp -i "$SSHKeyPath" "$LocalEnvFile" "$ServerUser@$ServerIP`:$ServerProjectPath/.env" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to copy .env file: $result"
    }
}
Write-Ok ".env file copied (or would be in dry-run)"

# Step 2: Set permissions
Write-Step "Setting permissions" 2

if ($DryRun) {
    Write-Info "[DRY RUN] Would chmod 600 on .env"
}
else {
    $result = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "chmod 600 $ServerProjectPath/.env" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to set permissions: $result"
    }
}
Write-Ok "Permissions set (or would be in dry-run)"

# Step 3: Git pull
Write-Step "Pulling latest code" 3

if ($DryRun) {
    Write-Info "[DRY RUN] Would pull: git pull origin main"
}
else {
    $result = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "cd $ServerProjectPath && git pull origin main" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to pull code: $result"
    }
}
Write-Ok "Code pulled (or would be in dry-run)"

# Step 4: Make script executable
Write-Step "Preparing deploy script" 4

if ($DryRun) {
    Write-Info "[DRY RUN] Would chmod +x deploy-master.sh"
}
else {
    $result = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "chmod +x $ServerProjectPath/deploy-master.sh" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to make deploy script executable: $result"
    }
}
Write-Ok "Deploy script executable (or would be in dry-run)"

# Step 5: Run deployment
if (-not $DryRun) {
    Write-Header "RUNNING DEPLOYMENT ON SERVER"
    Write-Host "This may take 5-10 minutes..." -ForegroundColor Yellow
    Write-Host "Waiting for deployment to complete...`n" -ForegroundColor Yellow
    
    $healthCheckArg = if ($SkipHealthCheck) { "" } else { "--health-check" }
    & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "cd $ServerProjectPath && sudo ./deploy-master.sh $Environment $healthCheckArg"
    
    $deployStatus = $LASTEXITCODE
    if ($deployStatus -ne 0) {
        Write-Error "Deployment failed with exit code: $deployStatus"
    }
}
else {
    Write-Info "[DRY RUN] Would execute: sudo ./deploy-master.sh $Environment"
}

# ============================================================================
# POST-DEPLOYMENT VERIFICATION
# ============================================================================

if (-not $DryRun) {
    Write-Header "DEPLOYMENT VERIFICATION"
    
    Write-Step "Checking containers" 1
    $result = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "cd $ServerProjectPath && docker-compose ps" 2>&1
    Write-Host $result
    
    Write-Step "Testing API endpoint" 2
    $apiStatus = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "curl -s -o /dev/null -w '%{http_code}' https://$ServerIP/api/" 2>&1
    
    if ($apiStatus -eq "200") {
        Write-Ok "API responding with HTTP 200"
    }
    else {
        Write-Info "API returned HTTP $apiStatus (may still be starting up)"
    }
}

# ============================================================================
# SUCCESS MESSAGE
# ============================================================================

Write-Header "DEPLOYMENT COMPLETE"

if ($DryRun) {
    Write-Host "DRY RUN MODE - No actual changes were made" -ForegroundColor Yellow
    Write-Host "To execute: .\deploy-staging.ps1 (without -DryRun)" -ForegroundColor Cyan
}
else {
    Write-Host "Your application has been deployed to:" -ForegroundColor Green
    Write-Host "  URL: $($Config.Description)" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. Test: https://$($ServerIP)/" -ForegroundColor White
    Write-Host "  2. Check logs: ssh -i `"$SSHKeyPath`" $ServerUser@$ServerIP" -ForegroundColor White
    Write-Host "     Then: cd $ServerProjectPath && docker-compose logs -f" -ForegroundColor White
}

Write-Host ""
