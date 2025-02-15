/*
  # Add username field to user profile

  1. Changes
    - Add username column to users_profile table
    - Add unique constraint for username
    - Add username validation check (min 4 chars)

  2. Security
    - Maintain existing RLS policies
*/

-- Add username column with validation
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD CONSTRAINT username_length_check CHECK (length(username) >= 4);

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_username 
ON users_profile(username);