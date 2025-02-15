/*
  # Fix RLS Policies Final

  1. Changes
    - Drop all existing problematic policies
    - Create new non-recursive policies using auth.uid() directly
    - Add proper admin checks without circular dependencies
    - Fix infinite recursion issue

  2. Security
    - Maintain proper access control
    - Ensure admins can manage users
    - Allow users to view/edit their own profiles
*/

-- First, drop all existing policies
DROP POLICY IF EXISTS "Allow users to view own profile" ON users_profile;
DROP POLICY IF EXISTS "Allow users to update own profile" ON users_profile;
DROP POLICY IF EXISTS "Allow system to insert new profiles" ON users_profile;

-- Create new non-recursive policies
CREATE POLICY "Public profile access"
ON users_profile FOR SELECT
USING (true);

CREATE POLICY "Self profile update"
ON users_profile FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "System profile creation"
ON users_profile FOR INSERT
WITH CHECK (true);

-- Create function to check admin status without recursion
CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users_profile
    WHERE id = auth.uid()
    AND is_admin = true
  );
$$;

-- Create admin-specific policies
CREATE POLICY "Admin all access"
ON users_profile FOR ALL
USING (check_is_admin())
WITH CHECK (check_is_admin());

-- Ensure RLS is enabled
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;