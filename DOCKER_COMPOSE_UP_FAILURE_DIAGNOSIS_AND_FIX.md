# Docker Compose Up -d Failure: Root Cause & Complete Fix
**Error:** `KeyError: 'ContainerConfig'` in docker-compose 1.29.2
**Date:** April 14, 2026

---

## ROOT CAUSE ANALYSIS

### The Problem
```
ERROR: for 228bb26bf852_kms_django  'ContainerConfig'
KeyError: 'ContainerConfig'
```

This error occurs in **docker-compose 1.29.2** (EOL version from 2021) when:
1. **Stale/corrupted container exists** with outdated image reference
2. **Image metadata is incomplete** after rebuild
3. **docker-compose tries to recreate** container but fails reading image config

Your evidence:
```
root@khaz-server:/var/www/html/kmsetjendpdri# docker-compose ps
228bb26bf852_kms_django   gunicorn --bind 0.0.0.0:80 ...   Exit 0
```

Notice: Port shows `0.0.0.0:80` but Dockerfile exposes `8002` → **stale container corruption**

### Why It Happened
1. Old containers still exist from previous deployments
2. Image rebuild created new image but old container is orphaned
3. docker-compose 1.29.2 lacks proper cleanup logic
4. Container ID mismatch causes metadata lookup to fail

---

## TWO SOLUTIONS

### ⭐ SOLUTION 1: Quick Fix (Recommended - 2 minutes)
Clean up stale containers and rebuild from scratch:

```bash
# SSH to staging server
cd /var/www/html/kmsetjendpdri

# Step 1: Stop all containers safely
docker-compose down

# Step 2: Remove orphaned containers and dangling images
docker container prune -f
docker image prune -f
docker system prune -f

# Step 3: Verify .env file has correct settings
cat .env | grep VITE_APP_SUBPATH
# Should output: VITE_APP_SUBPATH=/kms

# Step 4: Rebuild everything from scratch
docker-compose build --no-cache

# Step 5: Start fresh
docker-compose up -d

# Step 6: Verify all containers healthy
sleep 5
docker-compose ps
docker-compose logs django | tail -20
docker-compose logs frontend | tail -20
```

---

### SOLUTION 2: Deep Clean (If Solution 1 fails)
Remove everything and start fresh:

```bash
cd /var/www/html/kmsetjendpdri

# Step 1: Stop containers
docker-compose down

# Step 2: Remove all project-specific images
docker rmi kmsetjendpdri_django:latest kmsetjendpdri_frontend:latest 2>/dev/null || true

# Step 3: Full system cleanup
docker system prune -a -f
docker volume prune -f

# Step 4: Rebuild with no cache
docker-compose build --no-cache --force-rm

# Step 5: Start services
docker-compose up -d

# Step 6: Check logs for errors
docker-compose logs -f
```

---

## DEEPER INVESTIGATION (If Both Fail)

### Check Docker daemon health:
```bash
# Verify Docker is functioning properly
docker stats --no-stream

# Check for corrupted images
docker image inspect kmsetjendpdri_django:latest

# Restart Docker daemon if needed (nuclear option)
sudo systemctl restart docker
```

### Check docker-compose version compatibility:
```bash
# Current version (likely 1.29.2 - old, unsupported)
docker-compose --version

# If you see 1.29.2, consider upgrading
# Upgrade to newer docker-compose (if root available):
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

---

## WHAT TO CHECK BEFORE DEPLOYMENT

### 1. Environment Configuration
```bash
# Verify .env is correct
grep -E "VITE_APP_SUBPATH|VITE_API_BASE_URL" .env

# Expected for staging:
# VITE_APP_SUBPATH=/kms
# VITE_API_BASE_URL=https://khaz.app/kms/api
```

### 2. All Containers Running
```bash
# Check each service
docker-compose ps

# Expected state - ALL services with "Up":
# kms_redis              - Up (healthy)
# kms_django             - Up (healthy)
# kms_frontend           - Up (healthy)
```

### 3. Django Container Logs
```bash
# Check for startup errors
docker-compose logs django | tail -50

# Look for these indicators:
# ✅ "health check passed"
# ✅ "Listening on 127.0.0.1:8002"
# ❌ "connection refused" = Database issue
# ❌ "CRITICAL" = Django app issue
```

### 4. Frontend Container Logs
```bash
docker-compose logs frontend | tail -20

# Should show:
# ✅ "accepting connections on 5175"
```

### 5. API Connectivity Test
```bash
# Test from staging server
curl http://localhost:8002/health/

# Expected: 200 OK with JSON response
```

---

## COMMON ISSUES & SOLUTIONS

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Stale containers** | `KeyError: 'ContainerConfig'` | `docker-compose down` then `up -d` |
| **Image corruption** | Build succeeds, up fails | Use `--no-cache` flag |
| **Port already in use** | `bind: address already in use` | Kill process: `lsof -i :8002` |
| **Volume permission** | Volume mount fails | Run as same user or fix perms |
| **Old PostgreSQL version** | `PSYCOPG2 connection refused` | Check DB_HOST in .env |
| **Redis connection** | Redis handshake error | Verify REDIS_PASSWORD |

---

## COMPLETE DEPLOYMENT CHECKLIST

```bash
# 1. Update code from GitHub
git pull origin main

# 2. Check .env configuration
ls -la .env .env.staging
cp .env.staging .env  # If needed

# 3. Clean Docker environment
docker system prune -f

# 4. Rebuild containers
docker-compose down
docker-compose build --no-cache

# 5. Start services
docker-compose up -d
sleep 10

# 6. Verify health
docker-compose ps
docker-compose logs --tail=30

# 7. Test endpoints
curl http://localhost:8002/health/
curl http://localhost:5175/

# 8. Check in browser
# Go to: https://khaz.app/kms/
# Verify: Images load (perpustakaan.jpg, jdih.png, ppid.jpg)
# Verify: No 404 errors in console
```

---

## EXPECTED OUTCOME

After running Solution 1:

✅ All three containers running and healthy
✅ Django API responding on localhost:8002
✅ Frontend accessible on port 5175
✅ Nginx proxying correctly to /kms/
✅ Images loading from correct subpath (/kms/perpustakaan.jpg)
✅ No API 502 errors
✅ Zero console errors

---

## IF STILL FAILING

Collect diagnostic info and share:
```bash
# 1. Get docker-compose version
docker-compose --version

# 2. Get Docker version
docker --version

# 3. Get full error from logs
docker-compose down
docker-compose up 2>&1 | tee deployment_error.log

# 4. Get container details
docker ps -a
docker images

# 5. Share the error.log file
```

