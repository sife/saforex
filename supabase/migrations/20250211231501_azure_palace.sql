/*
  # Fix content posts relationship with users profile

  1. Changes
    - Drop existing foreign key if it exists
    - Create new foreign key referencing auth.users instead of users_profile
    - Update RLS policies for content posts

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

-- Add the correct foreign key constraint to auth.users
ALTER TABLE content_posts
ADD CONSTRAINT content_posts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);

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