-- Drop existing policies for trading_signals
DROP POLICY IF EXISTS "Anyone can view active signals" ON trading_signals;
DROP POLICY IF EXISTS "Admin or owner can manage signals" ON trading_signals;
DROP POLICY IF EXISTS "Users can create signals" ON trading_signals;

-- Create new policies with proper permissions
CREATE POLICY "view_active_signals"
ON trading_signals FOR SELECT
USING (status = 'active');

CREATE POLICY "admin_manage_signals"
ON trading_signals FOR ALL
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
ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trading_signals_status 
ON trading_signals(status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_trading_signals_user 
ON trading_signals(user_id, status);

-- Grant necessary permissions
GRANT ALL ON trading_signals TO authenticated;