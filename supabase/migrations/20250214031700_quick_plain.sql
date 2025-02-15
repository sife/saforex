-- Drop existing function if it exists
DROP FUNCTION IF EXISTS handle_new_user CASCADE;

-- Create a more robust user creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the new user profile if it doesn't exist
  INSERT INTO public.users_profile (
    id,
    email,
    created_at,
    is_admin,
    is_banned,
    last_login
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.created_at, now()),
    false,
    false,
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    last_login = now()
  WHERE users_profile.id = EXCLUDED.id;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create a function to handle login updates
CREATE OR REPLACE FUNCTION handle_user_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users_profile
  SET last_login = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger for login updates
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_login();

-- Ensure all existing auth users have profiles
INSERT INTO users_profile (id, email, created_at, last_login)
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Update RLS policies
DROP POLICY IF EXISTS "allow_public_read" ON users_profile;
DROP POLICY IF EXISTS "allow_self_update" ON users_profile;
DROP POLICY IF EXISTS "allow_system_insert" ON users_profile;
DROP POLICY IF EXISTS "allow_admin_all" ON users_profile;

-- Create new policies
CREATE POLICY "users_profile_select"
ON users_profile FOR SELECT
USING (
  id = auth.uid() 
  OR is_admin(auth.uid())
);

CREATE POLICY "users_profile_update"
ON users_profile FOR UPDATE
USING (
  id = auth.uid() 
  OR is_admin(auth.uid())
)
WITH CHECK (
  id = auth.uid() 
  OR is_admin(auth.uid())
);

CREATE POLICY "users_profile_insert"
ON users_profile FOR INSERT
WITH CHECK (true);

CREATE POLICY "users_profile_delete"
ON users_profile FOR DELETE
USING (is_admin(auth.uid()));

-- Ensure RLS is enabled
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;