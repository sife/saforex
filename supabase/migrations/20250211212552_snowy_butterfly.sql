/*
  # Initial Schema Setup for SA FOREX

  1. New Tables
    - users_profile
      - Extended user profile information
      - Linked to auth.users
    - trading_signals
      - Trading recommendations and signals
    - economic_events
      - Economic calendar events
    - content_posts
      - User-generated content and posts

  2. Security
    - RLS policies for all tables
    - User-specific access controls
*/

-- Users Profile Table
CREATE TABLE users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  country TEXT,
  bio TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
  avatar_url TEXT,
  cover_photo_url TEXT,
  preferred_markets TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trading Signals Table
CREATE TABLE trading_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  currency_pair TEXT NOT NULL,
  entry_price DECIMAL NOT NULL,
  stop_loss DECIMAL NOT NULL,
  take_profit DECIMAL NOT NULL,
  risk_rating INTEGER CHECK (risk_rating BETWEEN 1 AND 5),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  performance_pips DECIMAL
);

-- Economic Events Table
CREATE TABLE economic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  country TEXT NOT NULL,
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high')),
  event_time TIMESTAMPTZ NOT NULL,
  actual_value TEXT,
  forecast_value TEXT,
  previous_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Content Posts Table
CREATE TABLE content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('text', 'image', 'video', 'link')),
  media_url TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
  ON users_profile
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users_profile
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Anyone can view published trading signals"
  ON trading_signals
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can create trading signals"
  ON trading_signals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view economic events"
  ON economic_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view published content"
  ON content_posts
  FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can create and manage their content"
  ON content_posts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);