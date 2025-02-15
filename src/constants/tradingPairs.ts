// Currency Pairs (Forex)
export const FOREX_PAIRS = [
  // Major Pairs
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF',
  'AUD/USD', 'USD/CAD', 'NZD/USD',
  
  // Minor Pairs
  'EUR/GBP', 'EUR/AUD', 'GBP/JPY',
  'EUR/JPY', 'CHF/JPY', 'EUR/CHF',
  'AUD/JPY', 'GBP/CHF',
  
  // Exotic Pairs
  'USD/SAR', 'EUR/TRY', 'USD/TRY',
  'USD/ZAR', 'USD/MXN', 'USD/BRL'
] as const;

// Commodities
export const COMMODITIES = [
  // Metals
  'XAU/USD', // Gold
  'XAG/USD', // Silver
  'XPT/USD', // Platinum
  'XPD/USD', // Palladium
  
  // Energy
  'USOIL',   // US Crude Oil
  'UKOIL',   // Brent Crude Oil
  'NGAS',    // Natural Gas
  
  // Agricultural
  'WHEAT',   // Wheat
  'CORN',    // Corn
  'SOYBEAN', // Soybeans
  'COFFEE',  // Coffee
  'COTTON'   // Cotton
] as const;

export type ForexPair = typeof FOREX_PAIRS[number];
export type Commodity = typeof COMMODITIES[number];
export type TradingInstrument = ForexPair | Commodity;

// Combined trading instruments
export const TRADING_INSTRUMENTS: TradingInstrument[] = [...FOREX_PAIRS, ...COMMODITIES];