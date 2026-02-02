# PostgreSQL Local Setup - Quick Reference

## 1. System Requirements

- PostgreSQL 12+ running on `localhost:5432`
- Username: `postgres`
- Password: `Okkdpdri2026`
- Database: `kmsdb`

## 2. Before First Run

```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Create database if it doesn't exist
psql -U postgres -c "CREATE DATABASE kmsdb;"

# Verify database exists
psql -U postgres -l | grep kmsdb
```

## 3. Backend Setup

```bash
cd backend

# Install Python dependencies (first time only)
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create superuser (optional, first time only)
python manage.py createsuperuser

# Start Django backend (runs on port 8002)
python manage.py runserver 8002
# OR
python run_server.py
```

## 4. Frontend Setup

```bash
cd frontend

# Install Node dependencies (first time only)
npm install

# Start Vite dev server (runs on port 5175)
npm run dev
```

## 5. Access Points

- **Frontend:** http://localhost:5175
- **Backend API:** http://localhost:8002
- **Django Admin:** http://localhost:8002/admin/
- **API Documentation:** http://localhost:8002/api/docs/ (if Swagger enabled)

## 6. Database Configuration

**File:** `backend/.env`

```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kmsdb
DB_USER=postgres
DB_PASSWORD=Okkdpdri2026
DB_HOST=localhost
DB_PORT=5432
```

**Django Settings:** `backend/config/settings.py` (line 109-120)

```python
DATABASES = {
    'default': {
        'ENGINE': env('DB_ENGINE', default='django.db.backends.postgresql'),
        'NAME': env('DB_NAME', default='kmsdb'),
        'USER': env('DB_USER', default='postgres'),
        'PASSWORD': env('DB_PASSWORD', default='Okkdpdri2026'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 0,
        'OPTIONS': {'connect_timeout': 10},
        'ATOMIC_REQUESTS': True,
    }
}
```

## 7. Troubleshooting

### PostgreSQL Not Running
**macOS:**
```bash
brew services start postgresql
```

**Linux:**
```bash
sudo systemctl start postgresql
```

**Windows:**
- Open Services app → Find PostgreSQL → Right-click → Start
- Or: `net start PostgreSQL-x64-15`

### Can't Connect to Database
```bash
# Test connection
psql -U postgres -h localhost -d kmsdb

# If failed, check:
# 1. PostgreSQL is running
# 2. Database exists: psql -U postgres -l
# 3. Password is correct
# 4. Port is 5432 (not 5433 or other)
```

### Django Migration Errors
```bash
# Reset migrations (⚠️ removes all data)
python manage.py migrate --plan  # Preview
python manage.py migrate zero auth  # Rollback specific app
python manage.py migrate  # Fresh migrations

# Or check for problems
python manage.py check --deploy
```

### Frontend Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 8. Development Workflow

1. **Start PostgreSQL** (keep running)
2. **Terminal 1:** Backend
   ```bash
   cd backend && python manage.py runserver 8002
   ```
3. **Terminal 2:** Frontend
   ```bash
   cd frontend && npm run dev
   ```
4. **Open Browser:** http://localhost:5175

## 9. Important Files

- **Backend Config:** [backend/config/settings.py](backend/config/settings.py)
- **Database Credentials:** [backend/.env](backend/.env)
- **Frontend Config:** [frontend/vite.config.js](frontend/vite.config.js)
- **Docker (Optional):** [docker-compose.yml](docker-compose.yml)

## 10. No SQLite!

- ✅ SQLite completely removed
- ✅ Only PostgreSQL used
- ✅ No Docker database needed
- ✅ Local machine setup only

---

**Last Updated:** Database Migration Complete
**Status:** ✅ Ready for Development
