# QUICK FIX: Docker Compose 'ContainerConfig' Error - Copy & Paste Commands

## ⚡ 2-MINUTE QUICK FIX (Run on staging server)

```bash
# Navigate to project
cd /var/www/html/kmsetjendpdri

# STEP 1: Stop and remove containers (30 seconds)
docker-compose down

# STEP 2: Clean up Docker system (30 seconds)
docker container prune -f
docker image prune -f

# STEP 3: Verify .env has correct staging config (10 seconds)
grep VITE_APP_SUBPATH .env
# Expected output: VITE_APP_SUBPATH=/kms

# STEP 4: Rebuild containers (2-3 minutes)
docker-compose build --no-cache

# STEP 5: Start all services (20 seconds)
docker-compose up -d

# STEP 6: Wait for services to become healthy
sleep 15

# STEP 7: Check container status (should all be "Up")
docker-compose ps

# STEP 8: Verify Django is responding
curl http://localhost:8002/health/

# STEP 9: Check logs for any errors
docker-compose logs --tail=50
```

---

## 🔍 IF ABOVE FAILS - Try Deep Clean (5 minutes)

```bash
cd /var/www/html/kmsetjendpdri

# Hard stop everything
docker-compose down -v

# Remove images
docker rmi kmsetjendpdri_django:latest kmsetjendpdri_frontend:latest 2>/dev/null || echo "Images not found, OK"

# Full Docker cleanup
docker system prune -a -f
docker volume prune -f

# Rebuild without cache
docker-compose build --no-cache --force-rm

# Start fresh
docker-compose up -d

# Check status
sleep 10
docker-compose ps
docker-compose logs django | tail -30
```

---

## 🚨 IF STILL FAILING - Nuke Option (Complete Reset)

```bash
cd /var/www/html/kmsetjendpdri

# Stop everything
docker-compose down

# Kill all related containers manually
docker stop $(docker ps -a -q --filter="name=kms") 2>/dev/null || echo "No containers to stop"
docker rm $(docker ps -a -q --filter="name=kms") 2>/dev/null || echo "No containers to remove"

# Remove all project images
docker rmi $(docker images -q --filter="reference=kmsetjendpdri*") 2>/dev/null || echo "No images to remove"

# Restart Docker daemon (nuclear option)
sudo systemctl restart docker
sleep 10

# Verify Docker is healthy
docker ps

# Rebuild everything
docker-compose build --no-cache --force-rm

# Start
docker-compose up -d

# Monitor (shows live logs)
docker-compose logs -f
```

---

## ✅ VERIFICATION CHECKLIST

After running quick fix, verify everything:

```bash
# Check all containers are healthy
docker-compose ps
# Output should show: All services "Up (healthy)"

# Test Django API
curl -s http://localhost:8002/health/ | head -20

# Test frontend
curl -s http://localhost:5175/ | head -5

# Check for errors in logs
docker-compose logs django | grep -i error
docker-compose logs frontend | grep -i error

# If no errors output = ✅ SUCCESS
```

---

## 🌐 BROWSER TESTING

Once containers are healthy:

```
1. Open browser: https://khaz.app/kms/
2. Open DevTools (F12) → Console tab
3. Look for image load requests:
   ✅ /kms/perpustakaan.jpg
   ✅ /kms/jdih.png
   ✅ /kms/ppid.jpg
   ✅ Status 200 (not 404)

4. Check for "502 Bad Gateway" errors
   ✅ Should see no 502 errors

5. If images show but say 404:
   - Check .env has: VITE_APP_SUBPATH=/kms
   - Run: docker-compose down && docker-compose build --no-cache && docker-compose up -d
```

---

## 📋 TROUBLESHOOTING BY SYMPTOM

### Symptom: `Cannot connect to Docker daemon`
```bash
sudo systemctl start docker
sudo systemctl status docker
```

### Symptom: `Port 8002 already in use`
```bash
sudo lsof -i :8002
# Kill the process shown, then retry docker-compose up -d
```

### Symptom: `Permission denied`
```bash
# If not root, might need sudo:
sudo docker-compose up -d
# OR add user to docker group:
sudo usermod -aG docker $USER
```

### Symptom: `django container Exit 0 but not staying up`
```bash
# Check logs for startup errors
docker-compose logs django --tail=100
# Look for: database connection, Redis connection, import errors
```

### Symptom: `Frontend container shows 502 errors`
```bash
# Django container must be healthy first
docker-compose logs django --tail=50
# Verify: curl http://localhost:8002/health/
```

---

## 🎯 EXPECTED STATE AFTER FIX

```bash
root@khaz-server:/var/www/html/kmsetjendpdri# docker-compose ps
         Name                        Command                  State                             Ports
----------------------------------------------------------------------------------------------------------------------------
kms_django                gunicorn --bind 0.0.0.0:80 ...   Up (healthy)    0.0.0.0:8002->8002/tcp
kms_frontend              docker-entrypoint.sh serve ...   Up (healthy)    0.0.0.0:5175->5175/tcp,:::5175->5175/tcp
kms_redis                 docker-entrypoint.sh redis ...   Up (healthy)    6379/tcp, 0.0.0.0:6382->6382/tcp
```

✅ **All three containers: "Up (healthy)"**
✅ **Django port: 8002 (not 80)**
✅ **All ports exposed correctly**

---

## 📞 IF STILL STUCK

Collect and share these details:

```bash
# Get system info
docker --version
docker-compose --version
docker-compose ps -a
docker images | grep kms

# Get full error log
docker-compose down
docker-compose up 2>&1 > /tmp/deployment_error.txt
cat /tmp/deployment_error.txt | tail -100
```

Then share the output from the last 100 lines of deployment_error.txt.

