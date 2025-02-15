-- First, drop all existing policies and views
DROP POLICY IF EXISTS "View own profile or admin view all" ON users_profile;
DROP POLICY IF EXISTS "Update own profile or admin update all" ON users_profile;
DROP POLICY IF EXISTS "System insert profiles" ON users_profile;
DROP POLICY IF EXISTS "Admin delete profiles" ON users_profile;
DROP MATERIALIZED VIEW IF EXISTS admin_users;
DROP TRIGGER IF EXISTS refresh_admin_users_trigger ON users_profile;
DROP FUNCTION IF EXISTS refresh_admin_users();

-- Create a simpler, non-recursive approach for admin checks
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users_profile
    WHERE id = user_id
    AND is_admin = true
  );
$$;

-- Create new policies using the is_admin function
CREATE POLICY "users_profile_select"
ON users_profile FOR SELECT
USING (
  id = auth.uid() OR is_admin(auth.uid())
);

CREATE POLICY "users_profile_update"
ON users_profile FOR UPDATE
USING (
  id = auth.uid() OR is_admin(auth.uid())
)
WITH CHECK (
  id = auth.uid() OR is_admin(auth.uid())
);

CREATE POLICY "users_profile_insert"
ON users_profile FOR INSERT
WITH CHECK (true);

CREATE POLICY "users_profile_delete"
ON users_profile FOR DELETE
USING (is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_admin ON users_profile(id) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_users_profile_banned ON users_profile(id) WHERE is_banned = true;

-- Ensure RLS is enabled
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;