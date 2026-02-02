# Frontend Development - Phase 6

**Status:** In Progress

## Project Setup

### Initialize Frontend Project

```bash
cd frontend
npm install
npm start
```

### Environment Configuration

Create `.env` file in the frontend directory:

```env
REACT_APP_API_BASE_URL=http://localhost:8002/api
REACT_APP_API_TIMEOUT=10000
```

### Technology Stack

- **React 18** - UI library
- **React Router v6** - Client-side routing
- **Bootstrap 5** - CSS framework
- **React Bootstrap** - Bootstrap components for React
- **Axios** - HTTP client for API calls
- **JWT Decode** - JWT token handling
- **Date-fns** - Date formatting utilities
- **React Icons** - Icon library

---

## Project Structure

```
frontend/
├── public/                 # Static files
│   └── index.html         # Main HTML file
├── src/
│   ├── components/        # Reusable components
│   │   ├── Header.js      # Navigation header
│   │   ├── Footer.js      # Footer component
│   │   └── ProtectedRoute.js # Route protection
│   ├── contexts/          # React Context
│   │   └── AuthContext.js # Authentication context
│   ├── pages/             # Page components
│   │   ├── HomePage.js    # Home page
│   │   └── ArticleDetailPage.js # Article detail
│   ├── services/          # API services
│   │   └── api.js        # API client
│   ├── App.js             # Main app component
│   ├── App.css            # Global styles
│   └── index.js           # Entry point
├── package.json           # Dependencies
└── .env                   # Environment variables
```

---

## Completed Components

### 1. Authentication Context (AuthContext.js)
- User login/logout
- Token management
- User state management
- Role-based access control

### 2. API Service (api.js)
- Authentication endpoints
- Public API endpoints
- Internal API endpoints
- Admin API endpoints
- Automatic token refresh
- Error handling

### 3. Route Protection (ProtectedRoute.js)
- Authenticated route wrapper
- Role-based route protection
- Loading states
- Unauthorized access handling

### 4. Header Component
- Navigation bar
- User menu dropdown
- Login/Register links
- Mobile responsive

### 5. Footer Component
- Quick links
- About section
- Legal links
- Copyright info

### 6. Home Page
- Hero section
- Search functionality
- Featured articles
- Category browsing
- Call to action

### 7. Article Detail Page
- Article content display
- Metadata display (author, date, views)
- Category and tags
- Related article information
- Responsive layout

---

## Components To Be Implemented

### Phase 6.2: Core Components
- [ ] Loading spinner
- [ ] Error alert
- [ ] Pagination
- [ ] Search filter
- [ ] Breadcrumbs

### Phase 6.3: Public Pages
- [ ] Articles listing page
- [ ] Category detail page
- [ ] Tag detail page
- [ ] Search results page

### Phase 6.4: Authentication Pages
- [ ] Login page
- [ ] Register page
- [ ] Forgot password page
- [ ] Profile page
- [ ] Settings page

### Phase 6.5: Contributor Dashboard
- [ ] Dashboard overview
- [ ] My articles list
- [ ] Article editor
- [ ] Draft management
- [ ] Statistics

### Phase 6.6: Editor Dashboard
- [ ] Articles for review
- [ ] Review interface
- [ ] Approval workflow
- [ ] Publishing interface
- [ ] Rejection handling

### Phase 6.7: Admin Dashboard
- [ ] User management
- [ ] Role management
- [ ] Permission management
- [ ] Audit log viewer
- [ ] System statistics

### Phase 6.8: Additional Pages
- [ ] About page
- [ ] Contact page
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] 404 error page

---

## Running the Application

### Development Mode

```bash
npm start
```

The app will open at `http://localhost:5175`

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

---

## API Integration

All API endpoints are defined in `src/services/api.js`. The API client:

1. **Handles Authentication**
   - Adds JWT token to all requests
   - Automatically refreshes expired tokens
   - Redirects to login on token failure

2. **Error Handling**
   - Catches and logs errors
   - Provides meaningful error messages
   - Handles 401/403 errors appropriately

3. **Request Interceptors**
   - Adds authorization header
   - Handles request timeout
   - Formats requests properly

4. **Response Interceptors**
   - Handles token refresh
   - Processes error responses
   - Manages redirects

---

## Styling

- **Bootstrap 5** for base styles
- **Custom CSS** for component-specific styling
- **CSS Modules** (optional) for component isolation
- **Mobile-first** responsive design

### Color Scheme

- **Primary**: #0d6efd (Blue)
- **Success**: #198754 (Green)
- **Danger**: #dc3545 (Red)
- **Warning**: #ffc107 (Yellow)
- **Info**: #0dcaf0 (Cyan)

---

## State Management

### Context API

Currently using React Context API for global state:

- **AuthContext** - Authentication and user state
- **Can be extended** for other global state

For larger apps, consider Redux or Zustand.

---

## Routing

Using React Router v6 for client-side routing:

```javascript
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/articles/:id" element={<ArticleDetailPage />} />
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />
  <Route
    path="/admin"
    element={
      <ProtectedRoute requiredRole="ADMIN">
        <AdminPanel />
      </ProtectedRoute>
    }
  />
</Routes>
```

---

## Testing

```bash
npm test
```

Creates test suites for components and services.

---

## Deployment

### Development Server

```bash
npm start
```

### Production Build

```bash
npm run build
```

Deploy the `build/` folder to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Apache/Nginx web server

### Environment Setup

For production, update `.env`:

```env
REACT_APP_API_BASE_URL=https://api.yourdomain.com/api
REACT_APP_API_TIMEOUT=10000
```

---

## Next Steps

1. **Phase 6.2:** Implement remaining core components
2. **Phase 6.3:** Create public-facing pages
3. **Phase 6.4:** Build authentication system
4. **Phase 6.5:** Develop contributor dashboard
5. **Phase 6.6:** Create editor dashboard
6. **Phase 6.7:** Build admin panel
7. **Phase 6.8:** Add additional pages and polish UI

---

## Common Issues

### CORS Errors

The backend must have CORS enabled. Check Django settings:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5175",
    "https://yourdomain.com",
]
```

### Token Expiration

The API service automatically handles token refresh. Users will be redirected to login if refresh fails.

### API Not Found

Ensure the backend is running and `REACT_APP_API_BASE_URL` points to correct URL.

---

## Performance Tips

1. Use lazy loading for routes
2. Memoize expensive computations
3. Implement pagination for large lists
4. Optimize images
5. Use production build for deployment

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/component-name

# Make changes and commit
git add .
git commit -m "Add component description"

# Push to remote
git push origin feature/component-name

# Create pull request on GitHub
```

---

**Frontend Phase 6 - In Progress** 🚀
