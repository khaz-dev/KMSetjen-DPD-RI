# Testing Guide - KMSetjen DPD RI Content Management System

**Version:** 1.0.0  
**Last Updated:** January 5, 2026

---

## Table of Contents
1. [Testing Overview](#testing-overview)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Test Execution](#test-execution)
6. [Coverage Reports](#coverage-reports)
7. [CI/CD Integration](#cicd-integration)
8. [Test Data](#test-data)
9. [Performance Testing](#performance-testing)

---

## Testing Overview

### Testing Pyramid
```
        /\
       /  \ E2E Tests (10%)
      /────\
     /  INT \  Integration Tests (30%)
    /────────\
   /   UNIT   \ Unit Tests (60%)
  /────────────\
```

### Testing Standards
- **Minimum Coverage:** 60% of code
- **Critical Features:** 100% coverage required
- **Backend:** All API endpoints must be tested
- **Frontend:** All pages and components must be tested

### Test Environments
- **Unit Tests:** Run locally, no external dependencies
- **Integration Tests:** Run with database, external services mocked
- **E2E Tests:** Run against staging environment

---

## Unit Testing

### Frontend Unit Tests

#### Testing Components
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../components/Button';

describe('Button Component', () => {
  test('renders with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('calls onClick handler', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies variant classes', () => {
    render(<Button variant="primary">Click</Button>);
    expect(screen.getByText('Click')).toHaveClass('btn-primary');
  });
});
```

#### Testing Hooks
```javascript
import { renderHook, act } from '@testing-library/react';
import useAuth from '../../hooks/useAuth';

describe('useAuth Hook', () => {
  test('initializes with null user', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  test('updates user on login', () => {
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      result.current.login('user@example.com', 'password');
    });
    
    expect(result.current.user).toBeDefined();
  });
});
```

#### Testing Async Code
```javascript
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import UserList from '../../components/UserList';

jest.mock('axios');

test('loads and displays users', async () => {
  axios.get.mockResolvedValue({
    data: { results: [{ id: 1, name: 'John' }] }
  });

  render(<UserList />);

  await waitFor(() => {
    expect(screen.getByText('John')).toBeInTheDocument();
  });
});
```

### Backend Unit Tests

#### Testing Models
```python
from django.test import TestCase
from users.models import User

class UserModelTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_user_creation(self):
        self.assertEqual(self.user.username, 'testuser')
        self.assertTrue(self.user.is_active)

    def test_user_password_hashed(self):
        self.assertNotEqual(self.user.password, 'testpass123')
        self.assertTrue(self.user.check_password('testpass123'))
```

#### Testing Serializers
```python
from rest_framework.test import APITestCase
from articles.serializers import ArticleSerializer
from articles.models import Article
from users.models import User

class ArticleSerializerTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )

    def test_valid_serialization(self):
        article = Article.objects.create(
            title='Test',
            content='Content',
            author=self.user
        )
        serializer = ArticleSerializer(article)
        self.assertEqual(serializer.data['title'], 'Test')

    def test_invalid_serialization(self):
        serializer = ArticleSerializer(data={'title': ''})
        self.assertFalse(serializer.is_valid())
```

#### Testing Utilities
```python
from django.test import TestCase
from articles.utils import format_title

class UtilityFunctionsTestCase(TestCase):
    def test_format_title(self):
        result = format_title('hello world')
        self.assertEqual(result, 'Hello World')

    def test_format_title_empty(self):
        result = format_title('')
        self.assertEqual(result, '')
```

---

## Integration Testing

### Frontend Integration Tests

#### Testing API Workflows
```javascript
import { render, screen, fireEvent, waitFor } from '../test-utils';
import axios from 'axios';
import UserManagementPage from '../../pages/UserManagementPage';

jest.mock('axios');

describe('User Management Integration', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({
      data: {
        results: [
          { id: 1, username: 'john', email: 'john@example.com' }
        ]
      }
    });
  });

  test('complete create user workflow', async () => {
    render(<UserManagementPage />);

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('john')).toBeInTheDocument();
    });

    // Click add user
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    // Fill form
    fireEvent.change(screen.getByName('username'), {
      target: { value: 'newuser' }
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    // Verify API call
    expect(axios.post).toHaveBeenCalledWith(
      '/api/v1/admin/users/',
      expect.objectContaining({ username: 'newuser' })
    );
  });
});
```

### Backend Integration Tests

#### Testing API Endpoints
```python
from django.test import TestCase
from rest_framework.test import APIClient
from users.models import User
from articles.models import Article

class ArticleAPIIntegrationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_article_workflow(self):
        # Create article
        response = self.client.post('/api/v1/articles/', {
            'title': 'Test Article',
            'content': 'Article content',
            'category': 1
        })
        self.assertEqual(response.status_code, 201)
        article_id = response.data['id']

        # Retrieve article
        response = self.client.get(f'/api/v1/articles/{article_id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], 'Test Article')

        # Update article
        response = self.client.put(f'/api/v1/articles/{article_id}/', {
            'title': 'Updated Title',
            'content': 'Updated content'
        })
        self.assertEqual(response.status_code, 200)

        # Delete article
        response = self.client.delete(f'/api/v1/articles/{article_id}/')
        self.assertEqual(response.status_code, 204)
```

#### Testing Permissions
```python
from rest_framework.test import APITestCase
from users.models import User

class PermissionIntegrationTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            password='admin123',
            is_staff=True
        )
        self.user = User.objects.create_user(
            username='user',
            password='user123'
        )

    def test_admin_access(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/v1/admin/users/')
        self.assertEqual(response.status_code, 200)

    def test_user_denied_admin_access(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/v1/admin/users/')
        self.assertEqual(response.status_code, 403)
```

---

## End-to-End Testing

### Using Cypress

#### Test Structure
```javascript
describe('Article Publishing Workflow', () => {
  beforeEach(() => {
    cy.login('editor@example.com', 'password123');
    cy.visit('/editor/dashboard');
  });

  it('should publish article from creation to publication', () => {
    // Create
    cy.get('[data-cy=create-article]').click();
    cy.get('[name=title]').type('New Article');
    cy.get('[name=content]').type('Article body');
    cy.get('[data-cy=save]').click();

    // Submit for review
    cy.visit('/editor/articles/1');
    cy.get('[data-cy=submit-review]').click();

    // Admin approves
    cy.login('admin@example.com', 'admin123');
    cy.visit('/admin/articles');
    cy.get('[data-cy=approve-article-1]').click();

    // Verify published
    cy.logout();
    cy.visit('/articles/new-article');
    cy.get('h1').should('contain', 'New Article');
  });
});
```

#### Common Commands
```javascript
// Custom command for login
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[name=email]').type(email);
  cy.get('[name=password]').type(password);
  cy.get('[type=submit]').click();
  cy.url().should('not.include', '/login');
});

// Custom command for logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy=user-menu]').click();
  cy.get('[data-cy=logout]').click();
  cy.url().should('include', '/login');
});
```

---

## Test Execution

### Running Frontend Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test UserManagement.test.js

# Run tests matching pattern
npm test --testNamePattern="create user"

# Run tests with coverage
npm test -- --coverage

# Run tests once (CI mode)
npm test -- --watchAll=false

# Run E2E tests
npm run test:e2e

# Run E2E tests headless
npm run test:e2e:run
```

### Running Backend Tests
```bash
# Run all tests
python manage.py test

# Run specific app
python manage.py test users

# Run specific test class
python manage.py test users.tests.UserTestCase

# Run specific test method
python manage.py test users.tests.UserTestCase.test_user_creation

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML report
```

### Test Order
1. **Unit Tests** - Fastest, run first
2. **Integration Tests** - Medium speed
3. **E2E Tests** - Slowest, run last

---

## Coverage Reports

### Frontend Coverage
```bash
npm test -- --coverage --watchAll=false
```

**Report Output:**
```
Statements   : 68.5% ( 137/200 )
Branches     : 62.3% ( 98/157 )
Functions    : 65.0% ( 26/40 )
Lines        : 69.2% ( 139/200 )
```

### Backend Coverage
```bash
coverage run --source='.' manage.py test
coverage report
coverage html
```

**Report Locations:**
- HTML Report: `htmlcov/index.html`
- Console Report: Terminal output

### Coverage Goals
- **Overall:** 60% minimum
- **Critical paths:** 100%
- **API endpoints:** 90%
- **Models:** 85%
- **Utilities:** 80%

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: npm test -- --coverage --watchAll=false
      - uses: codecov/codecov-action@v2

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - run: cd backend && pip install -r requirements.txt
      - run: python manage.py test
      - run: coverage run --source='.' manage.py test
      - run: coverage report
```

---

## Test Data

### Fixtures
```python
# fixtures/users.json
[
  {
    "model": "auth.user",
    "pk": 1,
    "fields": {
      "username": "testuser",
      "email": "test@example.com",
      "password": "pbkdf2_sha256$..."
    }
  }
]
```

### Factories
```python
import factory
from users.models import User

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.Faker('email')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')

# Usage
user = UserFactory()
users = UserFactory.create_batch(5)
```

---

## Performance Testing

### Load Testing
```python
# Using locust
from locust import HttpUser, task

class WebsiteUser(HttpUser):
    @task
    def index(self):
        self.client.get("/")
    
    @task
    def articles(self):
        self.client.get("/api/v1/articles/")
```

### Benchmark Testing
```javascript
// Frontend performance
performance.mark('start');
// ... code to test
performance.mark('end');
performance.measure('duration', 'start', 'end');
```

---

## Test Checklist

Before deployment, verify:

### Functionality
- [ ] All user workflows tested
- [ ] All API endpoints tested
- [ ] Error cases handled
- [ ] Validation working

### Quality
- [ ] Test coverage 60%+
- [ ] No console errors
- [ ] No unhandled promises
- [ ] Performance acceptable

### Security
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Input validation tested
- [ ] XSS protection verified

### Compatibility
- [ ] Chrome latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Mobile browsers

---

**Last Updated:** January 5, 2026  
**Maintained by:** QA Team
