# Staging Server Admin Roles & 403 Access Issue - Root Cause Analysis & Fix

## 🚨 Issues Reported

1. **Roles Deleted** - `/kms/admin/core/role/` shows 0 Roles
2. **Blank Roles Display** - User change form has no roles to select (blank dropdown)
3. **Google OAuth 403 Error** - `khairilazmiashari@gmail.com` gets 403 when trying to access admin

---

## 📊 Root Cause Analysis

### Issue #1: Roles Table Empty (0 Roles)

**What Happened:**
- The `Role` table in the database was manually cleared/deleted
- 5 roles should exist: `admin`, `editor`, `contributor`, `reader`, `public`
- Without roles in database, all dependent data breaks

**Verification:**
```sql
SELECT COUNT(*) FROM core_role;
-- Expected: 5, Actual: 0 ❌
```

**Why This Breaks Everything:**
- Django admin's `filter_horizontal` widget for roles field reads from database
- With 0 roles, widget shows empty (nothing to select)
- New users created via Google OAuth get no roles assigned
- Users with no roles cannot access any admin pages

---

### Issue #2: User Roles & Permissions Field Blank

**Root Cause:**
The User change form in Django admin has no roles to display because the `Role` table is empty.

**How Django Admin Roles Field Works:**

In `backend/apps/core/admin.py`:
```python
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = (
        ('Roles & Permissions', {
            'fields': ('roles', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ('roles', 'groups', 'user_permissions')
    # ↑ This creates a dual-select dropdown widget
```

The `filter_horizontal` widget:
1. **Left side**: Available roles (from `Role.objects.all()`)
2. **Right side**: User's current roles

When `Role.objects.all()` returns empty set:
- Left side is empty → nothing to select from
- Right side is empty → user has no roles
- Result: Completely blank widget ❌

**Evidence:**
```python
# In database
Role.objects.all().count()  # Returns: 0

# In User detail page
user.roles.all()  # Returns: <QuerySet []> (empty)
```

---

### Issue #3: Google OAuth 403 Forbidden

**The 403 Error Flow:**

```
1. User clicks "Login dengan Google" button
   ↓
2. Google OAuth callback hits backend
   → backend/apps/auth/views.py::google_callback()
   ↓
3. Backend creates new User:
   user = User.objects.create_user(
       username='khairilazmiashari@gmail.com',
       email='khairilazmiashari@gmail.com',
       first_name='Khairil',
       last_name='Azmi Ashari',
       # ❌ NO ROLES ASSIGNED! (because Role table is empty)
   )
   ↓
4. Frontend receives user data with empty roles:
   {
       "id": 123,
       "email": "khairilazmiashari@gmail.com",
       "roles": [],  # ← EMPTY!
       "primary_role": null,
       ...
   }
   ↓
5. Frontend component checks for admin role:
   // src/components/ProtectedRoute.jsx
   const hasRole = user?.roles?.some(
       role => role.toUpperCase() === 'ADMIN'
   );
   // ↑ Returns FALSE (no roles in array)
   ↓
6. Frontend redirects to /403 ❌
   return <Navigate to="/403" />;
```

**Verification in Code:**

Frontend protection (src/components/ProtectedRoute.jsx):
```javascript
if (requiredRole) {
    const hasRole = user?.roles?.some(
        role => (typeof role === 'string' ? role : role.code)
            ?.toUpperCase() === requiredRole.toUpperCase()
    );
    if (!hasRole) {
        return <Navigate to="/403" />;  // ← 403 happens here
    }
}
```

Admin nav-link requirement (src/App.jsx):
```javascript
<Route path="/admin/users" element={
    <ProtectedRoute requiredRole="ADMIN">
        <UserManagementPage />
    </ProtectedRoute>
} />
```

**Why 403 Instead of Different Error:**
- User IS authenticated (JWT token valid)
- User IS created in database
- But user has EMPTY roles array
- Frontend role check fails → 403 Forbidden

---

## 🔧 Solution & Fixes

### Fix #1: Restore All Roles to Database

**Command to Run (on staging server):**
```bash
# SSH into server
ssh -i /path/to/key root@165.245.191.216

# Navigate to project
cd /var/www/html/kmsetjendpdri

# Run seed data to recreate roles
docker-compose exec -T django python manage.py seed_data --roles-only
```

Or if that flag doesn't exist:
```bash
docker-compose exec -T django python manage.py seed_data
```

**What This Does:**
- Creates 5 roles: `admin`, `editor`, `contributor`, `reader`, `public`
- Populates permissions for each role
- Reinitializes data safely (won't duplicate)

**Verification:**
```bash
# Check roles were created
docker-compose exec -T django python manage.py shell
>>> from apps.core.models import Role
>>> Role.objects.all().count()
5  # ✅ Should be 5 now

>>> for role in Role.objects.all():
...     print(f"{role.code}: {role.name_id}")
admin: Administrator
editor: Editor
contributor: Kontributor
reader: Pembaca
public: Publik
```

---

### Fix #2: Assign ADMIN Role to khairilazmiashari@gmail.com

**On Staging Server - Django Shell:**
```bash
docker-compose exec -T django python manage.py shell
```

**Python Code:**
```python
from apps.core.models import User, Role

# Find the user
user = User.objects.get(email='khairilazmiashari@gmail.com')
print(f"Found user: {user.email}")

# Get admin role
admin_role = Role.objects.get(code='admin')
print(f"Found role: {admin_role.name_id}")

# Assign role to user
user.roles.add(admin_role)
print(f"Assigned {admin_role.code} to {user.email}")

# Verify
print(f"User roles: {[role.code for role in user.roles.all()]}")
# Expected: ['admin']
```

**Or via Django Admin:**
1. Go to: `https://khaz.app/kms/admin/core/user/`
2. Click on `khairilazmiashari@gmail.com` user
3. Scroll to "Roles & Permissions" section
4. In the left box under "Available Roles", select "Administrator (admin)"
5. Click the right arrow `→` to move it to "Chosen Roles"
6. Click "Save"

---

### Fix #3: Clear Browser Cache & Re-login

After roles are assigned:

1. **Clear browser cache:**
   - Open browser console (F12)
   - Go to Application → Storage → Cache Storage → Delete all
   - Or use Ctrl+Shift+Delete

2. **Logout & Clear localStorage:**
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   ```

3. **Log out from the application:**
   - Click logout button in admin UI

4. **Clear JWT tokens:**
   - The JWT token still cached may have old role data
   - Logging out + clearing storage ensures fresh login

5. **Re-login with Google:**
   - Go to `https://khaz.app/kms/login`
   - Click "Masuk dengan Google"
   - Use `khairilazmiashari@gmail.com` account
   - Should now see admin dashboard ✅

---

## 🔍 Why This Happened

### Root Cause Chain:

```
User manually deleted roles from database
    ↓
Role.objects.all() returns empty QuerySet
    ↓
Django admin roles field becomes empty (nothing to select)
    ↓
Even if existing users had roles, they couldn't be viewed/edited
    ↓
When new Google OAuth user created → no roles assigned
    ↓
Frontend checks for roles → finds empty array
    ↓
Frontend → 403 redirect
```

### Data Flow Before Fix:

```
Database:
├─ Role table: [EMPTY] ← Problem starts here
└─ User.roles (M2M): [empty] because no roles to join

Django Admin:
└─ User change form roles field: [blank] ← can't select anything

Frontend:
└─ User roles: [] → fails role check → 403 ❌
```

### Data Flow After Fix:

```
Database:
├─ Role table: [admin, editor, contributor, reader, public] ✅
├─ User.roles (M2M):
│  └─ khairilazmiashari@gmail.com → [admin] ✅
└─ ...

Django Admin:
└─ User change form roles field: [shows all 5 roles] ✅

Frontend:
└─ User roles: ['admin'] → passes role check ✅
```

---

## 📋 Detailed Fix Steps

### Step 1: SSH to Staging Server
```bash
ssh -i c:\Users\khair\khaz root@165.245.191.216
```

### Step 2: Navigate to Project
```bash
cd /var/www/html/kmsetjendpdri
```

### Step 3: Restore All Roles
```bash
docker-compose exec -T django python manage.py seed_data
```

**Expected Output:**
```
[START] Populating database with seed data...
[LNG] Creating languages...
  [-] Bahasa Indonesia
  [-] English
[ROL] Creating roles...
  [-] Administrator (permissions: 16)
  [-] Editor (permissions: 6)
  [-] Kontributor (permissions: 5)
  [-] Pembaca (permissions: 3)
  [-] Publik (permissions: 3)
...
[SUCCESS] Database seeding completed successfully!
```

### Step 4: Verify Roles Created
```bash
docker-compose exec -T django python manage.py shell

# In Python shell:
from apps.core.models import Role
print(f"Total roles: {Role.objects.count()}")
for role in Role.objects.all():
    print(f"  - {role.code}: {role.name_id}")
```

### Step 5: Assign Admin Role to User
```bash
# Still in Python shell:
from apps.core.models import User, Role

user = User.objects.get(email='khairilazmiashari@gmail.com')
admin_role = Role.objects.get(code='admin')
user.roles.add(admin_role)

print(f"User {user.email} roles: {[r.code for r in user.roles.all()]}")
```

### Step 6: Test Admin Access
```bash
# Exit Python shell (Ctrl+D or type: exit())

# Test with curl
curl -X GET https://khaz.app/kms/admin/core/role/ \
  -H "Authorization: Bearer <user_jwt_token>"
# Should return 200 OK with list of roles
```

### Step 7: Browser Testing
1. Go to `https://khaz.app/kms/` (logged in as your user)
2. Check browser console (F12) for any errors
3. Navigate to Admin → should load without 403
4. Check `/admin/core/role/` → should show 5 roles ✅

---

## 🧪 Verification Checklist

After applying fixes, verify:

- [ ] **Roles Restored**: `https://khaz.app/kms/admin/core/role/` shows 5 roles
- [ ] **Admin User List**: `https://khaz.app/kms/admin/core/user/` is accessible
- [ ] **User Detail Form**: Click on any user, "Roles & Permissions" section shows role dropdowns (not blank)
- [ ] **khairilazmiashari@gmail.com Access**: User can login with Google and access admin ✅
- [ ] **No Console Errors**: Browser F12 console shows no 403 errors
- [ ] **Admin Nav Link Works**: Clicking "Admin" in nav goes to dashboard, not 403

---

## 🔐 Prevention

To prevent accidental role deletion:

1. **Make roles read-only in Django admin:**
   ```python
   @admin.register(Role)
   class RoleAdmin(admin.ModelAdmin):
       def has_delete_permission(self, request, obj=None):
           return False  # Prevent deletion
   ```

2. **Create database backup:**
   ```bash
   docker-compose exec -T django python manage.py dumpdata core.Role > roles_backup.json
   ```

3. **Use migrations for seed data:**
   - Instead of management command, create data migrations
   - Makes data changes version-controlled

4. **Implement soft deletes:**
   - Add `deleted_at` field instead of hard delete
   - Can recover deleted data if needed

---

## 📝 Technical Details

### User Role Model Relationships

```python
# Model: apps/core/models.py

class Role(models.Model):
    code = CharField(unique=True)  # 'admin', 'editor', etc.
    name_id = CharField()  # 'Administrator', 'Penyunting', etc.
    permissions = JSONField()  # Permission IDs: [1, 2, 3, ...]
    # ...

class User(AbstractUser):
    roles = ManyToManyField(
        Role,
        related_name='users',
        blank=True
    )
    # ...
    
    def get_primary_role(self):
        """Returns user's highest privilege role"""
        # Priority: admin > editor > contributor > reader > public
```

### Frontend Role Check

```javascript
// src/components/ProtectedRoute.jsx

export const ProtectedRoute = ({ children, requiredRole = null }) => {
    const { user } = useAuth();
    
    if (requiredRole) {
        const hasRole = user?.roles?.some(role =>
            (typeof role === 'string' ? role : role.code)
                ?.toUpperCase() === requiredRole.toUpperCase()
        );
        
        if (!hasRole) {
            return <Navigate to="/403" />;  // ← 403 Forbidden
        }
    }
    
    return children;
};
```

### JSON Response Structure

When user logs in via Google OAuth:
```json
{
    "access": "eyJ...",
    "refresh": "eyJ...",
    "user": {
        "id": 123,
        "email": "khairilazmiashari@gmail.com",
        "first_name": "Khairil",
        "last_name": "Azmi Ashari",
        "roles": ["admin"],  // ← Frontend checks this array
        "primary_role": "admin",
        "is_admin": true,
        "is_editor": true,
        "is_staff": false
    }
}
```

---

## ✅ Status

**Issues:** 3 identified and analyzed
**Root Cause:** Roles table deleted from database
**Fixes:** Clear and actionable
**Priority:** HIGH (blocks all admin access)

**Next Step:** Run seed_data command to restore roles and assign to user

