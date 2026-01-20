"""
Django admin configuration for core models.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role, Language


# ============================================================================
# ROLE ADMIN
# ============================================================================

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('code', 'name_id', 'name_en', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('code', 'name_id', 'name_en')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Identifikasi', {
            'fields': ('code', 'is_active')
        }),
        ('Nama & Deskripsi', {
            'fields': ('name_id', 'name_en', 'description_id', 'description_en')
        }),
        ('Permissions', {
            'fields': ('permissions',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ============================================================================
# LANGUAGE ADMIN
# ============================================================================

@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_default', 'is_active', 'created_at')
    list_filter = ('is_active', 'is_default', 'created_at')
    search_fields = ('code', 'name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Identifikasi', {
            'fields': ('code', 'name')
        }),
        ('Status', {
            'fields': ('is_default', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# ============================================================================
# USER ADMIN
# ============================================================================

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        'username', 'email', 'get_full_name', 'nip', 'department',
        'is_active', 'created_at'
    )
    list_filter = (
        'is_active', 'is_staff', 'is_superuser', 'is_sso_user',
        'department', 'created_at'
    )
    search_fields = ('username', 'email', 'first_name', 'last_name', 'nip')
    readonly_fields = ('created_at', 'updated_at', 'last_sso_login')
    
    fieldsets = (
        ('Identifikasi', {
            'fields': ('username', 'email', 'nip')
        }),
        ('Nama & Data Pribadi', {
            'fields': ('first_name', 'last_name', 'phone', 'avatar')
        }),
        ('Organisasi', {
            'fields': ('department',)
        }),
        ('Roles & Permissions', {
            'fields': ('roles', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Preferensi', {
            'fields': ('preferred_language', 'theme_mode'),
            'classes': ('collapse',)
        }),
        ('Autentikasi', {
            'fields': ('is_sso_user', 'last_sso_login', 'is_verified'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'last_login'),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ('roles', 'groups', 'user_permissions')
