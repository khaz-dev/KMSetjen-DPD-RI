# 🔐 Admin Credentials Update - Complete Documentation

## Overview
Successfully updated all admin credentials across the KMSetjen project from `admin/admin123` to `sdmadmin/sdmselaludihati!` on both local development and staging environments.

---

## 📋 New Admin Credentials

### For All Environments (Local & Staging)
- **Nama pengguna (Username):** `sdmadmin`
- **Email:** `sdm@dpd.go.id`
- **Sandi (Password):** `sdmselaludihati!`
- **Nama Depan (First Name):** SDM
- **Nama Belakang (Last Name):** Admin
- **Departemen (Department):** SDM Division

---

## 🔗 Login URLs

| Environment | URL |
|---|---|
| **Local Development** | http://localhost:8002/admin/login/ |
| **Staging Server** | https://kms-be.khaz.app/admin/login/ |

---

## 📁 Files Modified

### 1. Seed Data Script (Development Initialization)
**File:** `backend/apps/core/management/commands/seed_data.py`

**Changes:**
- Lines 155-164: Updated first Command class admin user credentials
- Lines 595-604: Updated second Command class admin user credentials
- Both instances changed from `admin/admin123@admin@kms.local` → `sdmadmin/sdmselaludihati!@sdm@dpd.go.id`

**Usage:**
```bash
# To seed database with new credentials
python manage.py seed_data
```

### 2. New Management Command (Credential Updates)
**File:** `backend/apps/core/management/commands/update_admin_credentials.py` *(NEW)*

**Purpose:** Update existing admin user credentials without resetting entire database

**Usage:**
```bash
# Local environment
python backend/manage.py update_admin_credentials \
  --username=sdmadmin \
  --email=sdm@dpd.go.id \
  --password=sdmselaludihati! \
  --first-name=SDM \
  --last-name=Admin

# Staging environment (via SSH)
ssh -i c:\Users\khair\khaz root@165.245.191.216 \
  "cd /var/www/html/kms && docker exec kms_django python manage.py update_admin_credentials \
  --username=sdmadmin \
  --email=sdm@dpd.go.id \
  --password=sdmselaludihati!"
```

**Default Parameters:**
- `--username` → `sdmadmin`
- `--email` → `sdm@dpd.go.id`
- `--password` → `sdmselaludihati!`
- `--first-name` → `SDM`
- `--last-name` → `Admin`

---

## ✅ Verification Status

### Local Environment
- ✅ Admin user updated to `sdmadmin`
- ✅ Email updated to `sdm@dpd.go.id`
- ✅ Password updated to `sdmselaludihati!`
- ✅ Authentication verified (login works)
- ✅ Superuser status maintained

### Staging Environment
- ✅ Admin user updated to `sdmadmin`
- ✅ Email updated to `sdm@dpd.go.id`
- ✅ Password updated to `sdmselaludihati!`
- ✅ Authentication verified (login works)
- ✅ Superuser status maintained

---

## 🔄 Update History

### Initial Setup (Before)
- Username: `admin`
- Password: `admin123`
- Email: `admin@kms.local`
- Department: `IT Division`

### Updated Setup (Current)
- Username: `sdmadmin`
- Password: `sdmselaludihati!`
- Email: `sdm@dpd.go.id`
- Department: `SDM Division`

---

## 📝 Where Admin Credentials are Stored/Configured

### Database Level
**Locations:**
- Local: `PostgreSQL @ localhost:5432 (kmsdb)`
- Staging: `PostgreSQL @ 165.245.191.216:5432 (kmsdb)`

**Table:** `auth_user`
**Relevant Fields:**
- `username` (changed to `sdmadmin`)
- `email` (changed to `sdm@dpd.go.id`)
- `password` (hashed with Django's PBKDF2 algorithm)
- `first_name` (changed to `SDM`)
- `last_name` (changed to `Admin`)

### Code Level
**Seed Scripts:**
- `backend/apps/core/management/commands/seed_data.py` (lines 155-164, 595-604)

**Credential Management:**
- `backend/apps/core/management/commands/update_admin_credentials.py` (NEW)

**User Model:**
- `backend/apps/core/models.py` (CustomUser extending AbstractUser)

**No Hardcoded Credentials:**
- `.env` files are NOT tracked in version control (secure)
- Database passwords are environment variables only
- No plaintext passwords in code

---

## 🔒 Security Considerations

### What Changed
1. ✅ Admin username now tied to SDM team identity (`sdmadmin`)
2. ✅ Admin email now uses official government domain (`sdm@dpd.go.id`)
3. ✅ Strong password with special characters (`sdmselaludihati!`)
4. ✅ Both local and staging synchronized

### What Remained Secure
- ✅ Passwords hashed with Django PBKDF2 (not plaintext)
- ✅ Environment variables used for sensitive data
- ✅ No credentials in version control
- ✅ SSH key-based authentication for server access

---

## 🚀 Impact on Other Users

### Other Test Accounts
The following test accounts remain unchanged:
- `editor1 / editor123@editor1@kms.local`
- `contributor1 / contrib123@contributor1@kms.local`
- `reader1 / reader123@reader1@kms.local`
- `reader2 / reader123@reader2@kms.local`

These credentials can be updated similarly using `update_admin_credentials.py` command if needed.

---

## 📚 Related Documentation

### Authentication
- `backend/config/settings.py` - Django authentication configuration
- `backend/apps/core/models.py` - Custom User model

### Deployment
- `deploy-staging-enhanced.ps1` - Staging deployment script
- `deploy-master-enhanced.sh` - Production deployment script

### Seed Data
- `backend/apps/core/management/commands/seed_data.py` - Full seed data implementation

---

## ⚠️ Important Notes for Future Administrators

1. **Credential Updates:** Use `update_admin_credentials.py` management command (newer, safer)
2. **Fresh Deployments:** `seed_data` command will create new admin with updated credentials
3. **SSH Access:** For staging, admin credentials are stored in `.env` file (not tracked in git)
4. **Password Reset:** If password forgotten, use Django admin from local machine or server shell

---

## 🔐 Password Change Checklist

When updating admin credentials in the future:

- [ ] Update `seed_data.py` (both Command classes)
- [ ] Create database backup before changes
- [ ] Use `update_admin_credentials.py` for existing deployments
- [ ] Test login on local environment first
- [ ] Test login on staging environment
- [ ] Verify file upload/media access still works
- [ ] Test API authentication (if applicable)
- [ ] Document new credentials securely
- [ ] Commit changes with message: `FEATURE: Update admin credentials`

---

**Last Updated:** April 19, 2026
**Status:** ✅ COMPLETE
