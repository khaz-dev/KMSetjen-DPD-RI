# Backend Port 8002 Fix - Root Cause & Solution

**Status:** ✅ FIXED - Backend now runs on port 8002

**Issue:** Backend was running on port 8000 instead of 8002 despite configuration

**Root Cause (Deep Dive):**

Django command discovery follows a priority order based on `INSTALLED_APPS`:
- When multiple apps provide the same management command, the **first app in INSTALLED_APPS wins**
- The `config` app was NOT in `INSTALLED_APPS`, so it couldn't provide commands
- `django.contrib.staticfiles` IS in `INSTALLED_APPS` and provides its own `runserver` command
- Our custom `runserver.py` in `config/management/commands/` was being **ignored** because `config` wasn't registered as a Django app

**Why This Wasn't Obvious:**
- The custom command file existed and was syntactically correct
- But Django's app discovery system wasn't looking there
- Django only searches management commands in apps listed in `INSTALLED_APPS`

---

## The Fix

### 1. Moved Custom Command to apps.core (IN_INSTALLED_APPS)
**File:** `backend/apps/core/management/commands/runserver.py`

```python
# Location that WILL be discovered:
# backend/
# └── apps/
#     └── core/
#         └── management/
#             └── commands/
#                 └── runserver.py  ← Django now finds this!
```

### 2. Reordered INSTALLED_APPS to Prioritize apps.core

**File:** `backend/config/settings.py`

**Before:**
```python
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',  # <-- Has its own runserver
]

THIRD_PARTY_APPS = [...]

LOCAL_APPS = [
    'apps.core',  # <-- Comes AFTER staticfiles, so ignored
    ...
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS
```

**After:**
```python
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    # Moved staticfiles AFTER local apps
]

THIRD_PARTY_APPS = [...]

LOCAL_APPS = [
    'apps.core',  # <-- NOW COMES FIRST
    'apps.content',
    ...
]

DJANGO_APPS_AFTER_LOCAL = [
    'django.contrib.staticfiles',  # <-- apps.core.runserver takes priority
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS + DJANGO_APPS_AFTER_LOCAL
```

---

## Implementation Details

### apps/core/management/commands/runserver.py

```python
"""Custom runserver that defaults to port 8002."""

import os
from django.core.management.commands.runserver import Command as BaseCommand

class Command(BaseCommand):
    """
    Custom runserver that defaults to port 8002.
    
    Environment Variables:
        BACKEND_PORT: Override default port (default: 8002)
    """
    
    def handle(self, *args, **options):
        backend_port = os.environ.get('BACKEND_PORT', '8002')
        
        if not options.get('addrport'):
            options['addrport'] = f'0.0.0.0:{backend_port}'
            # Print confirmation messages
        
        return super().handle(*args, **options)
```

**Key Features:**
- ✅ Inherits from Django's base `runserver` Command
- ✅ Defaults to port 8002 if no addrport specified
- ✅ Respects `BACKEND_PORT` environment variable
- ✅ Placed in `apps.core` (first in LOCAL_APPS)
- ✅ Prioritized before `django.contrib.staticfiles`

---

## Verification

### Before Fix
```
$ python manage.py runserver
Starting development server at http://127.0.0.1:8000/  ❌ WRONG PORT
```

### After Fix
```
$ python manage.py runserver
[OK] Custom runserver command loaded
[OK] Backend running on port: 8002
[OK] URL: http://0.0.0.0:8002
Starting development server at http://0.0.0.0:8002/  ✅ CORRECT PORT
```

### Port Verification
```powershell
PS> Test-NetConnection -ComputerName localhost -Port 8002
ComputerName RemotePort TcpTestSucceeded
------------ ---------- ----------------
localhost          8002             True  ✅
```

---

## How to Start Backend (All Methods Work)

### Method 1: Default (Recommended) - Uses 8002
```bash
python manage.py runserver
# Starts on http://0.0.0.0:8002/
```

### Method 2: With Explicit Port
```bash
python manage.py runserver 8002
# Starts on http://0.0.0.0:8002/
```

### Method 3: With Environment Variable
```bash
$env:BACKEND_PORT="8002"
python manage.py runserver
# Starts on http://0.0.0.0:8002/
```

### Method 4: Startup Script (Guaranteed)
```bash
python run_backend.py
# Explicitly runs: python manage.py runserver 0.0.0.0:8002
```

### Method 5: Docker
```bash
docker-compose up backend
# Maps 8002:8002, gunicorn on 0.0.0.0:8002
```

---

## Files Modified

| File | Changes |
|------|---------|
| `backend/config/settings.py` | Reordered INSTALLED_APPS: moved staticfiles after LOCAL_APPS |
| `backend/apps/core/management/commands/runserver.py` | Created custom runserver command (moved from config) |

---

## System Check

```
$ python manage.py check
System check identified no issues (0 silenced).  ✅
```

---

## Frontend Connection

Frontend is configured correctly to proxy to backend:8002:
- ✅ `frontend/.env`: `VITE_API_URL=http://localhost:8002`
- ✅ `frontend/vite.config.js`: `proxy: { '/api': { target: 'http://localhost:8002' } }`

No additional frontend changes needed.

---

**Generated:** February 2, 2026
**Session:** Port Configuration Fix - Phase 7
