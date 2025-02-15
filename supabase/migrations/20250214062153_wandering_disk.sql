-- Drop any existing auth functions to start fresh
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS handle_user_login CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;

-- Create a simplified admin check function
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(is_admin, false)
  FROM users_profile
  WHERE id = user_id;
$$;

-- Create a robust user creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the new user profile
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

-- Create a login update function
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

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_login();

-- Create proper RLS policies
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_read" ON users_profile;
DROP POLICY IF EXISTS "allow_update" ON users_profile;
DROP POLICY IF EXISTS "allow_insert" ON users_profile;
DROP POLICY IF EXISTS "allow_delete" ON users_profile;

CREATE POLICY "allow_read"
ON users_profile FOR SELECT
USING (true);

CREATE POLICY "allow_update"
ON users_profile FOR UPDATE
USING (auth.uid() = id OR is_admin(auth.uid()))
WITH CHECK (auth.uid() = id OR is_admin(auth.uid()));

CREATE POLICY "allow_insert"
ON users_profile FOR INSERT
WITH CHECK (true);

CREATE POLICY "allow_delete"
ON users_profile FOR DELETE
USING (is_admin(auth.uid()));

-- Ensure admin user exists and has proper permissions
UPDATE users_profile
SET is_admin = true
WHERE email = 'sa_9_8@yahoo.com';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_auth ON users_profile(id, is_admin);
CREATE INDEX IF NOT EXISTS idx_users_profile_email ON users_profile(email);