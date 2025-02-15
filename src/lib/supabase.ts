import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const RETRY_BACKOFF_FACTOR = 2;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const customFetch = async (url: string, options: RequestInit = {}) => {
  let attempt = 0;
  let lastError: Error | null = null;
  
  const attemptFetch = async (): Promise<Response> => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Cache-Control': 'no-cache',
          ...options.headers,
          'X-Client-Info': 'sa-forex',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      attempt++;
      if (attempt >= MAX_RETRIES) {
        throw new Error(`Failed to fetch after ${MAX_RETRIES} attempts: ${lastError.message}`);
      }
      
      const delay = INITIAL_RETRY_DELAY * Math.pow(RETRY_BACKOFF_FACTOR, attempt - 1);
      console.warn(`Fetch attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return attemptFetch();
    }
  };
  
  return attemptFetch();
};

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sa-forex-auth',
    flowType: 'pkce',
    storage: {
      getItem: (key) => {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        } catch (error) {
          console.error('Error reading from localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error('Error writing to localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      },
    },
  },
  global: {
    headers: {
      'Cache-Control': 'no-cache',
      'X-Client-Info': 'sa-forex',
    },
  },
  fetch: customFetch,
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Test connection function with improved error handling
export const testConnection = async () => {
  let attempt = 0;
  let lastError: Error | null = null;

  const attemptConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Connection successful');
        return true;
      }
      return false;
    } catch (error) {
      lastError = error as Error;
      attempt++;
      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(RETRY_BACKOFF_FACTOR, attempt - 1);
        console.warn(`Connection attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptConnection();
      }
      console.error('Database connection error after retries:', lastError);
      return false;
    }
  };

  return attemptConnection();
};

// Only test connection in development
if (import.meta.env.DEV) {
  testConnection();
}

export default supabase;