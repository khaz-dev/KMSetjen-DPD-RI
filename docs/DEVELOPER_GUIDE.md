# Developer Documentation - KMSetjen DPD RI Content Management System

**Version:** 1.0.0  
**Last Updated:** January 5, 2026

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Frontend Development](#frontend-development)
5. [Backend Development](#backend-development)
6. [API Integration](#api-integration)
7. [Testing](#testing)
8. [Code Style & Standards](#code-style--standards)
9. [Deployment](#deployment)
10. [Contributing](#contributing)

---

## Project Overview

**KMSetjen DPD RI Content Management System** is a full-stack web application for managing and publishing institutional content.

### Project Goals
- Enable content creators to publish articles
- Provide editorial workflow (review/approval)
- Maintain audit trail of all changes
- Support bilingual content (English & Indonesian)
- Scale to handle large content libraries

### Project Statistics
- **Backend:** 7,500+ lines (Django REST Framework)
- **Frontend:** 12,000+ lines (React 18)
- **Total Files:** 95+
- **API Endpoints:** 19+ core endpoints
- **Test Coverage:** 60%+ target

---

## Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  ┌───────────────────────────────────────────────┐  │
│  │ Pages    │ Components │ Services │ Contexts  │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/REST API
┌──────────────────────▼──────────────────────────────┐
│              Backend (Django REST)                  │
│  ┌───────────────────────────────────────────────┐  │
│  │ Views   │ Serializers │ Models │ Permissions │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ ORM
┌──────────────────────▼──────────────────────────────┐
│            Database (PostgreSQL/SQLite)             │
│  ┌───────────────────────────────────────────────┐  │
│  │ Users │ Articles │ Categories │ Audit Logs   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Component Structure

#### Frontend Components
```
src/
├── components/          # Reusable components
│   ├── AdminSidebar
│   └── __tests__/       # Component tests
├── pages/              # Page components
│   ├── AdminDashboardPage
│   ├── UserManagementPage
│   ├── RoleManagementPage
│   ├── ArticleEditorPage
│   ├── ArticleDetailPage
│   ├── LoginPage
│   └── __tests__/      # Page tests
├── contexts/           # React contexts
│   ├── AuthContext
│   └── UIContext
├── services/           # API services
│   └── apiService.js
├── styles/             # Global styles
└── App.js             # Main app component
```

#### Backend Apps
```
backend/
├── apps/
│   ├── users/         # User management
│   ├── articles/      # Article management
│   ├── categories/    # Categories
│   ├── audit/         # Audit logging
│   └── api/           # API endpoints
│       ├── v1/
│       │   ├── admin/     # Admin endpoints
│       │   ├── internal/  # Internal endpoints
│       │   └── public/    # Public endpoints
│       └── serializers/   # Data serialization
├── core/              # Project settings
├── manage.py          # Django management
└── requirements.txt   # Dependencies
```

---

## Technology Stack

### Frontend
- **React 18:** UI framework with Hooks
- **React Router v6:** Client-side routing
- **Bootstrap 5.3:** UI component library
- **React-Bootstrap:** Bootstrap + React integration
- **Axios:** HTTP client
- **React Icons:** Icon library

### Backend
- **Django 4.2:** Web framework
- **Django REST Framework:** REST API toolkit
- **PostgreSQL/SQLite:** Database
- **Django ORM:** Object-relational mapping
- **JWT:** Authentication

### Development Tools
- **Jest:** JavaScript testing
- **React Testing Library:** Component testing
- **Cypress:** E2E testing
- **pytest:** Python testing
- **Docker:** Containerization

---

## Frontend Development

### Component Development

#### Creating a New Component
```jsx
import React, { useState } from 'react';
import './ComponentName.css';

/**
 * ComponentName - Description of component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
function ComponentName({ title, onAction }) {
  const [state, setState] = useState(null);

  return (
    <div className="component-name">
      <h1>{title}</h1>
      <button onClick={() => onAction()}>Action</button>
    </div>
  );
}

export default ComponentName;
```

#### Best Practices
1. **Use Functional Components**
   - Modern React approach
   - Hooks for state management
   - Better performance

2. **Props Validation**
   ```jsx
   import PropTypes from 'prop-types';
   
   ComponentName.propTypes = {
     title: PropTypes.string.isRequired,
     onAction: PropTypes.func.isRequired,
   };
   ```

3. **State Management**
   - Use useState for local state
   - Use Context for global state
   - Avoid prop drilling

4. **Side Effects**
   - Use useEffect with dependencies
   - Always cleanup subscriptions
   - Handle loading/error states

### Page Development

#### Creating a New Page
```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PageName.css';

function PageName() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/endpoint/');
      setData(response.data.results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="page-name">
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}

export default PageName;
```

### API Integration

#### Using Axios
```jsx
import axios from 'axios';

// GET request
const response = await axios.get('/api/v1/users/');

// POST request
const response = await axios.post('/api/v1/users/', {
  username: 'john_doe',
  email: 'john@example.com'
});

// PUT request
const response = await axios.put('/api/v1/users/1/', {
  email: 'newemail@example.com'
});

// DELETE request
await axios.delete('/api/v1/users/1/');
```

#### Error Handling
```jsx
try {
  const response = await axios.get('/api/v1/endpoint/');
  setData(response.data);
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error('Error:', error.response.data);
    setError(error.response.data.message);
  } else if (error.request) {
    // Request sent but no response
    setError('No response from server');
  } else {
    // Error in request setup
    setError('Error: ' + error.message);
  }
}
```

---

## Backend Development

### Creating a New API Endpoint

#### Model Definition
```python
from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20,
        choices=[
            ('DRAFT', 'Draft'),
            ('PENDING', 'Pending'),
            ('PUBLISHED', 'Published'),
        ],
        default='DRAFT'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
```

#### Serializer Definition
```python
from rest_framework import serializers
from .models import Article

class ArticleSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(
        source='author.username',
        read_only=True
    )
    
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'content', 'author',
            'author_username', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
```

#### View Definition
```python
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Article
from .serializers import ArticleSerializer

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all()
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filter by author
        if self.action == 'list':
            return Article.objects.filter(author=self.request.user)
        return Article.objects.all()
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        article = self.get_object()
        article.status = 'PUBLISHED'
        article.save()
        return Response({'status': 'published'})
```

#### URL Configuration
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet

router = DefaultRouter()
router.register(r'articles', ArticleViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

### Best Practices
1. **Authentication:** Always require authentication for non-public endpoints
2. **Permissions:** Use permission classes to control access
3. **Serializers:** Validate data in serializers
4. **Error Handling:** Return appropriate HTTP status codes
5. **Documentation:** Add docstrings to all methods
6. **Testing:** Write tests for all endpoints

---

## Testing

### Frontend Testing

#### Unit Tests
```jsx
import { render, screen, fireEvent } from '../test-utils';
import Button from '../../components/Button';

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

#### Integration Tests
```jsx
import { render, screen, fireEvent, waitFor } from '../test-utils';
import axios from 'axios';
import UserPage from '../../pages/UserPage';

jest.mock('axios');

describe('UserPage Integration', () => {
  test('loads and displays users', async () => {
    axios.get.mockResolvedValue({
      data: { results: [{ id: 1, username: 'john' }] }
    });

    render(<UserPage />);

    await waitFor(() => {
      expect(screen.getByText('john')).toBeInTheDocument();
    });
  });
});
```

### Backend Testing
```python
from django.test import TestCase
from rest_framework.test import APIClient
from users.models import User
from articles.models import Article

class ArticleAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_list_articles(self):
        Article.objects.create(
            title='Test',
            author=self.user
        )
        response = self.client.get('/api/v1/articles/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_article(self):
        response = self.client.post('/api/v1/articles/', {
            'title': 'New Article',
            'content': 'Content here'
        })
        self.assertEqual(response.status_code, 201)
```

### Running Tests
```bash
# Frontend tests
npm test

# Frontend tests with coverage
npm test -- --coverage

# Backend tests
python manage.py test

# Backend tests with coverage
coverage run --source='.' manage.py test
coverage report
```

---

## Code Style & Standards

### JavaScript/React Standards
```javascript
// Use const/let, not var
const count = 0;
let name = 'John';

// Arrow functions
const handleClick = () => { /* ... */ };

// Template literals
const message = `Hello ${name}`;

// Destructuring
const { id, name, email } = user;

// Async/await
const data = await fetchData();

// Try/catch for errors
try {
  const response = await api.get('/endpoint');
} catch (error) {
  console.error('Error:', error);
}
```

### Python Standards (PEP 8)
```python
# Imports at top
import os
from django.db import models

# Use meaningful names
user_list = []
total_count = 0

# Docstrings for functions
def calculate_total(items):
    """Calculate sum of items."""
    return sum(items)

# Type hints (Python 3.9+)
def get_users(active: bool = True) -> list[User]:
    return User.objects.filter(is_active=active)

# Constants in CAPS
MAX_RETRIES = 3
DEFAULT_TIMEOUT = 30
```

### CSS Standards
```css
/* Use BEM naming convention */
.button {}
.button--primary {}
.button__icon {}

/* Organize properties */
.element {
  /* Position & Layout */
  position: absolute;
  display: flex;
  
  /* Box Model */
  margin: 0;
  padding: 10px;
  width: 100%;
  
  /* Visual */
  background: #fff;
  color: #333;
  border: 1px solid #ddd;
  
  /* Animations */
  transition: all 0.3s ease;
}

/* Mobile first approach */
.responsive {
  width: 100%;
  padding: 10px;
}

@media (min-width: 768px) {
  .responsive {
    width: 50%;
    padding: 20px;
  }
}
```

---

## Deployment

### Production Checklist
- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Static files collected
- [ ] Backup created
- [ ] Monitoring configured
- [ ] Performance optimized

### Frontend Deployment
```bash
# Build for production
npm run build

# This creates an optimized build in build/ folder
# Deploy to web server (nginx, Apache, etc.)
```

### Backend Deployment
```bash
# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic

# Start production server
gunicorn config.wsgi:application --bind 0.0.0.0:8002
```

### Docker Deployment
```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "config.wsgi:application"]
```

---

## Contributing

### Development Workflow
1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes**
   - Write code
   - Write tests
   - Update documentation

3. **Test locally**
   ```bash
   npm test
   python manage.py test
   ```

4. **Commit changes**
   ```bash
   git commit -m "Add: new feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/new-feature
   ```

### Commit Message Format
```
<type>: <description>

<optional body explaining why>

<optional footer with references>
```

Types: feat, fix, docs, style, refactor, test, chore

### Code Review Checklist
- [ ] Code follows standards
- [ ] Tests included and passing
- [ ] Documentation updated
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security reviewed

---

## Resources

### Documentation
- [Django REST Framework Docs](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [Bootstrap 5 Docs](https://getbootstrap.com/docs/5.3/)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [React DevTools](https://react.dev/learn/react-developer-tools) - React debugging
- [Django Debug Toolbar](https://django-debug-toolbar.readthedocs.io/) - Django debugging

### Getting Help
- Check existing documentation
- Search issues on GitHub
- Ask in team chat
- Contact development lead

---

**Last Updated:** January 5, 2026  
**Maintained by:** Development Team
