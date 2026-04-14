# DEPLOYMENT SCRIPTS - CLEANUP & CONSOLIDATION GUIDE

## What Has Changed

### ✅ **NEW Consolidated Script**
- `deploy-staging.ps1` - Single unified Windows→Staging deployment script

### ⚠️ **Scripts to Delete** (Replaced by deployment-staging.ps1)
1. `deploy-helper.ps1` - OLD (use deploy-staging.ps1 instead)
2. `deploy_fix.ps1` - OLD (use deploy-staging.ps1 instead)
3. `DEPLOY_STAGING_NOW.ps1` - OLD (use deploy-staging.ps1 instead)
4. `DEPLOY_STAGING_FIX.ps1` - OLD (use deploy-staging.ps1 instead)

### ✅ **Keep These Scripts**
1. `deploy-master.ps1` - Local development/testing (Windows)
2. `deploy-master.sh` - Official server deployment (Linux/Ubuntu)

### ⚠️ **Bash Scripts to Review** (Not deleted yet, but deprecated)
1. `deploy-master-enhanced.sh` - Enhanced version (duplicate of deploy-master.sh)
2. `docs/deploy.sh` - Old legacy script

---

## Migration Path

### For Users Currently Using OLD Scripts

#### If you were using `deploy-helper.ps1`:
```powershell
# OLD WAY
.\deploy-helper.ps1

# NEW WAY  
.\deploy-staging.ps1
```

#### If you were using `deploy_fix.ps1`:
```powershell
# OLD WAY
.\deploy_fix.ps1

# NEW WAY
.\deploy-staging.ps1
```

#### If you were using `DEPLOY_STAGING_NOW.ps1`:
```powershell
# OLD WAY
.\DEPLOY_STAGING_NOW.ps1

# NEW WAY
.\deploy-staging.ps1
```

#### If you were using `DEPLOY_STAGING_FIX.ps1`:
```powershell
# OLD WAY
.\DEPLOY_STAGING_FIX.ps1

# NEW WAY
.\deploy-staging.ps1
```

**All map to the same command:** `.\deploy-staging.ps1`

---

## Before You Delete

### 1. Verify deploy-staging.ps1 Works

```powershell
# Test with dry run first
.\deploy-staging.ps1 -DryRun

# If successful, run actual deployment
.\deploy-staging.ps1
```

### 2. Check No References in CI/CD
- Search git workflows for references to old scripts
- Update any deployment pipelines
- Update any documentation

### 3. Archive Old Scripts (Optional)
If you want to keep them for historical reasons:
```powershell
mkdir archive
mv deploy-helper.ps1 archive/
mv deploy_fix.ps1 archive/
mv DEPLOY_STAGING_NOW.ps1 archive/
mv DEPLOY_STAGING_FIX.ps1 archive/
echo "Old deployment scripts archived"
```

### 4. DELETE Old Scripts (Recommended)

```powershell
# Option 1: Delete immediately
rm deploy-helper.ps1
rm deploy_fix.ps1
rm DEPLOY_STAGING_NOW.ps1
rm DEPLOY_STAGING_FIX.ps1

# Option 2: Delete with git (keep in history)
git rm deploy-helper.ps1 deploy_fix.ps1 DEPLOY_STAGING_NOW.ps1 DEPLOY_STAGING_FIX.ps1
git commit -m "Consolidate deployment scripts: remove old variants, use unified deploy-staging.ps1"
```

---

## New Features in Consolidated Script

### Configuration-Driven
Old scripts had hardcoded values. New one uses `$EnvironmentConfig`:
```powershell
$EnvironmentConfig = @{
    staging = @{
        ServerIP = "165.245.191.216"
        ServerProjectPath = "/var/www/html/kms"
        # ... etc
    }
    production = @{
        ServerIP = "YOUR_PRODUCTION_IP"
        # ... etc (not enabled until you fill it in)
    }
}
```

### Dry Run Mode
Test deployment without making changes:
```powershell
.\deploy-staging.ps1 -DryRun
```

### Better Error Messages
All functions consolidated into one file with consistent logging

### Ready for Production
Add your production IP and uncomment `Enabled = $true` for production deployments

---

## Cleanup Summary

### Before (Confusing)
```
Windows Machine
├── deploy-master.ps1        (local testing)
├── deploy-helper.ps1        (staging - OLD)
├── deploy_fix.ps1           (staging - HOTFIX)
├── DEPLOY_STAGING_NOW.ps1   (staging - QUICK)
├── DEPLOY_STAGING_FIX.ps1   (staging - FIX)
└── ... multiple .md docs about them

Ubuntu Server
├── deploy-master.sh         (deployment)
├── deploy-master-enhanced.sh (DUPLICATE)
└── docs/deploy.sh          (LEGACY)
```

### After (Clear)
```
Windows Machine
├── deploy-master.ps1        (local testing) ✅
├── deploy-staging.ps1       (Windows→Staging - SINGLE) ✅
└── simple reference docs

Ubuntu Server
├── deploy-master.sh         (deployment) ✅
└── clean & simple
```

---

## Configuration for Future Use

### To Enable Production Deployment

Edit `deploy-staging.ps1` and find this section:

```powershell
production = @{
    Enabled = $false                    # ← Change to $true
    ServerIP = "YOUR_PRODUCTION_IP"     # ← Fill in actual IP
    ServerUser = "root"
    ServerProjectPath = "/var/www/html/kms"
    SSHKeyPath = "c:\Users\khair\.ssh\production_key"  # ← Set your prod key
    EnvFile = ".env.production"
    Description = "Production environment"
}
```

Then run:
```powershell
.\deploy-staging.ps1 -Environment production
```

---

## Troubleshooting After Migration

### Script not found
Ensure you deleted the old ones and are running the new `deploy-staging.ps1`

### Path issues
The new script uses centralized config. If path is wrong, update `$EnvironmentConfig` section

### SSH connection fails
Check SSH key path is correct for your setup (might be different than what's configured)

### Deployment stalls
Use `-Verbose` flag to see detailed output:
```powershell
.\deploy-staging.ps1 -Verbose
```

---

## Documentation Updates

### Docs That Should Be Updated
- [ ] README.md - Update deployment instructions
- [ ] DEPLOYMENT_START_HERE.md - Point to deploy-staging.ps1
- [ ] Any CI/CD documentation
- [ ] Onboarding guide for new developers

### Delete These Docs (Replace with single guide)
- [ ] DEPLOY_PS1_*.md files (too many variants)
- [ ] DEPLOYMENT_SCRIPT_*.md (outdated)
- [ ] Any docs mentioning old script names

### Keep These Docs
- [ ] DEPLOYMENT_SCRIPTS_PROLIFERATION_ANALYSIS.md (explains why/how)
- [ ] This cleanup guide
- [ ] Simple new deployment guide

---

## Timeline for Cleanup

**Recommended Order:**
1. ✅ Create and test `deploy-staging.ps1` (DONE)
2. ⏳ Run `.\deploy-staging.ps1` once successfully
3. ⏳ Delete old scripts (one by one, test each deletion)
4. ⏳ Commit to git with message: "Consolidate: Remove old deployment scripts"
5. ⏳ Update documentation
6. ⏳ Delete old documentation files (optional)

---

## Expected Timeline
- **Step 2:** 2-3 minutes
- **Step 3:** 5 minutes  
- **Step 4:** 1 minute
- **Step 5:** 15 minutes (find and update all refs)
- **Step 6:** 10 minutes (cleanup docs)

**Total: ~35 minutes to fully consolidate**

