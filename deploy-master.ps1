# ==============================================================================
# KMSetjen DPD RI - Master Deployment Script (PowerShell)
# ==============================================================================
# Unified deployment script replacing deploy.ps1, deploy-staging.sh, etc.
# Works on: Windows, macOS, Linux (with PowerShell 7+)
#
# Usage: .\deploy-master.ps1 [Environment] [Options]
# ==============================================================================

param(
    [Parameter(Position = 0)]
    [ValidateSet('local', 'staging', 'production')]
    [string]$Environment = 'staging',
    
    [switch]$SkipBackup,
    [switch]$Verbose,
    [switch]$DryRun,
    [switch]$NoHealthCheck
)

$ErrorActionPreference = "Stop"
$VerbosePreference = if ($Verbose) { "Continue" } else { "SilentlyContinue" }

# Colors
$Colors = @{
    Red = "`e[31m"; Green = "`e[32m"; Yellow = "`e[33m"; Blue = "`e[34m"; Cyan = "`e[36m"; NC = "`e[0m"
}

function Log { param([string]$Msg, [string]$Level = "INFO")
    $Color = @{INFO="$($Colors.Blue)"; SUCCESS="$($Colors.Green)"; ERROR="$($Colors.Red)"; WARN="$($Colors.Yellow)"}[$Level]
    Write-Host "$Color[$Level]$($Colors.NC) $Msg"
}

function Header { param([string]$Msg)
    Write-Host "$($Colors.Cyan)$('=' * 70)$($Colors.NC)"
    Write-Host "$($Colors.Cyan)$Msg$($Colors.NC)"
    Write-Host "$($Colors.Cyan)$('=' * 70)$($Colors.NC)`n"
}

try {
    Header "KMSetjen DPD RI - Master Deployment Script"
    
    Log "Environment: $Environment" "INFO"
    Log "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "INFO"
    if ($DryRun) { Log "MODE: DRY RUN (no changes)" "WARN" }
    
    $ProjectRoot = Get-Location
    Log "Project Root: $ProjectRoot" "INFO"
    
    # Step 1: Check prerequisites
    Log "`nStep 1: Checking Prerequisites..." "INFO"
    @("git", "node", "npm", "python") | ForEach-Object {
        try { Invoke-Expression "$_ --version" > $null 2>&1; Log "✓ $_ installed" "SUCCESS" }
        catch { Log "✗ $_ not found" "ERROR"; exit 1 }
    }
    
    # Step 2: Check frontend
    Log "`nStep 2: Building Frontend..." "INFO"
    Push-Location (Join-Path $ProjectRoot "frontend")
    if (-not $DryRun) {
        npm install --legacy-peer-deps --quiet
        npm run build
        Log "✓ Frontend built" "SUCCESS"
    } else {
        Log "[DRY RUN] Would build frontend" "WARN"
    }
    Pop-Location
    
    # Step 3: Check backend
    Log "`nStep 3: Preparing Backend..." "INFO"
    Push-Location (Join-Path $ProjectRoot "backend")
    $venvPath = Join-Path (Get-Location) "venv"
    if (-not (Test-Path $venvPath)) {
        Log "Creating Python virtual environment..." "INFO"
        python -m venv venv
    }
    if (-not $DryRun) {
        & (Join-Path $venvPath "Scripts" "Activate.ps1")
        pip install -r requirements.txt -q
        Log "✓ Backend prepared" "SUCCESS"
    } else {
        Log "[DRY RUN] Would prepare backend" "WARN"
    }
    Pop-Location
    
    # Step 4: Environment-specific actions
    Log "`nStep 4: Environment Configuration..." "INFO"
    switch ($Environment) {
        'local' {
            Log "✓ Local development ready" "SUCCESS"
            Log "`nStart services:`n  Backend:  cd backend && python manage.py runserver`n  Frontend: cd frontend && npm run dev" "INFO"
        }
        'staging' {
            Log "✓ Staging deployment configuration loaded" "SUCCESS"
            Log "Server: 143.198.200.57" "INFO"
            Log "URL: https://khaz.app/kms" "INFO"
            Log "`nFor remote deployment, use remote-deploy.sh on the server" "INFO"
        }
        'production' {
            Log "✓ Production deployment configuration loaded" "SUCCESS"
            Log "⚠️  Production deployment requires server access" "WARN"
            Log "Use remote-deploy.sh on the production server" "INFO"
        }
    }
    
    Log "`n✓ Deployment preparation completed successfully" "SUCCESS"
    
} catch {
    Log "Deployment failed: $_" "ERROR"
    exit 1
}
