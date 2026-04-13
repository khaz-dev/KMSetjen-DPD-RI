import json

print("Creating import-friendly export...")

# Emails already on staging (to skip)
EXISTING_EMAILS = {'khairilazmiashari@gmail.com'}

# Read the full export
with open('backend/core_full_export.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Filter out users and roles, remove M2M role assignments
filtered = []
skipped_count = 0
for obj in data:
    if obj['model'] == 'core.role':
        # Skip all roles (they already exist on staging)
        continue
    elif obj['model'] == 'core.language':
        # Keep languages
        filtered.append(obj)
    elif obj['model'] == 'core.user':
        # Keep users but remove the roles M2M references
        email = obj['fields'].get('email', '')
        if email not in EXISTING_EMAILS:
            obj_copy = obj.copy()
            obj_copy['fields'] = obj['fields'].copy()
            obj_copy['fields']['roles'] = []  # Clear role assignments
            filtered.append(obj_copy)
        else:
            print(f"  Excluding existing user: {email}")
            skipped_count += 1

# Write filtered export
with open('backend/users_final_import.json', 'w', encoding='utf-8') as f:
    json.dump(filtered, f, indent=2, ensure_ascii=False)

users = len([o for o in filtered if o['model'] == 'core.user'])
print(f"✓ Created users_final_import.json")
print(f"  - Users to import: {users}")
print(f"  - Users excluded: {skipped_count}")
print(f"  - Total objects: {len(filtered)}")
print(f"\nAfter import, you can manually assign roles or use:")
print(f"  python manage.py assign_roles_from_nip")
