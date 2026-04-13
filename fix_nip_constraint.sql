-- Fix NIP unique constraint to allow NULL values
-- PostgreSQL by default allows multiple NULLs in unique columns, but
-- the constraint on auth_user.nip might have been created incorrectly

-- Drop and recreate the nip unique constraint to properly handle NULLs
ALTER TABLE auth_user DROP CONSTRAINT IF EXISTS auth_user_nip_key CASCADE;

-- Create a partial unique index that excludes NULL values
CREATE UNIQUE INDEX IF NOT EXISTS auth_user_nip_key ON auth_user(nip) WHERE nip IS NOT NULL AND nip != '';

-- Verify constraints
SELECT constraint_name, constraint_type FROM information_schema.table_constraints 
WHERE table_name='auth_user' AND constraint_type='UNIQUE'
ORDER BY constraint_name;
