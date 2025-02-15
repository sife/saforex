/*
  # Add description column to live_streams table

  1. Changes
    - Add description column to live_streams table
    - Make it nullable to maintain compatibility with existing records
*/

-- Add description column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'live_streams' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE live_streams
    ADD COLUMN description TEXT;
  END IF;
END $$;