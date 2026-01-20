# Quick Reference: Translation Implementation Guide

## For Completing Remaining Form Strings

### Template to Follow

For each hardcoded string, use this pattern:

```javascript
// BEFORE (hardcoded)
<Form.Label>Username</Form.Label>
placeholder="Enter username"
title="Click to edit user"
"Are you sure?" // confirmation message

// AFTER (translated)
<Form.Label>{t('users.username')}</Form.Label>
placeholder={t('users.username')}
title={t('users.edit_user')}
{t('users.confirm_delete')}
```

---

## Quick Search & Replace Guide

### For UserManagementPage

Replace in order:
1. `"Loading users..."` → `{t('users.loading_users')}`
2. `"Search by username, email, or name..."` → `{t('common.search_placeholder')}`
3. `"Username"` → `{t('users.username')}`
4. `"Email"` → `{t('users.email')}`
5. `"Name"` → `{t('table.name')}`
6. `"Status"` → `{t('users.is_active')}`
7. `"Staff"` → `{t('users.is_staff')}`
8. `"Joined"` → `{t('users.date_joined')}`
9. `"Actions"` → `{t('common.actions')}`
10. `"Active"` / `"Inactive"` → `{t('common.yes')}` / `{t('buttons.cancel')}`
11. Form placeholders and labels → use `{t()}` pattern
12. Modal buttons → `{t('buttons.save')}`, `{t('buttons.cancel')}`

### For RoleManagementPage

1. `"Role Management"` → `{t('roles.title')}`
2. `"Manage user roles and permissions"` → `{t('roles.subtitle')}`
3. `"Add Role"` → `{t('roles.add_role')}`
4. Form field labels → `{t('roles.code')}`, `{t('roles.name')}`, etc.
5. Table headers → `{t('table.name')}`, `{t('table.actions')}`
6. Modal buttons and labels

### For AuditLogPage

1. `"Audit Log"` → `{t('audit.title')}`
2. `"System activity and changes"` → `{t('audit.subtitle')}`
3. Table headers → `{t('audit.user')}`, `{t('audit.action')}`, `{t('audit.timestamp')}`
4. Action badges → `{t('audit.actions.CREATE')}`, `{t('audit.actions.UPDATE')}`, etc.
5. Filter labels

### For CategoryManagementPage

1. `"Category Management"` → `{t('categories.title')}`
2. `"Manage article categories"` → `{t('categories.subtitle')}`
3. `"Add Category"` → `{t('categories.add_category')}`
4. Form fields → `{t('categories.name_en')}`, `{t('categories.name_id')}`, `{t('categories.description')}`
5. Table headers
6. Modal buttons

### For ArticleEditorPage

1. Form labels → `{t('editor.article_title')}`, `{t('editor.description')}`, etc.
2. Status labels → `{t('editor.draft')}`, `{t('editor.published')}`
3. Buttons → `{t('editor.save_draft')}`, `{t('editor.submit_review')}`
4. Messages → `{t('editor.auto_saved')}`, `{t('editor.last_saved')}`

### For ArticleModerationPage

1. Tab titles → `{t('moderation.pending_review')}`, `{t('moderation.approved')}`, etc.
2. Buttons → `{t('moderation.approve')}`, `{t('moderation.reject')}`
3. Labels → `{t('moderation.review_comment')}`
4. Error messages

### For AdminDashboardPage

1. Headers → Already done ✅
2. KPI labels → `{t('admin.total_users')}`, `{t('admin.total_articles')}`, etc.
3. Button labels → `{t('common.refresh')}`
4. Error messages

### For ArticleDetailPage & CategoryDetailPage

1. Navigation labels
2. Info labels
3. Error/not found messages

### For EditorDashboardPage

1. Tab titles and labels
2. Article status labels
3. Action buttons

---

## Translation Keys by Category

### Common - 15 keys
- loading, saving, deleting, search_placeholder, no_results
- yes, no, ok, cancel, close, back, next, previous, first, last
- actions, edit, delete, save, add, refresh, refreshing, system_overview

### Users - 20 keys
- title, subtitle, add_user, edit_user, delete_user
- username, email, first_name, last_name, password, confirm_password
- is_active, is_staff, is_admin, is_editor
- date_joined, last_login
- no_users, loading_users, confirm_delete
- user_saved, user_deleted, user_error

### Roles - 15 keys
- title, subtitle, add_role, edit_role, delete_role
- code, name, description
- permissions, select_permissions
- no_roles, loading_roles, confirm_delete
- role_saved, role_deleted, role_error

### Categories - 13 keys
- title, subtitle, add_category, edit_category, delete_category
- name_en, name_id, description, articles
- no_categories, loading_categories, confirm_delete
- category_saved, category_deleted, category_error

### Audit - 15 keys
- title, subtitle
- user, action, object_type, object_id, timestamp, changes
- filter, no_logs, loading_logs, view_details
- actions (CREATE, UPDATE, DELETE, PUBLISH, APPROVE, REJECT, LOGIN, LOGOUT)

### Editor - 13 keys
- title, new_article, edit_article
- article_title, description, content, category, tags
- featured_image, slug, meta_description, status
- draft, published, pending_review
- save_draft, submit_review, publish
- auto_saved, saving, last_saved

### Moderation - 10 keys
- title, subtitle
- pending_review, approved, rejected, published
- approve, reject, review_comment, rejection_reason
- view_article, no_articles, loading_articles
- review_submitted

### Buttons - 15 keys
- submit, cancel, save, delete, edit, view, create, back
- search, filter, login, register, logout, get_started, read_more

### Table - 6 keys
- actions, id, name, email, status, created, updated

### Messages - 6 keys
- loading, error, success, not_found, unauthorized, welcome

### Other Sections
- nav, header, sidebar, pages, home, login, register, articles, dashboard, profile, admin, validation, errors

---

## Testing Checklist Per Page

For each page after making changes:
1. ✅ Language set to English - all text in English
2. ✅ Switch to Indonesian - all text in Indonesian
3. ✅ No hardcoded strings visible
4. ✅ All form labels translated
5. ✅ All buttons translated
6. ✅ All error/success messages translated
7. ✅ Language selection persists on reload

---

## Common Mistakes to Avoid

❌ **Don't do this:**
```javascript
<h1>Users List {t('table.actions')}</h1>  // Mixed languages
```

✅ **Do this:**
```javascript
<h1>{t('users.title')}</h1>  // Fully translated
```

---

❌ **Don't:**
```javascript
label={'users.username'}  // String instead of function call
```

✅ **Do:**
```javascript
label={t('users.username')}  // Proper translation function call
```

---

❌ **Don't:**
```javascript
import { useLanguage } from 'hooks';  // Wrong hook for pages
```

✅ **Do:**
```javascript
import { useTranslation } from 'react-i18next';  // Correct hook
const { t } = useTranslation();
```

---

## Files to Update (In Order)

1. [ ] UserManagementPage - Form strings (30 mins)
2. [ ] RoleManagementPage - Form strings (25 mins)
3. [ ] CategoryManagementPage - Table and form strings (20 mins)
4. [ ] AuditLogPage - Filter and status strings (15 mins)
5. [ ] ArticleEditorPage - Form labels (20 mins)
6. [ ] ArticleModerationPage - Status and button labels (15 mins)
7. [ ] AdminDashboardPage - Stats labels (10 mins)
8. [ ] ArticleDetailPage - Info labels (10 mins)
9. [ ] CategoryDetailPage - Info labels (10 mins)
10. [ ] EditorDashboardPage - Tab labels (10 mins)

**Total Time Estimate: 2-3 hours**

---

## How to Verify Progress

### Terminal Command:
```bash
# Search for remaining hardcoded English strings in admin pages
grep -r "\"[A-Z]" src/pages/UserManagementPage.js | grep -v "t(" | head -20
```

### Visual Check:
1. Open app in browser
2. Navigate to each admin page
3. Look for any English text that's NOT in translation keys
4. Compare English vs Indonesian versions

### Coverage Report:
After completing all updates, hardcoded string count should be near 0:
```bash
grep -r "\"[a-z].*\"" src/pages/*.js | grep -v "t(" | wc -l
```

---

## Still Stuck?

### Reference Pattern - Copy & Apply:

Already working examples in LoginPage.js:
```javascript
<Form.Control
  type="email"
  placeholder={t('login.email')}  // ← Pattern
  required
/>
```

Already working examples in DashboardPage.js:
```javascript
<h1>{t('dashboard.title')}</h1>  // ← Pattern
```

Already working examples in AdminSidebar.js:
```javascript
<Nav.Link as={Link} to="/admin">
  {t('nav.admin')}  // ← Pattern
</Nav.Link>
```

Apply these same patterns to remaining pages!

---

## Final Check

Once all updates complete:

✅ Run `npm start` - app starts without errors
✅ Switch language - both English and Indonesian work
✅ Check admin pages - all strings translated
✅ Test forms - submissions work in both languages
✅ Verify browser cache - language persists after reload

**You're done! 🎉**
