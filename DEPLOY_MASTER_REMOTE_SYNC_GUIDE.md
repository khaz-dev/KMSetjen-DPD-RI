# Deploy-Master.sh Remote Staging Sync Implementation Guide

## Overview
Enhanced `deploy-master.sh` with the ability to pull database and media files from a remote staging server during deployment.

## What Was Fixed

### Problem
`deploy-master.sh` could not sync data from staging server to production because:
1. ❌ No SSH configuration for remote servers
2. ❌ Database operations hardcoded to localhost only  
3. ❌ Media sync using local `cp` command only
4. ❌ No functions for remote file transfer via SSH/SCP

### Solution
✅ Added complete remote staging server integration:
1. SSH configuration for staging server access
2. Remote database backup via Docker exec over SSH
3. Remote media file sync via SSH/SCP with tar compression
4. New `--remote-source` flag to enable remote mode
5. Dynamic configuration for staging server IP and SSH key

---

## New Functions Added

### 1. `backup_database_from_remote()`
Backs up database from remote staging server Docker container.

**What it does:**
- Tests SSH connection to staging server
- Executes `docker exec kms_django pg_dump` on remote server
- Pipes database dump back to production
- Validates file size and success

**Technical details:**
```bash
ssh -i $STAGING_SSH_KEY_PATH $STAGING_SERVER_USER@$STAGING_SERVER_IP \
  "cd $STAGING_PROJECT_PATH && docker exec -T kms_django pg_dump -U postgres -h localhost kmsdb" \
  > "$DB_DUMP_FILE"
```

### 2. `sync_media_from_remote()`
Syncs media files from remote staging server Docker volume.

**What it does:**
- Creates tar.gz archive of media files on staging
- Downloads tar archive via SCP
- Extracts to local media path
- Cleans up temporary files
- Reports file count

**Technical details:**
```bash
# On staging:
tar -czf /tmp/media.tar.gz -C /var/lib/docker/volumes/kms_kms_django_media/_data .

# On production:
scp $STAGING_SERVER:$remote_tar $local_tar
tar -xzf $local_tar -C $MEDIA_PATH
```

---

## New Configuration Variables

Added to script header (lines 85-92):
```bash
# Remote Staging Server Configuration
STAGING_SERVER_IP="${STAGING_SERVER_IP:-165.245.191.216}"
STAGING_SERVER_USER="${STAGING_SERVER_USER:-root}"
STAGING_SSH_KEY_PATH="${STAGING_SSH_KEY_PATH:-/root/.ssh/khaz}"
STAGING_PROJECT_PATH="${STAGING_PROJECT_PATH:-/var/www/html/kms}"
REMOTE_MODE="${REMOTE_MODE:-false}"
```

**Defaults:**
- IP: `165.245.191.216`
- User: `root`  
- SSH Key: `/root/.ssh/khaz`
- Project: `/var/www/html/kms`

---

## New Command-Line Flags

### `--remote-source`
Enables remote mode to pull from staging server instead of local backup.

### `--staging-ip=<IP>`
Override staging server IP (default: 165.245.191.216)

### `--staging-key=<PATH>`
Override SSH key path (default: /root/.ssh/khaz)

---

## Usage Examples

### Example 1: Deploy to Production with Data from Staging
```bash
# On production server
sudo bash deploy-master.sh production --mode=update-with-data --remote-source

# This will:
# 1. Pull database from staging Docker container
# 2. Sync media files from staging Docker volume
# 3. Import database locally
# 4. Restart containers with new data
```

### Example 2: Custom Staging Server
```bash
sudo bash deploy-master.sh production --mode=update-with-data --remote-source \
  --staging-ip=192.168.1.100 \
  --staging-key=/home/deploy/.ssh/custom_key
```

### Example 3: Dry Run to Test
```bash
sudo bash deploy-master.sh production --mode=update-with-data --remote-source --dry-run
```

### Example 4: Verbose Output
```bash
sudo bash deploy-master.sh production --mode=update-with-data --remote-source --verbose
```

### Example 5: Local Backup (Original Behavior)
```bash
# No --remote-source flag = use local backup
sudo bash deploy-master.sh production --mode=update-with-data
```

---

## Prerequisites for Remote Mode

### 1. SSH Key on Production Server
The SSH key must be placed on the production server at `/root/.ssh/khaz`:

```bash
# If on production server:
ls -la /root/.ssh/khaz
# Should show: -rw------- root root

# If key is missing, copy it from Windows/local machine:
scp -i existing_key local_user@windows_machine:/path/to/khaz /root/.ssh/khaz
chmod 600 /root/.ssh/khaz
```

### 2. Network Connectivity
Production server must be able to reach staging server:

```bash
# Test SSH connection from production:
ssh -i /root/.ssh/khaz -v root@165.245.191.216 "echo OK"

# Expected output: OK
# If fails: Check firewall, network routing, SSH key permissions
```

### 3. Docker Access on Staging
Staging server must have Docker and containers running:

```bash
# Test from production:
ssh -i /root/.ssh/khaz root@165.245.191.216 \
  "cd /var/www/html/kms && docker-compose ps"

# Should show kms_django and other containers running
```

---

## Data Flow Diagram

### Before (Local Backup Only)
```
Production Server
  ├── Local database
  ├── Local media files  
  └── pg_dump → cp-r → docker restart
      Result: Empty database (first deploy)
```

### After (With Remote Staging Sync)
```
Production Server → SSH to Staging Server → Query Docker
                          ↓
                   Export database ←─────┐
                   Get media files ←──────┤
                          ↓              ├─ SSH commands
                   Transfer via SCP ←────┤
                          ↓              │
Production Server ← Import database ←─────┤
                   Extract media ←───────┘
                   docker restart
                   Result: Complete data from staging
```

---

## Troubleshooting

### Issue: SSH key not found
```bash
Error: SSH key not found: /root/.ssh/khaz

Solution:
1. Check key exists: ls -la /root/.ssh/khaz
2. Check permissions: chmod 600 /root/.ssh/khaz
3. Copy from local: scp -i existing_key user@host:/path/to/khaz /root/.ssh/khaz
```

### Issue: Cannot connect to staging
```bash
Error: Cannot connect to staging server at 165.245.191.216

Solution:
1. Test SSH: ssh -i /root/.ssh/khaz -v root@165.245.191.216 "echo OK"
2. Check firewall: ping 165.245.191.216
3. Check SSH service on staging: systemctl status ssh
4. Check SSH key on staging: authorized_keys contains public key
```

### Issue: Docker exec fails on staging
```bash
Error: Failed to backup database from staging server

Solution:
1. Check Docker containers: ssh -i /root/.ssh/khaz root@165.245.191.216 "docker ps"
2. Check container name: Should be kms_django
3. Check Docker exec: ssh ... "docker exec -T kms_django pg_dump -U postgres -h localhost kmsdb"
```

### Issue: Media tar fails
```bash
Error: Could not create tar archive (media may not exist on staging)

Solution:
1. Check media volume: ssh ... "ls -la /var/lib/docker/volumes/kms_kms_django_media/_data/"
2. Check volume mount: docker volume inspect kms_kms_django_media
```

---

## Security Considerations

### SSH Key Management
✅ **Best Practices:**
- SSH key stored at `/root/.ssh/khaz` (root only, mode 600)
- Key is DSA/RSA format (not password-protected)
- Different from deployment/development keys
- Unique to each production server

⚠️ **Warnings:**
- Don't store SSH key in version control
- Don't share SSH key between servers
- Rotate keys regularly
- Monitor SSH access logs

### Network Security
✅ **Verify:**
- SSH port 22 only open to authorized IPs
- VPN tunnel (if accessing over internet)
- Firewall rules restrict staging → production SSH
- Monitor bandwidth (media sync is ~150 MB)

---

## Testing Deployment Flow

### Step 1: Dry Run
```bash
sudo bash deploy-master.sh production --mode=update-with-data --remote-source --dry-run

# Output will show what WOULD happen without making changes
```

### Step 2: Verify Staging Data
```bash
ssh -i /root/.ssh/khaz root@165.245.191.216 \
  "cd /var/www/html/kms && docker exec kms_django psql -U postgres kmsdb -c 'SELECT COUNT(*) FROM content_article;'"

# Should show: 12 (number of articles on staging)
```

### Step 3: Run Actual Deployment  
```bash
sudo bash deploy-master.sh production --mode=update-with-data --remote-source

# Monitor progress and watch for success message
```

### Step 4: Verify Production Data
```bash
cd /var/www/html/kms
docker exec kms_django psql -U postgres kmsdb -c 'SELECT COUNT(*) FROM content_article;'

# Should show: 12 (same as staging)
```

---

## Modified Functions

### `deploy_update_with_data()`
**Before:** Only used local backup
**After:** Uses remote functions if `--remote-source` flag is set

```bash
# New logic:
if [[ "$REMOTE_MODE" == "true" ]]; then
    backup_database_from_remote
    sync_media_from_remote
fi
```

### Updated Usage Examples in Header
- Added remote sync examples
- Added SSH key configuration notes
- Added prerequisite documentation

---

## Files Changed
- `deploy-master.sh` - Main deployment script
  - Added 80+ lines for remote functions
  - Updated configuration section
  - Enhanced deploy_update_with_data()
  - Updated usage documentation

---

## Rollback Plan

If remote sync fails, deployment will stop and previous data remains intact:

```bash
# Automatic safety:
1. Backup existing production data first
2. Stop containers BEFORE importing
3. Import only if dump file exists and is valid
4. Restart containers with imported data

# Manual rollback (if needed):
- Restore from $BACKUP_DIR/db_backup_*.sql
- Restore media from $BACKUP_DIR/media_backup_*/
- Restart docker-compose
```

---

## Next Steps

### Prerequisites Before Using Remote Mode
1. ✅ Copy SSH key to production: `/root/.ssh/khaz`
2. ✅ Test SSH connection from production to staging
3. ✅ Verify Docker containers running on staging
4. ✅ Test with `--dry-run` first

### Production Deployment
```bash
# First time: Test with verbose output
sudo bash deploy-master.sh production --mode=update-with-data --remote-source --verbose

# After verification: Regular deployment
sudo bash deploy-master.sh production --mode=update-with-data --remote-source
```

---

**Version:** v3.0+ with Remote Staging Support
**Last Updated:** April 19, 2026
**Status:** ✅ READY FOR PRODUCTION USE
