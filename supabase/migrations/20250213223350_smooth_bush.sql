/*
  # Add foreign key relationship between live_streams and users_profile

  1. Changes
    - Add foreign key constraint from live_streams to users_profile
    - Update existing foreign key to reference users_profile instead of auth.users

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper foreign key relationships
*/

-- First, drop the existing foreign key if it exists
ALTER TABLE live_streams
DROP CONSTRAINT IF EXISTS live_streams_user_id_fkey;

-- Add the new foreign key constraint to users_profile
ALTER TABLE live_streams
ADD CONSTRAINT live_streams_user_profile_fkey
FOREIGN KEY (user_id) REFERENCES users_profile(id);

-- Create index for the foreign key if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_live_streams_user_profile
ON live_streams(user_id);