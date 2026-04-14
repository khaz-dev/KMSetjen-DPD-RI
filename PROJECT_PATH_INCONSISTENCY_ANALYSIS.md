# PROJECT DIRECTORY PATH INCONSISTENCY - ROOT CAUSE ANALYSIS

## The Problem

**Actual Server Setup:** `/var/www/html/kms`
**Deployment Scripts Expecting:** `/var/www/html/kmsetjendpdri`
**Result:** Deployment scripts fail because they're looking in the wrong directory

## Timeline of Changes

### BEFORE (Original Setup)
- Project deployed at: `/var/www/html/kms`
- Docker containers: `kms_django`, `kms_frontend`, `kms_redis`
- Frontend accessed at: `https://khaz.app/kms/`
- Backend accessed at: `https://kms-be.khaz.app/` (subdomain routing)

### DURING (Documentation Inconsistency Created)
Some documentation & old scripts described deployment as:
- `/var/www/html/kmsetjendpdri`
- Container names: `kmsetjendpdri_django`, `kmsetjendpdri_frontend`

### CURRENT (ACTUAL Reality)
The server actually has `/var/www/html/kms` with:
- `.env` file exists
- `docker-compose.yml` exists (with `kms_django` service)
- `.git` directory with full repo
- All project files in place

## Where the Mismatch Occurs

### 1. **Deployment Scripts** 
   - ❌ `deploy_fix.ps1` (line 8): `$ServerProjectPath = "/var/www/html/kmsetjendpdri"`
   - ❌ `deploy-helper.ps1` (line 35): `$ServerProjectPath = "/var/www/html/kmsetjendpdri"`
   - ✅ `deploy-master.sh`: Correct - uses auto-detection `DEPLOY_PATH="$(pwd)"`

### 2. **Documentation Files**
   - References to both paths scattered across 50+ markdown files
   - Some docs show `/var/www/html/kmsetjendpdri`
   - Some docs show `/var/www/html/kms`
   - This created confusion during setup

### 3. **Docker Compose**
   - ✅ `docker-compose.yml`: Uses `kms_django`, `kms_redis` (CORRECT)
   - Service names are consistent with server reality

### 4. **Environment Files**
   - `.env` exists at `/var/www/html/kms/.env` (CORRECT)
   - `.env.example` shows `VITE_APP_SUBPATH=/kms` (CORRECT)
   - `.env.staging` in local project (needs to be copied)

## Why This Happened

1. **Project Inception:** Created as `/var/www/html/kms` for subdomain routing
2. **Documentation Evolution:** Early docs used `kmsetjendpdri` as project name for system names
3. **Namespace Confusion:** `kmsetjendpdri` is the organization name, not the deployment folder
4. **Multiple Scripts:** Different deployment scripts written at different times by different people
5. **Staging vs Production:** Different paths for different environments mentioned in docs

## The Fix Required

**Update all hardcoded references from `/var/www/html/kmsetjendpdri` to `/var/www/html/kms`**

Files to update:
1. `deploy_fix.ps1` - Line 8 ❌
2. `deploy-helper.ps1` - Line 35 ❌
3. `DEPLOY_STAGING_NOW.ps1` - Line 116 ❌
4. Any other deployment scripts with hardcoded paths

## Verification

Confirm server has:
```
/var/www/html/kms/
├── .env
├── docker-compose.yml
├── .git/
├── backend/
├── frontend/
└── ... (all project files)
```

✅ **CONFIRMED** - All files present at `/var/www/html/kms`

## Impact

- ✅ Deployment script will now copy `.env` to correct location
- ✅ Git pull will work from correct directory
- ✅ Docker containers will be in correct working directory
- ✅ Deploy-master.sh will execute from correct path
- ✅ All future deployments will work properly

