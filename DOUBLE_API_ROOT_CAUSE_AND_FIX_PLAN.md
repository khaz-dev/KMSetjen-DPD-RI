# Critical Issues Found - Multiple /api Endpoints with Double Path

## 🔍 Root Cause Analysis

**Problem:** Double `/api` error appearing on multiple admin pages:
- Users page: `GET /api/api/v1/admin/users/ 404`
- Roles page: `GET /api/api/v1/admin/roles/ 404`

**Why it's happening:**
1. Files `UserManagementPage.jsx` and `RoleManagementPage.jsx` are making **manual axios calls**
2. They construct URLs using: `${VITE_API_URL}/api/v1/admin/users/`
3. Since `VITE_API_URL=https://khaz.app/kms`, the result is DOUBLE `/api`:
   ```
   https://khaz.app/kms + /api/v1/admin/users/
   = https://khaz.app/kms/api/v1/admin/users/  ❌ CORRECT
   
   ERROR PATTERN (what was happening):
   https://khaz.app/kms/api + /api/v1/admin/users/
   = https://khaz.app/kms/api/api/v1/admin/users/  ❌ WRONG (double /api)
   ```

**Actual issue:** The frontend hasn't been rebuilt since we fixed the `.env` file!

## ✅ Solution

### 1. Add Missing API Method
Need to add `syncExternalUsers` to `api.js`

### 2. Replace All Manual Axios Calls
**UserManagementPage.jsx** - Replace 8+ manual axios calls with adminAPI methods:
- `loadUsers()` → `adminAPI.getUsers(params)`
- `handleOpenModal()` → `adminAPI.getUser(id)`
- `handleDeleteUser()` → `adminAPI.deleteUser(id)`
- `handleToggleActive()` → `adminAPI.activateUser() / deactivateUser()`
- `handleSyncExternalUsers()` → `adminAPI.syncExternalUsers()`

**RoleManagementPage.jsx** - Replace 4+ manual axios calls:
- `loadRoles()` → `adminAPI.getRoles(params)`
- `loadPermissions()` → `adminAPI.getPermissions(params)`
- `handleSubmitForm()` → `adminAPI.createRole() / updateRole()`
- `handleConfirmDelete()` → `adminAPI.deleteRole(id)`

### 3. Rebuild and Redeploy Frontend
After code changes, rebuild the frontend container with corrected code

### 4. Simplify Backend Admin URL (Bonus)
Change `/kms-be/admin/` to `/kms-be/` in Nginx config

## Files to Modify

1. `frontend/src/services/api.js` - Add syncExternalUsers method
2. `frontend/src/pages/UserManagementPage.jsx` - Replace manual axios calls
3. `frontend/src/pages/RoleManagementPage.jsx` - Replace manual axios calls
4. `/etc/nginx/sites-available/kms` on staging - Simplify backend URL

## Expected Outcome

✅ Admin pages load without double `/api` errors
✅ Users management page functional
✅ Roles management page functional
✅ Backend admin accessible at cleaner URL
