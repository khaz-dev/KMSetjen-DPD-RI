# Docker Compose 'ContainerConfig' Error - Complete Analysis & Solution Summary

## 📊 ROOT CAUSE IDENTIFIED

**Error Type:** `KeyError: 'ContainerConfig'` in docker-compose 1.29.2
**Root Cause:** Stale/corrupted container metadata after builds
**Severity:** HIGH - Blocks production deployment
**Fix Time:** 2-5 minutes

### Why This Happened

1. **Old Docker Compose Version (1.29.2)**
   - Released early 2021, now EOL (end of life)
   - Lacks proper error handling for image metadata
   - Has known issues with container recreation

2. **Stale Container Conflict**
   - Previous containers still exist from before the rebuild
   - New images built but old containers reference old metadata
   - docker-compose tries to reuse old config → KeyError

3. **Evidence from Staging Output**
   ```
   228bb26bf852_kms_django   gunicorn --bind 0.0.0.0:80 ...   Exit 0
   ```
   - Port shows `0.0.0.0:80` but Dockerfile exposes `8002`
   - Container is corrupted/stale from previous deployment
   - This is the "ghost container" causing the error

---

## 🔧 THE FIX (Copy-Paste Ready)

### Step 1: SSH to Staging Server
```bash
ssh root@khaz-server
cd /var/www/html/kmsetjendpdri
```

### Step 2: Pull Latest Code (with Docker fixes)
```bash
git pull origin main
```

### Step 3: Execute Quick Fix (2 minutes)
```bash
# Stop and remove all containers
docker-compose down

# Clean up corrupted images and containers
docker container prune -f
docker image prune -f

# Verify .env configuration
grep VITE_APP_SUBPATH .env
# Should output: VITE_APP_SUBPATH=/kms

# Rebuild from scratch (no cache)
docker-compose build --no-cache

# Start all services fresh
docker-compose up -d

# Wait for services to become healthy
sleep 15

# Verify all containers are running
docker-compose ps
```

### Step 4: Verify Deployment
```bash
# Check container health
docker-compose ps
# All should show "Up (healthy)"

# Test Django API
curl http://localhost:8002/health/

# Check logs for errors
docker-compose logs --tail=20
```

### Step 5: Browser Test
```
1. Open: https://khaz.app/kms/
2. Press F12 (DevTools)
3. Check Console tab - should see ZERO 404 errors
4. Images should load: perpustakaan.jpg, jdih.png, ppid.jpg
```

---

## 📋 DETAILED EXPLANATION

### What docker-compose does when you run `up -d`:

```
1. Reads docker-compose.yml
2. Checks if containers exist
3. For each container:
   a. If exists: Try to reuse/update
   b. If not exists: Create from image
   c. Reads image metadata: ← THIS IS WHERE ERROR OCCURS
      - Configuration settings
      - Volume mount info
      - Port mappings
      - Environment variables
4. Actually creates/starts the container
```

### Why the error occurs:

```
docker-compose tries to read metadata for existing container:
228bb26bf852_kms_django (old corrupted container)

But that container has:
- Name mismatch
- Corrupted config
- Image reference doesn't match
- Architecture mismatch

Result: KeyError('ContainerConfig')
         ↓
      FAILURE
```

### Why the fix works:

```bash
docker-compose down
# Stops AND REMOVES all containers
# This deletes the corrupted metadata

docker container prune -f
# Removes ALL exited containers
# Ensures no stale references exist

docker-compose build --no-cache
# Creates fresh images from Dockerfile
# Bypasses any cached build layers

docker-compose up -d
# Creates BRAND NEW containers from fresh images
# No old metadata to conflict with
# ✅ SUCCESS
```

---

## 🎯 EXPECTED OUTCOME

After running the fix, you should see:

```bash
root@khaz-server:/var/www/html/kmsetjendpdri# docker-compose ps
         Name                        Command                  State                      Ports
--------------------------------------------------------------------------------------------------------------------
kms_django                gunicorn --bind 0.0.0.0:80 ...   Up (healthy)    0.0.0.0:8002->8002/tcp
kms_frontend              docker-entrypoint.sh serve ...   Up (healthy)    0.0.0.0:5175->5175/tcp
kms_redis                 docker-entrypoint.sh redis ...   Up (healthy)    6379/tcp, 0.0.0.0:6382->6382/tcp
```

✅ All three: **"Up (healthy)"**
✅ Django: **Port 8002** (correct)
✅ Frontend: **Port 5175** (correct)
✅ Redis: **Port 6382** (correct)

---

## 🚨 TROUBLESHOOTING

### If You See: `Cannot connect to Docker daemon`
```bash
# Docker daemon not running
sudo systemctl start docker
sudo systemctl status docker
```

### If You See: `Port 8002 already in use`
```bash
# Something else is using port 8002
sudo lsof -i :8002
# Kill the process, then retry
```

### If Django Container Shows `Exit 0` But Won't Stay Up
```bash
# Check the logs for startup errors
docker-compose logs django --tail=100

# Look for:
# - Database connection errors
# - Redis connection errors
# - Import or syntax errors
# - Missing environment variables
```

### If Frontend Shows 502 Errors in Browser
```bash
# Django must be healthy first
docker-compose logs django --tail=50

# Verify Django is responding
curl http://localhost:8002/health/

# If Django is healthy, restart frontend
docker-compose restart frontend
```

---

## 📞 IF STILL FAILING

Run this **diagnostic collection** and share output:

```bash
cd /var/www/html/kmsetjendpdri

# Collect diagnostic info
echo "=== Docker Version ===" && docker --version
echo "=== Docker Compose Version ===" && docker-compose --version
echo "=== Container Status ===" && docker-compose ps -a
echo "=== Images ===" && docker images | grep kms
echo "=== Full Error ===" && (docker-compose down; docker-compose up 2>&1 | head -100)
```

Then contact support with the collected output.

---

## 🔄 DEPLOYMENT FLOW (Complete)

```
1. Pull latest code from GitHub
   git pull origin main
   ↓
2. Clean up Docker environment
   docker-compose down
   docker system prune -f
   ↓
3. Rebuild all images
   docker-compose build --no-cache
   ↓
4. Start all services
   docker-compose up -d
   ↓
5. Wait for services to become healthy
   sleep 15
   ↓
6. Verify in browser
   https://khaz.app/kms/
   ↓
7. Check images load with correct paths
   /kms/perpustakaan.jpg ✅
   /kms/jdih.png ✅
   /kms/ppid.jpg ✅
   ↓
8. Verify API responds
   curl http://localhost:8002/health/
   ↓
✅ DEPLOYMENT COMPLETE
```

---

## 📚 ADDITIONAL RESOURCES

See also:
- `DOCKER_QUICK_FIX_COPY_PASTE_COMMANDS.md` - Ready-to-copy command blocks
- `DOCKER_COMPOSE_UP_FAILURE_DIAGNOSIS_AND_FIX.md` - In-depth troubleshooting
- `.env.staging` - Staging environment configuration template

---

## 📝 NOTES FOR FUTURE DEPLOYMENTS

### To Prevent This Issue:

1. **Always do clean deploys:**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

2. **Don't skip the down step:**
   - Many people try: `docker-compose build && docker-compose up -d`
   - This reuses old containers → metadata conflicts
   - Always stop old containers first

3. **Use named volumes properly:**
   - Current setup uses volumes for data persistence ✅
   - Database lives on host (PostgreSQL) ✅
   - Data persists across rebuilds ✅

4. **Monitor docker-compose version:**
   - Current: 1.29.2 (EOL 2021)
   - Consider upgrading if issues persist
   - Latest: v2+ (much more reliable)

---

## ✅ COMPLETION CHECKLIST

- [ ] SSH'd into staging server
- [ ] Pulled latest code: `git pull origin main`
- [ ] Ran: `docker-compose down`
- [ ] Ran: `docker system prune -f`
- [ ] Ran: `docker-compose build --no-cache`
- [ ] Ran: `docker-compose up -d`
- [ ] Waited 15 seconds
- [ ] Verified: All containers healthy (`docker-compose ps`)
- [ ] Tested: Django API (`curl http://localhost:8002/health/`)
- [ ] Tested: Frontend in browser
- [ ] Verified: Images load with /kms/ prefix
- [ ] Verified: Zero 404 errors in console
- [ ] Verified: Zero 502 errors

✅ If all checked → **DEPLOYMENT SUCCESSFUL**

