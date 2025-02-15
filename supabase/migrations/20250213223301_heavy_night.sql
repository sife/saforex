/*
  # Add user_id to live_streams table

  1. Changes
    - Add user_id column with foreign key constraint
    - Add index for faster lookups
    - Update RLS policies to include user_id checks
    - Set default admin user for existing streams

  2. Security
    - Enable RLS policies for user-based access control
    - Add policy for admins to manage all streams
    - Add policy for users to manage their own streams
*/

-- First, add the column as nullable
ALTER TABLE live_streams
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add index for faster lookups
CREATE INDEX idx_live_streams_user_id ON live_streams(user_id);

-- Update existing rows to have an admin user_id
UPDATE live_streams
SET user_id = (
  SELECT id FROM users_profile 
  WHERE is_admin = true 
  LIMIT 1
)
WHERE user_id IS NULL;

-- Now we can safely set the NOT NULL constraint
ALTER TABLE live_streams
ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policies to include user_id checks
DROP POLICY IF EXISTS "Admins can manage streams" ON live_streams;

CREATE POLICY "Admins can manage streams"
ON live_streams FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users_profile WHERE is_admin = true
  )
  OR auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users_profile WHERE is_admin = true
  )
  OR auth.uid() = user_id
);