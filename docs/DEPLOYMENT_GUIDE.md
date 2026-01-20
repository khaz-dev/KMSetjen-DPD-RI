# Deployment Guide - KMSetjen DPD RI Content Management System

**Version:** 1.0.0  
**Last Updated:** January 5, 2026

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Development Environment Setup](#development-environment-setup)
3. [Staging Environment Setup](#staging-environment-setup)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Post-Deployment](#post-deployment)
7. [Rollback Procedures](#rollback-procedures)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm test`, `python manage.py test`)
- [ ] No console errors or warnings
- [ ] Code review completed
- [ ] Code follows standards (linting passed)
- [ ] No hardcoded credentials
- [ ] Comments and documentation updated

### Security
- [ ] JWT secrets configured
- [ ] Database passwords secure
- [ ] API keys secured in environment
- [ ] HTTPS enabled
- [ ] CORS configured properly
- [ ] SQL injection protections verified
- [ ] XSS protections verified

### Performance
- [ ] Frontend bundle size optimized
- [ ] Database indexes created
- [ ] Caching configured
- [ ] API response times acceptable (<500ms)
- [ ] No N+1 queries
- [ ] Image optimization complete

### Database
- [ ] Migrations tested locally
- [ ] Database backup created
- [ ] Rollback plan prepared
- [ ] Data migration scripts ready

### Documentation
- [ ] API documentation complete
- [ ] User guide updated
- [ ] Admin guide updated
- [ ] Developer guide updated
- [ ] Deployment steps documented

---

## Development Environment Setup

### System Requirements
- Node.js 16+ or npm 8+
- Python 3.8+
- PostgreSQL 12+ (or SQLite for dev)
- Git
- Docker (optional)

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
echo "REACT_APP_API_URL=http://localhost:8000" > .env

# Start development server
npm start
```

Server runs at `http://localhost:3000`

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Create environment file
echo "DEBUG=True" > .env
echo "SECRET_KEY=dev-secret-key" >> .env
echo "DATABASE_URL=sqlite:///db.sqlite3" >> .env

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

Server runs at `http://localhost:8000`

### Running Tests Locally
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
python manage.py test

# Coverage reports
npm test -- --coverage
coverage run --source='.' manage.py test
coverage report
```

---

## Staging Environment Setup

### Server Requirements
- Ubuntu 20.04 LTS+
- 2+ CPU cores
- 4GB+ RAM
- 20GB+ storage
- Static IP address

### Installation Steps

#### 1. System Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3 python3-pip python3-venv
sudo apt install -y nodejs npm
sudo apt install -y postgresql postgresql-contrib
sudo apt install -y nginx
sudo apt install -y git curl wget
```

#### 2. Database Setup
```bash
# Create database user
sudo -u postgres createuser kmsetjen_user -P

# Create database
sudo -u postgres createdb kmsetjen_db -O kmsetjen_user

# Enable UUID extension
sudo -u postgres psql kmsetjen_db -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

#### 3. Application Setup
```bash
# Clone repository
git clone <repository-url> /home/ubuntu/kmsetjen

# Backend setup
cd /home/ubuntu/kmsetjen/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cat > .env << EOF
DEBUG=False
SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(50))')
DATABASE_URL=postgresql://kmsetjen_user:password@localhost:5432/kmsetjen_db
ALLOWED_HOSTS=staging.kmsetjen.go.id
EOF

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Frontend setup
cd ../frontend
npm install
npm run build
```

#### 4. Nginx Configuration
```bash
# Create nginx config
sudo cat > /etc/nginx/sites-available/kmsetjen << 'EOF'
upstream django {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name staging.kmsetjen.go.id;

    client_max_body_size 75M;

    location /api {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static {
        alias /home/ubuntu/kmsetjen/backend/static;
        expires 30d;
    }

    location / {
        root /home/ubuntu/kmsetjen/frontend/build;
        try_files $uri /index.html;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/kmsetjen /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

#### 5. Gunicorn Setup
```bash
# Install gunicorn
source /home/ubuntu/kmsetjen/backend/venv/bin/activate
pip install gunicorn

# Create systemd service
sudo cat > /etc/systemd/system/kmsetjen.service << 'EOF'
[Unit]
Description=KMSetjen Django Application
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/kmsetjen/backend
ExecStart=/home/ubuntu/kmsetjen/backend/venv/bin/gunicorn config.wsgi:application --bind 0.0.0.0:8000

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable kmsetjen
sudo systemctl start kmsetjen
```

---

## Production Deployment

### Pre-Production Verification
```bash
# Run all tests
npm test -- --coverage
python manage.py test --keepdb

# Check static files
python manage.py collectstatic --noinput --check

# Verify migrations
python manage.py showmigrations

# Performance check
python manage.py check --deploy
```

### Production Environment
```bash
# Production environment variables
cat > backend/.env << 'EOF'
DEBUG=False
SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(50))')
DATABASE_URL=postgresql://user:password@db.example.com:5432/kmsetjen_prod
ALLOWED_HOSTS=kmsetjen.go.id,www.kmsetjen.go.id
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=noreply@kmsetjen.go.id
EMAIL_HOST_PASSWORD=<password>
EOF
```

### SSL/TLS Setup
```bash
# Install Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --nginx -d kmsetjen.go.id -d www.kmsetjen.go.id

# Update nginx for HTTPS
sudo nano /etc/nginx/sites-available/kmsetjen
# Configure redirect to HTTPS
```

### Load Balancing (Optional)
For high-traffic deployments:
```bash
# Install HAProxy
sudo apt install -y haproxy

# Configure for multiple backend servers
# Distribute traffic across multiple instances
```

---

## Docker Deployment

### Docker Setup
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose
```

### Dockerfile (Backend)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Create non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Run application
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### Dockerfile (Frontend)
```dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
```

### Docker Compose Configuration
```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: kmsetjen_db
      POSTGRES_USER: kmsetjen_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://kmsetjen_user:secure_password@db:5432/kmsetjen_db
      SECRET_KEY: your-secret-key-here
      DEBUG: 'False'
    depends_on:
      - db
    ports:
      - "8000:8000"
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      REACT_APP_API_URL: http://backend:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
```

### Deployment with Docker
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Post-Deployment

### Verification Steps
```bash
# Check application status
curl -s http://localhost:8000/api/v1/health/

# Verify database connectivity
curl -s http://localhost:8000/api/v1/admin/statistics/

# Check frontend loading
curl -s http://localhost:3000 | head -20

# Check SSL certificate
openssl s_client -connect kmsetjen.go.id:443 -showcerts
```

### Initial Configuration
1. **Create Admin User**
   ```bash
   python manage.py createsuperuser
   ```

2. **Configure Email**
   - Set email settings in environment
   - Test email sending

3. **Setup Monitoring**
   - Install monitoring tools
   - Configure alerts

4. **Database Backup**
   ```bash
   # Automated backup script
   pg_dump kmsetjen_db > backup_$(date +%Y%m%d).sql
   ```

5. **User Creation**
   - Create initial users
   - Assign roles and permissions

### Performance Optimization
```bash
# Enable caching
python manage.py collectstatic

# Create indexes
python manage.py sqlsequencereset articles users | python manage.py dbshell

# Compress static files
gzip -r static/
```

---

## Rollback Procedures

### Quick Rollback
```bash
# Stop current version
sudo systemctl stop kmsetjen

# Revert code
git revert HEAD

# Revert migrations (if needed)
python manage.py migrate <previous_migration>

# Restart service
sudo systemctl start kmsetjen
```

### Database Rollback
```bash
# Restore from backup
psql kmsetjen_db < backup_20240101.sql

# Verify data
python manage.py dbshell
```

### Zero-Downtime Rollback
1. Keep previous version running
2. Update load balancer to point to old version
3. Debug new version
4. Redeploy when ready

---

## Monitoring & Maintenance

### Logging Setup
```bash
# Application logs
tail -f /var/log/kmsetjen/app.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -u kmsetjen -f
```

### Regular Maintenance
- **Daily:** Monitor logs and errors
- **Weekly:** Review performance metrics
- **Monthly:** Database optimization and cleanup
- **Quarterly:** Security updates and patches
- **Annually:** Major version upgrades

### Backup Strategy
```bash
# Daily database backups
0 2 * * * pg_dump kmsetjen_db | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz

# Weekly full backups
0 3 * * 0 tar -czf /backups/full_$(date +\%Y\%m\%d).tar.gz /home/ubuntu/kmsetjen

# Retain for 30 days
find /backups -type f -mtime +30 -delete
```

### Monitoring Tools
- **Server Monitoring:** New Relic, Datadog, or Prometheus
- **Error Tracking:** Sentry
- **Application Logging:** ELK Stack or Splunk
- **Uptime Monitoring:** Pingdom or Uptime Robot

---

## Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check database status
systemctl status postgresql

# Check connection string
echo $DATABASE_URL

# Test connection
psql -U user -d kmsetjen_db -c "SELECT 1;"
```

**Application Not Starting**
```bash
# Check gunicorn status
systemctl status kmsetjen

# View error logs
journalctl -u kmsetjen -n 50

# Test application directly
cd /app && python manage.py runserver
```

**Nginx Not Serving**
```bash
# Check nginx status
systemctl status nginx

# Test nginx configuration
sudo nginx -t

# Check nginx logs
tail -f /var/log/nginx/error.log
```

---

## Support & Escalation

For deployment issues:
1. Check logs
2. Verify environment variables
3. Test connectivity
4. Review recent changes
5. Contact DevOps team

**On-Call Support:** [contact information]

---

**Last Updated:** January 5, 2026  
**Deployment Team:** [Team name]
