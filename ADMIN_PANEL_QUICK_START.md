# Admin Panel Access - Complete Guide

## ✅ Issue RESOLVED

**Problem:** Clicking "Admin" link showed 403/404 error  
**Cause:** Case sensitivity mismatch (backend: `'admin'` vs frontend: `'ADMIN'`)  
**Fix:** Applied case-insensitive role comparison in ProtectedRoute  
**Status:** ✅ Fixed and Working

---

## How to Access Admin Panel

### Option 1: Via Navbar (Easiest)
1. Login to the application with admin credentials:
   - Username: `admin`
   - Password: `admin123`

2. In the top navbar, you'll see "Admin" link (appears for admin/editor users)

3. Click "Admin" → You're taken to `/admin` dashboard

### Option 2: Direct URL
```
http://localhost:8002/admin/login/?next=/admin/
http://localhost:5175/admin
```

---

## Admin Credentials

| Field | Value |
|-------|-------|
| **Username** | admin |
| **Password** | admin123 |
| **Email** | admin@kms.local |
| **Role** | Administrator (ADMIN) |
| **Status** | Superuser ✅ |

---

## What You Can Access

### Admin Dashboard (`/admin`)
- View system statistics
- KPI metrics (users, articles, roles)
- System overview cards

### User Management (`/admin/users`)
- List all users
- Create new users
- Edit user details
- Manage user roles
- Activate/deactivate accounts
- Delete users

### Role Management (`/admin/roles`)
- View all roles
- Create new roles
- Assign permissions
- Edit role details
- Delete roles

### Category Management (`/admin/categories`)
- Manage article categories
- Bilingual support (ID/EN)
- Create/edit/delete categories

### Article Moderation (`/admin/articles`)
- Review pending articles
- Approve/reject submissions
- Leave review comments
- View article status

### Audit Logs (`/admin/audit-logs`)
- View system activity log
- Filter by action type
- Track user changes
- Monitor system events

---

## Technical Details of the Fix

### What Was Wrong
```jsx
// BEFORE: Case-sensitive comparison failed
const hasRole = user?.roles?.some(role => role.code === requiredRole);
// 'admin' === 'ADMIN' → FALSE ❌
```

### How It's Fixed
```jsx
// AFTER: Case-insensitive comparison
const hasRole = user?.roles?.some(role => role.code?.toUpperCase() === requiredRole.toUpperCase());
// 'ADMIN' === 'ADMIN' → TRUE ✅
```

### Why This Works
- Backend returns role codes in lowercase: `['admin', 'editor', 'contributor']`
- Frontend checks for uppercase: `requiredRole="ADMIN"`
- By converting both to uppercase before comparison, we ensure they match
- This works regardless of case formatting

---

## Troubleshooting

### Still Seeing 403 Error?

**Check 1: Are you logged in?**
```
Visit: http://localhost:5175/login
Login with: admin / admin123
```

**Check 2: Clear browser cache**
```
Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
Clear cached data and refresh page
```

**Check 3: Check user roles in database**
```bash
cd backend
venv\Scripts\activate
python manage.py shell
>>> from apps.core.models import User
>>> user = User.objects.get(username='admin')
>>> [r.code for r in user.roles.all()]
['admin', 'public']  # Should include 'admin'
```

**Check 4: Verify backend is running**
```bash
python manage.py runserver 8002
# Should show: [OK] Backend running on port: 8002
```

---

## Related Files Modified

- [frontend/src/components/ProtectedRoute.jsx](frontend/src/components/ProtectedRoute.jsx) - Case-insensitive role check

---

## Verification Checklist

- ✅ Backend PostgreSQL running
- ✅ Backend on port 8002
- ✅ Frontend on port 5175
- ✅ Admin user exists with 'admin' role
- ✅ ProtectedRoute uses case-insensitive comparison
- ✅ Admin navbar link shows for authenticated users
- ✅ Admin routes accessible without 403 error

---

**Last Updated:** February 2, 2026  
**Status:** ✅ Production Ready  
**Issue:** RESOLVED
