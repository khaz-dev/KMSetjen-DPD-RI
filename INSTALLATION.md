# Installation Guide

Complete step-by-step instructions for setting up KMSetjen DPD RI for development and production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Production Setup](#production-setup)
4. [Docker Setup](#docker-setup)
5. [Configuration](#configuration)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Purpose |
|----------|-----------------|---------|
| Python | 3.10 | Backend runtime |
| Node.js | 16 | Frontend build tool |
| npm | 8+ | Package manager |
| Git | 2.30+ | Version control |
| PostgreSQL | 12+ | Database (required) |

### System Requirements

- **OS**: Windows, macOS, Linux
- **RAM**: 4GB minimum (8GB recommended)
- **Disk**: 2GB free space
- **Internet**: Stable connection (for OAuth, npm packages)

### Installation Commands

**Windows (using Chocolatey):**
```bash
choco install python nodejs postgresql git
```

**macOS (using Homebrew):**
```bash
brew install python@3.10 node postgresql git
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install python3.10 python3.10-venv nodejs npm postgresql git
```

**Verify installations:**
```bash
python --version        # Should be 3.10+
node --version          # Should be 16+
npm --version           # Should be 8+
psql --version          # Should be 12+
git --version           # Should be 2.30+
```

---

## Development Setup

### Step 1: Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/khaz-dev/KMSetjen-DPD-RI.git
cd KMSetjen-DPD-RI

# Or use SSH
git clone git@github.com:khaz-dev/KMSetjen-DPD-RI.git
cd KMSetjen-DPD-RI
```

### Step 2: Backend Setup

```bash
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Edit .env with your settings (see Configuration section)

# Run database migrations
python manage.py migrate

# Create superuser (admin account)
python manage.py createsuperuser
# Follow the prompts to set username, email, password

# Start backend server
python manage.py runserver 0.0.0.0:8002
```

**Expected output:**
```
Starting development server at http://127.0.0.1:8002/
Quit the server with CONTROL-C.
```

**Backend is ready when you see:**
- No error messages
- "Quit the server with CONTROL-C"

### Step 3: Frontend Setup (New Terminal)

```bash
cd frontend

# Install npm dependencies
npm install

# Copy environment template
cp .env.example .env.local
# Edit .env.local if needed (see Configuration section)

# Start development server
npm run dev
```

**Expected output:**
```
VITE v4.5.0 starting...

  ➜  Local:   http://localhost:3769/
  ➜  press h + enter to show help
```

**Frontend is ready at:** http://localhost:3769

### Step 4: Access the Application

Open your browser and navigate to:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3769 | Main application |
| **Backend API** | http://localhost:8002/api | REST API |
| **Admin Panel** | http://localhost:8002/admin | Django admin |
| **API Docs** | http://localhost:8002/api/docs | API documentation |

---

## Configuration

### Backend Configuration (.env)

Create `backend/.env` based on `backend/.env.example`:

```bash
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://postgres:Okkdpdri@2026@localhost:5432/kmsdb
# Or for PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/kmsetjen

# Google OAuth (required for login)
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3769/auth/google/callback

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3769,http://localhost:5175

# Email (optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Logging
LOG_LEVEL=DEBUG
```

### Frontend Configuration (.env.local)

Create `frontend/.env.local` based on `frontend/.env.example`:

```bash
# API Configuration
VITE_API_URL=http://localhost:8002/api
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Debug Settings
VITE_DEBUG=true

# Feature Flags
VITE_ENABLE_DARK_MODE=true
VITE_DEFAULT_LANGUAGE=en
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3769`
   - Authorized redirect URIs: `http://localhost:3769/auth/google/callback`
5. Copy Client ID and Client Secret to `.env` files

👉 **[Detailed OAuth setup guide](docs/GOOGLE_LOGIN_SETUP_COMPLETE.md)**

---

## Database Setup

### PostgreSQL Configuration

PostgreSQL must be running with the standard credentials:

```bash
# Verify PostgreSQL is running
psql --version

# Connect to PostgreSQL
psql -U postgres -h localhost

# The database 'kmsdb' will be created automatically during migrations
cd backend
python manage.py migrate
```

### PostgreSQL (Recommended for Production)

**Install PostgreSQL:**
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql`
- **Ubuntu**: `sudo apt-get install postgresql postgresql-contrib`

**Create a database:**
```bash
# Start PostgreSQL service
sudo service postgresql start  # Linux
# macOS: PostgreSQL starts automatically

# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE kmsetjen;
CREATE USER kmsetjen WITH PASSWORD 'your-secure-password';
ALTER ROLE kmsetjen SET client_encoding TO 'utf8';
ALTER ROLE kmsetjen SET default_transaction_isolation TO 'read committed';
ALTER ROLE kmsetjen SET default_transaction_deferrable TO on;
ALTER ROLE kmsetjen SET default_transaction_read_committed TO off;
ALTER ROLE kmsetjen SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE kmsetjen TO kmsetjen;
\q  # Exit psql
```

**Update .env:**
```
DATABASE_URL=postgresql://kmsetjen:your-secure-password@localhost:5432/kmsetjen
```

**Run migrations:**
```bash
cd backend
python manage.py migrate
```

---

## Production Setup

### Step 1: Server Preparation

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade

# Install system dependencies
sudo apt-get install python3.10 python3.10-venv python3-pip
sudo apt-get install nodejs npm
sudo apt-get install postgresql postgresql-contrib
sudo apt-get install nginx
sudo apt-get install git
```

### Step 2: Clone Repository

```bash
sudo mkdir -p /var/www/kmsetjen
sudo chown $USER:$USER /var/www/kmsetjen
cd /var/www/kmsetjen

git clone https://github.com/khaz-dev/KMSetjen-DPD-RI.git
cd KMSetjen-DPD-RI
```

### Step 3: Backend Setup

```bash
cd backend

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Setup environment
cp .env.example .env
# Edit .env with production settings

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser
python manage.py createsuperuser
```

### Step 4: Frontend Setup

```bash
cd ../frontend

# Install and build
npm install
npm run build

# Output goes to frontend/dist/
```

### Step 5: Nginx Configuration

Create `/etc/nginx/sites-available/kmsetjen`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;
    
    # Frontend
    root /var/www/kmsetjen/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Media files
    location /media/ {
        alias /var/www/kmsetjen/backend/media/;
    }
    
    # Static files
    location /static/ {
        alias /var/www/kmsetjen/backend/staticfiles/;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/kmsetjen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Gunicorn Setup

Create `/etc/systemd/system/kmsetjen.service`:

```ini
[Unit]
Description=KMSetjen Gunicorn Service
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/kmsetjen/backend
Environment="PATH=/var/www/kmsetjen/backend/venv/bin"
ExecStart=/var/www/kmsetjen/backend/venv/bin/gunicorn \
    --workers 4 \
    --bind 127.0.0.1:8002 \
    config.wsgi:application

[Install]
WantedBy=multi-user.target
```

Start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl start kmsetjen
sudo systemctl enable kmsetjen
```

👉 **[Full deployment guide](DEPLOYMENT.md)**

---

## Docker Setup

### Option 1: Docker Compose (Easiest)

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Access the application
# Frontend: http://localhost:5175
# Backend: http://localhost:8002
# Admin: http://localhost:8002/admin
```

### Option 2: Individual Docker Containers

**Build images:**
```bash
# Backend
docker build -t kmsetjen-backend ./backend

# Frontend
docker build -t kmsetjen-frontend ./frontend
```

**Run containers:**
```bash
# Backend
docker run -p 8002:8002 --env-file backend/.env kmsetjen-backend

# Frontend (new terminal)
docker run -p 5175:80 kmsetjen-frontend
```

---

## Verification Checklist

After installation, verify everything works:

### Backend
- [ ] `http://localhost:8002/api/articles/` returns JSON
- [ ] `http://localhost:8002/admin` shows Django admin
- [ ] No error messages in terminal
- [ ] Database migrations successful

### Frontend
- [ ] `http://localhost:3769` loads the homepage
- [ ] Page is responsive (works on mobile size)
- [ ] Dark/light mode toggle works
- [ ] Language toggle works (EN/ID)
- [ ] No console errors (F12 → Console)

### OAuth
- [ ] Google OAuth credentials are in `.env` files
- [ ] OAuth callback URL matches Google Cloud Console
- [ ] Login button appears on the page
- [ ] Can click through OAuth flow (may fail at end if not fully configured)

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8002
lsof -i :8002  # macOS/Linux
netstat -ano | findstr :8002  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
python manage.py runserver 0.0.0.0:8002
```

### Database Connection Error

```bash
# Check database URL in .env
# PostgreSQL connection (automatic via .env from DB_NAME, DB_USER, DB_PASSWORD)
# For PostgreSQL: postgresql://user:password@host:5432/dbname

# Verify PostgreSQL is running
sudo service postgresql status  # Linux
brew services list  # macOS

# Reset database (careful - deletes data!)
cd backend
# Database is managed by PostgreSQL, migrations handle schema
python manage.py migrate
```

### Node Modules Issues

```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Virtual Environment Issues

```bash
# Deactivate current environment
deactivate

# Remove old environment
rm -rf backend/venv

# Create new environment
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### OAuth Not Working

- [ ] Check `.env` files have correct Client ID and Secret
- [ ] Verify redirect URI matches Google Cloud Console exactly
- [ ] Clear browser cookies for localhost
- [ ] Check backend logs for error messages
- [ ] See [OAuth troubleshooting guide](docs/GOOGLE_LOGIN_SETUP_COMPLETE.md)

### CORS Errors in Browser Console

```
Access to XMLHttpRequest from origin 'http://localhost:3769' has been blocked

Solution:
1. Check CORS_ALLOWED_ORIGINS in backend/.env
2. Should include: http://localhost:3769
3. Restart backend server after changing .env
```

### Frontend Build Fails

```bash
cd frontend

# Clear cache
npm run clean  # If available
rm -rf dist node_modules

# Reinstall and rebuild
npm install
npm run build
```

### Backend Tests Fail

```bash
cd backend

# Run tests with verbose output
python manage.py test -v 2

# Run specific test
python manage.py test apps.articles.tests.ArticleTestCase
```

---

## Next Steps

1. ✅ **Installation complete!**
2. 📖 Read [README.md](README.md) for project overview
3. 🤝 See [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
4. 🚀 See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
5. 📚 Check [docs/](docs/) for detailed documentation

---

## Need Help?

- 📖 **Documentation**: [docs/README.md](docs/README.md)
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/khaz-dev/KMSetjen-DPD-RI/issues)
- 💬 **Ask Questions**: [GitHub Discussions](https://github.com/khaz-dev/KMSetjen-DPD-RI/discussions)

---

**Happy developing! 🚀**
