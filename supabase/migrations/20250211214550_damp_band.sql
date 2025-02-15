/*
  # Fix User Profile RLS Policies
  
  1. Changes
    - Drop existing RLS policies for users_profile
    - Add comprehensive RLS policies for profile management
    
  2. Security
    - Allow users to view and update their own profiles
    - Allow profile creation through the trigger
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON users_profile;

-- Create new policies
CREATE POLICY "Users can view their own profile"
ON users_profile FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON users_profile FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON users_profile FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow the trigger function to create profiles
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;

-- Ensure RLS is enabled
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;