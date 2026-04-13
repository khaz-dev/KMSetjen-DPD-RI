import subprocess
import json
import sys
import os

os.chdir('backend')

# Export full core app with natural primary keys
proc = subprocess.run(
    [sys.executable, 'manage.py', 'dumpdata', 'core', '--natural-primary', '--indent=2'],
    capture_output=True,
    text=True,
    encoding='utf-8'
)

# Write with clean UTF-8
with open('core_full_export.json', 'w', encoding='utf-8') as f:
    f.write(proc.stdout)

# Load and analyze
data = json.loads(proc.stdout)
roles = len([o for o in data if o['model'] == 'core.role'])
users = len([o for o in data if o['model'] == 'core.user'])
langs = len([o for o in data if o['model'] == 'core.language'])

print(f"✓ Full core export created:")
print(f"  - Roles: {roles}")
print(f"  - Users: {users}")
print(f"  - Languages: {langs}")
print(f"  - Total: {len(data)} objects")

# Check if roles are using natural keys
if roles > 0:
    role_sample = next((o for o in data if o['model'] == 'core.role'), None)
    if role_sample:
        print(f"\nSample role:")
        print(f"  pk field: {role_sample.get('pk')}")
        if isinstance(role_sample.get('pk'), list):
            print(f"  Using natural key: YES (pk={role_sample['pk']})")
        else:
            print(f"  Using natural key: NO (pk={role_sample['pk']})")
