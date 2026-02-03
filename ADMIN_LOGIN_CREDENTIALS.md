# 🔐 Django Admin Login Credentials & Access Guide

## Quick Login Information

### Primary Admin Account (Superuser)

| Field | Value |
|-------|-------|
| **Nama Pengguna (Username)** | `admin` |
| **Sandi (Password)** | `admin123` |
| **Email** | admin@kms.local |
| **Full Name** | Admin System |
| **Status** | ✅ Active Superuser |

**Login URL:** http://localhost:8002/admin/login/?next=/admin/

---

## All Available User Accounts in Database

| # | Username | Email | Role | Password | Staff | Type |
|---|----------|-------|------|----------|-------|------|
| 1 | **admin** | admin@kms.local | Administrator | **admin123** | ✅ Yes | 👑 Superuser |
| 2 | editor1 | editor1@kms.local | Editor | editor123 | ✅ Yes | Staff |
| 3 | contributor1 | contributor1@kms.local | Contributor | contrib123 | ❌ No | User |
| 4 | contributor2 | contrib2@kms.local | Contributor | contrib123 | ❌ No | User |
| 5 | contributor3 | contrib3@kms.local | Contributor | contrib123 | ❌ No | User |
| 6 | editor2 | editor2@kms.local | Editor | editor123 | ❌ No | User |
| 7 | reader1 | reader1@kms.local | Reader | reader123 | ❌ No | User |
| 8 | reader2 | reader2@kms.local | Reader | reader123 | ❌ No | User |
| 9 | khairilazmiashari | khairilazmiashari@gmail.com | User | *custom* | ❌ No | User |

---

## 🚀 How to Login to Admin Panel

### Step 1: Navigate to Admin Login
```
http://localhost:8002/admin/login/?next=/admin/
```

### Step 2: Enter Credentials
- **Nama Pengguna:** `admin`
- **Sandi:** `admin123`

### Step 3: Click Login
You'll be redirected to the admin dashboard at `http://localhost:8002/admin/`

---

## 📋 What You Can Do in Admin Panel

With the **admin** account (superuser), you have full access to:

✅ **User Management**
- Create, edit, delete users
- Assign roles and permissions
- Manage staff and superuser status
- View user activity

✅ **Content Management**
- Create and edit articles
- Manage categories
- Publish/unpublish content
- View article statistics

✅ **Site Management**
- Manage all application settings
- Configure system parameters
- View system logs
- Access audit trails

✅ **Permission Management**
- Create and manage roles
- Assign permissions to roles
- Control access levels

---

## Alternative: Backend API Authentication

If you prefer using the REST API instead of Django Admin:

### Get Authentication Token
```bash
curl -X POST http://localhost:8002/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Use Token in API Requests
```bash
curl http://localhost:8002/api/v1/admin/users/ \
  -H "Authorization: Bearer <access_token>"
```

---

## 🛡️ Security Notes

⚠️ **For Local Development Only:**
- These are default development credentials
- Change passwords before deployment to production
- Never commit credentials to version control
- Use strong passwords in production

### Change Admin Password
```bash
python manage.py changepassword admin
```

### Create New Admin User
```bash
python manage.py createsuperuser
```

### Reset Database Users
If you need to reset all users, run the seed script:
```bash
python manage.py seed_data
```

---

## 📚 User Account Files

The user accounts are created by:

1. **Seed Data Script:** [backend/apps/core/management/commands/seed_data.py](backend/apps/core/management/commands/seed_data.py)
   - Line 113-200: User creation logic
   - Contains all default credentials

2. **Comprehensive Seed Script:** [backend/apps/core/management/commands/seed_comprehensive.py](backend/apps/core/management/commands/seed_comprehensive.py)
   - Alternative comprehensive seeding

3. **Admin Configuration:** [backend/apps/core/admin.py](backend/apps/core/admin.py)
   - Line 69: Django Admin interface setup

---

## ✅ Verification Steps

### 1. Check Backend is Running
```bash
# Should see: Backend running on port: 8002
python manage.py runserver 8002
```

### 2. Verify User Exists
```bash
python manage.py shell
>>> from apps.core.models import User
>>> User.objects.filter(username='admin').exists()
True
```

### 3. Test Admin Panel Access
Visit: http://localhost:8002/admin/

---

## 🔗 Related Documentation

- [Database Configuration](FINAL_DATABASE_SUMMARY.md)
- [PostgreSQL Setup](POSTGRESQL_LOCAL_SETUP.md)
- [Admin API Testing](docs/PHASE_5_TESTING_GUIDE.md)
- [System Architecture](docs/01_SYSTEM_ARCHITECTURE.md)

---

**Last Updated:** February 2, 2026  
**Backend Status:** ✅ Running on http://localhost:8002  
**Database:** ✅ PostgreSQL on localhost:5432
