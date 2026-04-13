#!/usr/bin/env python
"""
Create merge export by filtering out existing staging users
"""
import json
import sys

print("Creating merge export...")

# Emails to skip (from staging)
skip_emails = {'khairilazmiashari@gmail.com'}

# Read local export
with open('backend/users_only_export.json', 'r', encoding='utf-8') as f:
    all_data = json.load(f)

# Filter new users
filtered_data = []
skipped = 0
included = 0

for obj in all_data:
    if obj['model'] == 'core.user':
        email = obj['fields'].get('email', '')
        if email not in skip_emails:
            filtered_data.append(obj)
            included += 1
        else:
            print(f"  Skipping existing user: {email}")
            skipped += 1
    else:
        # Keep language data
        filtered_data.append(obj)

# Write merge export
with open('backend/users_merge_export.json', 'w', encoding='utf-8') as f:
    json.dump(filtered_data, f, indent=2, ensure_ascii=False)

print(f"\n✓ Merge export created:")
print(f"  - New users to import: {included}")
print(f"  - Existing users (skipped): {skipped}")
print(f"  - Total objects: {len(filtered_data)}")
print(f"\nFile: backend/users_merge_export.json")
