/*
  # Add Live Streaming Support

  1. New Tables
    - `live_streams`
      - `id` (uuid, primary key)
      - `title` (text)
      - `url` (text)
      - `thumbnail_url` (text, nullable)
      - `is_live` (boolean)
      - `viewers_count` (integer)
      - `started_at` (timestamptz)
      - `ended_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `live_streams` table
    - Add policies for:
      - Public viewing of active streams
      - Admin-only management of streams

  3. Indexes
    - Index on `is_live` for quick active stream lookups
    - Index on `started_at` for efficient sorting
*/

-- Create live_streams table
CREATE TABLE live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_live BOOLEAN DEFAULT false,
  viewers_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_live_streams_is_live ON live_streams(is_live);
CREATE INDEX idx_live_streams_started_at ON live_streams(started_at DESC);

-- Enable RLS
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active streams"
  ON live_streams FOR SELECT
  USING (is_live = true);

CREATE POLICY "Admins can manage streams"
  ON live_streams FOR ALL
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

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_live_streams_updated_at
  BEFORE UPDATE ON live_streams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();