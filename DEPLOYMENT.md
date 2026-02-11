# Production Deployment Guide

Complete guide for deploying KMSetjen DPD RI to production environments.

---

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Docker Deployment](#docker-deployment)
4. [Manual Deployment](#manual-deployment)
5. [Configuration](#configuration)
6. [SSL/TLS Setup](#ssltls-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Scaling](#scaling)

---

## Deployment Options

| Method | Best For | Complexity | Cost |
|--------|----------|-----------|------|
| **Docker (Recommended)** | Most organizations | Low-Medium | Varies |
| **Ubuntu/Linux Server** | On-premise deployment | Medium | Minimal |
| **AWS/Azure/GCP** | Cloud deployment | Medium-High | Pay-per-use |
| **Kubernetes** | Large-scale, high availability | High | Varies |

👉 **Recommended for government deployment:** Docker on-premise Linux server

---

## Pre-Deployment Checklist

### Security Review

- [ ] Change all default passwords
- [ ] Update `SECRET_KEY` in `.env` (use `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall rules (80, 443, 5432 if needed)
- [ ] Set `DEBUG=False` in production `.env`
- [ ] Review CORS settings - whitelist specific origins only
- [ ] Ensure `.env` file is not tracked in git (.gitignore)
- [ ] Remove test/debug data from database
- [ ] Configure secure password hashing (Django defaults are good)
- [ ] Set up regular backups

### Performance Review

- [ ] Enable caching (Redis recommended)
- [ ] Optimize database queries
- [ ] Set up CDN for static files (optional)
- [ ] Configure Gunicorn workers appropriately
- [ ] Enable gzip compression in Nginx
- [ ] Set up monitoring and alerting

### Functionality Review

- [ ] Test all user flows (login, article creation, etc.)
- [ ] Verify OAuth configuration for production Google project
- [ ] Test email notifications
- [ ] Check file upload functionality
- [ ] Test search functionality
- [ ] Verify media file serving
- [ ] Test on multiple browsers

---

## Docker Deployment

### Prerequisites

- Docker installed and running
- Docker Compose installed
- Domain name (for HTTPS)
- SSL certificate (for HTTPS)

### Step 1: Prepare Production Environment

```bash
# Clone repository to production server
git clone https://github.com/your-org/kmsetjen-dpd-ri.git
cd kmsetjen-dpd-ri

# Create production .env file
cp backend/.env.example backend/.env
nano backend/.env  # Edit with production settings
```

### Step 2: Configure Production Environment

Edit `backend/.env`:

```bash
# Django Settings
DEBUG=False
SECRET_KEY=your-long-random-secret-key-here
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Database (use PostgreSQL in production!)
DATABASE_URL=postgresql://kmsetjen:secure_password@db:5432/kmsetjen

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-production-client-secret
GOOGLE_OAUTH_REDIRECT_URI=https://your-domain.com/auth/google/callback

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_BROWSER_XSS_FILTER=True
SECURE_CONTENT_SECURITY_POLICY=True

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Logging
LOG_LEVEL=INFO
SENTRY_DSN=https://your-sentry-dsn@sentry.io/projectid  # Optional error tracking
```

### Step 3: Update Docker Compose

Edit `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: kmsetjen
      POSTGRES_USER: kmsetjen
      POSTGRES_PASSWORD: your_secure_db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kmsetjen"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://kmsetjen:your_secure_db_password@db:5432/kmsetjen
      DEBUG: "False"
    volumes:
      - ./backend/media:/app/media
      - ./backend/staticfiles:/app/staticfiles
    ports:
      - "127.0.0.1:8002:8002"
    depends_on:
      db:
        condition: service_healthy
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      VITE_API_URL: https://your-domain.com/api
      VITE_GOOGLE_CLIENT_ID: your-production-client-id.apps.googleusercontent.com
    ports:
      - "127.0.0.1:5175:80"
    depends_on:
      - backend
    restart: always

  nginx:
    image: nginx:latest
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
      - frontend
    restart: always

volumes:
  postgres_data:
```

### Step 4: Configure Nginx

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

    # HTTP redirect to HTTPS
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Frontend
        location / {
            limit_req zone=general burst=20 nodelay;
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API Backend
        location /api/ {
            limit_req zone=api burst=50 nodelay;
            proxy_pass http://backend:8002;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 30s;
        }

        # Django admin
        location /admin/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend:8002;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Media files
        location /media/ {
            alias /var/www/kmsetjen/backend/media/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### Step 5: Set Up SSL Certificate

```bash
# Option 1: Let's Encrypt (Free)
sudo apt-get install certbot
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Certificates will be in:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem

# Copy to project
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
sudo chown $USER:$USER ./ssl/*

# Set up auto-renewal
sudo certbot renew --dry-run
```

### Step 6: Deploy with Docker Compose

```bash
# Build images
docker-compose build

# Run migrations
docker-compose up -d db
sleep 10  # Wait for database
docker-compose run backend python manage.py migrate

# Create superuser
docker-compose run backend python manage.py createsuperuser

# Collect static files
docker-compose run backend python manage.py collectstatic --noinput

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs -f backend
```

### Step 7: Set Up Automated Backups

```bash
# Create backup script: backup.sh
#!/bin/bash
BACKUP_DIR="/backups/kmsetjen"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T db pg_dump -U kmsetjen kmsetjen | \
  gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup media files
tar -czf $BACKUP_DIR/media_$DATE.tar.gz ./backend/media/

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"

# Make executable and add to cron
chmod +x backup.sh
crontab -e
# Add: 0 2 * * * /path/to/backup.sh  # Daily at 2 AM
```

---

## Manual Deployment

### Prerequisites

- Ubuntu 20.04+ or similar Linux
- Python 3.10+, Node.js 16+
- PostgreSQL 12+
- Nginx
- Systemd

### Step 1: System Setup

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install curl wget htop git

# Install Python
sudo apt-get install python3.10 python3.10-venv python3-pip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install Nginx
sudo apt-get install nginx

# Install Certbot for SSL
sudo apt-get install certbot python3-certbot-nginx
```

### Step 2: Create Application Directory

```bash
sudo mkdir -p /var/www/kmsetjen
sudo chown $USER:$USER /var/www/kmsetjen

cd /var/www/kmsetjen
git clone https://github.com/your-org/kmsetjen-dpd-ri.git .
```

### Step 3: Backend Setup

```bash
cd /var/www/kmsetjen

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install dependencies
cd backend
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Configure environment
cp .env.example .env
nano .env  # Edit with production settings

# Setup database
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput

cd /var/www/kmsetjen
```

### Step 4: Frontend Setup

```bash
cd frontend

# Install and build
npm install
npm run build

# Output is in frontend/dist/
```

### Step 5: Systemd Service

Create `/etc/systemd/system/kmsetjen.service`:

```ini
[Unit]
Description=KMSetjen Gunicorn Service
After=network.target
Wants=kmsetjen-reload.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/var/www/kmsetjen/backend
Environment="PATH=/var/www/kmsetjen/venv/bin"
EnvironmentFile=/var/www/kmsetjen/backend/.env
ExecStart=/var/www/kmsetjen/venv/bin/gunicorn \
    --workers 4 \
    --worker-class sync \
    --worker-tmp-dir /dev/shm \
    --bind 127.0.0.1:8002 \
    --timeout 30 \
    --access-logfile /var/log/kmsetjen/access.log \
    --error-logfile /var/log/kmsetjen/error.log \
    config.wsgi:application

Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo mkdir -p /var/log/kmsetjen
sudo chown www-data:www-data /var/log/kmsetjen

sudo systemctl daemon-reload
sudo systemctl enable kmsetjen
sudo systemctl start kmsetjen
sudo systemctl status kmsetjen
```

### Step 6: Nginx Configuration

Create `/etc/nginx/sites-available/kmsetjen`:

```nginx
# See Docker Deployment section for complete config
# Main differences:
# - proxy_pass http://127.0.0.1:8002 (not http://backend:8002)
# - Use local file paths instead of container volumes
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/kmsetjen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
# Follow prompts
```

---

## Performance Optimization

### Gunicorn Configuration

```ini
# For 4 CPU cores, start with 9 workers
workers = (2 * 4) + 1

# Adjust based on monitoring:
# - If CPU > 80%: increase workers (more concurrency)
# - If memory > available: decrease workers
# - If slow responses: add more workers

# Worker class for I/O bound (database, API calls):
worker_class = sync  # Default

# Worker class for CPU intensive:
worker_class = sync
```

### Database Optimization

```sql
-- Create indexes on frequently queried fields
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_status ON articles(status);

-- Enable query analysis
EXPLAIN ANALYZE SELECT * FROM articles WHERE category_id = 1;
```

### Frontend Optimization

```javascript
// frontend/vite.config.js
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log in production
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'utils': [/* list of util files */],
        },
      },
    },
  },
}
```

### Caching Strategy

```nginx
# Static files - cache for 1 year
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 365d;
    add_header Cache-Control "public, immutable";
}

# API responses - no cache (or short cache)
location /api/ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# HTML - no cache (check frequently)
location / {
    add_header Cache-Control "no-cache, must-revalidate";
}
```

### Redis Caching (Optional)

```bash
# Install Redis
sudo apt-get install redis-server

# Configure Django to use Redis
# In backend/.env:
CACHE_URL=redis://localhost:6382/0

# In settings.py:
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6382/1',
    }
}
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check all services
docker-compose ps
# or
systemctl status kmsetjen nginx postgresql

# Check logs
docker-compose logs backend
# or
tail -f /var/log/kmsetjen/error.log

# Check disk usage
df -h

# Check database size
docker-compose exec db psql -U kmsetjen -d kmsetjen -c "SELECT pg_size_pretty(pg_database_size('kmsetjen'));"
```

### Automated Monitoring

Set up with Prometheus + Grafana or use cloud monitoring:

```bash
# Example: Send metrics to external service
# In backend/.env:
SENTRY_DSN=https://...@sentry.io/...
DATADOG_API_KEY=...
```

### Regular Maintenance

```bash
# Weekly: Check logs for errors
docker-compose logs --tail=100 backend | grep -i error

# Monthly: Update dependencies
pip list --outdated
npm outdated

# Monthly: Clean up old data
python manage.py cleanup_old_sessions
python manage.py cleanup_old_logs

# Quarterly: Full security audit
git security-audit
```

---

## Scaling

### Horizontal Scaling (Multiple Servers)

```nginx
# Load balancer config
upstream backend_servers {
    server backend1.internal:8002;
    server backend2.internal:8002;
    server backend3.internal:8002;
}

server {
    location /api/ {
        proxy_pass http://backend_servers;
    }
}
```

### Database Replication

```bash
# Set up PostgreSQL replication for high availability
# Primary server streams WAL to replicas
# Use pg_basebackup for initial sync
```

---

## Troubleshooting

### Services Not Starting

```bash
# Check Nginx
nginx -t
sudo systemctl status nginx
sudo journalctl -u nginx -n 20

# Check Gunicorn
sudo journalctl -u kmsetjen -n 50

# Check database
sudo systemctl status postgresql
sudo -u postgres psql -l
```

### Out of Memory

```bash
# Check memory usage
free -h
docker stats

# Reduce Gunicorn workers
# Edit /etc/systemd/system/kmsetjen.service
# Change: workers = 2 (or less)

sudo systemctl daemon-reload
sudo systemctl restart kmsetjen
```

### High CPU Usage

```bash
# Identify slow queries
docker-compose exec backend python manage.py shell_plus
# Then use Django ORM or raw SQL to analyze

# Profile with Django debug toolbar
pip install django-debug-toolbar
# Add to INSTALLED_APPS and middleware
```

---

## Next Steps

1. ✅ **Deployment complete!**
2. 📊 Set up monitoring
3. 📅 Schedule regular backups
4. 🔐 Configure SSL certificate auto-renewal
5. 📈 Monitor performance and scale as needed

---

**Happy deploying! 🚀**
