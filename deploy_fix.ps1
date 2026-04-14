#!/usr/bin/env pwsh

# Configuration
$ServerIP = "165.245.191.216"
$ServerUser = "root"
$SSHKeyPath = "c:\Users\khair\khaz"
$LocalEnvFile = "$(Split-Path -Parent $MyInvocation.MyCommand.Path)\.env.staging"
$ServerProjectPath = "/var/www/html/kms"

Write-Host "`n=== STAGING DEPLOYMENT - SECURE_PROXY_HEADER FIX ===" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n[1] Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Path $LocalEnvFile)) {
    Write-Host "ERROR: .env.staging not found at: $LocalEnvFile" -ForegroundColor Red
    exit 1
}
Write-Host "OK: .env.staging found" -ForegroundColor Green

if (-not (Test-Path $SSHKeyPath)) {
    Write-Host "ERROR: SSH key not found at: $SSHKeyPath" -ForegroundColor Red
    exit 1
}
Write-Host "OK: SSH key found" -ForegroundColor Green

# Test SSH connection
Write-Host "`n[2] Testing SSH connection..." -ForegroundColor Yellow
$sshTest = & ssh -i "$SSHKeyPath" -o ConnectTimeout=5 "$ServerUser@$ServerIP" "echo OK" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cannot connect to server at $ServerIP" -ForegroundColor Red
    Write-Host "Details: $sshTest" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Server is reachable" -ForegroundColor Green

# Copy .env.staging
Write-Host "`n[3] Copying .env.staging to server..." -ForegroundColor Yellow
$result = & scp -i "$SSHKeyPath" "$LocalEnvFile" "$ServerUser@$ServerIP`:$ServerProjectPath/.env" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to copy .env file" -ForegroundColor Red
    Write-Host "Details: $result" -ForegroundColor Red
    exit 1
}
Write-Host "OK: .env.staging copied to server" -ForegroundColor Green

# Set permissions
Write-Host "`n[4] Setting .env permissions..." -ForegroundColor Yellow
$result = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "chmod 600 $ServerProjectPath/.env" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to set permissions" -ForegroundColor Red
    Write-Host "Details: $result" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Permissions set (600)" -ForegroundColor Green

# Pull latest code
Write-Host "`n[5] Pulling latest code from GitHub..." -ForegroundColor Yellow
$result = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "cd $ServerProjectPath && git pull origin main" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to pull code" -ForegroundColor Red
    Write-Host "Details: $result" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Code updated from GitHub" -ForegroundColor Green

# Make deployment script executable
Write-Host "`n[6] Preparing deployment script..." -ForegroundColor Yellow
$result = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "chmod +x $ServerProjectPath/deploy-master.sh" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to make script executable" -ForegroundColor Red
    Write-Host "Details: $result" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Deployment script is executable" -ForegroundColor Green

# Run deployment
Write-Host "`n[7] Executing deployment on server..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes...`n" -ForegroundColor Cyan

& ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "cd $ServerProjectPath && sudo ./deploy-master.sh staging --health-check"
$deployStatus = $LASTEXITCODE

if ($deployStatus -ne 0) {
    Write-Host "`nERROR: Deployment script exited with code: $deployStatus" -ForegroundColor Red
    exit 1
}

# Verification
Write-Host "`n[8] Verifying deployment..." -ForegroundColor Yellow

# Check containers
Write-Host "Checking containers..." -ForegroundColor Cyan
$result = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "cd $ServerProjectPath && docker-compose ps" 2>&1
Write-Host $result

# Test API
Write-Host "`nTesting API endpoint..." -ForegroundColor Cyan
$apiStatus = & ssh -i "$SSHKeyPath" "$ServerUser@$ServerIP" "curl -s -o /dev/null -w '%{http_code}' https://kms-be.khaz.app/api/" 2>&1
if ($apiStatus -eq "200") {
    Write-Host "SUCCESS: API responding with HTTP 200 - SECURE_PROXY_HEADER FIX WORKING!" -ForegroundColor Green
}
else {
    Write-Host "API returned HTTP $apiStatus" -ForegroundColor Yellow
}

# Success message
Write-Host "`n=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host "`nYour application is deployed at:" -ForegroundColor Cyan
Write-Host "  - Frontend:     https://kms.khaz.app" -ForegroundColor Green
Write-Host "  - Backend API:  https://kms-be.khaz.app" -ForegroundColor Green
Write-Host "  - Admin Panel:  https://kms.khaz.app/admin/" -ForegroundColor Green

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Test: https://kms.khaz.app" -ForegroundColor White
Write-Host "  2. Check browser console for CORS errors (should be NONE)" -ForegroundColor White
Write-Host "  3. If issues, SSH to: ssh -i `"$SSHKeyPath`" $ServerUser@$ServerIP" -ForegroundColor White
Write-Host "     Then: docker-compose logs -f django" -ForegroundColor White
Write-Host "`nDeployment successful!" -ForegroundColor Green
Write-Host ""
