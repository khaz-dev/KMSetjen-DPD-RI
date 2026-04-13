#!/usr/bin/env python
"""
Assign ADMIN role to khairilazmiashari@gmail.com user
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.core.models import User, Role

print("\n" + "="*70)
print("ASSIGNING ADMIN ROLE TO USER")
print("="*70)

# Find user
user = User.objects.filter(email='khairilazmiashari@gmail.com').first()

if not user:
    print("\n❌ User khairilazmiashari@gmail.com NOT FOUND in database")
    print("\nAvailable users:")
    for u in User.objects.all():
        print(f"  - {u.email}")
else:
    print(f"\n✓ Found user: {user.email}")
    print(f"  First name: {user.first_name}")
    print(f"  Last name: {user.last_name}")
    
    # Get admin role
    admin_role = Role.objects.get(code='admin')
    print(f"\n✓ Found role: {admin_role.code} ({admin_role.name_id})")
    
    # Check if already has admin role
    if user.roles.filter(code='admin').exists():
        print(f"\n⚠ User already has ADMIN role")
    else:
        # Assign role
        user.roles.add(admin_role)
        print(f"\n✓ Assigned {admin_role.code} role to {user.email}")
    
    # Show all roles
    user_roles = list(user.roles.values_list('code', flat=True))
    print(f"\n✓ User's current roles: {user_roles}")
    
print("\n" + "="*70)
print("DONE")
print("="*70 + "\n")
