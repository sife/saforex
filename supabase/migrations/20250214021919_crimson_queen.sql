/*
  # Add is_banned column to users_profile

  1. Changes
    - Add is_banned column to users_profile table with default value false
    - Add index for faster lookups
*/

-- Add is_banned column if it doesn't exist
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Create index for is_banned column
CREATE INDEX IF NOT EXISTS idx_users_profile_is_banned
ON users_profile(is_banned);