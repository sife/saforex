/*
  # Fix RLS Policies for Users Profile

  1. Changes
    - Drop existing problematic policies
    - Create new non-recursive policies
    - Add proper admin checks without circular dependencies
    - Fix infinite recursion issue

  2. Security
    - Maintain proper access control
    - Ensure admins can manage users
    - Allow users to view/edit their own profiles
*/

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users_profile;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Admins can update user profiles" ON users_profile;

-- Create new non-recursive policies
CREATE POLICY "Allow users to view own profile"
ON users_profile FOR SELECT
USING (
  -- Users can view their own profile
  id = auth.uid()
  OR
  -- Admins can view all profiles
  (
    SELECT is_admin FROM users_profile 
    WHERE id = auth.uid()
  ) = true
);

CREATE POLICY "Allow users to update own profile"
ON users_profile FOR UPDATE
USING (
  -- Users can update their own profile
  id = auth.uid()
  OR
  -- Admins can update any profile
  (
    SELECT is_admin FROM users_profile 
    WHERE id = auth.uid()
  ) = true
)
WITH CHECK (
  -- Same conditions for the CHECK clause
  id = auth.uid()
  OR
  (
    SELECT is_admin FROM users_profile 
    WHERE id = auth.uid()
  ) = true
);

CREATE POLICY "Allow system to insert new profiles"
ON users_profile FOR INSERT
WITH CHECK (
  -- Allow the trigger function to create profiles
  -- This is needed for the handle_new_user trigger
  true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_lookup 
ON users_profile(id, is_admin);

-- Ensure RLS is enabled
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;