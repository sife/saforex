/*
  # Market Analysis Schema

  1. New Tables
    - `market_analysis`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `content` (text)
      - `instrument` (text)
      - `direction` (enum: buy, sell)
      - `entry_price` (decimal)
      - `stop_loss` (decimal)
      - `take_profit` (decimal)
      - `status` (enum: draft, published, archived)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `likes_count` (integer)
      - `views_count` (integer)
    
    - `analysis_likes`
      - `analysis_id` (uuid, references market_analysis)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Market Analysis Table
CREATE TABLE market_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  instrument TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('buy', 'sell')),
  entry_price DECIMAL,
  stop_loss DECIMAL,
  take_profit DECIMAL,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0
);

-- Analysis Likes Table
CREATE TABLE analysis_likes (
  analysis_id UUID REFERENCES market_analysis(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (analysis_id, user_id)
);

-- Enable RLS
ALTER TABLE market_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for market_analysis
CREATE POLICY "Anyone can view published analyses"
  ON market_analysis FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can create analyses"
  ON market_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
  ON market_analysis FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for analysis_likes
CREATE POLICY "Anyone can view likes"
  ON analysis_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like/unlike"
  ON analysis_likes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_analysis_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE market_analysis
    SET likes_count = likes_count + 1
    WHERE id = NEW.analysis_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE market_analysis
    SET likes_count = likes_count - 1
    WHERE id = OLD.analysis_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for likes count
CREATE TRIGGER update_analysis_likes_count
AFTER INSERT OR DELETE ON analysis_likes
FOR EACH ROW
EXECUTE FUNCTION update_analysis_likes_count();