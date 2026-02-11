# 🚀 DEPLOY SCRIPTS - PRACTICAL IMPLEMENTATION GUIDE

**Complete step-by-step usage for both Windows (PowerShell) and Linux (Bash)**

---

## 📌 Quick Start (Copy & Paste Commands)

### For Windows Users (PowerShell)

```powershell
# Step 1: Open PowerShell (Run as Administrator recommended)
# Press: Windows + X → PowerShell (Admin)

# Step 2: Navigate to project
cd "d:\Project\KMSetjen DPD RI"

# Step 3: Check .env is present
Test-Path .env
# Should return: True

# Step 4: Deploy to development (fastest)
.\deploy.ps1 -Environment development

# Step 5: Check if it worked
docker-compose ps
# Should show: 3 containers (django, frontend, redis) with status "Up"

# Step 6: Test the API
curl http://localhost:8002/api/
# Should return: JSON response
```

### For Linux/Ubuntu Users (Bash)

```bash
# Step 1: Open terminal

# Step 2: Navigate to project
cd /path/to/KMSetjen-DPD-RI  # Replace with actual path

# Step 3: Make script executable
chmod +x deploy.sh

# Step 4: Check .env is present
test -f .env && echo "✓ .env found"

# Step 5: Deploy to development (fastest)
./deploy.sh development

# Step 6: Check if it worked
docker-compose ps
# Should show: 3 containers (django, frontend, redis) with status "Up"

# Step 7: Test the API
curl http://localhost:8002/api/
# Should return: JSON response
```

---

## 📚 Complete Command Reference

### Windows PowerShell Commands

#### Basic Deployments

```powershell
# Development deployment (fastest, all debug enabled)
.\deploy.ps1 -Environment development

# Staging deployment (production-like, but debug allowed)
.\deploy.ps1 -Environment staging

# Production deployment (full safety checks, requires confirmation)
.\deploy.ps1 -Environment production
```

#### Advanced Options

```powershell
# Build images only, don't start containers
.\deploy.ps1 -Environment development -BuildOnly

# Deploy without pulling latest code
.\deploy.ps1 -Environment staging -NoPull

# Deploy but skip database backup (not recommended for production)
.\deploy.ps1 -Environment production -SkipBackup

# Deploy without health checks
.\deploy.ps1 -Environment development -NoHealthCheck

# Combine options
.\deploy.ps1 -Environment development -BuildOnly -NoPull
.\deploy.ps1 -Environment staging -NoHealthCheck -NoPull
```

#### Monitoring & Verification

```powershell
# View running containers
docker-compose ps

# View logs from all services
docker-compose logs

# View logs from specific service
docker-compose logs django
docker-compose logs frontend
docker-compose logs redis

# View last 50 lines of deployment log
Get-Content .\deployment_logs\deploy_*.log | Select-Object -Last 50

# Watch logs in real-time
docker-compose logs -f django

# Check deployment status
Test-Path .\deployment_logs\deploy_*.log
# Returns: True if successful
```

#### Troubleshooting Commands

```powershell
# Stop all containers
docker-compose down

# Stop and remove volumes (resets everything)
docker-compose down -v

# Restart specific service
docker-compose restart django
docker-compose restart frontend
docker-compose restart redis

# Check service health
docker-compose ps

# Verify API is responding
curl http://localhost:8002/api/
curl http://localhost:5175/

# Check Python migrations
docker-compose exec django python manage.py migrate --check

# View database
docker-compose exec -T django python manage.py dbshell

# Clear cache
docker-compose exec redis redis-cli FLUSHALL

# See full logs
Get-Content .\deployment_logs\deploy_*.log
```

---

### Linux/Bash Commands

#### Basic Deployments

```bash
# Development deployment (fastest, all debug enabled)
./deploy.sh development

# Staging deployment (production-like, but debug allowed)
./deploy.sh staging

# Production deployment (full safety checks, requires confirmation)
./deploy.sh production
```

#### Advanced Options

```bash
# Build images only, don't start containers
./deploy.sh development --build-only

# Deploy without pulling latest code
./deploy.sh staging --no-pull

# Deploy but skip database backup (not recommended for production)
./deploy.sh production --skip-backup

# Deploy without health checks
./deploy.sh development --no-health-check

# Combine options
./deploy.sh development --build-only --no-pull
./deploy.sh staging --no-health-check --no-pull
```

#### Monitoring & Verification

```bash
# View running containers
docker-compose ps

# View logs from all services
docker-compose logs

# View logs from specific service
docker-compose logs django
docker-compose logs frontend
docker-compose logs redis

# View last 50 lines of deployment log
tail -50 ./deployment_logs/deploy_*.log

# Watch logs in real-time
docker-compose logs -f django

# Check deployment status
test -f ./deployment_logs/deploy_*.log && echo "Log found"

# Count deployments
ls -1 ./deployment_logs/ | wc -l
```

#### Troubleshooting Commands

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (resets everything)
docker-compose down -v

# Restart specific service
docker-compose restart django
docker-compose restart frontend
docker-compose restart redis

# Check service health
docker-compose ps

# Verify API is responding
curl http://localhost:8002/api/
curl http://localhost:5175/

# Check Python migrations
docker-compose exec django python manage.py migrate --check

# View database
docker-compose exec -T django python manage.py dbshell

# Clear cache
docker-compose exec redis redis-cli FLUSHALL

# See full logs
cat ./deployment_logs/deploy_*.log
```

---

## 🎯 Real-World Examples

### Scenario 1: Fresh Development Setup

**Windows:**
```powershell
# 1. Navigate to project
cd "d:\Project\KMSetjen DPD RI"

# 2. Deploy to development
.\deploy.ps1 -Environment development

# 3. Wait for completion (~3-5 minutes)

# 4. Verify everything works
curl http://localhost:8002/api/
# Expected: GET /api/ works

# 5. Check database is setup
docker-compose exec django python manage.py dbshell
# Type: \q to exit
```

**Linux:**
```bash
# 1. Navigate to project
cd ~/projects/KMSetjen-DPD-RI

# 2. Make script executable
chmod +x deploy.sh

# 3. Deploy to development
./deploy.sh development

# 4. Wait for completion (~3-5 minutes)

# 5. Verify everything works
curl http://localhost:8002/api/
# Expected: GET /api/ works

# 6. Check database is setup
docker-compose exec django python manage.py dbshell
# Type: \q to exit
```

---

### Scenario 2: Quick Code Update (Skip Image Rebuild)

**Windows:**
```powershell
# If only code changed (no dependencies added/removed)
# Pull latest code without rebuilding images

.\deploy.ps1 -Environment development -NoPull
# or manually:
git pull origin main
docker-compose restart django
docker-compose restart frontend
```

**Linux:**
```bash
# If only code changed (no dependencies added/removed)
# Pull latest code without rebuilding images

./deploy.sh development --no-pull
# or manually:
git pull origin main
docker-compose restart django
docker-compose restart frontend
```

---

### Scenario 3: Fix Database Issue

**Windows:**
```powershell
# 1. Check current migrations
docker-compose exec django python manage.py migrate --check

# 2. If migrations failed:
docker-compose exec django python manage.py migrate

# 3. Check static files
docker-compose exec django python manage.py collectstatic --noinput

# 4. Restart services
docker-compose restart

# 5. Verify
curl http://localhost:8002/api/
```

**Linux:**
```bash
# 1. Check current migrations
docker-compose exec django python manage.py migrate --check

# 2. If migrations failed:
docker-compose exec django python manage.py migrate

# 3. Check static files
docker-compose exec django python manage.py collectstatic --noinput

# 4. Restart services
docker-compose restart

# 5. Verify
curl http://localhost:8002/api/
```

---

### Scenario 4: Production Deployment (Ubuntu Server)

**Linux (Production):**
```bash
#!/bin/bash
# Save as: deploy-prod.sh

# 1. Navigate to project
cd /opt/app/KMSetjen-DPD-RI

# 2. Update code
git pull origin main

# 3. Run deployment with full safety
./deploy.sh production

# 4. Verify deployment
docker-compose ps
curl http://localhost:8002/api/

# 5. Check logs
tail -100 ./deployment_logs/deploy_*.log | grep "SUCCESS\|ERROR"

# 6. Record deployment
echo "Deployment completed: $(date)" >> ./deployment_logs/deployment_history.log
```

Then execute with:
```bash
chmod +x deploy-prod.sh
./deploy-prod.sh
```

---

### Scenario 5: CI/CD Pipeline Integration

**GitHub Actions (.github/workflows/deploy.yml):**
```yaml
name: Deploy to Production
on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy via script
        env:
          DOCKER_BUILDKIT: 1
        run: |
          chmod +x deploy.sh
          ./deploy.sh production --no-health-check
          
      - name: Verify deployment
        run: |
          sleep 30
          curl http://localhost:8002/api/
          
      - name: Send notification
        if: always()
        run: |
          # Send Slack/email notification
          echo "Deployment status: ${{ job.status }}"
```

---

## 📊 Parameter Explanation

### Common Parameters (Both Scripts)

| Parameter | Format | Example | What It Does |
|-----------|--------|---------|------|
| Environment | Required 1st arg | `-Environment development` (PS1) or `development` (SH) | Chooses dev/staging/prod config |
| Build Only | `-BuildOnly` / `--build-only` | `.\deploy.ps1 -Environment dev -BuildOnly` | Only builds images, doesn't start services |
| Skip Git | `-NoPull` / `--no-pull` | `.\deploy.ps1 -Environment dev -NoPull` | Skips `git pull`, uses current code |
| Skip Backup | `-SkipBackup` / `--skip-backup` | `.\deploy.ps1 -Environment prod -SkipBackup` | Skips database backup before deploy |
| Skip Health | `-NoHealthCheck` / `--no-health-check` | `.\deploy.ps1 -Environment dev -NoHealthCheck` | Skips health verification |

---

## 🔍 Understanding the Logs

### Log File Location

**Windows:**
```
d:\Project\KMSetjen DPD RI\deployment_logs\deploy_20260211_143025.log
```

**Linux:**
```
/path/to/project/deployment_logs/deploy_20260211_143025.log
```

### Sample Successful Log

```
[2026-02-11 14:30:25] [INFO] ========== KMSetjen DPD RI Deployment Script ==========
[2026-02-11 14:30:25] [INFO] Environment: development
[2026-02-11 14:30:25] [INFO] Timestamp: 20260211_143025
[2026-02-11 14:30:26] [SUCCESS] Docker found: Docker version 29.1.5
[2026-02-11 14:30:27] [SUCCESS] docker-compose found: Docker Compose version v5.0.1
[2026-02-11 14:30:28] [SUCCESS] .env file found
[2026-02-11 14:30:29] [SUCCESS] Configuration validated
[2026-02-11 14:30:30] [INFO] Skipping code update
[2026-02-11 14:30:45] [SUCCESS] Images built successfully
[2026-02-11 14:30:55] [SUCCESS] Services started successfully
[2026-02-11 14:31:15] [SUCCESS] Redis ready
[2026-02-11 14:31:25] [SUCCESS] Django ready
[2026-02-11 14:31:35] [SUCCESS] Database migrations completed
[2026-02-11 14:31:45] [SUCCESS] Static files collected
[2026-02-11 14:31:55] [SUCCESS] Services verified successfully
[2026-02-11 14:32:00] [SUCCESS] ========== Deployment Completed Successfully ==========
```

### Sample Error Log

```
[2026-02-11 14:30:25] [INFO] ========== Deployment Started ==========
[2026-02-11 14:30:26] [ERROR] Docker not found. Please install Docker Desktop.
[2026-02-11 14:30:26] [ERROR] Deployment failed
```

---

## ⚙️ Environment Modes Explained

### Development Mode
```
Best for: Local development, testing features
Features: DEBUG=True, no cache, fast reload
Time to deploy: 3-4 minutes
Health checks: Yes (30-second timeout)
Database backup: No
Safety checks: Minimal
Use when: Testing new features locally
```

### Staging Mode
```
Best for: QA testing, production dry-run
Features: DEBUG=False but detailed errors shown, normal cache
Time to deploy: 3-4 minutes  
Health checks: Yes (30-second timeout)
Database backup: No
Safety checks: Yes (check .env)
Use when: Testing before production deployment
```

### Production Mode
```
Best for: Live deployment
Features: DEBUG=False, all optimizations, strict errors
Time to deploy: 3-4 minutes
Health checks: Yes (30-second timeout)
Database backup: Yes (automatic)
Safety checks: Maximum (requires explicit confirmation)
Use when: Deploying to production servers
```

---

## 🆘 Common Issues & Solutions

### Issue 1: "Docker not found"

**Windows:**
```powershell
# Install Docker Desktop from: https://www.docker.com/products/docker-desktop
# After installation, restart PowerShell completely

# If still not found:
# 1. Open Docker Desktop (taskbar icon)
# 2. Wait for "Engine running" 
# 3. Retry deploy command
```

**Linux:**
```bash
# Install Docker:
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Give user permission:
sudo usermod -aG docker $(whoami)

# Log out and back in for permissions to take effect
```

### Issue 2: "Permission Denied" (Linux)

```bash
# Make script executable:
chmod +x deploy.sh

# Verify:
ls -la deploy.sh
# Should show: -rwxr-xr-x (x means executable)
```

### Issue 3: "Port Already In Use"

**Windows:**
```powershell
# Find what's using port 8002
Get-NetTCPConnection -LocalPort 8002 | Select-Object OwningProcess
taskkill /PID [PID] /F

# Or stop containers
docker-compose down
docker-compose rm -f
```

**Linux:**
```bash
# Find what's using port 8002
lsof -i :8002
kill -9 [PID]

# Or stop containers
docker-compose down
docker-compose rm -f
```

### Issue 4: "Health Check Failed"

```powershell
# Windows
# Wait longer (services take time to start)
Start-Sleep -Seconds 30
.\deploy.ps1 -Environment development -NoHealthCheck

# Then check manually
docker-compose logs django | Select-String ERROR
```

```bash
# Linux
# Wait longer (services take time to start)
sleep 30
./deploy.sh development --no-health-check

# Then check manually
docker-compose logs django | grep ERROR
```

### Issue 5: "Database Migration Failed"

**Windows:**
```powershell
# Check migrations
docker-compose exec django python manage.py migrate --check

# Rerun migrations manually
docker-compose exec django python manage.py migrate

# Check what migrations exist
docker-compose exec django python manage.py showmigrations
```

**Linux:**
```bash
# Check migrations
docker-compose exec django python manage.py migrate --check

# Rerun migrations manually
docker-compose exec django python manage.py migrate

# Check what migrations exist
docker-compose exec django python manage.py showmigrations
```

---

## 📝 Deployment Checklist

### Before Deployment

- [ ] Code changes committed to git
- [ ] .env file exists and is configured
- [ ] docker-compose.yml is present
- [ ] Docker Desktop running (Windows) or Docker service running (Linux)
- [ ] Sufficient disk space (at least 2GB free)
- [ ] No other containers running on same ports
- [ ] Internet connection available (for docker pulls)

### During Deployment

- [ ] Script running without errors
- [ ] No "ERROR" messages in logs
- [ ] All containers starting (check docker-compose logs)
- [ ] Health checks passing

### After Deployment

- [ ] All containers running: `docker-compose ps`
- [ ] API responding: `curl http://localhost:8002/api/`
- [ ] Frontend loads: Open http://localhost:5175 in browser
- [ ] Database functioning: Can execute database queries
- [ ] Logs clean: No ERROR messages in deployment_logs/

---

## 🔄 CI/CD Integration Examples

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    stages {
        stage('Deploy') {
            steps {
                sh '''
                    chmod +x deploy.sh
                    ./deploy.sh production --no-health-check
                '''
            }
        }
        
        stage('Verify') {
            steps {
                sh '''
                    sleep 30
                    curl -f http://localhost:8002/api/
                '''
            }
        }
    }
    
    post {
        always {
            sh 'tail -100 ./deployment_logs/deploy_*.log'
        }
    }
}
```

### GitLab CI

```yaml
deploy_production:
  stage: deploy
  image: docker:latest
  services:
    - docker:dind
  script:
    - chmod +x deploy.sh
    - ./deploy.sh production
    - curl http://localhost:8002/api/
  only:
    - main
```

---

## 📞 Support & Help

### Getting Help

```powershell
# Windows - Show script help
Get-Help .\deploy.ps1

# Windows - Show parameter help
Get-Help .\deploy.ps1 -Parameter Environment

# Windows - Show detailed examples
Get-Help .\deploy.ps1 -Examples
```

```bash
# Linux - View script
head -50 deploy.sh

# Linux - Check if specific command exists
command -v docker-compose

# Linux - See manual
docker-compose help
```

### Debugging

```powershell
# Windows - Verbose output
$VerbosePreference = "Continue"
.\deploy.ps1 -Environment development
```

```bash
# Linux - Verbose output  
bash -x deploy.sh development

# Linux - Run specific function
source deploy.sh
validate_environment
```

---

## 🎉 Success Indicators

✅ **Deployment Successful When:**
1. Script runs without "ERROR" messages
2. All containers show "Up" status
3. API responds to curl request
4. Logs show "Deployment Completed Successfully"
5. deployment_logs/ directory contains new log file

---

## 📌 Key Takeaways

| Task | Windows | Linux |
|------|---------|-------|
| Make script executable | (automatic) | `chmod +x deploy.sh` |
| Deploy to dev | `.\deploy.ps1 -Environment development` | `./deploy.sh development` |
| Deploy to staging | `.\deploy.ps1 -Environment staging` | `./deploy.sh staging` |
| Deploy to production | `.\deploy.ps1 -Environment production` | `./deploy.sh production` |
| View logs | `Get-Content .\deployment_logs\*.log` | `cat ./deployment_logs/*.log` |
| Check services | `docker-compose ps` | `docker-compose ps` |
| Test API | `curl http://localhost:8002/api/` | `curl http://localhost:8002/api/` |

---

**Last Updated:** February 11, 2026  
**Status:** ✅ Production Ready  
**Verified On:** Windows 11 & Ubuntu 22.04 LTS
