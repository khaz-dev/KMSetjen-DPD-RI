# Administrator Guide - KMSetjen DPD RI Content Management System

**Version:** 1.0.0  
**Last Updated:** January 5, 2026

---

## Table of Contents
1. [Admin Panel Overview](#admin-panel-overview)
2. [User Management](#user-management)
3. [Role & Permission Management](#role--permission-management)
4. [Category Management](#category-management)
5. [Content Moderation](#content-moderation)
6. [System Monitoring](#system-monitoring)
7. [Audit Logs](#audit-logs)
8. [Security & Best Practices](#security--best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Admin Panel Overview

### Accessing Admin Panel
1. Log in with admin account
2. Click **"Admin"** in sidebar navigation
3. Or navigate to `/admin`

### Admin Dashboard
The dashboard displays:
- **Total Users:** Count of all system users
- **Total Articles:** Count of all articles (all statuses)
- **Audit Logs:** Count of system actions
- **Articles in Review:** Pending approval count
- **Users by Role:** Distribution across roles
- **Articles by Status:** Distribution across statuses
- **Audit Activity:** Recent system actions

### Refresh Statistics
Click **"Refresh"** button to update statistics in real-time.

---

## User Management

### Accessing User Management
1. Click **Admin > Users** in sidebar
2. Or navigate to `/admin/users`

### User List Features
- **Search:** Find users by username, email, or name
- **Pagination:** View 20 users per page
- **Status Badge:** See active/inactive status
- **Staff Badge:** See if user is staff member

### Creating New User
1. Click **"Add User"** button
2. Enter required fields:
   - **Username:** Unique username (required)
   - **Email:** Valid email address (required)
   - **First Name:** User's first name (required)
   - **Last Name:** User's last name (required)
3. Select options:
   - **Is Active:** Check to activate account
   - **Is Staff:** Check to give staff privileges
4. Click **"Create User"**
5. User receives password reset email

### Editing User
1. Click user row or **"Edit"** button
2. Modify fields (username cannot be changed)
3. Update status or staff role
4. Click **"Save Changes"**

### Activating/Deactivating User
1. Find user in list
2. Click **"Activate"** or **"Deactivate"** button
3. Confirm action
4. Status updates immediately

### Deleting User
1. Click **"Delete"** button on user row
2. Confirm deletion
3. User is permanently removed from system
4. User's articles remain in system (author shows as deleted)

### Bulk Actions (Future)
- Select multiple users
- Activate all selected
- Deactivate all selected
- Export as CSV

---

## Role & Permission Management

### Accessing Role Management
1. Click **Admin > Roles** in sidebar
2. Or navigate to `/admin/roles`

### Understanding Roles
- **Admin:** Full system access
- **Editor:** Can create, edit, publish articles
- **User:** Can create articles, read published
- **Guest:** Read-only access

### Role List Features
- **Permissions Display:** Shows first 3 permissions + count
- **User Count:** Shows how many users have this role
- **Edit/Delete:** Manage role settings

### Creating New Role
1. Click **"Create Role"** button
2. Enter role details:
   - **Role Code:** Unique identifier (CAPS_SNAKE_CASE)
   - **Role Name:** Display name
   - **Description:** What this role can do
3. Select permissions:
   - Check permissions to assign
   - Grid shows all available permissions
4. Click **"Create Role"**

### Editing Role
1. Click **"Edit"** on role row
2. Modify name and description (code cannot change)
3. Update permissions by checking/unchecking
4. Click **"Save Changes"**

### Available Permissions
- **users.create** - Create new users
- **users.edit** - Edit user details
- **users.delete** - Delete users
- **articles.create** - Create articles
- **articles.edit** - Edit articles
- **articles.delete** - Delete articles
- **articles.publish** - Publish articles
- **articles.approve** - Approve articles
- **categories.manage** - Manage categories
- **admin.access** - Access admin panel

### Deleting Role
1. Click **"Delete"** button
2. If role has users assigned:
   - Delete button is disabled
   - Error message shows user count
   - Must reassign or delete users first
3. If no users, deletion is confirmed

### Assigning Roles to Users
1. Go to **User Management**
2. Click user to edit
3. Select role(s) from dropdown
4. Save changes

---

## Category Management

### Accessing Category Management
1. Click **Admin > Categories** in sidebar
2. Or navigate to `/admin/categories`

### Category List
- **Display:** English and Indonesian names
- **Articles:** Count of articles in category
- **Actions:** Edit and delete buttons

### Creating Category
1. Click **"Add Category"** button
2. Enter required fields:
   - **Name (English):** Category name in English
   - **Name (Indonesian):** Category name in Indonesian
   - **Description:** What this category contains
3. Click **"Create Category"**

### Editing Category
1. Click **"Edit"** on category row
2. Modify English name, Indonesian name, or description
3. Click **"Save Changes"**

### Deleting Category
1. Click **"Delete"** button
2. If category has articles:
   - Warning shows article count
   - You can proceed anyway
   - Articles remain but lose category
3. Confirm deletion

### Organizing Categories
- Create logical category structure
- Use clear names in both languages
- Update when adding new content areas
- Archive unused categories instead of deleting

---

## Content Moderation

### Accessing Article Moderation
1. Click **Admin > Articles** in sidebar
2. Or navigate to `/admin/articles`

### Moderation Workflow
- **PENDING:** Waiting for review
- **APPROVED:** Reviewed, ready to publish
- **REJECTED:** Needs revision before publishing
- **PUBLISHED:** Live and visible to readers

### Reviewing Articles
1. Click **PENDING** tab
2. Select article to review
3. Read title, author, category, and content
4. Click **"Approve"** or **"Reject"**

### Approving Article
1. Click **"Approve"** button
2. Add optional comment (feedback for author)
3. Click **"Approve Article"**
4. Article moves to APPROVED status
5. Author is notified

### Rejecting Article
1. Click **"Reject"** button
2. Enter required reason (mandatory)
3. Provide specific feedback for improvements
4. Click **"Reject Article"**
5. Article returns to PENDING, author notified
6. Author can revise and resubmit

### Filtering by Status
- Click tab to view articles by status
- **PENDING:** Awaiting your review
- **APPROVED:** Ready for publication
- **REJECTED:** Needs revision
- **PUBLISHED:** Live articles

### Bulk Moderation (Future)
- Select multiple articles
- Approve all at once
- Reject with batch message
- Export moderation report

---

## System Monitoring

### Admin Dashboard Statistics
- **Total Users:** Active user count
- **Total Articles:** All articles in system
- **Total Audit Logs:** System action count
- **Articles in Review:** Pending approval count

### Key Metrics
1. **Users by Role**
   - Admin count
   - Editor count
   - User count
   - Helps identify role distribution

2. **Articles by Status**
   - Published count
   - Pending count
   - Shows content pipeline

3. **Audit Activity**
   - Recent actions
   - Action frequency
   - Helps identify trends

### Monitoring Best Practices
1. **Regular Checks:** Review statistics daily
2. **Identify Trends:** Look for unusual activity
3. **Monitor Performance:** Check system responsiveness
4. **User Activity:** See who's using system

---

## Audit Logs

### Accessing Audit Logs
1. Click **Admin > Audit Logs** in sidebar
2. Or navigate to `/admin/audit-logs`

### Understanding Audit Logs
Each log entry shows:
- **Timestamp:** When action occurred
- **User:** Who performed action
- **Action:** Type of action (CREATE, UPDATE, DELETE, etc.)
- **Resource Type:** What was affected (Article, User, Role)
- **Resource ID:** ID of affected resource
- **IP Address:** Where action came from

### Filtering Logs
1. **By Action:** Select from dropdown
   - CREATE - New resource created
   - UPDATE - Resource modified
   - DELETE - Resource removed
   - PUBLISH - Article published
   - APPROVE - Article approved
   - REJECT - Article rejected

2. **By Resource Type:** Select from dropdown
   - Article - Article changes
   - User - User account changes
   - Role - Role/permission changes
   - Category - Category changes

3. **Combined Filters:** Use both dropdowns together

### Viewing Log Details
1. Click log entry row
2. See full details
3. Verify action timestamp and user
4. Note IP address if investigating

### Audit Log Uses
- **Security:** Track unauthorized access attempts
- **Accountability:** See who changed what
- **Compliance:** Maintain change records
- **Debugging:** Understand system changes
- **Investigation:** Review user actions

### Exporting Logs (Future)
- Export as CSV
- Filter date range
- Include in reports
- Archive for compliance

---

## Security & Best Practices

### Admin Account Security
1. **Strong Password**
   - At least 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Change every 90 days
   - Never share password

2. **Two-Factor Authentication**
   - Enable if available
   - Use authenticator app
   - Keep backup codes safe

3. **Session Management**
   - Log out when done
   - Don't leave session unattended
   - Use secure networks only

### Best Practices

#### User Management
1. **Regular Audits**
   - Review user list monthly
   - Deactivate unused accounts
   - Update role assignments

2. **Role Assignment**
   - Follow principle of least privilege
   - Only grant necessary permissions
   - Review role changes quarterly

3. **Password Management**
   - Reset compromised passwords
   - Require password change on first login
   - Implement password policies

#### Content Moderation
1. **Consistent Standards**
   - Establish moderation guidelines
   - Apply consistently to all users
   - Document decisions

2. **Quality Reviews**
   - Check accuracy
   - Verify sources
   - Ensure appropriateness

3. **Fair Process**
   - Provide clear feedback
   - Allow author response
   - Appeal process for rejection

#### System Security
1. **Backup Strategy**
   - Regular backups
   - Test recovery process
   - Store securely

2. **Access Control**
   - Limit admin access
   - Monitor permission changes
   - Audit access regularly

3. **Data Protection**
   - Encrypt sensitive data
   - HTTPS for all connections
   - Secure APIs with tokens

---

## Troubleshooting

### User Management Issues

**Can't create user?**
- Check all required fields filled
- Ensure username is unique
- Verify email format
- Check password requirements

**Can't delete user?**
- Cannot delete superuser
- Cannot delete own account while logged in
- Contact higher admin if needed

**User locked out?**
- Reset password from admin
- Check if account deactivated
- Review audit logs for issues

### Role Management Issues

**Can't delete role?**
- Role has users assigned
- Must reassign users first
- Or delete users from role

**Permissions not working?**
- User must log out and back in
- Clear browser cache
- Restart browser session

**Role creation failed?**
- Check role code is unique
- Use CAPS_SNAKE_CASE format
- Ensure at least one permission selected

### Content Moderation Issues

**Can't review article?**
- Check your role has permission
- Ensure admin access
- Try refreshing page

**Article status won't change?**
- Check internet connection
- Verify article exists
- Try again after refresh

**Can't add moderation comment?**
- Check comment length
- Verify you're logged in
- Try different browser

### System Issues

**Dashboard not loading?**
- Check internet connection
- Clear browser cache
- Try incognito/private mode
- Check if system down

**Audit logs not showing?**
- Check date filter
- Verify action/resource filters
- Try different filters
- Refresh page

**Can't access admin panel?**
- Verify admin role assigned
- Log out and back in
- Clear cache and cookies
- Try different browser

### Getting Help
1. **Check logs** - Review audit logs for errors
2. **Restart** - Often fixes temporary issues
3. **Contact Support** - Provide details and screenshots
4. **Report Bug** - Include steps to reproduce
5. **Check Status** - See if system maintenance

---

## Admin Checklist

### Daily
- [ ] Review dashboard statistics
- [ ] Check pending articles for review
- [ ] Monitor audit logs for issues
- [ ] Respond to user inquiries

### Weekly
- [ ] Review user activity
- [ ] Check for spam or abuse
- [ ] Update categories if needed
- [ ] Review rejected articles feedback

### Monthly
- [ ] Audit user list
- [ ] Review role assignments
- [ ] Check system performance
- [ ] Export reports for management

### Quarterly
- [ ] Full security audit
- [ ] Update moderation guidelines
- [ ] Review permission structure
- [ ] Plan system improvements

---

**For technical support:** Contact IT department  
**For policy questions:** Consult management  
**For urgent issues:** Call system administrator
