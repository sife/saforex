/*
  # Update content posts constraints and policies

  1. Changes
    - Safely add foreign key constraint if it doesn't exist
    - Update RLS policies for content posts

  2. Security
    - Add policies for viewing and managing content posts
    - Ensure admin-only access for content management
*/

-- Safely add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  -- Check if the constraint doesn't exist before trying to add it
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'content_posts_user_id_fkey'
    AND table_name = 'content_posts'
  ) THEN
    ALTER TABLE content_posts
    ADD CONSTRAINT content_posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users_profile(id);
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view published content posts" ON content_posts;
DROP POLICY IF EXISTS "Admins can manage all content posts" ON content_posts;

-- Create new policies
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