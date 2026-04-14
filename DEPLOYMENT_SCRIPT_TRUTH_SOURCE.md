# 🎯 THE TRUTH SOURCE: Which Deployment Script to Use?

## Executive Summary

**You have been confused because there are 6 deployment scripts instead of 1.**

The **TRUE ARCHITECTURALLY CORRECT DEPLOYMENT SCRIPTS** are:

| Script | Purpose | Environment | Host OS | Status |
|--------|---------|-------------|---------|--------|
| **deploy-master.sh** ✅ | THE TRUTH SOURCE for server deployment | Staging/Production | Ubuntu Linux (Server) | **USE THIS** |
| **deploy-helper.ps1** ✅ | Trigger deploy-master.sh from Windows | Windows Local Machine | Windows | Use to trigger server deployment |
| **deploy-master.ps1** ⚠️ | Local development (not for server) | Local Development | Windows/macOS/Linux | For local testing only |
| **deploy.ps1** ❌ | DEPRECATED/OLD | Any | Windows | **DO NOT USE** |
| deploy.sh.old | 🗑️ TRASH | Old | Linux | Ignore |
| deploy-staging.sh.old | 🗑️ TRASH | Old | Linux | Ignore |
| deploy-docker.sh.old | 🗑️ TRASH | Old | Linux | Ignore |
| deploy-final.sh.old | 🗑️ TRASH | Old | Linux | Ignore |

---

## 🔍 Root Cause Analysis: Why This Happened

### The Problem
You created multiple deployment scripts over time while fixing issues:

1. **Initial approach** (~Feb 2026): Created `deploy.sh` for Linux server
2. **First confusion** (~Feb 2026): Created `deploy-staging.sh` variant  
3. **Docker migration** (Feb 2026): Created `deploy-docker.sh` for containerized setup
4. **Final fix attempt** (~Feb 2026): Created `deploy-final.sh` with all workarounds
5. **Windows need** (~Feb 2026): Created `deploy.ps1` for Windows Local
6. **Unification attempt** (Mar 2026): Created `deploy-master.sh` and `deploy-master.ps1` to consolidate

### Why It's Confusing
- **Old scripts were never deleted** - they're all still in the repo with `.old` extensions, but also original names
- **Different naming conventions** - `deploy-final.sh`, `deploy.sh`, `deploy-staging.sh` don't indicate which is "master"
- **Documentation was scattered** - 20+ deployment docs in different states of accuracy
- **No clear README** - No single file saying "use THIS script"

---

## 📋 Architecture Explanation

### Your Deployment Architecture

```
Your Windows Machine (Local Development)
│
├─ deploy-master.ps1 ──────────► Local testing before deployment
│  (Builds & tests locally)
│
├─ deploy-helper.ps1 ──────────► Connects to server via SSH
│  (Copies .env to server)
│  (Triggers deploy-master.sh)
│  (Monitors deployment)
│
└─ .env ──────────► Sent via SCP to server
   
               ↓ (SSH connection)
               
Staging Server (Ubuntu 24.04 @ khaz.app)
│
├─ deploy-master.sh ─────────► THE ACTUAL DEPLOYMENT
│  (Pulls code from git)
│  (Builds Docker containers)
│  (Runs migrations)
│  (Configures Nginx)
│  (Restarts services)
│
└─ docker-compose.yml ──────► Orchestrates containers
   (Uses .env file)
```

### Why This Architecture?

#### **Why NOT run deploy-master.ps1 on Windows?**
- Staging server is Ubuntu Linux, not Windows
- Docker and docker-compose work, but building Node.js frontend on Windows is slow
- PostgreSQL is on the server, not Windows
- Nginx SSL certificates are on the server

#### **Why use deploy-helper.ps1?**
- You're on Windows, so you use PowerShell 
- It handles SSH authentication via your SSH key
- Copies .env securely to the server
- Executes deploy-master.sh remotely via SSH
- Shows you the output in real-time

#### **Why deploy-master.sh on the server?**
- It's a Bash script optimized for Ubuntu
- Has direct access to Docker, PostgreSQL, Nginx on the server
- Can execute with `sudo` for system-level operations
- Can access SSL certificates at `/etc/letsencrypt/`

---

## ⚡ The Correct Deployment Flow (Right Now!)

### Step 1: On Your Windows Machine

Ensure your .env file is updated with staging configuration:

```powershell
# Verify .env exists and has correct staging config
cat .env | grep -i "environment=\|vite_app_subpath"
# Should show: ENVIRONMENT=staging, VITE_APP_SUBPATH=/
```

### Step 2: Run the Deployment Helper

```powershell
# Navigate to project root
cd "d:\Project\KMSetjen DPD RI"

# Run the helper script
.\deploy-helper.ps1
# OR specify which staging server
.\deploy-helper.ps1 -ServerIP "165.245.191.216"  # Change to actual IP if different
```

### Step 3: What the Helper Does Automatically

1. ✅ Verifies SSH key exists (`C:\Users\khair\.ssh\id_rsa`)
2. ✅ Tests server connectivity
3. ✅ Copies your `.env` file to server via SCP
4. ✅ Sets `.env` permissions to 600 (secure)
5. ✅ Pulls latest code from GitHub
6. ✅ Runs `sudo ./deploy-master.sh staging` on the server
7. ✅ Monitors output in real-time
8. ✅ Shows you health check results

### Step 4: Verify Deployment (On Server via SSH)

```bash
# SSH to server
ssh root@165.245.191.216
# OR SSH with key
ssh -i ~/.ssh/id_rsa root@165.245.191.216

# Check containers are running
docker-compose ps
# Expected output: 3 containers (django, frontend, redis) with status "Up"

# Check certificate
ls -la /etc/letsencrypt/live/khaz.app/fullchain.pem
# Should exist and be valid

# Test HTTPS endpoint
curl -v https://kms.khaz.app/
# Should return HTTP 200 with HTML
```

---

## 🚨 When to Use Each Script

### For LOCAL Development (Your Windows Machine)
```powershell
# Use deploy-master.ps1 to test locally BEFORE deploying
.\deploy-master.ps1 -Environment local
# This builds frontend, prepares backend, but doesn't actually deploy anything
```

### For STAGING Deployment (Recommended Way)
```powershell
# Use deploy-helper.ps1 from your Windows machine
.\deploy-helper.ps1
# This copies .env to staging server and runs deploy-master.sh there
```

### For STAGING Deployment (Manual Way - if helper fails)
```bash
# SSH to staging server first
ssh root@165.245.191.216

# Then manually run the deployment script
cd /var/www/html/kmsetjendpdri
sudo ./deploy-master.sh staging --verbose
```

### For PRODUCTION Deployment (Future - DO NOT DO YET)
```bash
# Only after testing fully on staging
# Run on production server only
sudo ./deploy-master.sh production --skip-backup
# (Production requires explicit confirmation)
```

---

## 📁 Old Deployment Scripts (CLEANUP NEEDED)

These should be **DELETED** (or moved to archive):
- ❌ `deploy.ps1` - Old version, replaced by deploy-master.ps1
- ❌ `deploy.sh.old` - Old version, replaced by deploy-master.sh  
- ❌ `deploy-staging.sh.old` - Old version, replaced by deploy-master.sh
- ❌ `deploy-docker.sh.old` - Old version, replaced by deploy-master.sh
- ❌ `deploy-final.sh.old` - Old version, replaced by deploy-master.sh

---

## 🐛 The Key Differences: Why It Was Confusing

### Old `deploy.ps1`
```powershell
# ❌ Problems:
# - Tried to do everything on Windows (not the server)
# - Had hardcoded paths specific to your machine
# - Didn't handle SSH properly
# - Didn't sync with actual server deployment
```

### Old `deploy-final.sh`
```bash
# ❌ Problems:
# - Worked on the server but had workarounds baked in
# - Wasn't generic (referenced specific old paths)
# - Didn't handle .env properly
# - No clear documentation
```

### New `deploy-master.sh` ✅
```bash
# ✅ Solutions:
# - Generic, works for staging or production
# - Expects .env to be already present on server
# - Uses docker-compose for orchestration
# - Verifies SSL certificate is correct
# - Handles migrations and static files
# - Restarts services properly
# - Clear logging with colors
```

### New `deploy-helper.ps1` ✅
```powershell
# ✅ Solutions:
# - Runs from your Windows machine
# - Handles SSH key authentication
# - Copies .env file automatically
# - Executes deploy-master.sh on server
# - Shows you real-time output
# - Diagnoses problems if deployment fails
```

---

## 🎯 Summary: What You Should Do NOW

### Immediate Action (Deploy to Staging with Updated .env)

1. **Verify .env file is correct**
   ```powershell
   cd "d:\Project\KMSetjen DPD RI"
   cat .env | Select-String "ENVIRONMENT|VITE_APP_SUBPATH|VITE_API_BASE_URL"
   ```

2. **Run the deployment helper**
   ```powershell
   .\deploy-helper.ps1
   ```

3. **Confirm when prompted**
   - SSH key: (auto-detected)
   - Run deployment: yes

4. **Monitor output** - Watch for:
   - ✅ .env file copied
   - ✅ Git pull successful
   - ✅ Docker build successful
   - ✅ Migrations completed
   - ✅ Nginx configured
   - ✅ SSL certificate verified

### Long-term Action (Clean Up Confusion)

1. **Delete old scripts**
   ```bash
   rm deploy.ps1                    # Delete old version
   rm deploy.sh.old deploy-staging.sh.old deploy-docker.sh.old deploy-final.sh.old
   ```

2. **Create a DEPLOYMENT.md** with one simple guide (I'll provide this)

3. **Keep only these scripts:**
   - ✅ deploy-master.sh (server deployment)
   - ✅ deploy-master.ps1 (local dev)
   - ✅ deploy-helper.ps1 (trigger from Windows)

4. **Delete all the DEPLOYMENT_*.md docs** (20+ files creating noise)

---

## 🔐 Security Notes

- `.env` file should NEVER be committed to Git (it contains secrets)
- `.env` file IS in `.gitignore` ✅ (good)
- When copying to server, it's transmitted via SSH (encrypted)
- Permissions are set to 600 (only root can read)

---

## ✅ Conclusion

| Question | Answer |
|----------|--------|
| **Which deployment script is the "truth"?** | `deploy-master.sh` (runs on server) |
| **How do I deploy from Windows?** | Use `deploy-helper.ps1` |
| **Why are there so many scripts?** | Historical accumulation from bug fixes |
| **Can I delete the old ones?** | YES, they're obsolete |
| **What if deploy-helper.ps1 fails?** | SSH manually and run deploy-master.sh |
| **Do I need deploy-master.ps1?** | Only for local development testing |

