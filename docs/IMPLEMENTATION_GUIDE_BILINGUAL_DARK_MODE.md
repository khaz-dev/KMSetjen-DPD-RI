# IMPLEMENTATION GUIDE: Critical Frontend Features
## KMS SETJEN DPD RI - Bilingual & Dark Mode Setup

**Status:** Ready for Implementation  
**Priority:** 🔴 CRITICAL (Blocks Production Deployment)  
**Estimated Time:** 14-16 hours  
**Complexity:** Medium  

---

## PART 1: BILINGUAL INTERFACE (i18n) SETUP

### 1.1 Install Dependencies

```bash
cd "d:\Project\KMSetjen DPD RI\frontend"
npm install react-i18next i18next i18next-browser-languagedetector i18next-http-backend
```

**What each package does:**
- `react-i18next`: React hooks and components for i18n
- `i18next`: Core translation library
- `i18next-browser-languagedetector`: Auto-detect user language
- `i18next-http-backend`: Load translation files from backend

### 1.2 Create Translation Files

**Create folder structure:**
```
frontend/public/
└── locales/
    ├── id/
    │   └── translation.json
    └── en/
        └── translation.json
```

**File: `frontend/public/locales/id/translation.json`**
```json
{
  "site_name": "KMS Setjen DPD RI",
  "nav": {
    "home": "Beranda",
    "articles": "Artikel",
    "dashboard": "Dashboard",
    "admin": "Admin",
    "login": "Masuk",
    "register": "Daftar",
    "logout": "Keluar",
    "profile": "Profil",
    "settings": "Pengaturan",
    "language": "Bahasa",
    "theme": "Tema"
  },
  "header": {
    "welcome": "Selamat datang di KMS DPD RI",
    "search": "Cari artikel..."
  },
  "sidebar": {
    "users": "Pengguna",
    "roles": "Peran",
    "categories": "Kategori",
    "articles": "Artikel",
    "audit_log": "Log Audit"
  },
  "pages": {
    "home_title": "Beranda",
    "articles_title": "Semua Artikel",
    "login_title": "Masuk",
    "register_title": "Daftar",
    "dashboard_title": "Dashboard",
    "profile_title": "Profil Pengguna"
  },
  "buttons": {
    "submit": "Kirim",
    "cancel": "Batal",
    "save": "Simpan",
    "delete": "Hapus",
    "edit": "Edit",
    "view": "Lihat",
    "create": "Buat",
    "back": "Kembali",
    "search": "Cari",
    "filter": "Filter"
  },
  "messages": {
    "loading": "Memuat...",
    "error": "Terjadi kesalahan",
    "success": "Berhasil",
    "not_found": "Tidak ditemukan",
    "unauthorized": "Anda tidak memiliki akses"
  }
}
```

**File: `frontend/public/locales/en/translation.json`**
```json
{
  "site_name": "KMS Setjen DPD RI",
  "nav": {
    "home": "Home",
    "articles": "Articles",
    "dashboard": "Dashboard",
    "admin": "Admin",
    "login": "Login",
    "register": "Register",
    "logout": "Logout",
    "profile": "Profile",
    "settings": "Settings",
    "language": "Language",
    "theme": "Theme"
  },
  "header": {
    "welcome": "Welcome to KMS DPD RI",
    "search": "Search articles..."
  },
  "sidebar": {
    "users": "Users",
    "roles": "Roles",
    "categories": "Categories",
    "articles": "Articles",
    "audit_log": "Audit Log"
  },
  "pages": {
    "home_title": "Home",
    "articles_title": "All Articles",
    "login_title": "Login",
    "register_title": "Register",
    "dashboard_title": "Dashboard",
    "profile_title": "User Profile"
  },
  "buttons": {
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "view": "View",
    "create": "Create",
    "back": "Back",
    "search": "Search",
    "filter": "Filter"
  },
  "messages": {
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Success",
    "not_found": "Not found",
    "unauthorized": "You do not have access"
  }
}
```

### 1.3 Initialize i18n

**File: `frontend/src/i18n/config.js`** (CREATE NEW)
```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations (can use HTTP backend or import directly)
import idTranslation from '../../public/locales/id/translation.json';
import enTranslation from '../../public/locales/en/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'id', // Indonesian as default
    defaultNS: 'translation',
    ns: ['translation'],
    
    resources: {
      id: { translation: idTranslation },
      en: { translation: enTranslation }
    },

    interpolation: {
      escapeValue: false // React already prevents XSS
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
```

### 1.4 Import i18n in App.js

**Update: `frontend/src/index.js`** (ADD AT TOP)
```javascript
import './i18n/config'; // Initialize i18n first
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## PART 2: DARK MODE / THEME SETUP

### 2.1 Create Theme Context

**File: `frontend/src/contexts/ThemeContext.js`** (CREATE NEW)
```javascript
import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Update HTML attribute
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update Bootstrap theme if needed
    if (theme === 'dark') {
      document.body.style.backgroundColor = '#1a1a1a';
      document.body.style.color = '#ffffff';
    } else {
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#000000';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### 2.2 Create Theme CSS

**File: `frontend/src/styles/theme.css`** (CREATE NEW)
```css
/* Light Mode (Default) */
:root[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #e9ecef;
  
  --text-primary: #212529;
  --text-secondary: #6c757d;
  --text-tertiary: #adb5bd;
  
  --border-color: #dee2e6;
  --shadow: rgba(0, 0, 0, 0.1);
  
  --navbar-bg: #ffffff;
  --navbar-text: #212529;
  
  --card-bg: #ffffff;
  --card-border: #dee2e6;
}

/* Dark Mode */
:root[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-tertiary: #3d3d3d;
  
  --text-primary: #ffffff;
  --text-secondary: #b0b0b0;
  --text-tertiary: #808080;
  
  --border-color: #404040;
  --shadow: rgba(0, 0, 0, 0.3);
  
  --navbar-bg: #242424;
  --navbar-text: #ffffff;
  
  --card-bg: #2d2d2d;
  --card-border: #404040;
}

/* Apply theme colors */
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.navbar {
  background-color: var(--navbar-bg) !important;
  color: var(--navbar-text);
  border-bottom: 1px solid var(--border-color);
}

.navbar-light .navbar-brand,
.navbar-light .nav-link {
  color: var(--text-primary) !important;
}

.card {
  background-color: var(--card-bg);
  border-color: var(--card-border);
  color: var(--text-primary);
}

.btn-light {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.btn-light:hover {
  background-color: var(--bg-tertiary);
}

.form-control,
.form-select {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.form-control:focus,
.form-select:focus {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.dropdown-menu {
  background-color: var(--card-bg);
  border-color: var(--border-color);
}

.dropdown-item {
  color: var(--text-primary);
}

.dropdown-item:hover,
.dropdown-item:focus {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.table {
  color: var(--text-primary);
  border-color: var(--border-color);
}

.table thead th {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.table tbody td {
  border-color: var(--border-color);
}

.table tbody tr:hover {
  background-color: var(--bg-secondary);
}

.badge {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

/* Smooth transitions for theme switching */
* {
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}
```

### 2.3 Create Language & Theme Custom Hooks

**File: `frontend/src/hooks/useLanguage.js`** (CREATE NEW)
```javascript
import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    document.documentElement.lang = lng;
  };

  return {
    language: i18n.language,
    changeLanguage,
    t, // Translation function
    isIndonesian: i18n.language === 'id',
    isEnglish: i18n.language === 'en'
  };
};
```

**File: `frontend/src/hooks/useTheme.js`** (CREATE NEW)
```javascript
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

---

## PART 3: UPDATE COMPONENTS

### 3.1 Update App.js

**Replace entire file with:**
```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import ArticlesPage from './pages/ArticlesPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import ArticleEditor from './pages/ArticleEditorPage';
import EditorDashboard from './pages/EditorDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import RoleManagementPage from './pages/RoleManagementPage';
import CategoryManagementPage from './pages/CategoryManagementPage';
import ArticleModerationPage from './pages/ArticleModerationPage';
import AuditLogPage from './pages/AuditLogPage';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';
import './App.css';

function AppContent() {
  const { logout } = AuthProvider ? {} : {};

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:id" element={<ArticleDetailPage />} />
          <Route path="/category/:categoryId" element={<CategoryDetailPage />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/editor" element={<EditorDashboard />} />
            <Route path="/editor/new" element={<ArticleEditor />} />
            <Route path="/editor/:id" element={<ArticleEditor />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute requiredRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/roles" element={<RoleManagementPage />} />
            <Route path="/admin/categories" element={<CategoryManagementPage />} />
            <Route path="/admin/articles" element={<ArticleModerationPage />} />
            <Route path="/admin/audit" element={<AuditLogPage />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
```

### 3.2 Update Header.js with Language & Theme Switching

**Replace entire file with:**
```javascript
import React from 'react';
import { Navbar, Nav, Container, Dropdown, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../hooks/useLanguage';
import { useTheme } from '../hooks/useTheme';
import { FaUser, FaCog, FaSignOutAlt, FaMoon, FaSun, FaGlobe } from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Navbar bg="light" expand="lg" sticky="top" className="navbar-custom">
      <Container>
        <Navbar.Brand as={Link} to="/" className="brand-logo">
          <strong>KMS</strong> DPD RI
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/">
              {t('nav.home')}
            </Nav.Link>
            
            <Nav.Link as={Link} to="/articles">
              {t('nav.articles')}
            </Nav.Link>
            
            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/dashboard">
                  {t('nav.dashboard')}
                </Nav.Link>
                
                {(user?.is_admin || user?.is_editor) && (
                  <Nav.Link as={Link} to="/admin">
                    {t('nav.admin')}
                  </Nav.Link>
                )}
              </>
            )}

            {/* Theme Toggle */}
            <Button 
              variant="none" 
              className="nav-button theme-toggle"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </Button>

            {/* Language Dropdown */}
            <Dropdown className="ms-2">
              <Dropdown.Toggle variant="none" className="nav-button language-toggle">
                <FaGlobe className="me-1" />
                {language.toUpperCase()}
              </Dropdown.Toggle>
              
              <Dropdown.Menu align="end">
                <Dropdown.Item onClick={() => changeLanguage('id')}>
                  🇮🇩 Bahasa Indonesia
                </Dropdown.Item>
                <Dropdown.Item onClick={() => changeLanguage('en')}>
                  🇺🇸 English
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            
            {!isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/login" className="ms-2">
                  {t('nav.login')}
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className="ms-2">
                  {t('nav.register')}
                </Nav.Link>
              </>
            ) : (
              <Dropdown className="ms-3" align="end">
                <Dropdown.Toggle variant="none" className="user-menu-toggle">
                  <FaUser className="me-2" />
                  {user?.first_name || user?.username}
                </Dropdown.Toggle>
                
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/profile">
                    <FaUser className="me-2" />
                    {t('nav.profile')}
                  </Dropdown.Item>
                  
                  <Dropdown.Item as={Link} to="/settings">
                    <FaCog className="me-2" />
                    {t('nav.settings')}
                  </Dropdown.Item>
                  
                  <Dropdown.Divider />
                  
                  <Dropdown.Item onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" />
                    {t('nav.logout')}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
```

### 3.3 Update Header.css

**Add to `frontend/src/components/Header.css`:**
```css
.navbar-custom {
  box-shadow: 0 2px 4px var(--shadow);
}

.nav-button {
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  margin: 0 0.25rem;
  transition: color 0.2s ease;
}

.nav-button:hover {
  color: #007bff;
}

.theme-toggle {
  margin-left: 1rem;
}

.language-toggle {
  min-width: 80px;
  text-align: center;
}

.brand-logo {
  font-size: 1.5rem;
  font-weight: 600;
}

.user-menu-toggle {
  display: flex;
  align-items: center;
  white-space: nowrap;
}
```

### 3.4 Update index.js

**Replace top section:**
```javascript
import './i18n/config'; // Initialize i18n FIRST
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## PART 4: UPDATE OTHER COMPONENTS

### 4.1 Update Footer.js

```javascript
import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer mt-5 py-4 bg-light border-top">
      <Container>
        <Row>
          <Col md={6}>
            <h5>{t('site_name')}</h5>
            <p>{t('messages.welcome')}</p>
          </Col>
          <Col md={6} className="text-md-end">
            <p>&copy; 2024 KMS Setjen DPD RI. All rights reserved.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
```

### 4.2 Update AdminSidebar.js

```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaUsers, FaShield, FaFolderOpen, FaFileAlt, FaHistory } from 'react-icons/fa';

const AdminSidebar = () => {
  const { t } = useTranslation();

  const menuItems = [
    { path: '/admin/users', label: t('sidebar.users'), icon: FaUsers },
    { path: '/admin/roles', label: t('sidebar.roles'), icon: FaShield },
    { path: '/admin/categories', label: t('sidebar.categories'), icon: FaFolderOpen },
    { path: '/admin/articles', label: t('sidebar.articles'), icon: FaFileAlt },
    { path: '/admin/audit', label: t('sidebar.audit_log'), icon: FaHistory }
  ];

  return (
    <div className="admin-sidebar">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.path} to={item.path} className="sidebar-item">
            <Icon className="me-2" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
};

export default AdminSidebar;
```

---

## PART 5: TRANSLATION COVERAGE CHECKLIST

Use this checklist to ensure all UI strings are translatable:

### Pages to Update
- [ ] HomePage.js
- [ ] ArticlesPage.js
- [ ] ArticleDetailPage.js
- [ ] CategoryDetailPage.js
- [ ] LoginPage.js
- [ ] RegisterPage.js
- [ ] ProfilePage.js
- [ ] DashboardPage.js
- [ ] EditorDashboardPage.js
- [ ] ArticleEditorPage.js
- [ ] AdminDashboardPage.js
- [ ] UserManagementPage.js
- [ ] RoleManagementPage.js
- [ ] CategoryManagementPage.js
- [ ] ArticleModerationPage.js
- [ ] AuditLogPage.js

### Components to Update
- [ ] Header.js ✅
- [ ] Footer.js ✅
- [ ] AdminSidebar.js ✅
- [ ] ArticleCard.js
- [ ] SearchFilter.js
- [ ] Pagination.js
- [ ] ErrorBoundary.js (if exists)

### Pattern: How to Use Translations

**OLD:**
```javascript
<h1>Articles</h1>
<button>Submit</button>
<p>Loading...</p>
```

**NEW:**
```javascript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <>
      <h1>{t('pages.articles_title')}</h1>
      <button>{t('buttons.submit')}</button>
      <p>{t('messages.loading')}</p>
    </>
  );
};
```

---

## PART 6: TESTING THE IMPLEMENTATION

### Test Checklist

```bash
# 1. Install dependencies
npm install react-i18next i18next i18next-browser-languagedetector

# 2. Create all files listed above

# 3. Start development server
npm start

# 4. Test language switching
# - Click language dropdown in header
# - Verify text changes to Indonesian/English
# - Refresh page and verify language persists

# 5. Test theme switching
# - Click moon/sun icon in header
# - Verify entire UI switches to dark mode
# - Refresh page and verify theme persists

# 6. Run tests
npm test -- --watchAll=false

# 7. Verify no console errors
# - Open DevTools (F12)
# - Check Console tab for errors
```

### Expected Results

✅ Language switcher works  
✅ Theme switcher works  
✅ Both persist across page reloads  
✅ No console errors  
✅ All text displays correctly  
✅ Tests still pass  

---

## PART 7: NEXT PHASE - FULL IMPLEMENTATION

After completing these setup steps:

1. **Replace all hardcoded text** with translation keys (2-3 hours)
2. **Add missing translation strings** to both JSON files (1-2 hours)
3. **Test all pages** for bilingual support (2 hours)
4. **Add more CSS variables** for complete theme support (1 hour)
5. **Update tests** to use translations (1 hour)

**Total Phase 1:** 14-16 hours  
**Total Phase 2:** 6-8 hours  
**Grand Total to Production:** 20-24 hours

---

## ROLLBACK PROCEDURE (If Needed)

```bash
# Revert package.json changes
npm uninstall react-i18next i18next i18next-browser-languagedetector

# Delete new files
rm -r src/i18n
rm -r src/contexts/ThemeContext.js
rm -r src/hooks/useLanguage.js
rm -r src/hooks/useTheme.js
rm -r src/styles/theme.css
rm -r public/locales

# Restore original App.js and index.js (from git)
git checkout src/App.js src/index.js src/components/Header.js
```

---

## COMPLETION CHECKLIST

- [ ] Dependencies installed
- [ ] Translation files created (id, en)
- [ ] i18n config initialized
- [ ] ThemeContext created
- [ ] Theme CSS created
- [ ] Custom hooks created
- [ ] App.js updated with providers
- [ ] Header.js updated with switchers
- [ ] index.js imports i18n first
- [ ] No console errors
- [ ] All tests passing
- [ ] Language switching works
- [ ] Theme switching works
- [ ] Both settings persist across reloads

---

**Ready to implement? Start with installing dependencies and creating the folder structure.**

Next document: Translation strings expansion guide (coming after Phase 1 completion)
