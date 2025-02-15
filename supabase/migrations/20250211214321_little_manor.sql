/*
  # Initial Sample Data
  
  1. Sample Data
    - Add sample economic events
    - Add sample trading signals with proper user references
    
  2. Notes
    - Creates a demo user for sample data
    - All data is for demonstration purposes
    - Uses proper UUID format for user ID
*/

-- Create a demo user in auth.users
INSERT INTO auth.users (id, email)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'demo@example.com'
) ON CONFLICT (id) DO NOTHING;

-- Sample Economic Events
INSERT INTO economic_events (title, country, impact_level, event_time, forecast_value, previous_value) VALUES
('US Non-Farm Payrolls', 'USA', 'high', NOW() + INTERVAL '2 days', '200K', '180K'),
('ECB Interest Rate Decision', 'EUR', 'high', NOW() + INTERVAL '3 days', '4.50%', '4.50%'),
('UK GDP', 'GBP', 'medium', NOW() + INTERVAL '4 days', '0.3%', '0.2%'),
('JPY CPI', 'JPY', 'medium', NOW() + INTERVAL '5 days', '2.8%', '2.6%'),
('AUD Employment Change', 'AUD', 'medium', NOW() + INTERVAL '6 days', '25.0K', '20.0K');

-- Sample Trading Signals with proper user reference
INSERT INTO trading_signals (
  user_id,
  currency_pair,
  entry_price,
  stop_loss,
  take_profit,
  risk_rating,
  status,
  created_at
) VALUES
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'EUR/USD',
  1.0950,
  1.0900,
  1.1050,
  3,
  'active',
  NOW()
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'GBP/USD',
  1.2650,
  1.2600,
  1.2750,
  2,
  'active',
  NOW()
);