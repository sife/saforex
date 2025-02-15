/*
  # Fix admin policies to prevent recursion

  1. Changes
    - Remove recursive admin policies
    - Add new non-recursive admin policies
    - Update admin check function
    - Fix policy syntax

  2. Security
    - Maintain admin access control
    - Prevent infinite recursion
    - Keep existing security rules
*/

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Admins can manage all analyses" ON market_analysis;
DROP POLICY IF EXISTS "Admins can manage all signals" ON trading_signals;
DROP POLICY IF EXISTS "Admins can manage all events" ON economic_events;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON users_profile;
DROP POLICY IF EXISTS "Admin or owner can manage analyses" ON market_analysis;
DROP POLICY IF EXISTS "Admin or owner can manage signals" ON trading_signals;
DROP POLICY IF EXISTS "Admin can manage events" ON economic_events;
DROP POLICY IF EXISTS "Anyone can view events" ON economic_events;

-- Create a more efficient admin check function
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users_profile 
    WHERE id = user_id 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add new non-recursive policies for users_profile
CREATE POLICY "Users can view their own profile"
  ON users_profile FOR SELECT
  USING (
    id = auth.uid() 
    OR is_admin(auth.uid())
  );

CREATE POLICY "Users can update their own profile"
  ON users_profile FOR UPDATE
  USING (
    id = auth.uid() 
    OR is_admin(auth.uid())
  )
  WITH CHECK (
    id = auth.uid() 
    OR is_admin(auth.uid())
  );

-- Add new policies for market_analysis
CREATE POLICY "Admin or owner can manage analyses"
  ON market_analysis FOR ALL
  USING (
    user_id = auth.uid() 
    OR is_admin(auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid() 
    OR is_admin(auth.uid())
  );

-- Add new policies for trading_signals
CREATE POLICY "Admin or owner can manage signals"
  ON trading_signals FOR ALL
  USING (
    user_id = auth.uid() 
    OR is_admin(auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid() 
    OR is_admin(auth.uid())
  );

-- Add new policies for economic_events
CREATE POLICY "Admin can manage events"
  ON economic_events FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Add policy for public viewing of economic events
CREATE POLICY "Anyone can view events"
  ON economic_events FOR SELECT
  USING (true);