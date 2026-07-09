#!/usr/bin/env python
"""
Script to list all users and their roles in the KMS system
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.core.models import User, Role

print("="*100)
print("KMS SYSTEM - USER & ROLE INVENTORY")
print("="*100)
print()

# Get all users
users = User.objects.all().select_related().prefetch_related('roles')

print(f"TOTAL USERS IN SYSTEM: {users.count()}")
print()

if users.count() == 0:
    print("⚠️  No users found in the system.")
else:
    print(f"{'ID':<5} | {'Username':<20} | {'Email':<30} | {'Full Name':<30} | {'Roles':<50} | {'Active':<8} | {'SSO':<6}")
    print("-" * 185)
    
    for user in users:
        roles_list = [r.code.upper() for r in user.roles.all()]
        roles_display = ', '.join(roles_list) if roles_list else 'NONE'
        is_sso = 'YES' if user.is_sso_user else 'NO'
        is_active = 'YES' if user.is_active else 'NO'
        full_name = user.get_full_name() or '(No Name)'
        
        print(f"{user.id:<5} | {user.username:<20} | {user.email:<30} | {full_name:<30} | {roles_display:<50} | {is_active:<8} | {is_sso:<6}")

print()
print("="*100)
print("DETAILED USER INFORMATION")
print("="*100)
print()

for user in users:
    print(f"User #{user.id}: {user.username}")
    print(f"  Email: {user.email}")
    print(f"  Full Name: {user.get_full_name()}")
    print(f"  Department: {user.department or 'N/A'}")
    print(f"  NIP: {user.nip or 'N/A'}")
    print(f"  Phone: {user.phone or 'N/A'}")
    print(f"  Active: {user.is_active}")
    print(f"  Staff: {user.is_staff}")
    print(f"  Superuser: {user.is_superuser}")
    print(f"  SSO User: {user.is_sso_user}")
    print(f"  Email Verified: {user.is_verified}")
    print(f"  Preferred Language: {user.preferred_language}")
    print(f"  Theme Mode: {user.theme_mode}")
    print(f"  Created: {user.date_joined}")
    print(f"  Updated: {user.updated_at}")
    
    roles = user.roles.all()
    if roles.exists():
        print(f"  Roles ({roles.count()}):")
        for role in roles:
            print(f"    - {role.code.upper()}: {role.name_en}")
    else:
        print(f"  Roles: NONE")
    
    primary_role = user.get_primary_role()
    if primary_role:
        print(f"  Primary Role: {primary_role.code.upper()}")
    
    print()

print("="*100)
print("ROLE DEFINITIONS")
print("="*100)
print()

roles = Role.objects.all()
print(f"TOTAL ROLES DEFINED: {roles.count()}")
print()

for role in roles:
    user_count = role.users.count()
    print(f"Role: {role.code.upper()}")
    print(f"  Name (Indonesian): {role.name_id}")
    print(f"  Name (English): {role.name_en}")
    print(f"  Description (ID): {role.description_id or 'N/A'}")
    print(f"  Description (EN): {role.description_en or 'N/A'}")
    print(f"  Users with this role: {user_count}")
    print(f"  Active: {'YES' if role.is_active else 'NO'}")
    
    if user_count > 0:
        users_with_role = role.users.all()
        print(f"  Users: {', '.join([u.username for u in users_with_role])}")
    
    print()

print("="*100)
print("ROLE HIERARCHY & PERMISSIONS")
print("="*100)
print()

print("Role Priority (highest to lowest privileges):")
print("  1. ADMIN       - Full system access, can manage users and all content")
print("  2. EDITOR      - Can manage all content and publish articles")
print("  3. CONTRIBUTOR- Can create and edit own content")
print("  4. READER      - Read-only access (ASN staff)")
print("  5. PUBLIC      - Public read-only access")
print()

print("="*100)
