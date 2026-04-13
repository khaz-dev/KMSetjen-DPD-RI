#!/usr/bin/env python
"""
Smart merge import script for users
- Reads export JSON
- Queries staging DB for existing emails
- Filters and imports only new users
"""
import subprocess
import sys
import json
import os

os.chdir('backend')

# Step 1: Get list of existing emails from staging
print("[1/3] Querying staging database for existing users...")
try:
    result = subprocess.run(
        ['python', 'manage.py', 'shell'],
        input='from django.contrib.auth import get_user_model;User=get_user_model();print("\\n".join([str(u.email) for u in User.objects.all()]))',
        capture_output=True,
        text=True,
        encoding='utf-8'
    )
    
    existing_emails_local = set(result.stdout.strip().split('\n')) if result.stdout.strip() else set()
    print(f"   Found {len(existing_emails_local)} existing users in LOCAL database")
except Exception as e:
    print(f"   Warning: Could not query local DB: {e}")
    existing_emails_local = set()

# Step 2: Read export and filter out existing users
print("[2/3] Reading export and filtering new users...")
with open('users_only_export.json', 'r', encoding='utf-8') as f:
    all_data = json.load(f)

new_data = []
user_count = 0
skipped_count = 0

for obj in all_data:
    if obj['model'] == 'core.user':
        email = obj['fields'].get('email', '')
        if email not in existing_emails_local:
            new_data.append(obj)
            user_count += 1
        else:
            skipped_count += 1
    else:
        # Keep all languages and other objects
        new_data.append(obj)

print(f"   Total objects: {len(all_data)}")
print(f"   New users to import: {user_count}")
print(f"   Existing users (will skip): {skipped_count}")

# Step 3: Write filtered export
print("[3/3] Creating merge export...")
with open('users_merge_export.json', 'w', encoding='utf-8') as f:
    json.dump(new_data, f, indent=2, ensure_ascii=False)

print(f"   ✓ Created: users_merge_export.json ({len(new_data)} objects)")
print(f"\nNext: python manage.py loaddata users_merge_export.json")
