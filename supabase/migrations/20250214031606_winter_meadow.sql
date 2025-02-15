-- First, create the new admin check function with a different name
CREATE OR REPLACE FUNCTION is_admin_v2(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
STABLE
AS $$
DECLARE
  admin_status boolean;
BEGIN
  SELECT is_admin INTO admin_status
  FROM users_profile
  WHERE id = user_id;
  RETURN COALESCE(admin_status, false);
END;
$$;

-- Update existing policies to use the new function
ALTER POLICY "Admin or owner can manage analyses" ON market_analysis
USING (user_id = auth.uid() OR is_admin_v2(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin_v2(auth.uid()));

ALTER POLICY "Admin or owner can manage signals" ON trading_signals
USING (user_id = auth.uid() OR is_admin_v2(auth.uid()))
WITH CHECK (user_id = auth.uid() OR is_admin_v2(auth.uid()));

ALTER POLICY "Admin can manage events" ON economic_events
USING (is_admin_v2(auth.uid()))
WITH CHECK (is_admin_v2(auth.uid()));

-- Now we can safely drop the old function and policies
DROP POLICY IF EXISTS "users_profile_select" ON users_profile;
DROP POLICY IF EXISTS "users_profile_update" ON users_profile;
DROP POLICY IF EXISTS "users_profile_insert" ON users_profile;
DROP POLICY IF EXISTS "users_profile_delete" ON users_profile;
DROP FUNCTION IF EXISTS is_admin;

-- Rename the new function to the original name
ALTER FUNCTION is_admin_v2(uuid) RENAME TO is_admin;

-- Create simpler, non-recursive policies
CREATE POLICY "allow_public_read"
ON users_profile FOR SELECT
USING (true);

CREATE POLICY "allow_self_update"
ON users_profile FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_system_insert"
ON users_profile FOR INSERT
WITH CHECK (true);

CREATE POLICY "allow_admin_all"
ON users_profile FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_profile_auth ON users_profile(id, is_admin);
CREATE INDEX IF NOT EXISTS idx_users_profile_email ON users_profile(email);

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure RLS is enabled
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;