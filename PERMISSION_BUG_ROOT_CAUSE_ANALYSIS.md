# Permission Bug Root Cause Analysis
## Why Public User Could Access Dashboard & Create Knowledge

**Date:** March 31, 2026  
**Issue:** Users with "Peran Pengguna: Public" role could access Dashboard and create Pengetahuan (Knowledge/Articles)

---

## Executive Summary

This is **NOT an algorithm bug**—it's a **missing role validation check** in the backend API.

### The Problem
```
User Role: PUBLIC
Expected: ❌ Cannot create content
Reality:  ✅ CAN create content (bug!)
```

### Root Cause
The article creation endpoint only checks if the user is **authenticated**, NOT if they have the required **Contributor** role.

---

## Deep Technical Analysis

### 1. THE BUG LOCATION

**File:** [backend/apps/api/v1/internal/views.py](backend/apps/api/v1/internal/views.py#L90-L97)  
**Method:** `get_permissions()` in `ArticleViewSet`

#### ❌ CURRENT BUGGY CODE (Lines 90-97)
```python
def get_permissions(self):
    """Set permissions based on action."""
    if self.action in ['create']:
        # Contributors and above can create
        permission_classes = [IsAuthenticated]  # ❌ WRONG!
    elif self.action in ['update', 'partial_update']:
        permission_classes = [IsAuthenticated, IsAuthorOrEditor]
    elif self.action == 'destroy':
        permission_classes = [IsAuthenticated, IsAuthorOrEditor]
```

### 2. WHY THIS IS A BUG

The comment on line 92 says:
```
"Contributors and above can create"
```

But the actual permission check on line 94 only has:
```python
permission_classes = [IsAuthenticated]
```

This means:
- ✅ Any **authenticated** user can create
- ❌ No check for **Contributor role** exists
- ❌ A PUBLIC user (if somehow authenticated) can create articles

### 3. THE PERMISSION CLASSES

#### Available Permission Classes
Located in [backend/shared/permissions/base.py](backend/shared/permissions/base.py)

```python
class IsAuthenticated(permissions.IsAuthenticated):
    """Require authentication."""
    pass

class IsContributor(permissions.BasePermission):
    """Require contributor role or higher."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_contributor()

class IsEditor(permissions.BasePermission):
    """Require editor role or higher."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_editor()

class IsAdmin(permissions.BasePermission):
    """Require admin role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin()
```

#### What Should Be Used
```python
permission_classes = [IsAuthenticated, IsContributor]  # ✅ CORRECT
```

### 4. USER ROLE HIERARCHY

The system defines roles in [backend/apps/core/models.py](backend/apps/core/models.py#L130-L200):

```
Priority (High → Low):
  ADMIN > EDITOR > CONTRIBUTOR > READER > PUBLIC
```

#### Role Capabilities

| Role | `is_contributor()` | Can Create Articles? |
|------|:--:|:--:|
| **ADMIN** | ✅ YES | ✅ YES |
| **EDITOR** | ✅ YES | ✅ YES |
| **CONTRIBUTOR** | ✅ YES | ✅ YES |
| **READER** | ❌ NO | ❌ NO |
| **PUBLIC** | ❌ NO | ❌ NO |

#### The Logic Chain
In [backend/apps/core/models.py](backend/apps/core/models.py#L210-L225):

```python
def is_admin(self) -> bool:
    """Check if user is admin."""
    return self.has_role(Role.ADMIN) or self.is_superuser

def is_editor(self) -> bool:
    """Check if user is editor or higher."""
    return self.has_role(Role.EDITOR) or self.is_admin()

def is_contributor(self) -> bool:
    """Check if user is contributor or higher."""
    return self.has_role(Role.CONTRIBUTOR) or self.is_editor()

def can_create_content(self) -> bool:
    """Check if user can create content."""
    return self.is_contributor()  # ✅ CORRECT logic
```

The User model HAS the correct logic (`can_create_content()` and `is_contributor()`), but the **view doesn't use it**.

---

## 5. HOW THE BUG ALLOWED PUBLIC USER ACCESS

### Scenario: Public User Creating Article

```
1. User with ONLY "PUBLIC" role authenticates
   ├─ user.is_contributor() = FALSE
   ├─ user.can_create_content() = FALSE
   └─ But user IS authenticated ✅

2. User hits POST /api/v1/internal/articles/
   ├─ Permission check: IsAuthenticated
   ├─ user.is_authenticated = TRUE ✅
   └─ Permission granted! ❌ BUG!

3. Article is created
   ├─ Author = Public user
   └─ Access = depends on serializer defaults
```

### Why Dashboard Access Worked

Similar issue likely exists in Dashboard endpoints. If they only check `IsAuthenticated` without checking for `IsContributor` minimum role, a PUBLIC user could access it.

---

## 6. DEFENSIVE LAYERS (What SHOULD Have Caught This)

### Layer 1: ❌ View-Level Permission (MISSING - THE BUG)
```python
# File: internal/views.py
permission_classes = [IsAuthenticated]  # ❌ Should include IsContributor
```

### Layer 2: ✅ View-Level Queryset Filtering
**Exists in:** [backend/apps/api/v1/internal/views.py](backend/apps/api/v1/internal/views.py#L55-L72)
```python
def get_queryset(self):
    user = self.request.user
    if user.is_editor() or user.is_admin():
        # Editors see all articles
        return Article.objects.all()
    else:
        # Non-editors (Contributors) see only their own
        return Article.objects.filter(author=user)
```
This assumes user got past permission check. ✅ Correct logic, but no permission gate.

### Layer 3: ✅ Model-Level Methods
**Exists in:** [backend/apps/core/models.py](backend/apps/core/models.py#L218-L220)
```python
def can_create_content(self) -> bool:
    return self.is_contributor()
```
This exists but is never called!

### Layer 4: ✅ Frontend Route Protection
**File:** [frontend/src/components/RoleRequiredRoute.jsx](frontend/src/components/RoleRequiredRoute.jsx)
```javascript
if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
}
```
This would prevent PUBLIC users from SEEING the Dashboard UI, but backend has no guard.

---

## 7. THE VULNERABILITY

### Attack Scenario
```
1. Public user registers or authenticates
2. User manually calls API endpoint:
   POST /api/v1/internal/articles/
   {
     "title_id": "Test Article",
     "title_en": "Test Article",
     "content_id": "...",
     "content_en": "..."
   }

3. Backend checks: IsAuthenticated? YES ✅
   Backend checks: IsContributor? (not checked) ❌
   
4. Article created successfully
```

Even though the frontend wouldn't show the button to non-Contributors, the API endpoint is open!

---

## 8. THE FIX

### Step 1: Fix the Permission Check

**File:** `backend/apps/api/v1/internal/views.py`

**Change Line 94:**
```python
# ❌ BEFORE
if self.action in ['create']:
    permission_classes = [IsAuthenticated]

# ✅ AFTER
if self.action in ['create']:
    permission_classes = [IsAuthenticated, IsContributor]
```

### Step 2: Ensure IsContributor is Imported

**File:** `backend/apps/api/v1/internal/views.py` (Line 10)

Check that the import exists:
```python
from shared.permissions.base import IsAuthorOrEditor, IsEditor, IsContributor
```

### Step 3: Apply Same Pattern to Dashboard Endpoints

Check all dashboard-related endpoints use similar protection.

---

## 9. VERIFICATION CHECKLIST

After fix, verify:

- [ ] Public user **cannot** create articles via API
- [ ] Contributor user **can** create articles
- [ ] Editor user **can** create articles
- [ ] Admin user **can** create articles
- [ ] Frontend shows "Create Article" only to Contributors+
- [ ] Test with token that has PUBLIC role only
- [ ] Test with token that has CONTRIBUTOR role

---

## 10. WHY THIS ISN'T AN ALGORITHM BUG

### This IS a Permission Bug (Access Control)
- ✅ The User role method (`is_contributor()`) works correctly
- ✅ The permission class (`IsContributor`) exists and works correctly
- ✅ The queryset filtering logic is sound
- ❌ The permission is simply not **applied** in the view

### Common Misconception
```
Developer wrote:  "Contributors can create" (intent) ✅
Developer tested: Only with Contributor user (didn't test Public) ❌
Developer checked: Permission class exists (didn't use it) ❌
Result: Unfinished implementation ❌
```

---

## Summary

| Aspect | Status | Evidence |
|--------|--------|----------|
| **Bug Type** | Permission/Authorization | Missing role validation in view |
| **Severity** | HIGH | Unauthorized access to article creation |
| **Location** | Backend API view | `backend/apps/api/v1/internal/views.py` L94 |
| **Root Cause** | Only checks `IsAuthenticated`, not `IsContributor` | Missing permission class |
| **Fix Complexity** | LOW | Add one permission class |
| **Defensive Layers** | Multiple exist but bypassed | Frontend guard insufficient alone |
| **Algorithm Issue?** | NO | Logic is correct, just not applied |
| **Implementation Issue?** | YES | Incomplete implementation |

---

## Conclusion

**The user with "Public" role could create articles because:**

1. ✅ Frontend's RoleRequiredRoute guards prevented them from seeing the Dashboard UI
2. ❌ Backend's POST `/api/v1/internal/articles/` endpoint only checked `IsAuthenticated`
3. ❌ Backend did NOT check if user has `IsContributor` role
4. ✅ If they bypassed frontend (direct API call), they could create articles
5. ❌ The required `IsContributor` permission class exists but was not used

**This is a permission validation bug, not an algorithm bug.** The fix is straightforward: add `IsContributor` to the permission classes for the create action.
