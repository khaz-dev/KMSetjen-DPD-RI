"""
Core app signals.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from .models import User, Role


@receiver(post_save, sender=User)
def assign_default_role(sender, instance, created, **kwargs):
    """
    Assign default PUBLIC role to new users.
    """
    if created and not instance.roles.exists():
        try:
            public_role = Role.objects.get(code=Role.PUBLIC)
            instance.roles.add(public_role)
        except Role.DoesNotExist:
            pass


@receiver(post_save, sender=Role)
def sync_role_with_group(sender, instance, created, **kwargs):
    """
    Keep Django groups in sync with custom roles (optional).
    """
    group, _ = Group.objects.get_or_create(name=instance.code)
    # Optionally: sync permissions
    pass
