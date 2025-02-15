/*
  # Add media support to content posts

  1. Changes
    - Add media upload support to content_posts table
    - Add storage bucket for post media
    - Add RLS policies for media storage

  2. Security
    - Enable RLS for storage bucket
    - Add policies for media uploads
*/

-- Create storage bucket for post media
INSERT INTO storage.buckets (id, name, public)
VALUES ('post_media', 'post_media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the storage bucket
CREATE POLICY "Post media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post_media');

CREATE POLICY "Admins can upload post media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post_media' AND
  auth.uid() IN (
    SELECT id FROM users_profile WHERE is_admin = true
  )
);

CREATE POLICY "Admins can update post media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post_media' AND
  auth.uid() IN (
    SELECT id FROM users_profile WHERE is_admin = true
  )
);

CREATE POLICY "Admins can delete post media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post_media' AND
  auth.uid() IN (
    SELECT id FROM users_profile WHERE is_admin = true
  )
);