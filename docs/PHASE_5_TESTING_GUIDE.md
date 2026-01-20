"""
PHASE 5 QUICK START - Admin API Testing Guide
=============================================

## Admin User Setup

Before testing, create an admin user in Django shell:

```bash
python manage.py shell
from django.contrib.auth import get_user_model
from apps.core.models import Role

User = get_user_model()

# Create admin user
admin = User.objects.create_user(
    username='admin',
    email='admin@test.com',
    password='adminpass123',
    first_name='Admin',
    last_name='User',
    is_staff=True
)

# Add admin role
admin_role = Role.objects.get(code='ADMIN')
admin.roles.add(admin_role)
admin.save()

exit()
```

## Get Admin Token

```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "adminpass123"
  }'

export ADMIN_TOKEN="<access_token_from_response>"
```

## Test User Management

### List Users
```bash
curl http://localhost:8000/api/v1/admin/users/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Create User
```bash
curl -X POST http://localhost:8000/api/v1/admin/users/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testadmin",
    "email": "testadmin@test.com",
    "password": "testpass123",
    "password_confirm": "testpass123",
    "first_name": "Test",
    "last_name": "Admin",
    "nip": "123456"
  }'

# Save user ID: export USER_ID=<id>
```

### Get User Detail
```bash
curl http://localhost:8000/api/v1/admin/users/$USER_ID/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Update User
```bash
curl -X PATCH http://localhost:8000/api/v1/admin/users/$USER_ID/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "department": "Admin Department"
  }'
```

### Set User Password (Admin Only)
```bash
curl -X POST http://localhost:8000/api/v1/admin/users/$USER_ID/set-password/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "newpass123",
    "password_confirm": "newpass123"
  }'
```

### Deactivate User
```bash
curl -X POST http://localhost:8000/api/v1/admin/users/$USER_ID/deactivate/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Activate User
```bash
curl -X POST http://localhost:8000/api/v1/admin/users/$USER_ID/activate/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Delete User
```bash
curl -X DELETE http://localhost:8000/api/v1/admin/users/$USER_ID/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Test Role Management

### List Roles
```bash
curl http://localhost:8000/api/v1/admin/roles/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Create Role
```bash
curl -X POST http://localhost:8000/api/v1/admin/roles/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUPERVISOR",
    "name": "Supervisor",
    "description": "Can supervise editors"
  }'

# Save role ID: export ROLE_ID=<id>
```

### Get Role Detail
```bash
curl http://localhost:8000/api/v1/admin/roles/$ROLE_ID/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Update Role
```bash
curl -X PATCH http://localhost:8000/api/v1/admin/roles/$ROLE_ID/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Senior supervisor for critical operations"
  }'
```

### Add Permission to Role
First get permission ID:
```bash
curl http://localhost:8000/api/v1/admin/permissions/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" | head -30

# Save permission ID: export PERMISSION_ID=<id>
```

Then add:
```bash
curl -X POST http://localhost:8000/api/v1/admin/roles/$ROLE_ID/add-permission/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_id": '$PERMISSION_ID'
  }'
```

### Remove Permission from Role
```bash
curl -X POST http://localhost:8000/api/v1/admin/roles/$ROLE_ID/remove-permission/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_id": '$PERMISSION_ID'
  }'
```

## Test Audit Logs

### List All Audit Logs
```bash
curl http://localhost:8000/api/v1/admin/audit-logs/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Filter by Action
```bash
curl "http://localhost:8000/api/v1/admin/audit-logs/?action=UPDATE" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Filter by Resource Type
```bash
curl "http://localhost:8000/api/v1/admin/audit-logs/?resource_type=Article" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Filter by User
```bash
curl "http://localhost:8000/api/v1/admin/audit-logs/?user_id=$USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Advanced Filter
```bash
curl -X POST http://localhost:8000/api/v1/admin/audit-logs/filter/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "UPDATE",
    "resource_type": "Article",
    "date_from": "2026-01-01T00:00:00Z",
    "date_to": "2026-01-05T23:59:59Z"
  }'
```

### Get Audit Log Detail
```bash
# First get log ID
LOG_ID=$(curl -s "http://localhost:8000/api/v1/admin/audit-logs/" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.results[0].id')

curl http://localhost:8000/api/v1/admin/audit-logs/$LOG_ID/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Test Statistics

### System Statistics
```bash
curl http://localhost:8000/api/v1/admin/statistics/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### User Statistics
```bash
curl http://localhost:8000/api/v1/admin/statistics/users/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Article Statistics
```bash
curl http://localhost:8000/api/v1/admin/statistics/articles/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Audit Statistics
```bash
curl http://localhost:8000/api/v1/admin/statistics/audit/ \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Test Permissions

### Try accessing as non-admin (should fail)

Register non-admin user:
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "normal",
    "email": "normal@test.com",
    "password": "pass123"
  }'

# Login and get token
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "normal", "password": "pass123"}'

export NORMAL_TOKEN="<access_token>"
```

Try to access admin endpoints (should get 403 Forbidden):
```bash
curl http://localhost:8000/api/v1/admin/users/ \
  -H "Authorization: Bearer $NORMAL_TOKEN"

curl http://localhost:8000/api/v1/admin/roles/ \
  -H "Authorization: Bearer $NORMAL_TOKEN"

curl http://localhost:8000/api/v1/admin/statistics/ \
  -H "Authorization: Bearer $NORMAL_TOKEN"
```

Expected response:
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### Try without token (should fail with 401)
```bash
curl http://localhost:8000/api/v1/admin/users/

# Expected: 401 Unauthorized
```

## Run Automated Tests

### All admin tests
```bash
pytest tests/api/test_admin_api.py -v
```

### Test user management
```bash
pytest tests/api/test_admin_api.py::AdminUserManagementTest -v
```

### Test role management
```bash
pytest tests/api/test_admin_api.py::AdminRoleManagementTest -v
```

### Test audit logs
```bash
pytest tests/api/test_admin_api.py::AdminAuditLogTest -v
```

### Test statistics
```bash
pytest tests/api/test_admin_api.py::AdminStatisticsTest -v
```

### Test permissions
```bash
pytest tests/api/test_admin_api.py::AdminPermissionTest -v
```

### With coverage
```bash
pytest tests/api/test_admin_api.py --cov=apps.api.v1.admin --cov-report=html
```

## Expected Test Results

✅ 15+ test cases covering:
- User CRUD operations
- Role CRUD operations
- Permission management
- Audit log filtering
- Statistics endpoints
- Admin-only permission validation
- Error handling (duplicates, not found, unauthorized)

## Common Issues

**401 Unauthorized:**
- Token missing or invalid
- Check header format: `Authorization: Bearer <token>`

**403 Forbidden:**
- User doesn't have admin role
- Create admin user and use admin token

**404 Not Found:**
- Resource doesn't exist
- Use valid IDs from list endpoints

**400 Bad Request:**
- Missing required fields
- Password mismatch (password != password_confirm)
- Duplicate username/email/role code
- Check field names match serializer

## Complete Workflow Test

Full admin workflow:
```bash
# 1. Get admin token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"adminpass123"}' | jq -r '.access')

# 2. Create new user
USER_ID=$(curl -s -X POST http://localhost:8000/api/v1/admin/users/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"newadmin","email":"new@test.com","password":"pass123","password_confirm":"pass123"}' | jq '.id')

# 3. Get user detail
curl -s http://localhost:8000/api/v1/admin/users/$USER_ID/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# 4. Update user
curl -s -X PATCH http://localhost:8000/api/v1/admin/users/$USER_ID/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"New","department":"Admin"}' | jq .

# 5. Get statistics
curl -s http://localhost:8000/api/v1/admin/statistics/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.total_users'

# 6. View audit logs
curl -s http://localhost:8000/api/v1/admin/audit-logs/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.results | length'
```

---

**Phase 5 Admin API Testing Complete!** ✅
"""
