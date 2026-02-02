# Quick Reference: Running Tests & Verification

## Frontend Tests

### Run All Frontend Tests
```bash
cd frontend
npm test -- --watchAll=false
```

**Expected Output:**
```
Test Suites: 4 passed, 4 total
Tests:       32 passed, 32 total
Snapshots:   0 total
Time:        X.XXXs
```

### Run Frontend with Coverage
```bash
cd frontend
npm test -- --coverage --watchAll=false
```

### Run Specific Test File
```bash
cd frontend
npm test -- src/pages/HomePage.test.js --watchAll=false
```

### Watch Mode (Auto-rerun on file change)
```bash
cd frontend
npm test
```

---

## Backend Model Tests

### Run All Model Tests
```bash
cd backend
pytest tests/models/test_models.py -v
```

**Expected Output:**
```
tests/models/test_models.py::RoleModelTest::test_role_creation PASSED
tests/models/test_models.py::RoleModelTest::test_role_inactive PASSED
... (25 more tests)
====================== 27 passed in X.XXs ======================
```

### Run Model Tests with Coverage
```bash
cd backend
pytest tests/models/test_models.py --cov=apps --cov-report=html
```

This generates coverage report in `htmlcov/index.html`

### Run Specific Test Class
```bash
cd backend
pytest tests/models/test_models.py::UserModelTest -v
```

### Run Specific Test Method
```bash
cd backend
pytest tests/models/test_models.py::UserModelTest::test_user_creation -v
```

### Run with Detailed Output & Short Traceback
```bash
cd backend
pytest tests/models/test_models.py -v --tb=short
```

---

## Backend API Tests (Ready to Run)

### Run CRUD Operation Tests
```bash
cd backend
pytest tests/api/test_crud_operations.py -v
```

### Run Permission Tests
```bash
cd backend
pytest tests/api/test_permissions.py -v
```

### Run Authentication Tests
```bash
cd backend
pytest tests/api/test_authentication.py -v
```

### Run All API Tests Together
```bash
cd backend
pytest tests/api/test_crud_operations.py tests/api/test_permissions.py tests/api/test_authentication.py -v
```

---

## Complete Test Suite

### Run All Tests (Frontend + Backend)
```bash
# Terminal 1: Frontend
cd frontend
npm test -- --watchAll=false

# Terminal 2: Backend
cd backend
pytest tests/
```

### Generate Full Coverage Report
```bash
cd backend
pytest tests/models/test_models.py tests/api/test_crud_operations.py --cov=apps --cov-report=html
```

---

## Verification Checklist

### ✅ Frontend Tests
```bash
cd frontend
npm test -- --watchAll=false
```
**Expected:** ✅ All 32 tests passing

### ✅ Backend Model Tests
```bash
cd backend
pytest tests/models/test_models.py -q
```
**Expected:** ✅ All 27 tests passing

### ✅ Backend Configuration
```bash
cd backend
pip list | grep -E "Django|pytest|rest"
```
**Expected:** 
- Django 4.2.8
- djangorestframework 3.14.0
- pytest 7.4.3
- pytest-django 4.7.0

### ✅ Database Setup
```bash
cd backend
python manage.py migrate --run-syncdb
```
**Expected:** ✅ All migrations applied successfully

---

## Development Server

### Run Frontend Development Server
```bash
cd frontend
npm start
```
**Access at:** http://localhost:5175

### Run Backend Development Server
```bash
cd backend
python manage.py runserver
```
**Access at:** http://localhost:8002

### Run Backend with Debugger
```bash
cd backend
python -m pdb manage.py runserver
```

---

## Common Test Commands

### Run Tests in Parallel (faster)
```bash
cd backend
pytest tests/models/test_models.py -n auto
```
*Requires: pytest-xdist*

### Run Only Failed Tests
```bash
cd backend
pytest tests/models/test_models.py --lf
```

### Run Tests Matching Pattern
```bash
cd backend
pytest tests/models/test_models.py -k "user"
```

### Show Print Statements in Tests
```bash
cd backend
pytest tests/models/test_models.py -v -s
```

### Stop on First Failure
```bash
cd backend
pytest tests/models/test_models.py -x
```

### Run Last N Tests Before Stopping
```bash
cd backend
pytest tests/models/test_models.py -x --maxfail=3
```

---

## Coverage Reports

### View Coverage in Terminal
```bash
cd backend
pytest tests/models/test_models.py --cov=apps --cov-report=term-missing
```

### Generate HTML Coverage Report
```bash
cd backend
pytest tests/models/test_models.py --cov=apps --cov-report=html
# Open: htmlcov/index.html
```

### Generate XML Coverage Report (for CI/CD)
```bash
cd backend
pytest tests/models/test_models.py --cov=apps --cov-report=xml
```

---

## Troubleshooting

### Python Module Not Found
```bash
# Make sure dependencies are installed
cd backend
pip install -r requirements.txt
cd ../frontend
npm install
```

### Django Settings Not Found
```bash
# Set DJANGO_SETTINGS_MODULE
cd backend
export DJANGO_SETTINGS_MODULE=config.settings
pytest tests/models/test_models.py -v
```

### Database Locked
```bash
# Clear test database
cd backend
rm db.sqlite3  # if using SQLite
pytest tests/models/test_models.py -v --reuse-db
```

### Import Errors
```bash
# Reinstall in development mode
cd backend
pip install -e .
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Frontend Tests
        run: cd frontend && npm ci && npm test -- --watchAll=false
      - name: Run Backend Tests
        run: cd backend && pip install -r requirements.txt && pytest tests/
```

---

## Performance Tips

### Faster Model Tests
```bash
cd backend
pytest tests/models/test_models.py --reuse-db --nomigrations
```

### Parallel Test Execution
```bash
cd backend
pytest tests/ -n auto
```
*Requires: `pip install pytest-xdist`*

### Cache Test Results
```bash
cd backend
pytest tests/models/test_models.py --cache-clear
```

---

## Test Monitoring

### Watch Tests for Changes
```bash
cd backend
pytest-watch tests/models/test_models.py
```
*Requires: `pip install pytest-watch`*

### Show Slowest Tests
```bash
cd backend
pytest tests/models/test_models.py --durations=10
```

---

## Summary

| Command | Purpose | Expected |
|---------|---------|----------|
| `npm test -- --watchAll=false` | Frontend tests | 32/32 ✅ |
| `pytest tests/models/ -v` | Backend model tests | 27/27 ✅ |
| `pytest tests/api/ -v` | Backend API tests | 35+ created |
| `pytest tests/ --cov=apps` | Full coverage report | 80%+ target |
| `npm start` | Frontend dev server | localhost:5175 |
| `python manage.py runserver` | Backend dev server | localhost:8002 |

---

## Key Files for Reference

### Frontend
- `frontend/package.json` - Dependencies and test scripts
- `frontend/jest.config.js` - Jest test configuration
- `frontend/.env` - Environment variables

### Backend
- `backend/pytest.ini` - Pytest configuration
- `backend/requirements.txt` - Python dependencies
- `backend/manage.py` - Django management commands
- `backend/config/settings.py` - Django settings

### Documentation
- `SESSION_SUMMARY.md` - Full session summary
- `PROJECT_STATUS.md` - Overall project status
- `PHASE_4_TEST_REPORT.md` - Detailed test report
- This file: Quick reference for running tests

---

**Happy Testing! 🚀**
