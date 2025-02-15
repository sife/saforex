-- Drop existing policies for market_analysis
DROP POLICY IF EXISTS "view_published_analyses" ON market_analysis;
DROP POLICY IF EXISTS "admin_manage_analyses" ON market_analysis;

-- Create new policies with proper permissions
CREATE POLICY "view_published_analyses"
ON market_analysis FOR SELECT
USING (status = 'published');

CREATE POLICY "admin_manage_analyses"
ON market_analysis FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Ensure RLS is enabled
ALTER TABLE market_analysis ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_market_analysis_status 
ON market_analysis(status) 
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_market_analysis_user 
ON market_analysis(user_id, status);

-- Grant necessary permissions
GRANT ALL ON market_analysis TO authenticated;