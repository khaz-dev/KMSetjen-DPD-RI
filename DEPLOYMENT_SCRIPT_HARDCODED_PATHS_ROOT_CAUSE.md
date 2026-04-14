# Deployment Path Hardcoding: Root Cause Analysis & Fix

## The Problem Explained

You renamed the project folder from `kmsetjendpdri` to `kms` on the staging server, but the deployment scripts have **hardcoded paths** that still reference the old folder name.

### Why This Happened

When deployment scripts were created, they used **hardcoded absolute paths** instead of **dynamic relative paths**. This means:

**Hardcoded (❌ BAD):**
```bash
DEPLOY_PATH="/var/www/html/kmsetjendpdri"  # Fixed forever
```

When you renamed the folder → script breaks!

**Dynamic (✅ GOOD):**
```bash
DEPLOY_PATH="$(pwd)"  # Auto-detects current directory
```

When you rename the folder → script still works!

---

## All Hardcoded Paths Found

### 1. **deploy-master.sh** (Line 44)
```bash
staging)  DEPLOY_PATH="/var/www/html/kmsetjendpdri"; DOMAIN="khaz.app"; URL="https://khaz.app/kms" ;;
```
**Impact:** This is the script you're trying to run! It's why you get "Deployment path not found"

### 2. **deploy-staging.sh** (Line 23)
```bash
PROJECT_DIR="/var/www/html/kmsetjendpdri"
```
**Impact:** Old deployment script (likely replaced by deploy-master.sh)

### 3. **deploy-docker.sh** & **deploy-final.sh**
Both likely have similar hardcoded paths

### 4. **Docker Compose & Nginx Config**
May reference `kmsetjendpdri` in service names, which is less critical but should be updated for consistency

---

## The Real Issue

The **fundamental problem** is that scripts assume a fixed deployment path:

```
Local development:      You run from project root (auto-detected)
Staging deployment:     Scripts hardcode /var/www/html/kmsetjendpdri
Problem:                Renaming folder breaks all hardcoded references
```

**Better approach:** Let scripts auto-detect from `pwd` or use relative paths

---

## Solution: Make Paths Dynamic

### Option 1: Auto-detect from Current Directory (RECOMMENDED)

```bash
# Instead of:
DEPLOY_PATH="/var/www/html/kmsetjendpdri"

# Use:
DEPLOY_PATH="$(pwd)"  # Works regardless of folder name!
```

**How it works:**
- User `cd /var/www/html/kms`
- User `bash deploy-master.sh staging`
- Script runs `DEPLOY_PATH="$(pwd)"` → `/var/www/html/kms` ✅ Automatically correct!

### Option 2: Look for docker-compose.yml

```bash
# Find deploy path by looking for docker-compose.yml
DEPLOY_PATH="$(pwd)"
if [[ ! -f "$DEPLOY_PATH/docker-compose.yml" ]]; then
    echo "Error: deploy-master.sh must be run from project root directory"
    echo "Run: cd /var/www/html/kms && bash deploy-master.sh staging"
    exit 1
fi
```

This ensures the script is run from the right place.

---

## Complete Fix for deploy-master.sh

### Current Code (Line 44)
```bash
case "$ENVIRONMENT" in
    staging)  DEPLOY_PATH="/var/www/html/kmsetjendpdri"; DOMAIN="khaz.app"; URL="https://khaz.app/kms" ;;
    production) echo "Production deployment requires --confirm flag"; exit 1 ;;
    *)        echo "Unknown environment: $ENVIRONMENT"; exit 1 ;;
esac
```

### Fixed Code
```bash
# Auto-detect deployment path from current directory
DEPLOY_PATH="$(pwd)"
DOMAIN=""
URL=""

case "$ENVIRONMENT" in
    staging)
        DOMAIN="khaz.app"
        URL="https://kms.khaz.app"  # FOR FUTURE: subdomain-based routing
        ;;
    production)
        echo "Production deployment requires --confirm flag"
        exit 1
        ;;
    *)
        echo "Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

# Verify we're in a project directory
if [[ ! -f "$DEPLOY_PATH/docker-compose.yml" ]]; then
    echo "Error: deploy-master.sh must be run from project directory"
    echo "Found docker-compose.yml? $(test -f "$DEPLOY_PATH/docker-compose.yml" && echo "Yes" || echo "No")"
    echo "Current directory: $DEPLOY_PATH"
    exit 1
fi
```

**Why this works:**
1. No hardcoded paths
2. Works with any folder name (kmsetjendpdri, kms, or anything else)
3. Fails with clear error if run from wrong directory
4. Can easily support subdomain URLs for future migration

---

## Why Hardcoding Paths is Bad

| Aspect | Hardcoded Path | Dynamic Path |
|--------|---|---|
| **Folder rename** | ❌ Breaks | ✅ Works |
| **Multiple instances** | ❌ Can't run multiple copies | ✅ Each works independently |
| **Portability** | ❌ Tied to one server path | ✅ Works anywhere |
| **Maintenance** | ❌ Need to update script for each change | ✅ No updates needed |
| **Documentation** | ❌ Path is hidden in script | ✅ User specifies location |

---

## Recommended Changes for All Scripts

| Script | Current | Fix |
|--------|---------|-----|
| `deploy-master.sh` | `DEPLOY_PATH="/var/www/html/kmsetjendpdri"` | `DEPLOY_PATH="$(pwd)"` |
| `deploy-staging.sh` | `PROJECT_DIR="/var/www/html/kmsetjendpdri"` | `PROJECT_DIR="$(pwd)"` |
| `docker-compose.yml` | Container names: `kmsetjendpdri_frontend` | Change to `kms_frontend` |
| `nginx-*.conf` | Paths like `/kmsetjendpdri/dist/` | Change to `/kms/dist/` |

---

## Implementation

The fix is simple:
1. Update `deploy-master.sh` line 44-50 to use `$(pwd)` instead of hardcoded path
2. Add validation to ensure `docker-compose.yml` exists
3. Same fix for `deploy-staging.sh` line 23

Then **deployment works regardless of folder name!**

---

## Going Forward

**New requirement for deployment:**

```bash
# User must run from project directory
cd /var/www/html/kms  # or any folder name
bash deploy-master.sh staging --health-check
```

No more hidden path assumptions!
