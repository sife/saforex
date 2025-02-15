/*
  # Add new fields to trading_signals table

  1. New Fields
    - description: Optional text for signal description (max 500 chars)
    - image_url: Optional URL for signal image
    - targets: Array of text for signal targets
    - likes_count: Counter for signal likes

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns
ALTER TABLE trading_signals
ADD COLUMN IF NOT EXISTS description TEXT CHECK (length(description) <= 500),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS targets TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create storage bucket for signal images
INSERT INTO storage.buckets (id, name, public)
VALUES ('signal_images', 'signal_images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the storage bucket
CREATE POLICY "Signal images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'signal_images');

CREATE POLICY "Users can upload signal images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'signal_images');

CREATE POLICY "Users can update their signal images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'signal_images');

CREATE POLICY "Users can delete their signal images"
ON storage.objects FOR DELETE
USING (bucket_id = 'signal_images');

-- Create signal_likes table
CREATE TABLE IF NOT EXISTS signal_likes (
  signal_id UUID REFERENCES trading_signals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users_profile(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (signal_id, user_id)
);

-- Enable RLS on signal_likes
ALTER TABLE signal_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for signal_likes
CREATE POLICY "Anyone can view likes"
ON signal_likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can like/unlike"
ON signal_likes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_signal_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE trading_signals
    SET likes_count = likes_count + 1
    WHERE id = NEW.signal_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE trading_signals
    SET likes_count = likes_count - 1
    WHERE id = OLD.signal_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for likes count
CREATE TRIGGER update_signal_likes_count
AFTER INSERT OR DELETE ON signal_likes
FOR EACH ROW
EXECUTE FUNCTION update_signal_likes_count();