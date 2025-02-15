/*
  # Fix content posts and users profile relationship

  1. Changes
    - Drop existing foreign key if it exists
    - Create a new foreign key from content_posts to auth.users
    - Add a foreign key from content_posts to users_profile
    - Update RLS policies

  2. Security
    - Maintain RLS policies for content posts
    - Ensure admin-only access for content management
*/

-- First, drop the existing foreign key if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'content_posts_user_id_fkey'
    AND table_schema = 'public'
    AND table_name = 'content_posts'
  ) THEN
    ALTER TABLE content_posts DROP CONSTRAINT content_posts_user_id_fkey;
  END IF;
END $$;

-- Add the foreign key to auth.users
ALTER TABLE content_posts
ADD CONSTRAINT content_posts_auth_user_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Add the foreign key to users_profile
ALTER TABLE content_posts
ADD CONSTRAINT content_posts_user_profile_fkey
FOREIGN KEY (user_id) REFERENCES users_profile(id);

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view published content posts" ON content_posts;
DROP POLICY IF EXISTS "Admins can manage all content posts" ON content_posts;

-- Recreate policies
CREATE POLICY "Anyone can view published content posts"
ON content_posts FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins can manage all content posts"
ON content_posts FOR ALL
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

-- Enable RLS
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;