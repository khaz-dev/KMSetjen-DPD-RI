#!/usr/bin/env pwsh
<#
.SYNOPSIS
    KMSetjen DPD RI Deployment Helper - Windows PowerShell Edition
    
.DESCRIPTION
    Automates the deployment process to Ubuntu 24.04 server at 143.198.200.57
    Handles .env file copying, SSH connection, and deployment verification
    
.PARAMETER ServerIP
    IP address of the deployment server (default: 143.198.200.57)
    
.PARAMETER ServerUser
    SSH user (default: root)
    
.PARAMETER SSHKeyPath
    Path to SSH private key (default: ~/.ssh/id_rsa)
    
.EXAMPLE
    .\deploy-helper.ps1
    .\deploy-helper.ps1 -ServerIP 143.198.200.57 -SSHKeyPath C:\Users\khair\.ssh\id_rsa
#>

param(
    [string]$ServerIP = "143.198.200.57",
    [string]$ServerUser = "root",
    [string]$SSHKeyPath = "$env:USERPROFILE\.ssh\id_rsa"
)

# ============================================================================
# CONFIGURATION
# ============================================================================
$ProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectName = "kms"
$ServerProjectPath = "/var/www/html/kms"
$EnvFile = ".env"

# Color output functions
function Write-Header {
    param([string]$Message)
    Write-Host "" 
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $Message" -ForegroundColor Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message, [int]$Number)
    Write-Host "[$Number] $Message" -ForegroundColor Yellow -BackgroundColor Black
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "→ $Message" -ForegroundColor Cyan
}

# ============================================================================
# STEP 1: VERIFY PREREQUISITES
# ============================================================================
Write-Header "STEP 1: VERIFYING PREREQUISITES"

# Check if .env file exists locally
Write-Step "Checking if .env file exists" 1
if (Test-Path ("$ProjectPath\$EnvFile")) {
    Write-Success ".env file found at: $ProjectPath\$EnvFile"
} else {
    Write-Error ".env file NOT found!"
    Write-Info "Create .env file before proceeding"
    exit 1
}

# Check SSH key
Write-Step "Checking SSH key" 2
if (Test-Path $SSHKeyPath) {
    Write-Success "SSH key found at: $SSHKeyPath"
} else {
    Write-Error "SSH key NOT found at: $SSHKeyPath"
    Write-Info "Trying alternative paths..."
    $altPaths = @(
        "$env:USERPROFILE\.ssh\id_rsa",
        "$env:USERPROFILE\.ssh\id_ed25519",
        "$ProjectPath\khaz",
        "$ProjectPath\khaz.pem"
    )
    $found = $false
    foreach ($path in $altPaths) {
        if (Test-Path $path) {
            Write-Success "Found SSH key: $path"
            $SSHKeyPath = $path
            $found = $true
            break
        }
    }
    if (-not $found) {
        Write-Error "No SSH key found. Please specify -SSHKeyPath parameter"
        exit 1
    }
}

# Check SSH command availability
Write-Step "Checking SSH availability" 3
try {
    $sshTest = ssh -V 2>&1
    Write-Success "SSH available: $sshTest"
} catch {
    Write-Error "SSH command not found. Please install OpenSSH for Windows"
    exit 1
}

# Test server connectivity
Write-Step "Testing server connectivity" 4
Write-Info "Connecting to $ServerUser@$ServerIP..."
try {
    $testCmd = "ssh -i `"$SSHKeyPath`" -n -o ConnectTimeout=5 $ServerUser@$ServerIP `"echo 'Connection successful'\""
    $result = Invoke-Expression $testCmd -ErrorAction Stop 2>&1
    if ($result -match "Connection successful") {
        Write-Success "Server is reachable"
    } else {
        Write-Error "Connection test failed: $result"
        exit 1
    }
} catch {
    Write-Error "Cannot connect to server: $_"
    Write-Info "Hint: Make sure SSH key is registered on the server"
    exit 1
}

# ============================================================================
# STEP 2: COPY .ENV FILE TO SERVER
# ============================================================================
Write-Header "STEP 2: TRANSFERRING .ENV FILE TO SERVER"

Write-Step "Copying .env file via SCP" 5
try {
    Write-Info "Source: $ProjectPath\$EnvFile"
    Write-Info "Destination: $ServerUser@$ServerIP:$ServerProjectPath\$EnvFile"
    
    $scpCmd = "scp -i `"$SSHKeyPath`" `"$ProjectPath\$EnvFile`" `"$ServerUser@$ServerIP`:`"$ServerProjectPath/$EnvFile`"`""
    
    $result = Invoke-Expression $scpCmd -ErrorAction Stop 2>&1
    Write-Success ".env file copied successfully"
} catch {
    Write-Error "Failed to copy .env file: $_"
    Write-Info "You may need to copy the file manually:"
    Write-Info "  scp -i ""$SSHKeyPath"" ""$ProjectPath\$EnvFile"" ""$ServerUser@$ServerIP`:$ServerProjectPath/$EnvFile"""
    exit 1
}

# ============================================================================
# STEP 3: SET PERMISSIONS AND PULL CODE
# ============================================================================
Write-Header "STEP 3: PREPARING SERVER FOR DEPLOYMENT"

$sshCmd = "ssh -i `"$SSHKeyPath`" $ServerUser@$ServerIP"

Write-Step "Setting .env file permissions (600)" 6
try {
    $cmd = "$sshCmd `"chmod 600 $ServerProjectPath/.env`""
    Invoke-Expression $cmd -ErrorAction Stop | Out-Null
    Write-Success "Permissions set correctly"
} catch {
    Write-Error "Failed to set permissions: $_"
}

Write-Step "Pulling latest code from Git" 7
try {
    $cmd = "$sshCmd `"cd $ServerProjectPath && git pull origin main`""
    $result = Invoke-Expression $cmd -ErrorAction Stop 2>&1
    Write-Success "Code pulled successfully"
    Write-Info $result
} catch {
    Write-Error "Failed to pull code: $_"
    exit 1
}

Write-Step "Verifying deployment script executable" 8
try {
    $cmd = "$sshCmd `"chmod +x $ServerProjectPath/deploy-final.sh`""
    Invoke-Expression $cmd -ErrorAction Stop | Out-Null
    Write-Success "Deployment script is executable"
} catch {
    Write-Error "Failed to make script executable: $_"
}

# ============================================================================
# STEP 4: OFFER TO RUN DEPLOYMENT
# ============================================================================
Write-Header "DEPLOYMENT FILES READY"

Write-Success "All files are ready for deployment!"
Write-Info "Next step: Run the deployment script on the server"
Write-Info ""
Write-Info "You can choose how to proceed:"
Write-Info "  1. Option A: Run deployment manually (SSH and run script yourself)"
Write-Info "  2. Option B: Execute deployment from here (not recommended for production)"
Write-Info ""

$proceed = Read-Host "Run deployment script now? (yes/no)"

if ($proceed -eq "yes" -or $proceed -eq "y") {
    # ========================================================================
    # STEP 5: RUN DEPLOYMENT
    # ========================================================================
    Write-Header "STEP 5: RUNNING DEPLOYMENT SCRIPT"
    
    Write-Step "Starting deployment on remote server" 9
    Write-Info "This will take 5-10 minutes, please wait..."
    Write-Info ""
    
    try {
        # Run deployment and capture output
        $deployCmd = "$sshCmd `"cd $ServerProjectPath && sudo ./deploy-final.sh`""
        
        Write-Host $deployCmd -ForegroundColor DarkGray
        
        # Run interactively so user sees output
        Invoke-Expression $deployCmd
        
        Write-Success "Deployment script completed"
    } catch {
        Write-Error "Deployment encountered an error: $_"
        Write-Info "Check the server logs for details"
    }
} else {
    Write-Info "To run deployment manually, execute:"
    Write-Host "" 
    Write-Host "ssh -i `"$SSHKeyPath`" $ServerUser@$ServerIP" -ForegroundColor Gray
    Write-Host "cd $ServerProjectPath" -ForegroundColor Gray
    Write-Host "sudo ./deploy-final.sh" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# STEP 6: VERIFICATION
# ============================================================================
Write-Header "DEPLOYMENT VERIFICATION"

Write-Step "Checking service status" 10
try {
    $cmd = "$sshCmd `"systemctl status postgresql redis-server kmsetjendpdri-gunicorn nginx --no-pager`""
    $result = Invoke-Expression $cmd -ErrorAction Stop 2>&1
    Write-Host $result
} catch {
    Write-Info "Could not get service status (may not be ready yet)"
}

Write-Host ""
Write-Info "Next steps:"
Write-Info "  1. Visit: https://khaz.app/kmsetjendpdri/ in your browser"
Write-Info "  2. Create admin user: python manage.py createsuperuser"
Write-Info "  3. Test admin panel: https://khaz.app/kmsetjendpdri/admin/"
Write-Info "  4. Check logs: sudo journalctl -u kmsetjendpdri-gunicorn -f"
Write-Info ""
Write-Info "For detailed instructions, see: DEPLOYMENT_INSTRUCTIONS_FINAL.md"

Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✓ DEPLOYMENT HELPER COMPLETED" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
