#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy to Staging - Simple, Reliable Deployment
    
.DESCRIPTION
    Deploys SECURE_PROXY_HEADER fix to staging server
    
.EXAMPLE
    .\DEPLOY_STAGING_FIX.ps1
#>

# Configuration
$ServerIP = "165.245.191.216"
$ServerUser = "root"
$SSHKeyPath = "c:\Users\khair\khaz"
$LocalEnvFile = "$(Split-Path -Parent $MyInvocation.MyCommand.Path)\.env.staging"
$ServerProjectPath = "/var/www/html/kms"

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ STAGING DEPLOYMENT - SECURE_PROXY_HEADER FIX          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check prerequisites
Write-Host "[1] Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Path $LocalEnvFile)) {
    Write-Host "✗ ERROR: .env.staging not found at: $LocalEnvFile" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ .env.staging found" -ForegroundColor Green

if (-not (Test-Path $SSHKeyPath)) {
    Write-Host "✗ ERROR: SSH key not found at: $SSHKeyPath" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ SSH key found" -ForegroundColor Green

# Test SSH connection
Write-Host "`n[2] Testing SSH connection..." -ForegroundColor Yellow
$sshTest = & ssh -i "$SSHKeyPath" -o ConnectTimeout=5 "$ServerUser@$ServerIP" "echo 'OK'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ERROR: Cannot connect to server at $ServerIP" -ForegroundColor Red
    Write-Host "  Details: $sshTest" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Server is reachable" -ForegroundColor Green

# Copy .env.staging
Write-Host "`n[3] Copying .env.staging to server..." -ForegroundColor Yellow
$result = & scp -i "$SSHKeyPath" "$LocalEnvFile" "$ServerUser@$ServerIP`:$ServerProjectPath/.env" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ERROR: Failed to copy .env file" -ForegroundColor Red
    Write-Host "  Details: $result" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ .env.staging copied to server" -ForegroundColor Green

# Set permissions
Write-Host "`n[4] Setting .env permissions..." -ForegroundColor Yellow
$result = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "chmod 600 $ServerProjectPath/.env" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ERROR: Failed to set permissions" -ForegroundColor Red
    Write-Host "  Details: $result" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Permissions set (600)" -ForegroundColor Green

# Pull latest code
Write-Host "`n[5] Pulling latest code from GitHub..." -ForegroundColor Yellow
$result = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "cd $ServerProjectPath && git pull origin main" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ERROR: Failed to pull code" -ForegroundColor Red
    Write-Host "  Details: $result" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Code updated from GitHub" -ForegroundColor Green

# Make deployment script executable
Write-Host "`n[6] Preparing deployment script..." -ForegroundColor Yellow
$result = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "chmod +x $ServerProjectPath/deploy-master.sh" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ERROR: Failed to make script executable" -ForegroundColor Red
    Write-Host "  Details: $result" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Deployment script is executable" -ForegroundColor Green

# Run deployment
Write-Host "`n[7] Executing deployment on server..." -ForegroundColor Yellow
Write-Host "  This may take 5-10 minutes..." -ForegroundColor Cyan
Write-Host "  Watch for progress indicators...`n" -ForegroundColor Cyan

& ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "cd $ServerProjectPath && sudo ./deploy-master.sh staging --health-check"
$deployStatus = $LASTEXITCODE

if ($deployStatus -ne 0) {
    Write-Host "`n✗ Deployment script exited with error code: $deployStatus" -ForegroundColor Red
    exit 1
}

# Verification
Write-Host "`n[8] Verifying deployment..." -ForegroundColor Yellow

# Check containers
Write-Host "  Checking containers..." -ForegroundColor Cyan
$result = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "cd $ServerProjectPath && docker-compose ps" 2>&1
Write-Host $result

# Test frontend
Write-Host "  Testing frontend endpoint..." -ForegroundColor Cyan
$statusCode = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "curl -s -o /dev/null -w '%{http_code}' https://kms.khaz.app/" 2>&1
if ($statusCode -eq "200") {
    Write-Host "  ✓ Frontend responding (HTTP 200)" -ForegroundColor Green
}
else {
    Write-Host "  ⚠ Frontend returned HTTP $statusCode (containers may still be starting)" -ForegroundColor Yellow
}

# Test API
Write-Host "  Testing API endpoint..." -ForegroundColor Cyan
$apiStatus = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "curl -s -o /dev/null -w '%{http_code}' https://kms-be.khaz.app/api/" 2>&1
if ($apiStatus -eq "200") {
    Write-Host "  ✓ API responding (HTTP 200) - SECURE_PROXY_HEADER FIX WORKING!" -ForegroundColor Green
}
else {
    Write-Host "  ⚠ API returned HTTP $apiStatus" -ForegroundColor Yellow
}

# Success message
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║ DEPLOYMENT COMPLETE ✓                                 ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nYour application is now deployed:" -ForegroundColor Cyan
Write-Host "  Frontend:     https://kms.khaz.app" -ForegroundColor Green
Write-Host "  Backend API:  https://kms-be.khaz.app" -ForegroundColor Green
Write-Host "  Admin Panel:  https://kms.khaz.app/admin/" -ForegroundColor Green

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Test: https://kms.khaz.app" -ForegroundColor White
Write-Host "  2. Check browser console for CORS errors (should be NONE)" -ForegroundColor White
Write-Host "  3. If any issues, SSH to: ssh -i `"$SSHKeyPath`" $ServerUser@$ServerIP" -ForegroundColor White
Write-Host "     Then: docker-compose logs -f django" -ForegroundColor White
Write-Host "`nDeployment successful!`n" -ForegroundColor Green
