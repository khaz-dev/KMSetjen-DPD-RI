# 🚀 Quick Deployment Reference

## One-Command Deployment

```powershell
cd "d:\Project\KMSetjen DPD RI"
.\deploy.ps1 -Environment staging -SkipBackup -SkipTests
```

## Manual Deployment Steps

```powershell
# 1. Clean up
docker-compose down -v

# 2. Build fresh images
docker-compose build --no-cache

# 3. Start services
docker-compose up -d

# 4. Verify health
docker-compose ps
docker-compose exec django curl http://localhost:8002/health/
```

## Testing Endpoints

```powershell
# Health check
curl http://localhost:8002/health/

# Root API
curl http://localhost:8002/

# Articles list
curl http://localhost:8002/api/v1/articles/

# From inside container
docker-compose exec -T django curl http://localhost:8002/api/v1/articles/
```

## View Logs

```powershell
# All services
docker-compose logs -f

# Django only
docker-compose logs -f django

# Redis only
docker-compose logs -f redis

# Last 50 lines
docker-compose logs --tail=50 django
```

## Troubleshooting

### Issue: 301 Redirect Loops
**Cause:** DEBUG=False forcing HTTPS redirect
**Fix:** Set `DEBUG=True` in `.env` and recreate container
```powershell
docker-compose down django
docker-compose up -d django
```

### Issue: Build Fails with Package Error
**Cause:** Non-existent packages in requirements.txt
**Fix:** Run clean build
```powershell
docker-compose build --no-cache
```

### Issue: Database Connection Refused
**Cause:** PostgreSQL not running on host
**Fix:** Start PostgreSQL (check `DB_HOST` in .env - should be `host.docker.internal`)

### Issue: Container Exits Immediately
**Cause:** Check Django logs
```powershell
docker logs kms_django
```

## Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| `.env` | Main environment config | Root |
| `.env.example` | Configuration template | Root |
| `docker-compose.yml` | Service definitions | Root |
| `deploy.ps1` | Deployment script | Root |
| `deploy.sh` | Deployment script | docs/ |

## Services Running

| Service | Port | Status |
|---------|------|--------|
| Django API | 8002 | Running ✅ |
| Redis Cache | 6379 | Running ✅ |
| PostgreSQL | 5432 | Local (not in Docker) |

## Database Access

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d kmsdb

# Check article count
psql -h localhost -U postgres -d kmsdb -c "SELECT COUNT(*) FROM content_article;"
```

## Common Docker Commands

```powershell
# Show running containers
docker ps

# Show all containers (including stopped)
docker ps -a

# Show images
docker images

# Remove image
docker rmi kmsetjendpdri-django

# Run shell in container
docker exec -it kms_django bash

# Execute command in container
docker exec kms_django python manage.py migrate

# View container stats
docker stats kms_django
```

## Environment Variables (Key Settings)

```env
# Core Django
DEBUG=True                              # Development mode
SECRET_KEY=your-secret-key              # Django secret
ALLOWED_HOSTS=localhost,127.0.0.1,django

# Database
DB_ENGINE=django.db.backends.postgresql
DB_HOST=host.docker.internal            # From Docker, connects to host
DB_PORT=5432
DB_NAME=kmsdb
DB_USER=postgres
DB_PASSWORD=Okkdpdri@2026

# Redis
REDIS_PASSWORD=redis123

# API
CORS_ALLOWED_ORIGINS=http://localhost:5175

# SSL/HTTPS
SECURE_SSL_REDIRECT=False               # Set to False for development
```

## Reset Everything

```powershell
# Full reset (removes volumes and images)
docker-compose down -v
docker rmi kmsetjendpdri-django

# Then rebuild
docker-compose build --no-cache
docker-compose up -d
```

## Performance Tips

- Use `docker-compose up -d` to run in background
- Add `--parallel 4` to docker-compose build for faster builds
- Monitor with `docker stats` if experiencing slowness
- Check logs with `docker logs` for errors

---

**Last Updated:** February 2, 2026  
**Status:** All services verified and operational ✅
