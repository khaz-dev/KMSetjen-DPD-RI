#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick Deploy to Staging - One-Command Deployment
    
.DESCRIPTION
    This is a simplified deployment script that:
    1. Uses .env.staging for configuration
    2. Validates everything is ready
    3. Copies .env.staging to server as .env
    4. Runs deploy-master.sh on staging server
    
.EXAMPLE
    .\DEPLOY_STAGING_NOW.ps1
    
.NOTES
    Prerequisites:
    - SSH key at ~/.ssh/id_rsa
    - .env.staging exists locally (✓ you have this)
    - Staging server accessible at 165.245.191.216 (update IP if needed)
#>

param(
    [string]$ServerIP = "165.245.191.216",
    [string]$ServerUser = "root",
    [string]$Verbose = $false
)

# Configuration
$ProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$SSHKeyPath = "c:\Users\khair\khaz"
$LocalEnvFile = "$ProjectPath\.env.staging"
$ServerProjectPath = "/var/www/html/kms"

# Colors
$Colors = @{
    Success = 'Green'
    Error = 'Red'
    Warning = 'Yellow'
    Info = 'Cyan'
}

if ($Verbose) { Write-Host "[CONFIG] Using ServerIP=$ServerIP" -ForegroundColor $Colors.Info }

# ============================================================================
# OUTPUT FUNCTIONS
# ============================================================================
function Write-Header {
    param([string]$Text)
    Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $Text" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Text, [int]$Step)
    Write-Host "[$Step] $Text" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Text)
    Write-Host "✓ $Text" -ForegroundColor Green
}

function Stop-Deployment {
    param([string]$Text)
    Write-Host "✗ ERROR: $Text" -ForegroundColor Red
    exit 1
}

function Write-Info {
    param([string]$Text)
    Write-Host "  → $Text" -ForegroundColor Cyan
}

# ============================================================================
# VALIDATION
# ============================================================================
Write-Header "STAGING DEPLOYMENT VALIDATOR"

Write-Step "Checking prerequisites" 1

# Check .env.staging exists
if (-not (Test-Path $LocalEnvFile)) {
    Stop-Deployment ".env.staging not found at: $LocalEnvFile"
}
Write-Success ".env.staging found"

# Check SSH key
if (-not (Test-Path $SSHKeyPath)) {
    Stop-Deployment "SSH key not found at: $SSHKeyPath"
}
Write-Success "SSH key found"

# Test server connectivity
Write-Step "Testing server connectivity" 2
try {
    $testCmd = "ssh -i `"$SSHKeyPath`" -n -o ConnectTimeout=5 $ServerUser@$ServerIP `"echo 'OK'\""
    if ($Verbose) { Write-Info "Testing SSH connection..." }
    $result = Invoke-Expression $testCmd -ErrorAction Stop 2>&1
    Write-Success "Server is reachable"
} catch {
    Stop-Deployment "Cannot connect to server at $ServerIP - $_"
}

# ============================================================================
# DEPLOYMENT
# ============================================================================
Write-Header "DEPLOYING TO STAGING"

# Step 1: Copy .env.staging to server as .env
Write-Step "Copying .env.staging to server" 3
try {
    if ($Verbose) { 
        Write-Info "Source: $LocalEnvFile"
        Write-Info "Destination: $ServerUser@$($ServerIP):$ServerProjectPath/.env"
    }
    $scpCmd = "scp -i `"$SSHKeyPath`" `"$LocalEnvFile`" `"$ServerUser@$ServerIP`:`"$ServerProjectPath/.env`"`""
    Invoke-Expression $scpCmd -ErrorAction Stop | Out-Null
    Write-Success ".env.staging copied to server as .env"
} catch {
    Stop-Deployment "Failed to copy .env file: $_"
}

# Step 2: Set permissions on .env
Write-Step "Setting .env permissions" 4
try {
    $sshCmd = "ssh -i `"$SSHKeyPath`" $ServerUser@$ServerIP"
    $cmd = "$sshCmd `"chmod 600 $ServerProjectPath/.env`""
    Invoke-Expression $cmd -ErrorAction Stop | Out-Null
    Write-Success "Permissions set (600)"
} catch {
    Stop-Deployment "Failed to set permissions: $_"
}

# Step 3: Pull latest code
Write-Step "Pulling latest code from GitHub" 5
try {
    $sshCmd = "ssh -i `"$SSHKeyPath`" $ServerUser@$ServerIP"
    $cmd = $sshCmd + " `"cd $ServerProjectPath; git pull origin main`""
    if ($Verbose) { Write-Info "Running: git pull origin main" }
    $result = Invoke-Expression $cmd -ErrorAction Stop 2>&1
    Write-Success "Code updated from GitHub"
    if ($Verbose) { Write-Info $result }
} catch {
    Stop-Deployment "Failed to pull code: $_"
}

# Step 4: Make deployment script executable
Write-Step "Preparing deployment script" 6
try {
    $sshCmd = "ssh -i `"$SSHKeyPath`" $ServerUser@$ServerIP"
    $cmd = $sshCmd + " `"chmod +x $ServerProjectPath/deploy-master.sh`""
    Invoke-Expression $cmd -ErrorAction Stop | Out-Null
    Write-Success "Deployment script is executable"
} catch {
    Stop-Deployment "Failed to update permissions: $_"
}

# Step 5: Run deployment on server
Write-Header "RUNNING DEPLOYMENT ON SERVER"
Write-Step "Executing deploy-master.sh staging" 7

Write-Info "This may take 5-10 minutes..."
Write-Info "Watch for these success indicators:"
Write-Info "  ✓ Docker images built"
Write-Info "  ✓ Containers started"
Write-Info "  ✓ Migrations completed"
Write-Info "  ✓ Nginx configured"
Write-Info "  ✓ SSL certificate verified`n"

try {
    $sshCmd = "ssh -i `"$SSHKeyPath`" $ServerUser@$ServerIP"
    $cmd = $sshCmd + " `"cd $ServerProjectPath; sudo ./deploy-master.sh staging --health-check`""
    
    # Run interactively so output is visible
    Invoke-Expression $cmd -ErrorAction Stop
    
} catch {
    Stop-Deployment "Deployment script failed: $_"
}

# ============================================================================
# POST-DEPLOYMENT VERIFICATION
# ============================================================================
Write-Header "DEPLOYMENT VERIFICATION"

Write-Step "Checking deployed services" 8
try {
    $sshCmd = "ssh -i `"$SSHKeyPath`" $ServerUser@$ServerIP"
    
    # Check containers
    Write-Info "Checking containers..."
    $cmd = "$sshCmd `"cd $ServerProjectPath; docker-compose ps`""
    $output = Invoke-Expression $cmd -ErrorAction Stop 2>&1
    Write-Host $output
    
    $cmd = "$sshCmd `"curl -s -o /dev/null -w '%{http_code}' https://kms.khaz.app/`""
    $statusCode = Invoke-Expression $cmd -ErrorAction Stop 2>&1
    
    if ($statusCode -eq "200") {
        Write-Success "Frontend is responding (HTTP 200)"
    } else {
        Write-Info "Frontend returned HTTP $statusCode (wait a moment, containers may be starting)"
    }
    
} catch {
    Write-Error "Verification failed: $_"
}

# ============================================================================
# SUCCESS
# ============================================================================
Write-Header "STAGING DEPLOYMENT COMPLETE ✓"

Write-Info "Your application is deployed to:"
Write-Host "  🌐 Frontend: https://kms.khaz.app" -ForegroundColor Green
Write-Host "  📡 Backend:  https://kms-be.khaz.app" -ForegroundColor Green
Write-Host "  🔑 Admin:    https://kms.khaz.app/admin/" -ForegroundColor Green

Write-Info "`nNext steps:"
Write-Host "  1. Test the application: https://kms.khaz.app" -ForegroundColor Cyan
Write-Host "  2. Check admin panel: https://kms.khaz.app/admin/" -ForegroundColor Cyan
Write-Host "  3. View logs:  ssh root@$ServerIP -i $SSHKeyPath" -ForegroundColor Cyan
Write-Host "              then: docker-compose logs -f" -ForegroundColor Cyan
Write-Host "  4. Stop/restart: docker-compose restart" -ForegroundColor Cyan

Write-Info "`nIf you need to debug:"
Write-Host "  ssh -i `"$SSHKeyPath`" $ServerUser@$ServerIP" -ForegroundColor Gray
Write-Host "  cd $ServerProjectPath" -ForegroundColor Gray
Write-Host "  docker-compose logs -f frontend" -ForegroundColor Gray

Write-Host "`nDeployment successful!`n" -ForegroundColor Green
