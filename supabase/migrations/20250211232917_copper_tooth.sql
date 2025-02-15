/*
  # Add media support to market analysis

  1. Changes
    - Add media support to market_analysis table
    - Add storage bucket for analysis media
    - Add RLS policies for media storage

  2. Security
    - Enable RLS for storage bucket
    - Add policies for media uploads
*/

-- Add media columns to market_analysis
ALTER TABLE market_analysis
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video', 'link')),
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Create storage bucket for analysis media
INSERT INTO storage.buckets (id, name, public)
VALUES ('analysis_media', 'analysis_media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the storage bucket
CREATE POLICY "Analysis media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'analysis_media');

CREATE POLICY "Users can upload analysis media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'analysis_media');

CREATE POLICY "Users can update their analysis media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'analysis_media');

CREATE POLICY "Users can delete their analysis media"
ON storage.objects FOR DELETE
USING (bucket_id = 'analysis_media');