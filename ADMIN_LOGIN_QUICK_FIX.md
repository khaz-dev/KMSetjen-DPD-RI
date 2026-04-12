# Quick Action Plan: Fix Admin Login Now

## 🎯 Immediate Action (Choose One)

### **Option A: Quickest (2 min) - Use seed_comprehensive**

```bash
# SSH to server
ssh -i c:\Users\khair\khaz root@165.245.191.216

# Go to project
cd /var/www/html/kms

# Run seed command - creates admin user + test data
docker-compose exec kms_django python manage.py seed_comprehensive

# This creates:
# ✓ admin / password123
# ✓ editor1, editor2 / password123  
# ✓ contributor1-3 / password123
# ✓ 30+ sample articles

# Wait for completion (shows ✅ Comprehensive seeding completed!)
```

**Then Test:**
```
Browser: https://khaz.app/kms/admin/
Username: admin
Password: password123
```

---

### **Option B: Secure (3 min) - Use Custom Command**

```bash
# SSH to server
ssh -i c:\Users\khair\khaz root@165.245.191.216

# Navigate to project
cd /var/www/html/kms

# Auto-generate secure password
docker-compose exec kms_django python manage.py create_admin --generate

# Output shows:
# Generated secure password: xX9kL2@pQ#mN5vB!
# ✓ Admin user created: admin_prod
# =========================================================
# ADMIN CREDENTIALS:
# Username: admin_prod
# Email: admin@khaz.app
# Password: xX9kL2@pQ#mN5vB!
# =========================================================

# SAVE THESE CREDENTIALS SECURELY!
```

**Then Test:**
```
Browser: https://khaz.app/kms/admin/
Username: admin_prod
Password: [the generated password]
```

---

### **Option C: Manual (4 min) - Interactive createsuperuser**

```bash
# SSH to server
ssh -i c:\Users\khair\khaz root@165.245.191.216
cd /var/www/html/kms

# Interactive prompts
docker-compose exec kms_django python manage.py createsuperuser

# Prompts:
# Username: admin_production
# Email address: admin@khaz.app  
# Password: [enter your secure password]
# Password (again): [confirm]
# Superuser created successfully.
```

**Then Test:**
```
Browser: https://khaz.app/kms/admin/
Username: admin_production
Password: [your password]
```

---

## ✅ Verification Checklist

After creating admin user:

### 1. Test Login in Browser ✓
```
URL: https://khaz.app/kms/admin/login/?next=/kms/admin/
Username: [your username]
Password: [your password]
Expected: Login succeeds, redirects to /kms/admin/
```

### 2. Verify User in Database ✓
```bash
docker-compose exec kms_django python manage.py shell

# In Python shell:
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.filter(is_superuser=True).values('username', 'email')

# Should output:
# <QuerySet [{'username': 'admin_prod', 'email': 'admin@khaz.app'}]>
```

### 3. Check Admin Panel Works ✓
```bash
# Get admin cookie-based session
curl -c cookies.txt -d "username=admin_prod&password=YourPassword" \
  https://khaz.app/kms/admin/login/

# List articles
curl -b cookies.txt https://khaz.app/kms/admin/content/article/

# Expected: HTML table of articles
```

### 4. Check API Access ✓
```bash
# List articles via API
curl https://khaz.app/kms/api/v1/articles/

# Expected: JSON array of articles
```

---

## 🔍 Troubleshooting

### Issue: Still getting "Nama pengguna dan sandi yang benar"

**Check 1: Is admin user actually created?**
```bash
docker-compose exec kms_django python manage.py shell
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.all().count()  # Should show > 0
```

**Check 2: Is password correct?**
```bash
# Reset password
docker-compose exec kms_django python manage.py create_admin \
  --username admin_prod \
  --password "MyNewPassword123!" \
  --email admin@khaz.app
```

**Check 3: Are there database issues?**
```bash
# Check PostgreSQL connection
docker-compose exec kms_django python -c \
  "from django.db import connection; connection.ensure_connection(); print('✓ DB OK')"

# Check Django health
curl -I http://localhost:8002/health/
```

**Check 4: Is middleware working?**
```bash
# Check logs for middleware errors
docker-compose logs kms_django | grep -i "script\|middleware\|SCRIPT_NAME"

# Should show:
# ScriptNameMiddleware: Set SCRIPT_NAME='/kms'
```

### Issue: Password doesn't work
```bash
# Manually reset admin password
docker-compose exec kms_django python manage.py changepassword admin_prod
# Prompts for new password

# Or recreate:
docker-compose exec kms_django python manage.py create_admin \
  --username admin_prod \
  --password "CompletelyNewPassword123!"
```

### Issue: Can login but get 403 Forbidden on admin page
```bash
# This means authentication works but permissions are wrong
# The user should have is_staff=True and is_superuser=True

docker-compose exec kms_django python manage.py shell
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.get(username='admin_prod')
user.is_staff = True
user.is_superuser = True
user.save()
```

---

## 📊 Root Cause Summary

| Issue | Why | Fix |
|-------|-----|-----|
| Login fails with "credentials not found" | **No admin user exists** | Create user via command |
| Password `admin123` doesn't work | **Seeding never ran** (default is `password123`) | Use correct password or create new one |
| Nginx redirects to wrong URL | **Middleware fixes redirects** ✓ Fixed in previous message | Already implemented |
| Form action points to `/admin/` instead of `/kms/admin/` | **Middleware rewrites URLs** ✓ Fixed in previous message | Already implemented |

---

## 🚀 Recommended: Option B (Security Best Practice)

**Why Option B is best:**
- ✅ Auto-generates strong password (16 characters, symbols)
- ✅ Uses `admin_prod` username (avoid generic `admin`)
- ✅ Professional email format
- ✅ Can be run multiple times safely
- ✅ Provides clear credential output
- ✅ Takes only 3 minutes

**Execute now:**
```bash
ssh -i c:\Users\khair\khaz root@165.245.191.216
cd /var/www/html/kms
docker-compose exec kms_django python manage.py create_admin --generate
```

---

## 📝 Command Reference

### Check User Exists
```bash
docker-compose exec kms_django python manage.py shell
from django.contrib.auth import get_user_model
User = get_user_model()
for u in User.objects.filter(is_superuser=True):
    print(f"Username: {u.username}, Email: {u.email}, Staff: {u.is_staff}")
```

### Create Admin User (Secure)
```bash
docker-compose exec kms_django python manage.py create_admin --generate
```

### Update Admin Password
```bash
docker-compose exec kms_django python manage.py changepassword admin_prod
# Prompts for new password interactively
```

### List All Management Commands
```bash
docker-compose exec kms_django python manage.py help
```

---

## 🎯 Success Indicators

✓ Login to https://khaz.app/kms/admin/ succeeds  
✓ Can see admin dashboard  
✓ Can list articles, users, categories  
✓ Console shows no 403 or 404 errors  
✓ API endpoints work (https://khaz.app/kms/api/v1/articles/)  

---

**Estimated Time**: 5-10 minutes
**Difficulty**: Easy
**Risk**: Very Low (creates/updates user only)
