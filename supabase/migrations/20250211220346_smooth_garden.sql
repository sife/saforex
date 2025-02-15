/*
  # Update Market Analysis Schema

  1. Changes
    - Add foreign key relationship between market_analysis and users_profile
    - Add foreign key relationship between analysis_likes and users_profile
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add foreign key relationships
DO $$ 
BEGIN
  -- Add foreign key from market_analysis to users_profile
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'market_analysis_user_profile_fk'
  ) THEN
    ALTER TABLE market_analysis
    ADD CONSTRAINT market_analysis_user_profile_fk
    FOREIGN KEY (user_id) REFERENCES users_profile(id);
  END IF;

  -- Add foreign key from analysis_likes to users_profile
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'analysis_likes_user_profile_fk'
  ) THEN
    ALTER TABLE analysis_likes
    ADD CONSTRAINT analysis_likes_user_profile_fk
    FOREIGN KEY (user_id) REFERENCES users_profile(id);
  END IF;
END $$;