# Port Configuration Reference - KMSetjen DPD RI

## System Architecture

```
Frontend (Vite Dev Server)
    Port: 5175
    Proxy to Backend API: /api → http://localhost:8002
        ↓
Backend (Django)
    Port: 8002 (FIXED - ALL CONFIGURATIONS)
        ↓
PostgreSQL
    Port: 5432
    
Redis Cache
    Port: 6382
```

---

## Port Configuration Checklist

### ✅ Backend - Port 8002 Configurations

| File | Configuration | Status |
|------|---------------|--------|
| `backend/config/management/commands/runserver.py` | Custom Django command that defaults to 8002 | ✅ ACTIVE |
| `backend/Dockerfile` | `EXPOSE 8002` + `gunicorn --bind 0.0.0.0:8002` | ✅ CONFIGURED |
| `docker-compose.yml` | Backend service: `ports: - "8002:8002"` | ✅ MAPPED |
| `backend/run_backend.py` | Startup script: `runserver 0.0.0.0:8002` | ✅ PROVIDED |
| `deploy.ps1` | Health check: `http://localhost:8002/` | ✅ CORRECT |

### ✅ Frontend - Proxy to Backend:8002

| File | Configuration | Status |
|------|---------------|--------|
| `frontend/vite.config.js` | `proxy: { '/api': { target: 'http://localhost:8002' } }` | ✅ CONFIGURED |
| `frontend/.env` | `VITE_API_URL=http://localhost:8002` | ✅ SET |
| `frontend/.env.local` | `VITE_API_URL=http://localhost:8002` | ✅ SET |
| `frontend/.env.example` | `VITE_API_BASE_URL=http://localhost:8002/api` | ✅ DOCUMENTED |

### ✅ Database & Cache

| Service | Port | Status |
|---------|------|--------|
| PostgreSQL | 5432 | ✅ CONFIGURED |
| Redis | 6382 | ✅ CONFIGURED |

---

## How to Start Backend

### Option 1: Using Custom Startup Script (Recommended)
```bash
cd backend
python run_backend.py
```
**Result:** Starts on `http://0.0.0.0:8002`

### Option 2: Using Django Management Command
```bash
cd backend
python manage.py runserver
```
**Result:** Starts on `http://0.0.0.0:8002` (uses custom command with BACKEND_PORT default)

### Option 3: Direct Command with Explicit Port
```bash
cd backend
python manage.py runserver 0.0.0.0:8002
```
**Result:** Starts on `http://0.0.0.0:8002`

### Option 4: Using Environment Variable
```bash
$env:BACKEND_PORT = "8002"
cd backend
python manage.py runserver
```
**Result:** Starts on `http://0.0.0.0:8002`

### Option 5: Using Docker Compose
```bash
docker-compose up backend
```
**Result:** Starts on `http://0.0.0.0:8002` (exposed as 8002:8002)

---

## Frontend Startup

```bash
cd frontend
npm run dev
```
**Result:**
- Frontend: `http://localhost:5175`
- Backend Proxy: `/api` → `http://localhost:8002/api`
- Auto-reload on save

---

## Verification

### Check Backend is Running on 8002
```bash
curl http://localhost:8002/health/
curl http://localhost:8002/ready/
```

### Check Frontend Proxy Works
```bash
# From frontend dev tools network tab, API calls should go to:
# http://localhost:8002/api/v1/...
```

### Check Docker Configuration
```bash
docker-compose config | grep -A2 "backend:"  # See port mappings
docker-compose ps                             # See running services
```

---

## Configuration Summary

✅ **Backend:** FIXED to port 8002 everywhere
✅ **Frontend:** Correctly proxies to backend:8002
✅ **Docker:** Correctly maps 8002:8002
✅ **Database:** PostgreSQL on 5432
✅ **Cache:** Redis on 6382

**All systems configured for port 8002. No conflicts.**

---

Generated: February 2, 2026
