"""
Core models: User, Role, Language
"""
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


# ============================================================================
# ROLE MODEL
# ============================================================================

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
    
    code = models.CharField(
        max_length=50,
        unique=True,
        help_text='Unique code untuk role (e.g., ADMIN, EDITOR, or custom codes)'
    )
    name_id = models.CharField(max_length=100, help_text='Nama role dalam Bahasa Indonesia')
    name_en = models.CharField(max_length=100, help_text='Nama role dalam English')
    
    description_id = models.TextField(
        blank=True,
        help_text='Deskripsi role dalam Bahasa Indonesia'
    )
    description_en = models.TextField(
        blank=True,
        help_text='Deskripsi role dalam English'
    )
    
    # Permissions as JSON array (extension point)
    permissions = models.JSONField(
        default=list,
        blank=True,
        help_text='List of permissions for this role'
    )
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'auth_role'
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name_id}"


# ============================================================================
# LANGUAGE MODEL
# ============================================================================

class Language(models.Model):
    """
    Supported languages in the system.
    """
    code = models.CharField(
        max_length=5,
        unique=True,
        choices=[('id', 'Bahasa Indonesia'), ('en', 'English')],
        help_text='Language code (e.g., id, en)'
    )
    name = models.CharField(max_length=100, help_text='Language name')
    is_default = models.BooleanField(default=False, help_text='Default language?')
    is_active = models.BooleanField(default=True, help_text='Is this language active?')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'content_language'
        verbose_name = 'Language'
        verbose_name_plural = 'Languages'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


# ============================================================================
# USER MODEL
# ============================================================================

class User(AbstractUser):
    """
    Extended Django User model.
    Supports both SSO and local authentication.
    """
    
    # Government ID
    nip = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        db_index=True,
        help_text='Nomor Induk Pegawai (ASN ID)'
    )
    
    # Profile
    department = models.CharField(
        max_length=255,
        blank=True,
        help_text='Unit kerja / Bagian'
    )
    phone = models.CharField(max_length=20, blank=True, help_text='Nomor telepon')
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        help_text='Photo profil'
    )
    
    # Organization & Position
    jenis_jabatan = models.CharField(
        max_length=100,
        blank=True,
        help_text='Jenis/Kategori Jabatan (e.g., Tenaga Ahli, Staff, Pimpinan)'
    )
    unit_organisasi = models.CharField(
        max_length=255,
        blank=True,
        help_text='Unit/Divisi Organisasi (e.g., Setjen, Bagian IT)'
    )
    jabatan = models.CharField(
        max_length=255,
        blank=True,
        help_text='Posisi/Jabatan (e.g., Kepala Bagian, Analyst IT)'
    )
    
    # Auth tracking
    is_sso_user = models.BooleanField(
        default=False,
        help_text='Apakah user login melalui SSO?'
    )
    last_sso_login = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Last SSO login timestamp'
    )
    
    # Roles (M2M with Role)
    roles = models.ManyToManyField(
        Role,
        related_name='users',
        blank=True,
        help_text='Roles yang dimiliki user'
    )
    
    # Localization preferences
    preferred_language = models.CharField(
        max_length=5,
        default='id',
        choices=[('id', 'Bahasa Indonesia'), ('en', 'English')],
        help_text='Preferred language'
    )
    theme_mode = models.CharField(
        max_length=10,
        default='light',
        choices=[('light', 'Light'), ('dark', 'Dark'), ('auto', 'Auto')],
        help_text='Preferred theme'
    )
    
    # Metadata
    is_verified = models.BooleanField(default=False, help_text='Email verified?')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['nip']),
            models.Index(fields=['department']),
            models.Index(fields=['is_active']),
            models.Index(fields=['email']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['email'],
                name='unique_email',
                condition=models.Q(email__isnull=False),
                violation_error_message='Email must be unique'
            ),
        ]
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.username})"
    
    # ========================================================================
    # ROLE & PERMISSION METHODS
    # ========================================================================
    
    def get_primary_role(self):
        """
        Return highest privilege role for this user.
        Priority: ADMIN > EDITOR > CONTRIBUTOR > READER > PUBLIC
        """
        role_priority = {
            Role.ADMIN: 1,
            Role.EDITOR: 2,
            Role.CONTRIBUTOR: 3,
            Role.READER: 4,
            Role.PUBLIC: 5,
        }
        roles = self.roles.all()
        if not roles:
            return None
        return min(roles, key=lambda r: role_priority.get(r.code, 999))
    
    def has_role(self, role_code: str) -> bool:
        """Check if user has a specific role."""
        return self.roles.filter(code=role_code).exists()
    
    def is_admin(self) -> bool:
        """Check if user is admin."""
        return self.has_role(Role.ADMIN) or self.is_superuser
    
    def is_editor(self) -> bool:
        """Check if user is editor or higher."""
        return self.has_role(Role.EDITOR) or self.is_admin()
    
    def is_contributor(self) -> bool:
        """Check if user is contributor or higher."""
        return self.has_role(Role.CONTRIBUTOR) or self.is_editor()
    
    def is_reader(self) -> bool:
        """Check if user is reader (ASN) or higher."""
        return self.has_role(Role.READER) or self.is_contributor()
    
    def can_create_content(self) -> bool:
        """Check if user can create content."""
        return self.is_contributor()
    
    def can_edit_article(self, article=None) -> bool:
        """Check if user can edit article (own or any if editor)."""
        if self.is_editor():
            return True
        if article and article.author_id == self.id:
            return self.is_contributor()
        return False
    
    def can_publish_article(self) -> bool:
        """Check if user can publish articles."""
        return self.is_editor()
    
    def can_manage_users(self) -> bool:
        """Check if user can manage users (admin only)."""
        return self.is_admin()
