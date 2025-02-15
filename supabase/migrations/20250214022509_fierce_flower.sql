/*
  # User Management System

  1. Changes
    - Add last_login column to users_profile
    - Add function to update last_login timestamp
    - Add trigger for updating last_login
    - Add policies for admin user management

  2. Security
    - Only admins can manage users
    - Proper RLS policies for user management
*/

-- Add last_login column if it doesn't exist
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Create function to update last_login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users_profile
  SET last_login = now()
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for last_login updates
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_last_login();

-- Add admin policies for user management
CREATE POLICY "Admins can manage users"
ON users_profile FOR ALL
USING (check_is_admin())
WITH CHECK (check_is_admin());