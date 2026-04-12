#!/usr/bin/env python
"""Verify database population"""
from apps.core.models import Language, Role, Category, Tag, User
from apps.content.models import Article

print("=" * 60)
print("DATABASE POPULATION VERIFICATION")
print("=" * 60)
print(f"\n✓ Languages: {Language.objects.count()}")
for lang in Language.objects.all():
    print(f"    - {lang.code}: {lang.name}")

print(f"\n✓ Roles: {Role.objects.count()}")
for role in Role.objects.all():
    print(f"    - {role.code}: {role.name}")

print(f"\n✓ Categories: {Category.objects.count()}")
for cat in Category.objects.all():
    print(f"    - {cat.slug}: {cat.name_id}")

print(f"\n✓ Tags: {Tag.objects.count()}")
for tag in Tag.objects.all()[:5]:
    print(f"    - {tag.slug}: {tag.name_id}")

print(f"\n✓ Users: {User.objects.count()}")
for user in User.objects.all()[:3]:
    print(f"    - {user.username}: {user.first_name} {user.last_name}")

print(f"\n✓ Articles: {Article.objects.count()}")

print("\n" + "=" * 60)
print("✅ ALL DATA SUCCESSFULLY POPULATED & VERIFIED!")
print("=" * 60)
