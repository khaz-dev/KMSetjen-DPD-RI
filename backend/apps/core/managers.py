"""
Core app managers and utilities.
"""
from django.db import models


class RoleManager(models.Manager):
    """Custom manager for Role model."""
    
    def get_by_code(self, code):
        """Get role by code."""
        return self.get(code=code)
    
    def get_admin_role(self):
        """Get admin role."""
        return self.get_by_code('admin')
    
    def get_editor_role(self):
        """Get editor role."""
        return self.get_by_code('editor')
    
    def get_contributor_role(self):
        """Get contributor role."""
        return self.get_by_code('contributor')
    
    def get_reader_role(self):
        """Get reader role."""
        return self.get_by_code('reader')
    
    def get_public_role(self):
        """Get public role."""
        return self.get_by_code('public')


class LanguageManager(models.Manager):
    """Custom manager for Language model."""
    
    def get_default(self):
        """Get default language."""
        return self.get(is_default=True)
    
    def get_active(self):
        """Get all active languages."""
        return self.filter(is_active=True)
    
    def get_indonesian(self):
        """Get Indonesian language."""
        return self.get(code='id')
    
    def get_english(self):
        """Get English language."""
        return self.get(code='en')
