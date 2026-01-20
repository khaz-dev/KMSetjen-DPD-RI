# KMS System - Complete User & Role Inventory
**Scan Date:** January 13, 2026

---

## 📊 EXECUTIVE SUMMARY

| Metric | Count |
|--------|-------|
| **Total Users** | 6 |
| **Total Roles** | 5 |
| **Active Users** | 6 (100%) |
| **SSO Users** | 0 (0%) |
| **Staff Members** | 2 |
| **Superusers** | 1 |

---

## 👥 USERS & ROLES MATRIX

### User #1: `admin` (Superuser)
- **Email:** admin@kmsetjen.local
- **Full Name:** *(No Name Set)*
- **Department:** N/A
- **NIP:** N/A
- **Phone:** N/A
- **Primary Role:** ⭐ **ADMIN** (Administrator)
- **All Roles:** ADMIN
- **Is Staff:** ✅ YES
- **Is Superuser:** ✅ YES
- **Auth Method:** Local
- **Status:** ✅ Active
- **Created:** January 6, 2026 12:24:53 UTC
- **Last Updated:** January 6, 2026 12:25:04 UTC
- **Permissions:** Full system access, manage users, manage all content, publish articles

---

### User #2: `editor1` (Editor)
- **Email:** editor1@kms.local
- **Full Name:** Budi Prasetyo
- **Department:** Content Division
- **NIP:** 199505151995051501
- **Phone:** *(Not set)*
- **Primary Role:** 📝 **EDITOR** (Editor)
- **All Roles:** EDITOR, PUBLIC
- **Is Staff:** ✅ YES
- **Is Superuser:** ❌ NO
- **Auth Method:** Local
- **Status:** ✅ Active
- **Created:** January 7, 2026 03:25:30 UTC
- **Last Updated:** January 7, 2026 03:25:30 UTC
- **Permissions:** Manage all content, publish articles, review content

---

### User #3: `contributor1` (Contributor)
- **Email:** contributor1@kms.local
- **Full Name:** Siti Nurhaliza
- **Department:** Public Relations
- **NIP:** 199403201994032001
- **Phone:** *(Not set)*
- **Primary Role:** ✍️ **CONTRIBUTOR** (Contributor)
- **All Roles:** CONTRIBUTOR, PUBLIC
- **Is Staff:** ❌ NO
- **Is Superuser:** ❌ NO
- **Auth Method:** Local
- **Status:** ✅ Active
- **Created:** January 7, 2026 03:25:30 UTC
- **Last Updated:** January 7, 2026 03:25:31 UTC
- **Permissions:** Create and edit own content, submit for review

---

### User #4: `reader1` (Reader / ASN Staff)
- **Email:** reader1@kms.local
- **Full Name:** Dedi Gunawan
- **Department:** HR Division
- **NIP:** 199201101992011001
- **Phone:** *(Not set)*
- **Primary Role:** 👓 **READER** (Reader)
- **All Roles:** READER, PUBLIC
- **Is Staff:** ❌ NO
- **Is Superuser:** ❌ NO
- **Auth Method:** Local
- **Status:** ✅ Active
- **Created:** January 7, 2026 03:25:31 UTC
- **Last Updated:** January 7, 2026 03:25:31 UTC
- **Permissions:** Read-only access to internal content

---

### User #5: `reader2` (Reader / ASN Staff)
- **Email:** reader2@kms.local
- **Full Name:** Rini Wijaya
- **Department:** Finance Division
- **NIP:** 199306151993061501
- **Phone:** *(Not set)*
- **Primary Role:** 👓 **READER** (Reader)
- **All Roles:** READER, PUBLIC
- **Is Staff:** ❌ NO
- **Is Superuser:** ❌ NO
- **Auth Method:** Local
- **Status:** ✅ Active
- **Created:** January 7, 2026 03:25:31 UTC
- **Last Updated:** January 7, 2026 03:25:31 UTC
- **Permissions:** Read-only access to internal content

---

### User #6: `khairilazmiashari` (Public User - Google OAuth)
- **Email:** khairilazmiashari@gmail.com
- **Full Name:** Khaz ID
- **Department:** N/A
- **NIP:** N/A
- **Phone:** N/A
- **Primary Role:** 🌐 **PUBLIC** (Public)
- **All Roles:** PUBLIC
- **Is Staff:** ❌ NO
- **Is Superuser:** ❌ NO
- **Auth Method:** Local (but loaded from name appears to be test)
- **Email Verified:** ❌ NO
- **Status:** ✅ Active
- **Created:** January 12, 2026 07:28:41 UTC
- **Last Updated:** January 12, 2026 09:29:42 UTC
- **Permissions:** Read-only access to public content

---

## 🔐 ROLE DEFINITIONS

### 1️⃣ **ADMIN** (Administrator)
| Property | Value |
|----------|-------|
| **Code** | `admin` |
| **Name (ID)** | Administrator |
| **Name (EN)** | Administrator |
| **Description (ID)** | Pengelola sistem dengan akses penuh |
| **Description (EN)** | System manager with full access |
| **Users with this role** | 1 (admin) |
| **Status** | ✅ Active |

**Permissions:**
- Full system access
- Manage users (create, edit, delete, assign roles)
- Manage all content (articles, categories, tags)
- Publish articles
- Manage system settings
- Access audit logs
- Can manage other roles

---

### 2️⃣ **EDITOR** (Content Editor)
| Property | Value |
|----------|-------|
| **Code** | `editor` |
| **Name (ID)** | Editor |
| **Name (EN)** | Editor |
| **Description (ID)** | Penyunting konten yang dapat meninjau dan menerbitkan |
| **Description (EN)** | Content editor who can review and publish |
| **Users with this role** | 1 (editor1) |
| **Status** | ✅ Active |

**Permissions:**
- Create, read, update, delete articles
- Publish articles
- Review content from contributors
- Manage categories and tags
- Cannot manage users or system settings

---

### 3️⃣ **CONTRIBUTOR** (Content Contributor)
| Property | Value |
|----------|-------|
| **Code** | `contributor` |
| **Name (ID)** | Kontributor |
| **Name (EN)** | Contributor |
| **Description (ID)** | Penulis konten yang mengirimkan untuk ditinjau |
| **Description (EN)** | Content writer who submits for review |
| **Users with this role** | 1 (contributor1) |
| **Status** | ✅ Active |

**Permissions:**
- Create articles
- Edit own articles
- Submit articles for review
- Cannot publish articles
- Cannot edit other's articles

---

### 4️⃣ **READER** (ASN Employee / Internal Reader)
| Property | Value |
|----------|-------|
| **Code** | `reader` |
| **Name (ID)** | Pembaca |
| **Name (EN)** | Reader |
| **Description (ID)** | Pegawai ASN yang hanya dapat membaca konten internal |
| **Description (EN)** | ASN employee who can only read internal content |
| **Users with this role** | 2 (reader1, reader2) |
| **Status** | ✅ Active |

**Permissions:**
- Read internal articles
- Read public articles
- Cannot create or edit content
- Cannot manage system

---

### 5️⃣ **PUBLIC** (Public User)
| Property | Value |
|----------|-------|
| **Code** | `public` |
| **Name (ID)** | Publik |
| **Name (EN)** | Public |
| **Description (ID)** | Pengguna publik yang dapat membaca konten publik |
| **Description (EN)** | Public user who can read public content |
| **Users with this role** | 5 (all users have this role) |
| **Status** | ✅ Active |

**Permissions:**
- Read public articles
- Cannot create, edit, or delete content
- Cannot access internal articles

---

## 📋 ROLE HIERARCHY & PERMISSION CASCADE

```
┌─────────────────────────────────────────────────────────────────┐
│                      ROLE HIERARCHY                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  LEVEL 1: ADMIN ⭐                                               │
│  └─ Full System Access                                           │
│  └─ Manage Users                                                 │
│  └─ Manage All Content                                           │
│  └─ Publish Content                                              │
│                                                                   │
│      ↓                                                            │
│                                                                   │
│  LEVEL 2: EDITOR 📝                                              │
│  └─ Manage All Content (Create, Read, Update, Delete)           │
│  └─ Publish Articles                                             │
│  └─ Review Contributions                                         │
│                                                                   │
│      ↓                                                            │
│                                                                   │
│  LEVEL 3: CONTRIBUTOR ✍️                                         │
│  └─ Create Articles                                              │
│  └─ Edit Own Articles                                            │
│  └─ Submit for Review                                            │
│                                                                   │
│      ↓                                                            │
│                                                                   │
│  LEVEL 4: READER 👓                                              │
│  └─ Read Internal Articles                                       │
│  └─ Read Public Articles                                         │
│  └─ Cannot Create/Edit                                           │
│                                                                   │
│      ↓                                                            │
│                                                                   │
│  LEVEL 5: PUBLIC 🌐 (Base Level)                                 │
│  └─ Read Public Articles Only                                    │
│  └─ No Create/Edit Privileges                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 ROLE DISTRIBUTION

| Role | Count | Percentage | Users |
|------|-------|-----------|-------|
| PUBLIC | 5 | 83.3% | khairilazmiashari, reader2, reader1, contributor1, editor1 |
| READER | 2 | 33.3% | reader1, reader2 |
| CONTRIBUTOR | 1 | 16.7% | contributor1 |
| EDITOR | 1 | 16.7% | editor1 |
| ADMIN | 1 | 16.7% | admin |

**Note:** Users can have multiple roles. PUBLIC role is assigned to most users as a base level.

---

## 🔑 KEY FINDINGS & OBSERVATIONS

### ✅ Current State
1. **Well-Structured Role Hierarchy:** Roles follow proper permission cascade (ADMIN > EDITOR > CONTRIBUTOR > READER > PUBLIC)
2. **Appropriate Role Assignment:** Each user has appropriate roles based on their responsibilities
3. **Department Organization:** Users are properly organized by department (HR, Finance, Content, PR)
4. **Government IDs:** Staff members have NIP (Nomor Induk Pegawai) assigned
5. **Bilingual Support:** System supports both Indonesian and English role definitions

### 📌 User Summary
- **1 System Administrator** (`admin`) - Full access, superuser
- **1 Content Editor** (`editor1`) - Content management and publishing
- **1 Content Contributor** (`contributor1`) - Content creation and submission
- **2 ASN Readers** (`reader1`, `reader2`) - Internal read-only access
- **1 Public User** (`khairilazmiashari`) - Public read-only access

### 🔍 Notable Details
- **No SSO Users:** All users are local authentication (no OAuth/SSO integration yet)
- **Email Verification:** No users have verified email addresses
- **Theme Preferences:** All users set to light mode
- **Language Preference:** All users prefer Indonesian
- **Staff Status:** Only admin and editor1 are marked as staff members

### ⚠️ Recommendations
1. **Set Full Names:** The admin user should have a full name set for better system usability
2. **Email Verification:** Implement email verification process for all users
3. **Department Completeness:** Ensure all users have department assignments
4. **Role Optimization:** Consider creating specialized roles for specific departments if needed
5. **Audit Trail:** Monitor user activity through audit logs regularly
6. **Backup Roles:** Consider having backup admin accounts for system administration

---

## 🔐 Permission Matrix

| Action | ADMIN | EDITOR | CONTRIBUTOR | READER | PUBLIC |
|--------|:-----:|:------:|:-----------:|:------:|:------:|
| **View Public Articles** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View Internal Articles** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Create Articles** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Edit Own Articles** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Edit All Articles** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Delete Articles** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Publish Articles** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Review Content** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage Categories** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage Tags** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage Users** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Manage Roles** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **View Audit Logs** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **System Settings** | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 📅 Timeline

| Date | Event | User |
|------|-------|------|
| Jan 6, 2026 12:24 | Admin account created | admin |
| Jan 7, 2026 03:25 | Editor created | editor1 |
| Jan 7, 2026 03:25 | Contributor created | contributor1 |
| Jan 7, 2026 03:25 | Reader 1 created | reader1 |
| Jan 7, 2026 03:25 | Reader 2 created | reader2 |
| Jan 12, 2026 07:28 | Public user signed up | khairilazmiashari |

---

## 🛠️ System Integration

### Authentication Methods
- ✅ **Local Authentication** - 6 users
- ⏳ **Google OAuth** - Configured (not yet used)
- ⏳ **SSO/OpenID** - Configured (not yet used)

### Preferences Set
- **Preferred Language:** All users set to Indonesian (`id`)
- **Theme Mode:** All users set to Light mode
- **Email Verified:** No users have verified emails

---

**Report Generated:** January 13, 2026
**System:** KMS DPD RI
**Backend Version:** Django 4.2.7
