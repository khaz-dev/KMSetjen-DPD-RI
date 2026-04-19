# 🚀 Deployment Commands - Complete Reference

**KMSetjen DPD RI - Deployment System v3.0**

---

## 🎯 Most Used Commands

### Staging Deployment (Windows)

```powershell
# SAFEST - Update code only (recommended for production)
.\deploy-staging-enhanced.ps1 -Mode update-only

# Test first (dry-run)
.\deploy-staging-enhanced.ps1 -Mode update-only -DryRun -Verbose

# Sync database and media
.\deploy-staging-enhanced.ps1 -Mode update-with-data

# Fresh build (testing)
.\deploy-staging-enhanced.ps1 -Mode clean
```

### Production Deployment (On Server)

```bash
# SSH to server
ssh root@PRODUCTION_IP

# Navigate to project
cd /var/www/html/production

# SAFEST - Update code only (recommended)
sudo bash deploy-master-enhanced.sh production --mode=update-only

# Test first (dry-run)
sudo bash deploy-master-enhanced.sh production --mode=update-only --dry-run --verbose

# With data import
sudo bash deploy-master-enhanced.sh production --mode=update-with-data

# Fresh build
sudo bash deploy-master-enhanced.sh production --mode=clean
```

---

## 🧪 Testing Commands

### Pre-Deployment Checks

```powershell
# Check PostgreSQL
psql --version

# Check Git
git status

# Check SSH key
Test-Path "c:\Users\khair\khaz"

# Check deployment script
Test-Path ".\deploy-staging-enhanced.ps1"
```

### Dry-Run (No Changes)

```powershell
# Windows - Test without making changes
.\deploy-staging-enhanced.ps1 -Mode update-only -DryRun -Verbose
.\deploy-staging-enhanced.ps1 -Mode update-with-data -DryRun -Verbose
.\deploy-staging-enhanced.ps1 -Mode clean -DryRun -Verbose
```

```bash
# Server - Test without making changes
sudo bash deploy-master-enhanced.sh production --mode=update-only --dry-run --verbose
sudo bash deploy-master-enhanced.sh production --mode=update-with-data --dry-run --verbose
sudo bash deploy-master-enhanced.sh production --mode=clean --dry-run --verbose
```

### Monitor Deployment

```powershell
# Watch logs in real-time (Windows)
Get-Content -Path deployment_logs\deploy_*.log -Tail 50 -Wait

# On server - Check container status
ssh root@165.245.191.216
docker-compose ps

# View Docker logs
docker-compose logs -f

# View specific service
docker-compose logs -f django
docker-compose logs -f frontend

# Exit SSH
exit
```

---

## 🔍 Verification Commands

### After Deployment

```bash
# SSH to server
ssh root@165.245.191.216

# Check containers
docker-compose ps
# Expected: All showing "RUNNING"

# Check API
curl http://127.0.0.1:8002/health/
# Expected: HTTP 200

# Check frontend
curl http://127.0.0.1:5175/ | head -20

# Check database
docker-compose exec -T django python manage.py shell -c "from django.contrib.auth import get_user_model; print(f'Users: {get_user_model().objects.count()}')"

# Check migrations
docker-compose exec -T django python manage.py showmigrations

# View logs
docker-compose logs --tail=50

# Check CPU/Memory
docker stats --no-stream

# Check disk space
df -h

# Exit SSH
exit
```

---

## 🗄️ Database Management

### Local Database (Windows)

```powershell
# Check PostgreSQL version
psql --version

# List databases
psql -U postgres -l

# Check specific database
psql -U postgres -d kmsdb -c "SELECT COUNT(*) FROM auth_user;"

# Export database
$env:PGPASSWORD = "Okkdpdri@2026"
pg_dump -U postgres -h localhost -v kmsdb > backup.sql
$env:PGPASSWORD = ""

# Import database
$env:PGPASSWORD = "Okkdpdri@2026"
psql -U postgres -h localhost -d kmsdb < backup.sql
$env:PGPASSWORD = ""

# Connect to database
psql -U postgres -h localhost -d kmsdb
```

### Remote Database (On Server)

```bash
# Check PostgreSQL
psql --version

# List databases
psql -U postgres -l

# Check database
sudo su - postgres
psql -d kmsdb -c "SELECT COUNT(*) FROM auth_user;"
exit

# Backup database
export PGPASSWORD='Okkdpdri@2026'
pg_dump -h localhost -U postgres kmsdb > backup.sql

# Restore database
export PGPASSWORD='Okkdpdri@2026'
psql -h localhost -U postgres kmsdb < backup.sql
unset PGPASSWORD
```

---

## 📁 File Management

### Media Files

```powershell
# Check local media
Get-ChildItem -Path ".\media" -Recurse | Measure-Object

# Copy media (manual)
robocopy .\media Z:\backup\media /MIR
```

```bash
# Check server media
ls -lh /var/www/html/kms/media/

# Backup media
cp -r /var/www/html/kms/media /var/www/html/kms/media_backup_$(date +%Y%m%d)

# Restore media
cp -r /var/www/html/kms/media_backup_YYYYMMDD/* /var/www/html/kms/media/
```

### Backup Files

```bash
# On server - Check backups
ls -lh backups/

# Clean old backups
rm backups/db_backup_*.sql -i  # -i for confirmation

# Restore from backup
export PGPASSWORD='Okkdpdri@2026'
psql -h localhost -U postgres kmsdb < backups/db_backup_LATEST.sql

# Restore media from backup
cp -r backups/media_backup_LATEST/* media/
```

---

## 🐳 Docker Commands

### Container Management

```bash
# SSH to server first
ssh root@165.245.191.216
cd /var/www/html/kms

# List running containers
docker-compose ps

# Start/Stop containers
docker-compose up -d      # Start
docker-compose down        # Stop

# Restart specific container
docker-compose restart django
docker-compose restart frontend

# Restart all
docker-compose restart

# Remove all containers
docker-compose down -v    # Remove volumes too
```

### Building & Deployment

```bash
# Build images (with cache)
docker-compose build

# Build images (without cache - clean build)
docker-compose build --no-cache

# View images
docker images

# Push to registry (if needed)
docker-compose push

# Pull updates
docker pull IMAGE_NAME
```

### Debugging

```bash
# Execute command in container
docker-compose exec django bash
docker-compose exec frontend bash

# View logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific container
docker-compose logs django

# Django shell
docker-compose exec django python manage.py shell
```

---

## 🔧 Environment Configuration

### Update Configuration

```powershell
# Edit Windows config
notepad .\.env

# Edit staging config
notepad .\.env.staging

# Copy to server
scp -i "ssh_key" .\.env.staging root@165.245.191.216:/path/to/project/
```

### Environment Variables

```bash
# Check current environment
env | grep KMS
env | grep DJANGO

# Set temporary environment variable
export PGPASSWORD='password'

# Remove environment variable
unset PGPASSWORD

# Make permanent (add to ~/.bashrc)
echo "export VAR_NAME=value" >> ~/.bashrc
source ~/.bashrc
```

---

## 🚨 Emergency Commands

### Kill Stuck Process

```powershell
# Kill SSH (Windows)
taskkill /F /IM ssh.exe

# Or
Get-Process ssh | Stop-Process -Force
```

### Emergency Rollback

```bash
# SSH to server
ssh root@165.245.191.216
cd /var/www/html/production

# Stop everything
docker-compose down

# Restore from backup
export PGPASSWORD='Okkdpdri@2026'
psql -h localhost -U postgres kmsdb < backups/db_backup_latest.sql

# Restore media
cp -r backups/media_backup_latest/* media/

# Restart
docker-compose up -d

# Verify
docker-compose ps
curl http://localhost:8002/health/
```

### Check Disk Space

```bash
# Check disk usage
df -h

# Find large files
du -sh /var/www/html/kms/*

# Check Docker data
du -sh /var/lib/docker/

# Clean Docker cache
docker system prune -a
```

---

## 📊 Monitoring

### Real-Time Monitoring

```bash
# Monitor container stats
docker stats

# Monitor specific container
docker stats django

# Monitor with top
docker-compose exec django top

# Monitor logs (live)
docker-compose logs -f

# Monitor system
watch df -h       # Watch disk space
watch free -h     # Watch memory
```

### Performance Checks

```bash
# List processes
ps aux | grep python

# Check load average
uptime

# Memory usage
free -h

# Disk space
df -h

# Network
netstat -tulpn | grep LISTEN
```

---

## 🔐 Security Commands

### SSH Access

```powershell
# Test SSH connection
ssh -i "c:\Users\khair\khaz" -v root@165.245.191.216

# SSH with command execution
ssh -i "c:\Users\khair\khaz" root@165.245.191.216 "docker-compose ps"

# SSH port forwarding
ssh -i "c:\Users\khair\khaz" -L 5432:localhost:5432 root@165.245.191.216
```

### File Permissions

```bash
# Check file permissions
ls -la

# Change permissions
chmod 600 .env          # Read/write owner only
chmod 755 *.sh         # Executable

# Change ownership
chown root:root .env
```

### SSL Certificates

```bash
# Check certificate
openssl x509 -in /path/to/cert.crt -text -noout

# Check renewal
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal
```

---

## 📚 Git Commands (if needed)

```bash
# Check status
git status

# View changes
git diff

# Commit changes
git add .
git commit -m "message"

# Push to remote
git push origin main

# Pull latest
git pull origin main

# View history
git log --oneline -n 10

# Revert to previous commit
git reset --hard origin/main
```

---

## 💡 Useful Tips

### Color Output (PowerShell)

```powershell
Write-Host "Success!" -ForegroundColor Green
Write-Host "Warning!" -ForegroundColor Yellow
Write-Host "Error!" -ForegroundColor Red
```

### Search Logs

```bash
# Search for errors
grep -i error deployment_logs/*.log

# Search for specific term
grep "migration" deployment_logs/*.log

# Show with context
grep -B 5 -A 5 "error" deployment_logs/*.log
```

### Quick Testing

```bash
# Test API endpoint
curl http://localhost:8002/api/v1/health/

# GET with headers
curl -H "Content-Type: application/json" http://localhost:8002/api/

# POST data
curl -X POST -d '{"key":"value"}' http://localhost:8002/api/

# With authentication
curl -H "Authorization: Bearer TOKEN" http://localhost:8002/api/
```

---

## 📖 Command Cheat Sheet

| Task | Command |
|------|---------|
| Deploy staging | `.\deploy-staging-enhanced.ps1 -Mode update-only` |
| Deploy production | `sudo bash deploy-master-enhanced.sh production --mode=update-only` |
| Test dry-run | `.\deploy-staging-enhanced.ps1 -Mode update-only -DryRun` |
| Check containers | `docker-compose ps` |
| View logs | `docker-compose logs -f` |
| Restart Django | `docker-compose restart django` |
| Database shell | `docker-compose exec django python manage.py shell` |
| Rollback DB | `psql -U postgres kmsdb < backup.sql` |
| Exit SSH | `exit` |
| Kill SSH hang | `taskkill /F /IM ssh.exe` |

---

**Version:** 3.0  
**Last Updated:** April 19, 2026  
**Status:** ✅ Complete
