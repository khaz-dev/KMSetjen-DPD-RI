"""
Content models: Article, Category, Tag, File, ArticleVersion
"""
import uuid
from django.db import models
from django.db.models import F
from django.utils.text import slugify
from django.conf import settings
from django.core.validators import FileExtensionValidator
from apps.content.constants import (
    KNOWLEDGE_TYPE_CHOICES,
    KNOWLEDGE_TYPE_ARTIKEL,
    KNOWLEDGE_TYPE_DETAILS,
    KNOWLEDGE_CLUSTER_MAP,
)


# ============================================================================
# FILE UPLOAD FUNCTIONS (Callable upload_to functions)
# ============================================================================

def article_image_upload_to(instance, filename):
    """
    Generate upload path for article images.
    
    Format: articles/article_{id}_image.{ext}
    
    Using a callable instead of format string (%s) avoids Django's
    string formatting issues and provides better error handling.
    """
    if not instance.pk:
        # For new instances without pk, use a temporary name
        # The file will be moved to the final path after save()
        import os
        name, ext = os.path.splitext(filename)
        return f'articles/article_new_image{ext}'
    
    import os
    name, ext = os.path.splitext(filename)
    return f'articles/article_{instance.pk}_image{ext}'


def category_image_upload_to(instance, filename):
    """
    Generate upload path for category images.
    
    Format: categories/{category_slug}.{ext}
    
    Using the slug (category name) instead of ID ensures:
    - Consistent, predictable filenames
    - Server memory efficiency (replacing an image keeps same filename)
    - Better cache behavior
    - Easy file identification and management
    """
    if not instance.slug:
        # For new instances without slug, generate one temporarily
        from django.utils.text import slugify
        slug = slugify(instance.name_en) if instance.name_en else 'category'
    else:
        slug = instance.slug
    
    import os
    name, ext = os.path.splitext(filename)
    return f'categories/{slug}{ext}'


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
        upload_to=category_image_upload_to,
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
        """Auto-generate slug from name_en if not provided, and auto-optimize image."""
        if not self.slug:
            self.slug = slugify(self.name_en)
        if self.image and not getattr(self.image, '_committed', True):
            try:
                from shared.utils.image_optimizer import optimize_image_file, MAX_SIZE_CATEGORY
                self.image = optimize_image_file(self.image, max_size=MAX_SIZE_CATEGORY)
            except Exception:
                pass
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """
        Delete category and clean up its image file from storage.
        """
        # Delete image file from storage if exists
        if self.image:
            storage_path = self.image.name
            if storage_path:
                try:
                    from django.core.files.storage import default_storage
                    default_storage.delete(storage_path)
                except Exception:
                    pass  # Log but don't fail if deletion fails
        
        # Call parent delete which handles CASCADE to child categories and articles
        super().delete(*args, **kwargs)



# ============================================================================
# TAG MODEL
# ============================================================================

class Tag(models.Model):
    """
    Flexible tagging system for articles.
    """
    name_id = models.CharField(max_length=100, help_text='Tag name (ID)')
    name_en = models.CharField(max_length=100, blank=True, help_text='Tag name (EN)')
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
# EXTERNAL AUTHOR MODEL
# ============================================================================

class ExternalAuthor(models.Model):
    """
    Model untuk menyimpan daftar penulis / penyusun eksternal.
    Digunakan untuk memberikan sugesti saat user mengetik nama penulis eksternal.
    """
    name = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text='Nama penyusun / penulis eksternal'
    )
    institution = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text='Institusi / lembaga / organisasi eksternal'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'content_external_author'
        verbose_name = 'External Author'
        verbose_name_plural = 'External Authors'
        ordering = ['name']

    def __str__(self):
        return self.name


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
    
    # Versioning
    VERSION_DRAFT = 'draft'
    VERSION_PUBLISHED = 'published'
    VERSION_CHOICES = [
        (VERSION_DRAFT, 'Draft Version'),
        (VERSION_PUBLISHED, 'Published Version'),
    ]
    
    version_type = models.CharField(
        max_length=20,
        default=VERSION_DRAFT,
        choices=VERSION_CHOICES,
        db_index=True,
        help_text='Whether this is a draft or published version'
    )
    
    draft_article = models.OneToOneField(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='published_version',
        help_text='Link to draft version (only for published versions)'
    )
    
    # Identifiers
    uuid = models.UUIDField(
        unique=True,
        default=uuid.uuid4,
        db_index=True,
        help_text='Unique external identifier'
    )
    slug = models.SlugField(
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
        upload_to=article_image_upload_to,
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
    media_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text='External media URL (YouTube, Vimeo, Google Drive, direct video/audio) untuk Produk Audiovisual'
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
    
    # Creator metadata (Penyusun / Penulis Asli)
    CREATOR_INTERNAL = 'internal'
    CREATOR_EXTERNAL = 'external'
    CREATOR_MIXED = 'mixed'
    CREATOR_TYPE_CHOICES = [
        (CREATOR_INTERNAL, 'Internal Setjen DPD RI'),
        (CREATOR_EXTERNAL, 'Eksternal'),
        (CREATOR_MIXED, 'Gabungan Internal & Eksternal'),
    ]

    creator_type = models.CharField(
        max_length=20,
        default=CREATOR_INTERNAL,
        choices=CREATOR_TYPE_CHOICES,
        db_index=True,
        help_text='Tipe penyusun: internal, eksternal, atau gabungan'
    )
    creator_name = models.TextField(
        blank=True,
        default='',
        help_text='Nama penyusun / penulis asli (bisa multiple dipisahkan koma)'
    )
    creator_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_articles',
        help_text='Pegawai internal Setjen DPD RI jika dipilih dari user internal'
    )
    creators_data = models.JSONField(
        default=list,
        blank=True,
        help_text='Daftar penyusun/penulis terstruktur: [{name, type, user_id, nip, institution}]'
    )

    # Relationships
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='articles',
        help_text='Kategori artikel'
    )
    # Bentuk Pengetahuan sesuai Peraturan Sekretaris Jenderal DPD RI No. 8 Tahun 2026 Bab II Pasal 7
    knowledge_type = models.CharField(
        max_length=30,
        choices=KNOWLEDGE_TYPE_CHOICES,
        default=KNOWLEDGE_TYPE_ARTIKEL,
        db_index=True,
        help_text='Bentuk Pengetahuan sesuai Persekjen DPD RI No. 8/2026 Bab II Pasal 7'
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
        help_text='Pengunggah / Publisher sistem artikel'
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
    
    # Rejection feedback
    rejection_reason = models.TextField(
        blank=True,
        default='',
        help_text='Reason for rejecting the article'
    )
    
    # Approval feedback
    approval_comment = models.TextField(
        blank=True,
        default='',
        help_text='Comment when approving the article'
    )
    
    # Metrics
    view_count = models.IntegerField(default=0, db_index=True, help_text='Total views')
    like_count = models.IntegerField(default=0, db_index=True, help_text='Total likes')
    share_count = models.IntegerField(default=0, db_index=True, help_text='Total shares')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'content_article'
        verbose_name = 'Article'
        verbose_name_plural = 'Articles'
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['version_type', 'slug']),
            models.Index(fields=['category']),
            models.Index(fields=['is_published', 'status']),
            models.Index(fields=['author']),
            models.Index(fields=['creator_type']),
            models.Index(fields=['creator_user']),
            models.Index(fields=['-published_at']),
            models.Index(fields=['access_level']),
            models.Index(fields=['knowledge_type']),
            models.Index(fields=['is_published', 'knowledge_type']),
        ]
        constraints = [
            # Slug must be unique per version_type (draft can have same slug as published)
            models.UniqueConstraint(
                fields=['version_type', 'slug'],
                name='unique_slug_per_version_type'
            ),
        ]
    
    def __str__(self):
        return f"{self.title_id} ({self.status})"

    def get_knowledge_type_display_id(self):
        """Get Indonesian display name for knowledge type."""
        details = KNOWLEDGE_TYPE_DETAILS.get(self.knowledge_type, {})
        return details.get('name_id', self.get_knowledge_type_display())

    def get_knowledge_type_display_en(self):
        """Get English display name for knowledge type."""
        details = KNOWLEDGE_TYPE_DETAILS.get(self.knowledge_type, {})
        return details.get('name_en', self.get_knowledge_type_display())

    def get_knowledge_cluster(self):
        """Get cluster code ('a', 'b', 'c', 'd') based on Pasal 7."""
        details = KNOWLEDGE_TYPE_DETAILS.get(self.knowledge_type, {})
        return details.get('cluster', 'c')

    def get_knowledge_cluster_display_id(self):
        """Get cluster title in Indonesian."""
        cluster_code = self.get_knowledge_cluster()
        cluster_info = KNOWLEDGE_CLUSTER_MAP.get(cluster_code, {})
        return cluster_info.get('title_id', '')

    def get_knowledge_cluster_display_en(self):
        """Get cluster title in English."""
        cluster_code = self.get_knowledge_cluster()
        cluster_info = KNOWLEDGE_CLUSTER_MAP.get(cluster_code, {})
        return cluster_info.get('title_en', '')

    
    def save(self, *args, **kwargs):
        """Auto-generate slug if not provided, ensure creator_name fallback, and auto-optimize featured image."""
        if not self.slug:
            self.slug = slugify(self.title_id)
        if not self.creator_name and self.creators_data:
            self.creator_name = ", ".join(
                c.get('name') for c in self.creators_data if isinstance(c, dict) and c.get('name')
            )
        elif not self.creator_name:
            if self.creator_user:
                self.creator_name = self.creator_user.get_full_name() or self.creator_user.username
            elif self.author:
                self.creator_name = self.author.get_full_name() or self.author.username
            else:
                self.creator_name = 'Setjen DPD RI'

        # Ensure creators_data is populated if creator_name exists
        if not self.creators_data and self.creator_name:
            self.creators_data = [
                {'name': n.strip(), 'type': self.creator_type or 'internal'}
                for n in self.creator_name.split(',') if n.strip()
            ]
        if self.image and not getattr(self.image, '_committed', True):
            try:
                from shared.utils.image_optimizer import optimize_image_file, MAX_SIZE_ARTICLE
                self.image = optimize_image_file(self.image, max_size=MAX_SIZE_ARTICLE)
            except Exception:
                pass
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """
        Custom delete to handle versioning properly:
        - When deleting a DRAFT: only delete its files, not published version
        - When deleting a PUBLISHED: remove the draft_article reference from it
        - Never cascade delete from draft to published version
        """
        # Delete featured image file from storage if exists
        if self.image:
            storage_path = self.image.name
            if storage_path:
                try:
                    from django.core.files.storage import default_storage
                    default_storage.delete(storage_path)
                except Exception:
                    pass  # Log error but don't fail
        
        # Delete all file attachments from storage
        for file_obj in self.files.all():
            if file_obj.file:
                try:
                    file_obj.file.delete(save=False)
                except Exception:
                    pass  # Log error but don't fail
        
        # Call parent delete which handles CASCADE for File.article
        # Files will be deleted from DB, but we've already handled storage cleanup
        super().delete(*args, **kwargs)
    
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
    
    def increment_view_count(self, user=None, ip_address=None):
        """
        Increment view count only if:
        1. Article is published (status='published' AND is_published=True)
        2. This is a new view (first time this user/IP viewed this article)
        
        Args:
            user: User object (optional, for authenticated users)
            ip_address: IP address (optional, for anonymous or tracking)
        
        Returns:
            bool: True if view was counted, False if already viewed or article not published
        """
        # CRITICAL: Only count views for published articles
        if self.status != Article.STATUS_PUBLISHED or not self.is_published:
            return False
        
        # For authenticated users, check if they already viewed this article
        if user and user.is_authenticated:
            # Try to create ArticleView record (unique constraint on article+user)
            # CRITICAL: Don't set ip_address for authenticated users!
            # The unique_together constraint has two separate rules:
            # 1. (article, user) must be unique for authenticated users
            # 2. (article, ip_address) must be unique for anonymous users
            # Mixing them causes IntegrityError when multiple authenticated users from same IP try to visit
            created = ArticleView.objects.get_or_create(
                article=self,
                user=user,
                defaults={}  # Don't include ip_address for authenticated users
            )[1]
            
            if created:
                # First time this user viewed this article - increment count
                Article.objects.filter(id=self.id).update(view_count=F('view_count') + 1)
                self.refresh_from_db(fields=['view_count'])
                return True
            else:
                # User already viewed this article - don't increment
                return False
        
        # For anonymous users, check IP address
        elif ip_address:
            # Try to create ArticleView record (unique constraint on article+ip_address)
            # CRITICAL: Don't set user for anonymous users to avoid unique constraint conflicts
            created = ArticleView.objects.get_or_create(
                article=self,
                ip_address=ip_address,
                defaults={}  # Don't include user for anonymous requests
            )[1]
            
            if created:
                # First time this IP viewed this article - increment count
                Article.objects.filter(id=self.id).update(view_count=F('view_count') + 1)
                self.refresh_from_db(fields=['view_count'])
                return True
            else:
                # IP already viewed this article - don't increment
                return False
        
        # No user or IP provided - can't track uniqueness, don't increment
        return False

    def toggle_like(self, user=None, ip_address=None):
        """
        Toggle like state for an article. Works like/unlike:
        1. Article must be published (status='published' AND is_published=True)
        2. If user/IP hasn't liked: add like and increment like_count
        3. If user/IP already liked: remove like and decrement like_count
        
        Args:
            user: User object (optional, for authenticated users)
            ip_address: IP address (optional, for anonymous users)
        
        Returns:
            dict: {
                'liked': bool - True if now liked, False if unlike
                'like_count': int - Updated like count
                'liked_by_user': bool - True if user has liked (for frontend)
            }
        """
        # CRITICAL: Only allow likes on published articles
        if self.status != Article.STATUS_PUBLISHED or not self.is_published:
            return {
                'liked': False,
                'like_count': self.like_count,
                'liked_by_user': False,
                'error': 'Article must be published to like'
            }
        
        # For authenticated users, check if they already liked this article
        if user and user.is_authenticated:
            # CRITICAL: Don't set ip_address for authenticated users!
            # The unique_together constraint has two separate rules:
            # 1. (article, user) must be unique for authenticated users
            # 2. (article, ip_address) must be unique for anonymous users
            # Mixing them causes IntegrityError when multiple authenticated users from same IP try to like
            user_like, created = UserLike.objects.get_or_create(
                article=self,
                user=user,
                defaults={}  # Don't include ip_address for authenticated users
            )
            
            if created:
                # First time this user liked this article - increment count
                Article.objects.filter(id=self.id).update(like_count=F('like_count') + 1)
                self.refresh_from_db(fields=['like_count'])
                return {
                    'liked': True,
                    'like_count': self.like_count,
                    'liked_by_user': True
                }
            else:
                # User already liked this article - unlike it
                user_like.delete()
                Article.objects.filter(id=self.id).update(like_count=F('like_count') - 1)
                self.refresh_from_db(fields=['like_count'])
                return {
                    'liked': False,
                    'like_count': self.like_count,
                    'liked_by_user': False
                }
        
        # For anonymous users, check IP address
        elif ip_address:
            # CRITICAL: Don't set user for anonymous users to avoid unique constraint conflicts
            user_like, created = UserLike.objects.get_or_create(
                article=self,
                ip_address=ip_address,
                defaults={}  # Don't include user for anonymous requests
            )
            
            if created:
                # First time this IP liked this article - increment count
                Article.objects.filter(id=self.id).update(like_count=F('like_count') + 1)
                self.refresh_from_db(fields=['like_count'])
                return {
                    'liked': True,
                    'like_count': self.like_count,
                    'liked_by_user': True
                }
            else:
                # IP already liked this article - unlike it
                user_like.delete()
                Article.objects.filter(id=self.id).update(like_count=F('like_count') - 1)
                self.refresh_from_db(fields=['like_count'])
                return {
                    'liked': False,
                    'like_count': self.like_count,
                    'liked_by_user': False
                }
        
        # No user or IP provided - can't track like state
        return {
            'liked': False,
            'like_count': self.like_count,
            'liked_by_user': False,
            'error': 'User or IP address required to like'
        }

    def increment_share_count(self, user=None, ip_address=None, platform='copy_link', user_agent=''):
        """
        Increment share count with anti-abuse / rate-limiting protection:
        1. Only published articles can be shared (status='published' AND is_published=True).
        2. Cooldown check: Prevents over share count (spam/hack) by checking if the same user
           or IP has shared this article recently (cooldown window: 24 hours).
        3. Rate-limit check: Limits global burst requests from a single IP (max 30 shares per hour).
        4. Platform logging: Records which platform was used (whatsapp, facebook, twitter, email, copy_link).
        
        Args:
            user: User object (optional, for authenticated users)
            ip_address: IP address string (optional, for tracking and anonymous users)
            platform: String platform name (default 'copy_link')
            user_agent: User-Agent string
            
        Returns:
            dict: {
                'shared': bool,
                'share_count': int,
                'share_recorded': bool,
                'message': str,
                'error': str (optional)
            }
        """
        from django.utils import timezone
        from datetime import timedelta
        
        # 1. CRITICAL: Only count shares for published articles
        if self.status != Article.STATUS_PUBLISHED or not self.is_published:
            return {
                'shared': False,
                'share_count': self.share_count,
                'share_recorded': False,
                'error': 'Article must be published to share'
            }
        
        # 2. Rate limit check: Maximum 30 shares per hour from the same IP (across all articles)
        if ip_address:
            one_hour_ago = timezone.now() - timedelta(hours=1)
            recent_shares_from_ip = ArticleShare.objects.filter(
                ip_address=ip_address,
                shared_at__gte=one_hour_ago
            ).count()
            if recent_shares_from_ip >= 30:
                return {
                    'shared': True,
                    'share_count': self.share_count,
                    'share_recorded': False,
                    'message': 'Rate limit exceeded. Please wait before sharing again.'
                }
        
        # 3. Cooldown check per article (24 hours window to prevent spamming share button)
        cooldown_window = timezone.now() - timedelta(hours=24)
        
        already_shared = False
        if user and user.is_authenticated:
            already_shared = ArticleShare.objects.filter(
                article=self,
                user=user,
                shared_at__gte=cooldown_window
            ).exists()
        elif ip_address:
            already_shared = ArticleShare.objects.filter(
                article=self,
                ip_address=ip_address,
                shared_at__gte=cooldown_window
            ).exists()
            
        if already_shared:
            return {
                'shared': True,
                'share_count': self.share_count,
                'share_recorded': False,
                'message': 'Share already recorded recently'
            }
            
        # 4. Valid share: Record to ArticleShare and increment share_count atomically
        clean_platform = (platform or 'copy_link')[:50].lower()
        ArticleShare.objects.create(
            article=self,
            user=user if (user and user.is_authenticated) else None,
            ip_address=ip_address,
            platform=clean_platform,
            user_agent=(user_agent or '')[:500]
        )
        
        Article.objects.filter(id=self.id).update(share_count=F('share_count') + 1)
        self.refresh_from_db(fields=['share_count'])
        
        return {
            'shared': True,
            'share_count': self.share_count,
            'share_recorded': True,
            'message': 'Share recorded successfully'
        }



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
        null=True,
        blank=True,
        help_text='File upload'
    )
    link_url = models.URLField(
        max_length=1000,
        null=True,
        blank=True,
        help_text='Link tautan file / dokumen eksternal'
    )
    original_filename = models.CharField(
        max_length=255,
        help_text='Original filename atau judul tautan'
    )
    file_size = models.BigIntegerField(default=0, help_text='Size in bytes')
    mime_type = models.CharField(max_length=100, default='', blank=True, help_text='MIME type')
    
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
    
    @property
    def is_link(self):
        return bool(self.link_url and not self.file)

    def __str__(self):
        return self.original_filename

# ============================================================================
# INFOGRAPHIC IMAGE (MULTI-IMAGE / BERANTAI) MODEL
# ============================================================================

class InfographicImage(models.Model):
    """
    Model untuk menyimpan rangkaian gambar infografis berantai (multi-slide/halaman).
    Mendukung urutan tampilan (order_index) dan keterangan tiap slide.
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='infographic_images',
        help_text='Artikel yang memiliki gambar infografis ini'
    )
    image = models.ImageField(
        upload_to='articles/infographics/%Y/%m/',
        null=True,
        blank=True,
        help_text='File visual infografis'
    )
    image_url = models.URLField(
        max_length=1000,
        null=True,
        blank=True,
        help_text='Tautan URL visual infografis (opsional)'
    )
    caption = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text='Judul atau keterangan slide/halaman infografis'
    )
    order_index = models.PositiveIntegerField(
        default=0,
        help_text='Urutan slide/halaman infografis (dimulai dari 0)'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'content_infographic_image'
        verbose_name = 'Infographic Image'
        verbose_name_plural = 'Infographic Images'
        ordering = ['order_index', 'id']

    def __str__(self):
        return f"{self.article.title_id} - Slide {self.order_index + 1}"

# ============================================================================
# ARTICLE VIEW TRACKING MODEL
# ============================================================================

# ============================================================================
# ARTICLE VIEW MODEL
# ============================================================================

class ArticleView(models.Model):
    """
    Track views per user/IP to prevent view count exploitation.
    One record = one user's one view of one article.
    Prevents the same user from inflating view counts by refreshing.
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='views',
        db_index=True,
        help_text='Artikel yang dilihat'
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='article_views',
        db_index=True,
        help_text='User yang melihat artikel (null untuk anonymous)'
    )
    
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='IP address dari viewer'
    )
    
    user_agent = models.TextField(
        blank=True,
        help_text='User agent string untuk identifikasi device'
    )
    
    viewed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text='Waktu view'
    )
    
    class Meta:
        db_table = 'content_article_view'
        verbose_name = 'Article View'
        verbose_name_plural = 'Article Views'
        # Composite index: one view per user per article
        # For authenticated users: check (article_id, user_id)
        # For anonymous users: check (article_id, ip_address)
        indexes = [
            models.Index(fields=['article', 'user']),
            models.Index(fields=['article', 'ip_address']),
            models.Index(fields=['article', 'viewed_at']),
            models.Index(fields=['viewed_at']),
        ]
        # Prevent duplicate views from same user/IP
        unique_together = [
            ('article', 'user'),  # One authenticated user = one view per article
            ('article', 'ip_address'),  # One IP address = one view per article (for anonymous)
        ]
    
    def __str__(self):
        viewer = self.user.username if self.user else self.ip_address
        return f"{self.article.title_id} - {viewer}"


# ============================================================================
# USER LIKE MODEL
# ============================================================================

class UserLike(models.Model):
    """
    Track likes per user/IP to prevent like count exploitation.
    One record = one user's like of one article.
    Supports toggling (liking again removes the like).
    Prevents the same user from inflating like counts.
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='user_likes',
        db_index=True,
        help_text='Artikel yang di-like'
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='article_likes',
        db_index=True,
        help_text='User yang like artikel (null untuk anonymous)'
    )
    
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='IP address dari liker'
    )
    
    liked_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text='Waktu like'
    )
    
    class Meta:
        db_table = 'content_user_like'
        verbose_name = 'User Like'
        verbose_name_plural = 'User Likes'
        # Composite index: one like per user per article
        # For authenticated users: check (article_id, user_id)
        # For anonymous users: check (article_id, ip_address)
        indexes = [
            models.Index(fields=['article', 'user']),
            models.Index(fields=['article', 'ip_address']),
            models.Index(fields=['article', 'liked_at']),
            models.Index(fields=['liked_at']),
        ]
        # Prevent duplicate likes from same user/IP
        unique_together = [
            ('article', 'user'),  # One authenticated user = one like per article
            ('article', 'ip_address'),  # One IP address = one like per article (for anonymous)
        ]
    
    def __str__(self):
        liker = self.user.username if self.user else self.ip_address
        return f"{self.article.title_id} - {liker}"


# ============================================================================
# ARTICLE SHARE MODEL
# ============================================================================

class ArticleShare(models.Model):
    """
    Track shares per user/IP and platform to prevent share count exploitation.
    Records each valid share event with platform and cooldown checking.
    Prevents the same user/IP from artificially inflating share counts.
    """
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='shares',
        db_index=True,
        help_text='Artikel yang dibagikan'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='article_shares',
        db_index=True,
        help_text='User yang membagikan artikel (null untuk anonymous)'
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='IP address dari pembagi'
    )
    platform = models.CharField(
        max_length=50,
        default='copy_link',
        help_text='Platform tujuan share (whatsapp, facebook, twitter, email, copy_link, dll)'
    )
    user_agent = models.TextField(
        blank=True,
        help_text='User agent string untuk identifikasi device'
    )
    shared_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text='Waktu share'
    )

    class Meta:
        db_table = 'content_article_share'
        verbose_name = 'Article Share'
        verbose_name_plural = 'Article Shares'
        indexes = [
            models.Index(fields=['article', 'user', 'shared_at']),
            models.Index(fields=['article', 'ip_address', 'shared_at']),
            models.Index(fields=['article', 'shared_at']),
            models.Index(fields=['shared_at']),
            models.Index(fields=['platform']),
        ]

    def __str__(self):
        sharer = self.user.username if self.user else (self.ip_address or 'Anonymous')
        return f"{self.article.title_id} - {sharer} ({self.platform})"