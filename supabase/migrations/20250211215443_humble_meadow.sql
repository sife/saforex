/*
  # Set up storage for profile avatars
  
  1. Changes
    - Create storage bucket for profile avatars
    - Set up RLS policies for secure access
  
  2. Security
    - Public read access for avatar images
    - User-specific write access
    - Bucket-level security
*/

-- Create the storage bucket for profiles
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the storage bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1]::uuid = auth.uid()
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1]::uuid = auth.uid()
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1]::uuid = auth.uid()
);