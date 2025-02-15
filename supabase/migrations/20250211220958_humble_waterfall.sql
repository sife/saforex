/*
  # Add admin role to users

  1. Changes
    - Add `is_admin` column to users_profile table
    - Set sa_9_8@yahoo.com as admin
    - Add admin RLS policies

  2. Security
    - Only admins can access admin features
    - Admins have full access to all tables
*/

-- Add is_admin column to users_profile
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Set the specified user as admin
UPDATE users_profile
SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email = 'sa_9_8@yahoo.com'
);

-- Add admin policies to users_profile
CREATE POLICY "Admins can view all profiles"
  ON users_profile FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users_profile WHERE is_admin = true
    )
  );

-- Add admin policies to market_analysis
CREATE POLICY "Admins can manage all analyses"
  ON market_analysis FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users_profile WHERE is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users_profile WHERE is_admin = true
    )
  );

-- Add admin policies to trading_signals
CREATE POLICY "Admins can manage all signals"
  ON trading_signals FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users_profile WHERE is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users_profile WHERE is_admin = true
    )
  );

-- Add admin policies to economic_events
CREATE POLICY "Admins can manage all events"
  ON economic_events FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users_profile WHERE is_admin = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users_profile WHERE is_admin = true
    )
  );

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;