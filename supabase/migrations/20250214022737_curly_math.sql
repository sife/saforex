/*
  # Fix User Management System

  1. Changes
    - Add email column to users_profile
    - Update RLS policies for user management
    - Add cascade delete trigger

  2. Security
    - Only admins can manage users
    - Proper RLS policies for user management
    - Secure deletion handling
*/

-- Add email column to users_profile if it doesn't exist
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update email values from auth.users
UPDATE users_profile up
SET email = au.email
FROM auth.users au
WHERE up.id = au.id
AND up.email IS NULL;

-- Create trigger to sync email from auth.users
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users_profile
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email sync
DROP TRIGGER IF EXISTS on_auth_user_email_update ON auth.users;
CREATE TRIGGER on_auth_user_email_update
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

-- Create trigger for cascade delete
CREATE OR REPLACE FUNCTION handle_deleted_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete from auth.users which will cascade to all related data
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for cascade delete
DROP TRIGGER IF EXISTS on_profile_delete ON users_profile;
CREATE TRIGGER on_profile_delete
  AFTER DELETE ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION handle_deleted_user();

-- Update RLS policies
DROP POLICY IF EXISTS "Public profile access" ON users_profile;
DROP POLICY IF EXISTS "Self profile update" ON users_profile;
DROP POLICY IF EXISTS "System profile creation" ON users_profile;
DROP POLICY IF EXISTS "Admin all access" ON users_profile;

-- Create new policies
CREATE POLICY "Users can view their own profile"
ON users_profile FOR SELECT
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Users can update their own profile"
ON users_profile FOR UPDATE
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "System can create profiles"
ON users_profile FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can delete profiles"
ON users_profile FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid() AND is_admin = true
  )
);