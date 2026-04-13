#!/usr/bin/env python
import subprocess
import sys
import os

os.chdir('backend')

# Run dumpdata and get output
proc = subprocess.run(
    [sys.executable, 'manage.py', 'dumpdata', 'core.user', 'core.language', '--natural-primary', '--indent=2'],
    capture_output=True,
    text=True,
    encoding='utf-8'
)

# Write with clean UTF-8 (no BOM)
with open('users_only_export.json', 'w', encoding='utf-8') as f:
    f.write(proc.stdout)

# Verify
import json
try:
    with open('users_only_export.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    users = len([obj for obj in data if obj['model'] == 'core.user'])
    langs = len([obj for obj in data if obj['model'] == 'core.language'])
    print(f"✓ Export created: {len(data)} total objects")
    print(f"  - Users: {users}")
    print(f"  - Languages: {langs}")
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
