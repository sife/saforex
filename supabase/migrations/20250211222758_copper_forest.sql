/*
  # Add Admin User

  1. Changes
    - Set admin privileges for user with email sa_9_8@yahoo.com
  
  2. Security
    - Updates users_profile table to grant admin access
    - Only affects the specified user
*/

-- Update the users_profile table to set admin privileges for the specified user
UPDATE users_profile
SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email = 'sa_9_8@yahoo.com'
);