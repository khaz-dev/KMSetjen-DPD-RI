#!/usr/bin/env python
"""
Backend startup script - ensures port 8002 is always used.
Run: python run_backend.py
"""
import os
import sys
import subprocess

# Set environment variables
os.environ['BACKEND_PORT'] = '8002'
os.environ['PYTHONUNBUFFERED'] = '1'

# Change to backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)

# Run Django development server with EXPLICIT port
cmd = [
    sys.executable,
    'manage.py',
    'runserver',
    '0.0.0.0:8002'  # EXPLICIT - Always 8002
]

print(f"\n{'=' * 70}")
print(f"Starting Django Backend on Port 8002")
print(f"{'=' * 70}")
print(f"Command: {' '.join(cmd)}")
print(f"Backend Port: 8002 (FIXED)")
print(f"URL: http://0.0.0.0:8002")
print(f"{'=' * 70}\n")

# Execute
sys.exit(subprocess.run(cmd).returncode)
