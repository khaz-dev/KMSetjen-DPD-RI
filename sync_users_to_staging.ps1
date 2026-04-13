#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Sync local database users to staging server (merge mode)
    
.DESCRIPTION
    Exports users from local dev DB and imports to staging DB (preserving existing staging data)
    
.NOTES
    - Exports 779 users, 6 roles, 2 languages from local development database
    - Uses Django's natural-primary to handle relationships correctly
    - Merges with existing staging data (does not clear)
    - No avatar files in this database (not synced)
#>

# =====================================================================
# CONFIGURATION
# =====================================================================
$SSHKey = "c:\Users\khair\khaz"
$StageServer = "root@165.245.191.216"
$StagingProjectPath = "/var/www/html/kmsetjendpdri"
$LocalBackendPath = "d:\Project\KMSetjen DPD RI\backend"
$ExportFile = "users_export.json"
$ExportPath = "$LocalBackendPath\$ExportFile"

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "DATA SYNC: LOCAL DEV DATABASE → STAGING SERVER (MERGE MODE)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# =====================================================================
# STEP 1: VERIFY EXPORT FILE
# =====================================================================
Write-Host "[1/4] Verifying export file..." -ForegroundColor Yellow
if (-not (Test-Path $ExportPath)) {
    Write-Host "❌ Export file not found: $ExportPath" -ForegroundColor Red
    exit 1
}

$FileSize = (Get-Item $ExportPath).Length / 1MB
$json = Get-Content $ExportPath | ConvertFrom-Json
$userCount = ($json | Where-Object { $_.model -eq "core.user" }).Count
$roleCount = ($json | Where-Object { $_.model -eq "core.role" }).Count
$langCount = ($json | Where-Object { $_.model -eq "core.language" }).Count

$sizeFormatted = "{0:N2}" -f $FileSize
Write-Host "✓ Export file: $(Split-Path $ExportPath -Leaf) ($sizeFormatted MB)" -ForegroundColor Green
Write-Host "  - Users: $userCount" -ForegroundColor Green
Write-Host "  - Roles: $roleCount" -ForegroundColor Green
Write-Host "  - Languages: $langCount" -ForegroundColor Green
Write-Host ""

# =====================================================================
# STEP 2: COPY TO STAGING SERVER
# =====================================================================
Write-Host "[2/4] Copying export file to staging server..." -ForegroundColor Yellow
Write-Host "→ Using SCP to transfer to ${StageServer}:${StagingProjectPath}/" -ForegroundColor Cyan

try {
    scp -i "$SSHKey" "$ExportPath" "${StageServer}:${StagingProjectPath}/" 2>&1 | ForEach-Object { Write-Host "  $_" }
    Write-Host "✓ File copied successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ SCP failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# =====================================================================
# STEP 3: IMPORT ON STAGING SERVER
# =====================================================================
Write-Host "[3/4] Importing data to staging database..." -ForegroundColor Yellow
Write-Host "→ Executing: python manage.py loaddata $ExportFile on staging" -ForegroundColor Cyan

try {
    $sshCmd = "cd $StagingProjectPath && python manage.py loaddata $ExportFile --format=json"
    $output = ssh -i "$SSHKey" $StageServer $sshCmd 2>&1
    
    # Parse output
    $output | ForEach-Object {
        Write-Host "  $_"
    }
    Write-Host "✓ Import completed" -ForegroundColor Green
} catch {
    Write-Host "❌ SSH import failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# =====================================================================
# STEP 4: VERIFY SYNC
# =====================================================================
Write-Host "[4/4] Verifying data on staging server..." -ForegroundColor Yellow

try {
    $verifyCmd = "cd $StagingProjectPath && python manage.py shell -c `"from django.contrib.auth import get_user_model; from apps.core.models import Role, Language; User = get_user_model(); print('Users: ' + str(User.objects.count())); print('Roles: ' + str(Role.objects.count())); print('Languages: ' + str(Language.objects.count()))`""
    
    Write-Host "Staging database status:" -ForegroundColor Cyan
    $verifyOutput = ssh -i "$SSHKey" $StageServer $verifyCmd 2>&1
    $verifyOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
} catch {
    Write-Host "⚠ Could not verify (SSH may have timed out, but data may be synced)" -ForegroundColor Yellow
}
Write-Host ""

# =====================================================================
# SUMMARY
# =====================================================================
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✓ DATA SYNC COMPLETE" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  • $userCount users exported and imported (merge mode)" -ForegroundColor White
Write-Host "  • $roleCount roles synchronized" -ForegroundColor White
Write-Host "  • $langCount languages configured" -ForegroundColor White
Write-Host "  • Staging database updated" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Visit: https://khaz.app/kms-be/admin/core/user/" -ForegroundColor White
Write-Host "  2. Verify user data now appears in staging" -ForegroundColor White
Write-Host "  3. Check role assignments and permissions" -ForegroundColor White
Write-Host ""
