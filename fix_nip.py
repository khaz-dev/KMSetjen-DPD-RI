#!/usr/bin/env python
from django.db import connection

with connection.cursor() as cursor:
    # Drop the problematic constraint
    print("Dropping old NIP constraint...")
    cursor.execute("ALTER TABLE auth_user DROP CONSTRAINT IF EXISTS auth_user_nip_key CASCADE")
    
    # Create a partial unique index that allows NULL and empty strings
    print("Creating partial unique index for NIP...")
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS auth_user_nip_key ON auth_user(nip) WHERE nip IS NOT NULL AND nip != ''")
    
    print("✓ NIP constraint fixed - now allows multiple NULL/empty NIP values")

connection.close()
