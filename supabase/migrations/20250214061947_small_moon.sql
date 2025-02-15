-- Drop any existing auth functions to start fresh
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS handle_user_login CASCADE;

-- Create a robust user creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_role text := 'authenticated';
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

  -- Grant role to new user
  EXECUTE format(
    'GRANT %I TO auth_user_%s',
    default_role,
    replace(NEW.id::text, '-', '_')
  );
  
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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_login();

-- Ensure proper grants for auth
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON auth.users TO anon, authenticated;
GRANT SELECT ON auth.refresh_tokens TO authenticated;

-- Ensure proper grants for public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;

-- Grant select on public schema to anon
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

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

-- Ensure admin user exists
UPDATE users_profile
SET is_admin = true
WHERE email = 'sa_9_8@yahoo.com';