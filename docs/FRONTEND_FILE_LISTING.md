# Frontend Project - Complete File Listing

## Project Status: Phase 6.2-6.5 Complete ✅

**Total Files: 38 files**
**Total Lines: 3,200+ lines**
**Phases Complete: 6 of 8**

---

## Directory Structure

```
frontend/
├── public/
│   └── index.html (20 lines)
│
├── src/
│   ├── components/
│   │   ├── Breadcrumbs.js (29 lines)
│   │   ├── Breadcrumbs.css (32 lines)
│   │   ├── ErrorAlert.js (22 lines)
│   │   ├── ErrorAlert.css (24 lines)
│   │   ├── Footer.js (61 lines)
│   │   ├── Header.js (100 lines)
│   │   ├── Header.css (40 lines)
│   │   ├── LoadingSpinner.js (20 lines)
│   │   ├── LoadingSpinner.css (20 lines)
│   │   ├── Pagination.js (72 lines)
│   │   ├── Pagination.css (54 lines)
│   │   ├── ProtectedRoute.js (50 lines)
│   │   └── SearchFilter.js (63 lines)
│   │       └── SearchFilter.css (58 lines)
│   │
│   ├── contexts/
│   │   └── AuthContext.js (110 lines)
│   │
│   ├── pages/
│   │   ├── ArticleDetailPage.js (190 lines)
│   │   ├── ArticleDetailPage.css (80 lines)
│   │   ├── ArticlesPage.js (180 lines)
│   │   ├── ArticlesPage.css (130 lines)
│   │   ├── AuthPages.css (148 lines)
│   │   ├── CategoryDetailPage.js (120 lines)
│   │   ├── CategoryDetailPage.css (110 lines)
│   │   ├── DashboardPage.js (170 lines)
│   │   ├── DashboardPage.css (140 lines)
│   │   ├── HomePage.js (182 lines)
│   │   ├── HomePage.css (90 lines)
│   │   ├── LoginPage.js (120 lines)
│   │   ├── ProfilePage.js (230 lines)
│   │   ├── ProfilePage.css (100 lines)
│   │   └── RegisterPage.js (170 lines)
│   │
│   ├── services/
│   │   └── api.js (200+ lines)
│   │
│   ├── App.js (84 lines)
│   ├── App.css (80 lines)
│   └── index.js (10 lines)
│
├── package.json (30 lines)
└── .env (2 lines - to be created)
```

---

## File Details

### Public Files

#### public/index.html
- HTML5 template for React app
- Meta tags for SEO and responsive design
- Root div for React mounting
- Bootstrap CDN (optional, using package instead)

### Components (frontend/src/components/)

#### Breadcrumbs.js & Breadcrumbs.css
- **Purpose:** Navigation breadcrumb trail
- **Props:**
  - `items` (array) - Breadcrumb items with label, path, active
- **Features:**
  - Click navigation
  - Active state styling
  - Responsive

#### ErrorAlert.js & ErrorAlert.css
- **Purpose:** Display error messages
- **Props:**
  - `message` (string) - Error message
  - `type` (string, default 'danger') - Alert variant
  - `onDismiss` (function) - Dismiss callback
- **Features:**
  - Dismissible
  - Slide-in animation
  - Bootstrap Alert variant

#### Footer.js (+ Header.css)
- **Purpose:** Footer with links and copyright
- **Features:**
  - 3-column layout (About, Links, Info)
  - Dynamic year
  - Responsive design
  - Sticky footer option

#### Header.js & Header.css
- **Purpose:** Navigation header with user menu
- **Features:**
  - Logo and home link
  - Navigation links
  - User dropdown menu
  - Login/Register buttons for guests
  - Responsive toggle for mobile
  - Sticky navbar

#### LoadingSpinner.js & LoadingSpinner.css
- **Purpose:** Loading indicator
- **Props:**
  - `message` (string, optional) - Loading message
- **Features:**
  - Centered spinner
  - Primary color (Bootstrap)
  - Optional message

#### Pagination.js & Pagination.css
- **Purpose:** Page navigation
- **Props:**
  - `currentPage` (number) - Current page
  - `totalPages` (number) - Total pages
  - `onPageChange` (function) - Page change callback
- **Features:**
  - Smart page numbering
  - Ellipsis for large page counts
  - Previous/Next buttons
  - Page info display
  - Hover effects

#### ProtectedRoute.js
- **Purpose:** Route protection wrapper
- **Components:**
  - `ProtectedRoute` - For authenticated routes
  - `PublicRoute` - For public routes
- **Features:**
  - Authentication check
  - Role-based access control
  - Loading spinner during auth check
  - Redirect to login if unauthenticated
  - Redirect to 403 if insufficient role

#### SearchFilter.js & SearchFilter.css
- **Purpose:** Search and filter interface
- **Props:**
  - `searchQuery` (string) - Current search term
  - `onSearchChange` (function) - Search change callback
  - `selectedCategory` (string) - Current category
  - `onCategoryChange` (function) - Category change callback
  - `categories` (array) - Category options
  - `sortBy` (string) - Current sort option
  - `onSortChange` (function) - Sort change callback
  - `onReset` (function) - Reset filters callback
- **Features:**
  - Search input with icon
  - Category dropdown
  - Sort options (date, views, title)
  - Reset button
  - Responsive layout

### Contexts (frontend/src/contexts/)

#### AuthContext.js
- **Purpose:** Global authentication state management
- **Exports:**
  - `AuthProvider` - Context provider component
  - `useAuth` - Hook to access auth state
- **State:**
  - `user` - Current user object
  - `loading` - Loading state
  - `error` - Error messages
  - `isAuthenticated` - Boolean
  - `isAdmin`, `isEditor`, `isContributor` - Role checks
- **Methods:**
  - `login(email, password)` - User login
  - `register(userData)` - User registration
  - `logout()` - User logout
  - `updateProfile(data)` - Update user profile
  - `changePassword(data)` - Change password
- **Features:**
  - Auto-load user on mount from localStorage
  - Token persistence
  - Automatic logout on token expiration
  - Role-based access control

### Pages (frontend/src/pages/)

#### HomePage.js & HomePage.css
- **Purpose:** Landing page
- **Features:**
  - Hero section with description and search
  - Featured articles listing (3 cards)
  - Browse by category section (6 categories)
  - Call-to-action section
  - Loading and error states
  - Search form redirects to articles page
- **Data:**
  - Fetches popular articles
  - Fetches all categories

#### ArticleDetailPage.js & ArticleDetailPage.css
- **Purpose:** Full article view
- **Route:** `/articles/:id`
- **Features:**
  - Article title, category, tags
  - Author, date, view count metadata
  - Bilingual content (Indonesian/English)
  - Summary in highlighted box
  - Full content display
  - Related information sidebar
  - Share and print buttons
  - Responsive layout
- **Data:**
  - Fetches single article by ID

#### ArticlesPage.js & ArticlesPage.css
- **Purpose:** Articles listing with filters
- **Route:** `/articles`
- **URL Parameters:**
  - `search` - Search query
  - `category` - Category filter
  - `sort` - Sort option
  - `page` - Page number
- **Features:**
  - Grid layout for articles
  - Search filter
  - Category dropdown
  - Sort options
  - Pagination
  - Empty state handling
  - Card-based article display
  - Loading and error states
- **Data:**
  - Fetches articles with filters
  - Fetches categories for dropdown

#### CategoryDetailPage.js & CategoryDetailPage.css
- **Purpose:** View articles by category
- **Route:** `/category/:categoryId`
- **Features:**
  - Category header with gradient
  - Category name, description, article count
  - List all articles in category
  - Article metadata
  - Click-to-read buttons
  - Responsive layout
- **Data:**
  - Fetches category details
  - Fetches articles in category

#### LoginPage.js
- **Purpose:** User login
- **Route:** `/login`
- **Features:**
  - Email input
  - Password input
  - Form validation
  - Error messages
  - Links to register and forgot password
  - Loading state
  - Redirect to dashboard on success
- **API:**
  - `authService.login(email, password)`

#### RegisterPage.js
- **Purpose:** User registration
- **Route:** `/register`
- **Features:**
  - First name, last name inputs
  - Email input
  - Username input
  - Password input
  - Password confirmation
  - Form validation
  - Error messages
  - Loading state
  - Redirect to login on success
- **API:**
  - `authService.register(userData)`

#### ProfilePage.js & ProfilePage.css
- **Purpose:** User profile management
- **Route:** `/profile` (protected)
- **Tabs:**
  1. Profile Information
     - Edit first name, last name, email
     - Save changes
  2. Change Password
     - Current password
     - New password
     - Confirm new password
- **Features:**
  - Form validation
  - Error and success messages
  - Logout button
  - Loading state
- **API:**
  - `authService.updateProfile(data)`
  - `authService.changePassword(data)`

#### DashboardPage.js & DashboardPage.css
- **Purpose:** Contributor dashboard
- **Route:** `/dashboard` (protected)
- **Features:**
  - Statistics cards (total, published, draft, review)
  - My recent articles list
  - Article status badges
  - View and edit buttons
  - Write new article button
  - Loading and error states
- **Data:**
  - `internalAPI.getDashboard()` - Statistics
  - `internalAPI.getMyArticles()` - Recent articles

#### AuthPages.css
- **Purpose:** Shared styles for auth pages
- **Includes:**
  - Background gradient
  - Card styling
  - Form styling
  - Button styling
  - Animations
  - Mobile responsiveness

### Services (frontend/src/services/)

#### api.js
- **Purpose:** API client and service layer
- **Exports:**
  - `authService` - Authentication methods
  - `publicAPI` - Public article endpoints
  - `internalAPI` - Authenticated user endpoints
  - `adminAPI` - Admin management endpoints
- **Features:**
  - Axios HTTP client
  - Automatic JWT injection
  - Token refresh on 401
  - Error handling
  - Request/response interceptors
  - Base URL from environment variable
- **Methods:** 80+ API methods across all categories

### Root Files

#### App.js & App.css
- **Purpose:** Main application router and layout
- **Features:**
  - Router setup with all routes
  - AuthProvider wrapper
  - Layout: Header → Routes → Footer
  - Protected routes
  - Role-based routes
  - Error page routes
- **Routes:**
  - Public: /, /articles, /articles/:id, /category/:id, /login, /register
  - Protected: /dashboard, /profile, /editor, /editor/:id
  - Admin: /admin
  - Error: /403, *

#### index.js
- **Purpose:** React entry point
- **Features:**
  - DOM rendering to #root
  - StrictMode wrapper
  - App component mounting

#### package.json
- **Purpose:** Project dependencies and scripts
- **Dependencies:**
  - React 18.2.0
  - React Router 6.20.0
  - Bootstrap 5.3.0
  - React Bootstrap 2.10.0
  - Axios 1.6.2
  - React Icons 4.12.0
  - Date-FNS 2.30.0
  - JWT-Decode 4.0.0
- **Scripts:**
  - `npm start` - Start development server
  - `npm test` - Run tests
  - `npm build` - Build for production
  - `npm eject` - Eject from Create React App

---

## Component Hierarchy

```
App
├── Header
│   ├── Logo/Home Link
│   ├── Navigation Links
│   └── User Menu (Dropdown)
│       ├── Profile Link
│       ├── Settings Link
│       └── Logout Button
│
├── Routes
│   ├── HomePage
│   │   ├── Hero Section
│   │   ├── Featured Articles (Card Grid)
│   │   ├── Categories Browse
│   │   └── Call-to-Action
│   │
│   ├── ArticlesPage
│   │   ├── Breadcrumbs
│   │   ├── SearchFilter
│   │   │   ├── Search Input
│   │   │   ├── Category Dropdown
│   │   │   ├── Sort Dropdown
│   │   │   └── Reset Button
│   │   ├── Articles Grid (Card Layout)
│   │   │   └── Article Cards (multiple)
│   │   └── Pagination
│   │
│   ├── ArticleDetailPage
│   │   ├── Breadcrumbs
│   │   ├── Article Header
│   │   ├── Article Metadata
│   │   ├── Article Content
│   │   └── Sidebar (Related Info)
│   │
│   ├── CategoryDetailPage
│   │   ├── Breadcrumbs
│   │   ├── Category Header
│   │   └── Articles List
│   │
│   ├── LoginPage
│   │   └── Auth Card
│   │       ├── Email Input
│   │       ├── Password Input
│   │       ├── Submit Button
│   │       └── Links (Register, Forgot)
│   │
│   ├── RegisterPage
│   │   └── Auth Card
│   │       ├── Name Inputs
│   │       ├── Email Input
│   │       ├── Username Input
│   │       ├── Password Inputs
│   │       ├── Submit Button
│   │       └── Link to Login
│   │
│   ├── ProfilePage
│   │   ├── Profile Info Tab
│   │   │   ├── Name Inputs
│   │   │   ├── Email Input
│   │   │   └── Save Button
│   │   ├── Change Password Tab
│   │   │   ├── Current Password
│   │   │   ├── New Password
│   │   │   ├── Confirm Password
│   │   │   └── Update Button
│   │   └── Logout Button
│   │
│   └── DashboardPage
│       ├── Statistics Cards (4)
│       │   ├── Total Articles Card
│       │   ├── Published Card
│       │   ├── Drafts Card
│       │   └── In Review Card
│       └── Recent Articles List
│           ├── Article Items (multiple)
│           └── Action Buttons (View, Edit)
│
└── Footer
    ├── About Section
    ├── Quick Links
    ├── Information Links
    └── Copyright
```

---

## Data Flow

### Authentication Flow

```
1. User registers at /register
   ├─ RegisterPage collects data
   ├─ authService.register() called
   └─ Redirects to /login

2. User logs in at /login
   ├─ LoginPage collects credentials
   ├─ authService.login() called
   ├─ Tokens stored in localStorage
   ├─ Auth context updated
   └─ Redirects to /dashboard

3. Protected routes check auth
   ├─ ProtectedRoute wrapper
   ├─ Uses useAuth hook
   ├─ Redirects to /login if not authenticated
   └─ Checks role if required

4. User logs out
   ├─ Click logout from Header or Profile
   ├─ logout() called from context
   ├─ Tokens cleared
   └─ Redirects to /login
```

### Article Data Flow

```
1. Public views articles
   ├─ HomePage
   │  ├─ publicAPI.getPopularArticles()
   │  └─ publicAPI.getCategories()
   ├─ ArticlesPage
   │  ├─ publicAPI.getArticles(filters)
   │  └─ publicAPI.getCategories()
   ├─ ArticleDetailPage
   │  └─ publicAPI.getArticle(id)
   └─ CategoryDetailPage
      └─ publicAPI.getArticles({category: id})

2. Authenticated users manage articles
   ├─ DashboardPage
   │  ├─ internalAPI.getDashboard()
   │  └─ internalAPI.getMyArticles()
   ├─ Editor (Phase 6.6)
   │  ├─ internalAPI.createArticle()
   │  ├─ internalAPI.updateArticle()
   │  └─ internalAPI.submitArticle()
   └─ Profile
      ├─ authService.updateProfile()
      └─ authService.changePassword()
```

---

## Environment Variables

Create `.env` file in frontend directory:

```env
REACT_APP_API_BASE_URL=http://localhost:8002/api
REACT_APP_API_TIMEOUT=10000
```

---

## Build & Deployment

### Development
```bash
npm start
# Runs on http://localhost:5175
# Hot reload enabled
```

### Production Build
```bash
npm run build
# Creates optimized production build in /build folder
```

### Deployment Options
- Vercel (recommended for React)
- Netlify
- AWS S3 + CloudFront
- Apache/Nginx web server
- Docker container

---

## Testing Commands

```bash
# Unit tests
npm test

# Build for production
npm run build

# Eject from Create React App (not recommended)
npm eject
```

---

## File Statistics

| Category | Count | Lines |
|----------|-------|-------|
| Components | 13 | 600+ |
| Pages | 9 | 1,200+ |
| Styles (CSS) | 13 | 800+ |
| Contexts | 1 | 110 |
| Services | 1 | 200+ |
| App Files | 2 | 100+ |
| Config Files | 2 | 50+ |
| **TOTAL** | **41** | **3,200+** |

---

## Progress Summary

✅ **Phase 6.1:** Foundation & Setup (1,200 lines)
✅ **Phase 6.2:** Core Components (600 lines)
✅ **Phase 6.3:** Public Pages (500 lines)
✅ **Phase 6.4:** Auth Pages (700 lines)
✅ **Phase 6.5:** Dashboard (200 lines)

⏳ **Phase 6.6:** Editor Dashboard & Review
⏳ **Phase 6.7:** Admin Panel
⏳ **Phase 6.8:** Testing & Documentation

---

**Frontend Implementation: 62.5% Complete** ✅

Ready for Phase 6.6: Editor Dashboard development.
