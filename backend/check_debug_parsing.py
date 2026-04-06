#!/usr/bin/env python
"""Check if environ is parsing DEBUG correctly"""
import os
os.chdir(r'd:\Project\KMSetjen DPD RI\backend')

# Read .env file like Django settings does
from pathlib import Path
import environ

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
env = environ.Env()
# Load .env from project root
env_file = os.path.join(PROJECT_ROOT, '.env')

print(f"__file__:              {__file__}")
print(f"BASE_DIR:              {BASE_DIR}")
print(f"PROJECT_ROOT:          {PROJECT_ROOT}")
print(f"env_file:              {env_file}")
print(f".env exists:           {os.path.exists(env_file)}")

# List files in PROJECT_ROOT
print(f"\nFiles in PROJECT_ROOT:")
try:
    for f in os.listdir(PROJECT_ROOT):
        if os.path.isfile(os.path.join(PROJECT_ROOT, f)):
            print(f"  {f}")
except Exception as e:
    print(f"  Error: {e}")

# Check if .env file content
if os.path.exists(env_file):
    print(f"\nFirst 10 lines of .env:")
    with open(env_file, 'r') as f:
        for i, line in enumerate(f):
            if i < 10:
                print(f"  {line.rstrip()}")
            else:
                break

# Now try to read .env
print(f"\nReading .env...")
environ.Env.read_env(env_file)

# Read DEBUG value
debug_str = env('DEBUG', default='not_found')
debug_bool = env.bool('DEBUG', default=True)

print(f"\nDEBUG value (string):  {repr(debug_str)}")
print(f"DEBUG value (bool):    {repr(debug_bool)}")
