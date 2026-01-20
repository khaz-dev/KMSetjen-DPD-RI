# KMS Frontend - Quick Reference Guide

## Quick Start

```bash
cd frontend
npm install
npm start
# Opens http://localhost:3000
```

---

## User Flows

### First-Time User
1. Visit http://localhost:3000 → HomePage
2. Browse articles or click "Get Started"
3. Click "Register" → Create account
4. Login with credentials
5. Access Dashboard (http://localhost:3000/dashboard)

### Returning User
1. Visit http://localhost:3000
2. Click "Sign In" → Login
3. View dashboard and manage articles

### Article Browsing
1. HomePage → Browse featured articles
2. Click category card → See all in category
3. Click article card → Read full article
4. Use Articles page to search/filter

---

## Key URLs

### Public Pages
- `/` - Home page
- `/articles` - All articles (with search/filters)
- `/articles/:id` - Article detail
- `/category/:categoryId` - Category articles

### Auth Pages
- `/login` - Login form
- `/register` - Registration form

### Protected Pages
- `/dashboard` - User dashboard
- `/profile` - User profile & settings

### Admin Pages
- `/admin` - Admin panel (Phase 6.7)

### Error Pages
- `/403` - Access denied
- `/*` - 404 Not found

---

## API Integration

### Base URL
```javascript
// From .env file
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

### Service Methods

#### Auth Service
```javascript
authService.login(email, password)
authService.register(userData)
authService.logout()
authService.getMe()
authService.updateProfile(data)
authService.changePassword(data)
```

#### Public API
```javascript
publicAPI.getArticles(params)
publicAPI.getArticle(id)
publicAPI.getPopularArticles()
publicAPI.getCategories()
publicAPI.getTags()
```

#### Internal API
```javascript
internalAPI.getDashboard()
internalAPI.getMyArticles(params)
internalAPI.createArticle(data)
internalAPI.updateArticle(id, data)
internalAPI.deleteArticle(id)
internalAPI.submitArticle(id)
```

#### Admin API
```javascript
adminAPI.getUsers(params)
adminAPI.createUser(data)
adminAPI.updateUser(id, data)
adminAPI.deleteUser(id)
// ... and more
```

---

## Component Usage

### LoadingSpinner
```jsx
<LoadingSpinner message="Loading..." />
```

### ErrorAlert
```jsx
<ErrorAlert 
  message={error} 
  type="danger"
  onDismiss={() => setError(null)}
/>
```

### Pagination
```jsx
<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={(newPage) => setPage(newPage)}
/>
```

### SearchFilter
```jsx
<SearchFilter
  searchQuery={search}
  onSearchChange={setSearch}
  selectedCategory={category}
  onCategoryChange={setCategory}
  categories={categories}
  sortBy={sort}
  onSortChange={setSort}
  onReset={resetFilters}
/>
```

### Breadcrumbs
```jsx
<Breadcrumbs items={[
  { label: 'Home', path: '/' },
  { label: 'Articles', path: '/articles' },
  { label: 'Category', active: true }
]} />
```

### ProtectedRoute
```jsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// With role requirement
<ProtectedRoute requiredRole="ADMIN">
  <AdminPanel />
</ProtectedRoute>
```

---

## Hooks & Context

### useAuth Hook
```javascript
const { 
  user,              // Current user object
  isAuthenticated,   // Boolean
  isAdmin,          // Boolean - user is admin
  isEditor,         // Boolean - user is editor
  isContributor,    // Boolean - user is contributor
  loading,          // Loading state
  error,            // Error message
  login,            // login(email, password)
  logout,           // logout()
  updateProfile,    // updateProfile(data)
  changePassword    // changePassword(data)
} = useAuth();
```

### useNavigate Hook (React Router)
```javascript
const navigate = useNavigate();
navigate('/articles');           // Go to page
navigate('/articles/:id');       // With params
navigate(-1);                    // Go back
```

### useParams Hook (React Router)
```javascript
const { id } = useParams();      // Get URL params
```

### useSearchParams Hook (React Router)
```javascript
const [params, setParams] = useSearchParams();
const search = params.get('search');
const page = parseInt(params.get('page') || '1');
```

---

## Form Validation

### Required Fields
```javascript
if (!email) {
  errors.email = 'Email is required';
}
```

### Email Format
```javascript
if (!/\S+@\S+\.\S+/.test(email)) {
  errors.email = 'Email is invalid';
}
```

### Password Strength
```javascript
if (password.length < 8) {
  errors.password = 'Password must be at least 8 characters';
}
```

### Confirm Match
```javascript
if (password !== passwordConfirm) {
  errors.passwordConfirm = 'Passwords do not match';
}
```

---

## Styling

### Bootstrap Classes
```jsx
// Buttons
<button className="btn btn-primary">Primary</button>
<button className="btn btn-danger">Danger</button>
<button className="btn btn-outline-secondary">Outline</button>

// Layout
<div className="container">
<div className="row">
<div className="col-md-6">

// Spacing
<div className="p-3">      {/* Padding */}
<div className="m-2">      {/* Margin */}
<div className="mb-4">     {/* Margin bottom */}

// Text
<div className="text-center">
<div className="text-muted">
<strong>Bold text</strong>
```

### Colors
- Primary: `#0d6efd` (blue)
- Success: `#198754` (green)
- Danger: `#dc3545` (red)
- Warning: `#ffc107` (yellow)
- Info: `#0dcaf0` (cyan)

---

## Common Issues & Solutions

### Issue: API calls failing
**Solution:** Ensure backend is running and `.env` has correct API_BASE_URL
```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

### Issue: CORS errors
**Solution:** Backend must have CORS enabled for localhost:3000

### Issue: Pages showing "To be implemented"
**Solution:** Components are stubs waiting for implementation

### Issue: Can't access protected pages
**Solution:** Login first, then access protected routes

### Issue: Token errors
**Solution:** Clear localStorage and re-login
```javascript
localStorage.clear();
```

---

## Browser DevTools Tips

### React DevTools
- Install React DevTools browser extension
- Inspect component hierarchy
- View props and state
- Debug component re-renders

### Network Tab
- Watch API calls
- Check request/response headers
- Verify token in Authorization header
- Monitor performance

### Local Storage
- View stored tokens
- Clear cache if needed
- Debug token issues

---

## Performance Tips

1. **Use Pagination** - Don't load all articles at once
2. **Lazy Loading** - Load images only when visible
3. **Code Splitting** - Load routes on demand
4. **Memoization** - Use React.memo for expensive renders
5. **Debounce** - Debounce search input

---

## Common Routes to Test

| Action | URL | Expected |
|--------|-----|----------|
| Home | `/` | Featured articles |
| Browse articles | `/articles` | All articles list |
| Read article | `/articles/1` | Full article content |
| View category | `/category/1` | Articles in category |
| Login page | `/login` | Login form |
| Register | `/register` | Registration form |
| Dashboard | `/dashboard` | User stats (protected) |
| Profile | `/profile` | Edit profile (protected) |
| Admin | `/admin` | Admin panel (protected, admin only) |

---

## Git Commands (for development)

```bash
# Create feature branch
git checkout -b feature/component-name

# Commit changes
git add .
git commit -m "Add component description"

# Push to remote
git push origin feature/component-name

# Create pull request on GitHub
```

---

## Environment Setup

### .env file
```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
REACT_APP_API_TIMEOUT=10000
```

### Node.js Requirements
- Node.js 14+ (preferably 16+)
- npm 6+ or yarn

### Backend Requirements
- Django running on localhost:8000
- API endpoints accessible
- CORS enabled

---

## Useful Commands

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Run tests
npm test

# Build for production
npm run build

# Clear npm cache
npm cache clean --force

# Update packages
npm update

# Check outdated packages
npm outdated
```

---

## Next Development Phases

### Phase 6.6: Editor Dashboard
- [ ] Article editor with rich text
- [ ] Draft management
- [ ] Submit for review
- [ ] Edit existing articles

### Phase 6.7: Admin Panel
- [ ] User management
- [ ] Role management
- [ ] Audit logs
- [ ] Statistics

### Phase 6.8: Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Documentation

---

## Support & Resources

### React Documentation
https://react.dev

### React Router
https://reactrouter.com

### Bootstrap
https://getbootstrap.com

### Axios
https://axios-http.com

### Bootstrap React
https://react-bootstrap.github.io

---

**Frontend Quick Reference - Ready to Develop!** 🚀
