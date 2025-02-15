/*
  # Fix RLS Recursion Issues

  1. Changes
    - Remove recursive policies
    - Create efficient non-recursive policies
    - Add materialized admin check

  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Optimize policy performance
*/

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON users_profile;
DROP POLICY IF EXISTS "System can create profiles" ON users_profile;
DROP POLICY IF EXISTS "Admins can delete profiles" ON users_profile;

-- Create a materialized view for admin users to prevent recursion
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_users AS
SELECT id
FROM users_profile
WHERE is_admin = true;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_id_idx ON admin_users(id);

-- Create function to refresh admin users view
CREATE OR REPLACE FUNCTION refresh_admin_users()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_users;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to refresh admin users view
DROP TRIGGER IF EXISTS refresh_admin_users_trigger ON users_profile;
CREATE TRIGGER refresh_admin_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users_profile
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_admin_users();

-- Create new non-recursive policies
CREATE POLICY "View own profile or admin view all"
ON users_profile FOR SELECT
USING (
  id = auth.uid() OR 
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "Update own profile or admin update all"
ON users_profile FOR UPDATE
USING (
  id = auth.uid() OR 
  auth.uid() IN (SELECT id FROM admin_users)
)
WITH CHECK (
  id = auth.uid() OR 
  auth.uid() IN (SELECT id FROM admin_users)
);

CREATE POLICY "System insert profiles"
ON users_profile FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admin delete profiles"
ON users_profile FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM admin_users)
);

-- Refresh the materialized view initially
REFRESH MATERIALIZED VIEW admin_users;