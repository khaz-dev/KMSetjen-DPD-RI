"""
Content models: Article, Category, Tag, File, ArticleVersion
"""
import uuid
from django.db import models
from django.db.models import F
from django.utils.text import slugify
from django.conf import settings
from django.core.validators import FileExtensionValidator


# ============================================================================
# CATEGORY MODEL
# ============================================================================

class Category(models.Model):
    """
    Content categories (hierarchical).
    """
    name_id = models.CharField(
        max_length=255,
        help_text='Nama kategori (Bahasa Indonesia)'
    )
    name_en = models.CharField(
        max_length=255,
        help_text='Nama kategori (English)'
    )
    slug = models.SlugField(
        unique=True,
        max_length=255,
        db_index=True,
        help_text='URL-friendly slug'
    )
    
    description_id = models.TextField(blank=True, help_text='Deskripsi (ID)')
    description_en = models.TextField(blank=True, help_text='Deskripsi (EN)')
    
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text='Icon name (e.g., "folder", "book")'
    )
    color = models.CharField(
        max_length=7,
        default='#007bff',
        help_text='Hex color code'
    )
    image = models.ImageField(
        upload_to='categories/',
        null=True,
        blank=True,
        help_text='Category image for visual representation'
    )
    
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='children',
        help_text='Parent category (untuk subcategory)'
    )
    
    order_index = models.IntegerField(
        default=0,
        help_text='Display order'
    )
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
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return self.name_id
    
    def save(self, *args, **kwargs):
        """Auto-generate slug if not provided."""
        if not self.slug:
            self.slug = slugify(self.name_id)
        super().save(*args, **kwargs)


# ============================================================================
# TAG MODEL
# ============================================================================

class Tag(models.Model):
    """
    Flexible tagging system for articles.
    """
    name_id = models.CharField(max_length=100, help_text='Tag name (ID)')
    name_en = models.CharField(max_length=100, help_text='Tag name (EN)')
    slug = models.SlugField(
        unique=True,
        max_length=100,
        db_index=True,
        help_text='URL-friendly slug'
    )
    
    description_id = models.TextField(blank=True, help_text='Deskripsi (ID)')
    description_en = models.TextField(blank=True, help_text='Deskripsi (EN)')
    
    color = models.CharField(
        max_length=7,
        default='#6c757d',
        help_text='Hex color code'
    )
    usage_count = models.IntegerField(
        default=0,
        db_index=True,
        help_text='Jumlah artikel dengan tag ini'
    )
    is_active = models.BooleanField(default=True, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'content_tag'
        verbose_name = 'Tag'
        verbose_name_plural = 'Tags'
        ordering = ['-usage_count', 'name_id']
    
    def __str__(self):
        return self.name_id
    
    def save(self, *args, **kwargs):
        """Auto-generate slug if not provided."""
        if not self.slug:
            self.slug = slugify(self.name_id)
        super().save(*args, **kwargs)


# ============================================================================
# ARTICLE MODEL
# ============================================================================

class Article(models.Model):
    """
    Main content entity with versioning and i18n support.
    """
    # Access level choices
    ACCESS_PUBLIC = 'public'
    ACCESS_INTERNAL = 'internal'
    ACCESS_ROLE_BASED = 'role_based'
    
    ACCESS_LEVEL_CHOICES = [
        (ACCESS_PUBLIC, 'Public (tanpa login)'),
        (ACCESS_INTERNAL, 'Internal (semua ASN)'),
        (ACCESS_ROLE_BASED, 'Role-based (specific roles)'),
    ]
    
    # Status choices
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
    uuid = models.UUIDField(
        unique=True,
        default=uuid.uuid4,
        db_index=True,
        help_text='Unique external identifier'
    )
    slug = models.SlugField(
        unique=True,
        max_length=255,
        db_index=True,
        help_text='URL-friendly slug'
    )
    
    # Bilingual content (storing both languages for faster access)
    title_id = models.CharField(max_length=255, help_text='Judul (Bahasa Indonesia)')
    title_en = models.CharField(max_length=255, help_text='Judul (English)')
    
    content_id = models.TextField(help_text='Konten WYSIWYG (ID)')
    content_en = models.TextField(help_text='Konten WYSIWYG (EN)')
    
    summary_id = models.TextField(
        max_length=500,
        blank=True,
        help_text='Ringkasan/excerpt (ID)'
    )
    summary_en = models.TextField(
        max_length=500,
        blank=True,
        help_text='Ringkasan/excerpt (EN)'
    )
    
    # Featured image
    image = models.ImageField(
        upload_to='articles/',
        null=True,
        blank=True,
        help_text='Article featured image for visual representation'
    )
    
    image_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text='External image URL (used if local image not available)'
    )
    
    # Metadata
    language = models.CharField(
        max_length=5,
        default='id',
        choices=[('id', 'Bahasa Indonesia'), ('en', 'English')],
        help_text='Primary language for this article'
    )
    is_bilingual = models.BooleanField(
        default=False,
        help_text='Does this article have both ID and EN versions?'
    )
    
    # Access control
    access_level = models.CharField(
        max_length=20,
        default=ACCESS_PUBLIC,
        choices=ACCESS_LEVEL_CHOICES,
        db_index=True,
        help_text='Siapa yang bisa mengakses artikel ini?'
    )
    
    # For role_based access
    allowed_roles = models.ManyToManyField(
        'core.Role',
        blank=True,
        related_name='accessible_articles',
        help_text='Jika access_level=role_based, roles mana saja yang bisa akses?'
    )
    
    # Relationships
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='articles',
        help_text='Kategori artikel'
    )
    tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name='articles',
        help_text='Tags untuk artikel'
    )
    
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='authored_articles',
        help_text='Penulis artikel'
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_articles',
        help_text='Reviewer artikel'
    )
    publisher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='published_articles',
        help_text='Orang yang publish artikel'
    )
    
    # Status & Publishing
    status = models.CharField(
        max_length=20,
        default=STATUS_DRAFT,
        choices=STATUS_CHOICES,
        db_index=True,
        help_text='Status artikel'
    )
    is_published = models.BooleanField(
        default=False,
        db_index=True,
        help_text='Sudah dipublikasikan?'
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Waktu publikasi'
    )
    scheduled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Auto-publish at this time'
    )
    
    # Metrics
    view_count = models.IntegerField(default=0, db_index=True, help_text='Total views')
    like_count = models.IntegerField(default=0, db_index=True, help_text='Total likes')
    
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
            models.Index(fields=['access_level']),
        ]
    
    def __str__(self):
        return f"{self.title_id} ({self.status})"
    
    def save(self, *args, **kwargs):
        """Auto-generate slug if not provided."""
        if not self.slug:
            self.slug = slugify(self.title_id)
        super().save(*args, **kwargs)
    
    def can_view(self, user=None):
        """
        Check if user can view this article.
        """
        # Public articles everyone can view (if published)
        if self.access_level == self.ACCESS_PUBLIC:
            return self.is_published if user is None else True
        
        # Non-authenticated users cannot view internal content
        if not user or not user.is_authenticated:
            return False
        
        # Internal access: all authenticated users with reader role or higher
        if self.access_level == self.ACCESS_INTERNAL:
            return user.is_reader() or user.is_editor() or user.is_admin()
        
        # Role-based access
        if self.access_level == self.ACCESS_ROLE_BASED:
            return self.allowed_roles.filter(users=user).exists()
        
        return False
    
    def increment_view_count(self):
        """Increment view count atomically using F() expression.
        This prevents race conditions and database locking issues.
        """
        # Use F() for atomic increment - avoids read-modify-write race condition
        Article.objects.filter(id=self.id).update(view_count=F('view_count') + 1)
        # Refresh view_count from database
        self.refresh_from_db(fields=['view_count'])


# ============================================================================
# ARTICLE VERSION MODEL
# ============================================================================

class ArticleVersion(models.Model):
    """
    Track content versions and change history.
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='versions',
        help_text='Artikel yang diversion-kan'
    )
    
    version_number = models.IntegerField(help_text='Version number')
    content_id = models.TextField(help_text='Content (ID)')
    content_en = models.TextField(help_text='Content (EN)')
    
    change_log = models.TextField(
        blank=True,
        help_text='Deskripsi perubahan yang dibuat'
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='article_versions',
        help_text='User yang membuat version'
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


# ============================================================================
# FILE/ATTACHMENT MODEL
# ============================================================================

class File(models.Model):
    """
    File attachments for articles.
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='files',
        help_text='Artikel yang memiliki file ini'
    )
    
    file = models.FileField(
        upload_to='articles/%Y/%m/',
        help_text='File upload'
    )
    original_filename = models.CharField(
        max_length=255,
        help_text='Original filename'
    )
    file_size = models.BigIntegerField(help_text='Size in bytes')
    mime_type = models.CharField(max_length=100, help_text='MIME type')
    
    description_id = models.CharField(
        max_length=255,
        blank=True,
        help_text='Deskripsi (ID)'
    )
    description_en = models.CharField(
        max_length=255,
        blank=True,
        help_text='Deskripsi (EN)'
    )
    
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_files',
        help_text='User yang upload file'
    )
    
    order_index = models.IntegerField(default=0, help_text='Display order')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'content_file'
        verbose_name = 'File'
        verbose_name_plural = 'Files'
        ordering = ['order_index']
    
    def __str__(self):
        return self.original_filename
