# KMSetjenDPDRI - Database Schema & Django Models

**Versi**: 1.0  
**Tanggal**: 5 Januari 2026

---

## 1. ENTITY RELATIONSHIP DIAGRAM (ERD)

```
┌──────────────────┐
│      User        │
├──────────────────┤
│ id (PK)          │
│ username (UNIQUE)│
│ email            │
│ first_name       │
│ last_name        │
│ nip (ASN ID)     │
│ is_active        │
│ created_at       │
│ updated_at       │
└────────┬─────────┘
         │
         ├─────────────┐
         │             │
         ▼             ▼
    ┌─────────┐    ┌─────────────────┐
    │  Role   │    │ UserPermission  │
    ├─────────┤    ├─────────────────┤
    │id (PK)  │    │id (PK)          │
    │name     │    │user_id (FK)     │
    │code     │    │role_id (FK)     │
    │perms[]  │    │granted_at       │
    └─────────┘    └─────────────────┘


┌─────────────────┐
│   Language      │
├─────────────────┤
│ id (PK)         │
│ code (UNIQUE)   │ "id", "en"
│ name            │
│ is_default      │
└─────────────────┘


┌──────────────────┐      ┌──────────────────┐
│   Category       │      │      Tag         │
├──────────────────┤      ├──────────────────┤
│ id (PK)          │      │ id (PK)          │
│ name_id          │      │ name_id          │
│ name_en          │      │ name_en          │
│ slug             │      │ slug             │
│ description_id   │      │ description_id   │
│ description_en   │      │ description_en   │
│ icon             │      │ color            │
│ order_index      │      │ usage_count      │
│ created_at       │      │ created_at       │
└──────────────────┘      └──────────────────┘


┌────────────────────────┐
│      Article           │        ┌───────────────────────────┐
├────────────────────────┤        │  ArticleTranslation       │
│ id (PK)                │        ├───────────────────────────┤
│ uuid (external ID)     │────┬───┤ id (PK)                   │
│ slug (UNIQUE)          │    │   │ article_id (FK)           │
│ title_id               │    │   │ language_id (FK)          │
│ title_en               │    │   │ title                     │
│ content_id             │    │   │ content (WYSIWYG)         │
│ content_en             │    │   │ meta_description          │
│ summary_id             │    │   │ meta_keywords             │
│ summary_en             │    │   │ created_at                │
│                        │    │   │ updated_at                │
│ author_id (FK User)    │    │   └───────────────────────────┘
│ reviewer_id (FK User)  │    │
│ publisher_id (FK User) │    │
│                        │    │
│ category_id (FK)       │    │   ┌───────────────────────────┐
│ access_level           │    │   │   ArticleVersion          │
│ is_published           │    │   ├───────────────────────────┤
│ is_bilingual           │    └───┤ id (PK)                   │
│ published_at           │        │ article_id (FK)           │
│ scheduled_at           │        │ version_number            │
│ language (default)     │        │ content                   │
│ status                 │        │ created_by_id (FK User)   │
│ view_count             │        │ change_log                │
│ created_at             │        │ created_at                │
│ updated_at             │        └───────────────────────────┘
└────────┬───────────────┘
         │
         ├─────────────┬─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌─────────┐  ┌─────────┐   ┌──────────┐
    │  File   │  │  Tag    │   │Category  │
    │(M2M)    │  │ (M2M)   │   │  (FK)    │
    └─────────┘  └─────────┘   └──────────┘


┌─────────────────────────┐
│      AuditLog           │
├─────────────────────────┤
│ id (PK)                 │
│ user_id (FK)            │
│ action                  │ CREATE, UPDATE, DELETE, PUBLISH
│ content_type            │ Article, User, Category, etc.
│ content_id              │
│ changes (JSON)          │ {field: [old, new]}
│ ip_address              │
│ user_agent              │
│ timestamp               │
├─────────────────────────┤
│ INDEX: (content_type,   │
│ content_id, timestamp)  │
└─────────────────────────┘


┌────────────────────────────┐
│      File/Attachment       │
├────────────────────────────┤
│ id (PK)                    │
│ article_id (FK)            │
│ file (FileField)           │
│ original_filename          │
│ file_size                  │
│ mime_type                  │
│ uploaded_by_id (FK User)   │
│ description                │
│ order_index                │
│ created_at                 │
└────────────────────────────┘
```

---

## 2. DJANGO MODELS (Implementation Ready)

### 2.1 Core Models

```python
# models.py - Core structure

# =====================================
# AUTH & PERMISSIONS
# =====================================

class Role(models.Model):
    """
    Role-based access control.
    Roles: ADMIN, EDITOR, CONTRIBUTOR, READER, PUBLIC
    """
    ADMIN = 'admin'
    EDITOR = 'editor'
    CONTRIBUTOR = 'contributor'
    READER = 'reader'
    PUBLIC = 'public'
    
    ROLE_CHOICES = [
        (ADMIN, 'Administrator'),
        (EDITOR, 'Editor'),
        (CONTRIBUTOR, 'Contributor'),
        (READER, 'Reader (ASN)'),
        (PUBLIC, 'Public'),
    ]
    
    code = models.CharField(max_length=20, unique=True, choices=ROLE_CHOICES)
    name_id = models.CharField(max_length=100)  # "Administrator"
    name_en = models.CharField(max_length=100)
    description_id = models.TextField(blank=True)
    description_en = models.TextField(blank=True)
    
    # Permissions as JSON array (extension point)
    permissions = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'auth_role'
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'
    
    def __str__(self):
        return f"{self.code} - {self.name_id}"


class User(AbstractUser):
    """
    Extended Django User model.
    Supports both SSO and local users.
    """
    # Government ID
    nip = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        help_text="Nomor Induk Pegawai (ASN ID)"
    )
    
    # Profile
    department = models.CharField(
        max_length=255,
        blank=True,
        help_text="Unit kerja / Bagian"
    )
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Auth tracking
    is_sso_user = models.BooleanField(default=False, help_text="Login via SSO?")
    last_sso_login = models.DateTimeField(null=True, blank=True)
    
    # Roles (M2M with Role)
    roles = models.ManyToManyField(Role, related_name='users', blank=True)
    
    # Localization preferences
    preferred_language = models.CharField(
        max_length=5,
        default='id',
        choices=[('id', 'Bahasa Indonesia'), ('en', 'English')]
    )
    theme_mode = models.CharField(
        max_length=10,
        default='light',
        choices=[('light', 'Light'), ('dark', 'Dark'), ('auto', 'Auto')]
    )
    
    # Metadata
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['nip']),
            models.Index(fields=['department']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.username})"
    
    def get_primary_role(self):
        """Return highest privilege role"""
        role_priority = {Role.ADMIN: 1, Role.EDITOR: 2, Role.CONTRIBUTOR: 3, Role.READER: 4}
        roles = self.roles.all()
        if not roles:
            return None
        return min(roles, key=lambda r: role_priority.get(r.code, 999))
    
    def has_role(self, role_code):
        return self.roles.filter(code=role_code).exists()
    
    def is_admin(self):
        return self.has_role(Role.ADMIN)
    
    def is_editor(self):
        return self.has_role(Role.EDITOR) or self.is_admin()
    
    def is_contributor(self):
        return self.has_role(Role.CONTRIBUTOR) or self.is_editor()


# =====================================
# LANGUAGES & METADATA
# =====================================

class Language(models.Model):
    """
    Supported languages in the system.
    """
    code = models.CharField(
        max_length=5,
        unique=True,
        choices=[('id', 'Bahasa Indonesia'), ('en', 'English')]
    )
    name = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'content_language'
        verbose_name = 'Language'
        verbose_name_plural = 'Languages'
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Category(models.Model):
    """
    Content categories (hierarchical).
    """
    name_id = models.CharField(max_length=255)
    name_en = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    
    description_id = models.TextField(blank=True)
    description_en = models.TextField(blank=True)
    
    icon = models.CharField(max_length=50, blank=True)  "folder", "book", etc.
    color = models.CharField(max_length=7, default='#007bff')  "#007bff"
    
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='children'
    )
    
    order_index = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'content_category'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['order_index', 'name_id']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['parent']),
        ]
    
    def __str__(self):
        return self.name_id


class Tag(models.Model):
    """
    Flexible tagging system.
    """
    name_id = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, max_length=100)
    
    description_id = models.TextField(blank=True)
    description_en = models.TextField(blank=True)
    
    color = models.CharField(max_length=7, default='#6c757d')
    usage_count = models.IntegerField(default=0, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'content_tag'
        verbose_name = 'Tag'
        verbose_name_plural = 'Tags'
        ordering = ['-usage_count', 'name_id']
    
    def __str__(self):
        return self.name_id


# =====================================
# CONTENT MODELS
# =====================================

class Article(models.Model):
    """
    Main content entity with versioning and i18n support.
    """
    ACCESS_PUBLIC = 'public'
    ACCESS_INTERNAL = 'internal'
    ACCESS_ROLE_BASED = 'role_based'
    
    ACCESS_LEVEL_CHOICES = [
        (ACCESS_PUBLIC, 'Public (tanpa login)'),
        (ACCESS_INTERNAL, 'Internal (semua ASN)'),
        (ACCESS_ROLE_BASED, 'Role-based (specific roles)'),
    ]
    
    STATUS_DRAFT = 'draft'
    STATUS_REVIEW = 'review'
    STATUS_REJECTED = 'rejected'
    STATUS_APPROVED = 'approved'
    STATUS_PUBLISHED = 'published'
    STATUS_SCHEDULED = 'scheduled'
    STATUS_ARCHIVED = 'archived'
    
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_REVIEW, 'Dalam Review'),
        (STATUS_REJECTED, 'Ditolak'),
        (STATUS_APPROVED, 'Disetujui'),
        (STATUS_PUBLISHED, 'Dipublikasikan'),
        (STATUS_SCHEDULED, 'Terjadwal'),
        (STATUS_ARCHIVED, 'Diarsipkan'),
    ]
    
    # Identifiers
    uuid = models.UUIDField(unique=True, default=uuid.uuid4, db_index=True)
    slug = models.SlugField(unique=True, max_length=255)
    
    # Bilingual content (storing both languages for faster access)
    title_id = models.CharField(max_length=255)
    title_en = models.CharField(max_length=255)
    
    content_id = models.TextField()  "HTML from WYSIWYG"
    content_en = models.TextField()
    
    summary_id = models.TextField(max_length=500, blank=True)  "Excerpt"
    summary_en = models.TextField(max_length=500, blank=True)
    
    # Metadata
    language = models.CharField(
        max_length=5,
        default='id',
        choices=[('id', 'Bahasa Indonesia'), ('en', 'English')],
        help_text="Primary language for this article"
    )
    is_bilingual = models.BooleanField(
        default=False,
        help_text="Does this article have both ID and EN versions?"
    )
    
    # Access control
    access_level = models.CharField(
        max_length=20,
        default=ACCESS_PUBLIC,
        choices=ACCESS_LEVEL_CHOICES
    )
    
    # For role_based access
    allowed_roles = models.ManyToManyField(
        Role,
        blank=True,
        related_name='accessible_articles',
        help_text="If access_level=role_based, which roles can view?"
    )
    
    # Relationships
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='articles'
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name='articles')
    
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='authored_articles'
    )
    reviewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_articles'
    )
    publisher = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='published_articles'
    )
    
    # Status & Publishing
    status = models.CharField(
        max_length=20,
        default=STATUS_DRAFT,
        choices=STATUS_CHOICES,
        db_index=True
    )
    is_published = models.BooleanField(default=False, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True)
    scheduled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Auto-publish at this time"
    )
    
    # Metrics
    view_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'content_article'
        verbose_name = 'Article'
        verbose_name_plural = 'Articles'
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['category']),
            models.Index(fields=['is_published', 'status']),
            models.Index(fields=['author']),
            models.Index(fields=['-published_at']),
        ]
    
    def __str__(self):
        return f"{self.title_id} ({self.status})"
    
    def can_view(self, user=None):
        """
        Check if user can view this article.
        """
        if self.access_level == self.ACCESS_PUBLIC:
            return True
        
        if not user or not user.is_authenticated:
            return False
        
        if self.access_level == self.ACCESS_INTERNAL:
            return user.has_role(Role.READER) or user.is_editor() or user.is_admin()
        
        if self.access_level == self.ACCESS_ROLE_BASED:
            return self.allowed_roles.filter(users=user).exists()
        
        return False


class ArticleVersion(models.Model):
    """
    Track content versions and change history.
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='versions'
    )
    
    version_number = models.IntegerField()
    content_id = models.TextField()
    content_en = models.TextField()
    
    change_log = models.TextField(blank=True)  "What changed?"
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='article_versions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'content_article_version'
        unique_together = [['article', 'version_number']]
        ordering = ['-version_number']
        indexes = [
            models.Index(fields=['article', '-version_number']),
        ]
    
    def __str__(self):
        return f"{self.article.slug} v{self.version_number}"


class File(models.Model):
    """
    File attachments for articles.
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='files'
    )
    
    file = models.FileField(upload_to='articles/%Y/%m/')
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()  "bytes"
    mime_type = models.CharField(max_length=100)
    
    description_id = models.CharField(max_length=255, blank=True)
    description_en = models.CharField(max_length=255, blank=True)
    
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_files'
    )
    
    order_index = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'content_file'
        verbose_name = 'File'
        verbose_name_plural = 'Files'
        ordering = ['order_index']
    
    def __str__(self):
        return self.original_filename


# =====================================
# AUDIT & LOGGING
# =====================================

class AuditLog(models.Model):
    """
    Immutable audit trail for all content changes.
    """
    ACTION_CREATE = 'create'
    ACTION_UPDATE = 'update'
    ACTION_DELETE = 'delete'
    ACTION_PUBLISH = 'publish'
    ACTION_UNPUBLISH = 'unpublish'
    ACTION_REVIEW = 'review'
    ACTION_APPROVE = 'approve'
    ACTION_REJECT = 'reject'
    
    ACTION_CHOICES = [
        (ACTION_CREATE, 'Create'),
        (ACTION_UPDATE, 'Update'),
        (ACTION_DELETE, 'Delete'),
        (ACTION_PUBLISH, 'Publish'),
        (ACTION_UNPUBLISH, 'Unpublish'),
        (ACTION_REVIEW, 'Submit to Review'),
        (ACTION_APPROVE, 'Approve'),
        (ACTION_REJECT, 'Reject'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs'
    )
    
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, db_index=True)
    
    # What was changed
    content_type = models.CharField(max_length=50, db_index=True)  "Article", "User", etc.
    content_id = models.CharField(max_length=100, db_index=True)
    content_display = models.CharField(max_length=255, blank=True)  "For easy identification"
    
    # What changed (JSON)
    # Format: {"field_name": ["old_value", "new_value"], ...}
    changes = models.JSONField(default=dict, blank=True)
    
    # Request context
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'audit_log'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['content_type', 'content_id', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user} {self.action} {self.content_type} #{self.content_id}"
```

---

## 3. RELATIONSHIPS & CONSTRAINTS

| Relationship | Type | Reason |
|--------------|------|--------|
| User ↔ Role | M2M | User can have multiple roles |
| Article → Category | FK | Each article in one category |
| Article → Tag | M2M | Each article can have multiple tags |
| Article → User (author) | FK | Track who created |
| Article → User (reviewer) | FK | Track who reviewed |
| Article → User (publisher) | FK | Track who published |
| Article → Role (allowed_roles) | M2M | For role-based access control |
| ArticleVersion → Article | FK | Cascade delete |
| File → Article | FK | Cascade delete |
| AuditLog → User | FK | Set null if user deleted |

---

## 4. DATABASE INDEXES

**Query Patterns** (indexes must support these):

```sql
-- Public articles listing
SELECT * FROM content_article 
WHERE is_published = true AND status = 'published' AND access_level = 'public'
ORDER BY published_at DESC;
-- INDEX: (is_published, status, access_level, published_at)

-- Internal articles by category
SELECT * FROM content_article 
WHERE category_id = ? AND is_published = true
ORDER BY published_at DESC;
-- INDEX: (category, is_published, published_at)

-- Full-text search
SELECT * FROM content_article
WHERE to_tsvector('indonesian', title_id || ' ' || content_id) @@ plainto_tsquery(?)
-- PostgreSQL FTS INDEX on title_id, content_id

-- Audit trail for specific content
SELECT * FROM audit_log
WHERE content_type = ? AND content_id = ?
ORDER BY timestamp DESC;
-- INDEX: (content_type, content_id, timestamp DESC)

-- User's recent activity
SELECT * FROM audit_log
WHERE user_id = ?
ORDER BY timestamp DESC;
-- INDEX: (user_id, timestamp DESC)
```

---

## 5. CONSTRAINTS & VALIDATIONS

### 5.1 Model-Level

- `Article.slug`: Must be unique, URL-safe
- `Article.title_*`: Cannot be empty
- `Article.content_*`: Cannot be empty
- `User.username`: Unique, alphanumeric
- `User.email`: Valid email format
- `Article.published_at` vs `Article.status`: If published, must have published_at
- `Article.scheduled_at`: Must be in future if set

### 5.2 Business Logic

- Can only publish if status = APPROVED
- Only EDITOR+ can approve/publish
- Only CONTRIBUTOR+ can create articles
- Cannot delete published articles (only archive)
- View counts updated on read (via cache, batch update)

---

## 6. DATA INTEGRITY & SOFT DELETES

**Approach**: Hard delete allowed, except:
- **Articles**: Archive instead of delete (keep for audit trail)
- **Users**: Deactivate instead of delete (keep audit history)
- **AuditLog**: Never delete (immutable)

---

## 7. MIGRATION STRATEGY

### Initial Migrations Order:
1. Create `User`, `Role`, `Language`
2. Create `Category`, `Tag`
3. Create `Article`, `ArticleVersion`, `File`
4. Create `AuditLog`
5. Create M2M relationships

### Sample Django Migration Commands:
```bash
python manage.py makemigrations core
python manage.py migrate
python manage.py loaddata initial_roles.json
python manage.py loaddata initial_languages.json
```

---

## NEXT STEPS

1. ✅ System Architecture
2. ✅ Database Schema (THIS DOCUMENT)
3. ⏳ Folder Structure (03_FOLDER_STRUCTURE.md)
4. ⏳ Configuration Plan (04_INITIAL_SCAFFOLDING.md)
5. ⏳ Implementation Checklist (05_IMPLEMENTATION_CHECKLIST.md)

---

**Schema siap diimplementasikan ke Django.**
