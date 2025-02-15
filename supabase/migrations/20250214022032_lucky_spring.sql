/*
  # Add User Management Policies

  1. Changes
    - Add policies for admin users to manage other users
    - Add foreign key reference to auth.users
    - Add policies for viewing user profiles
*/

-- Add policies for admin users
CREATE POLICY "Admins can view all profiles"
ON users_profile FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can update user profiles"
ON users_profile FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Add foreign key reference to auth.users if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_profile_id_fkey'
  ) THEN
    ALTER TABLE users_profile
    ADD CONSTRAINT users_profile_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_admin
ON users_profile(is_admin);