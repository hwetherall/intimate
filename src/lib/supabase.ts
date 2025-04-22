import { createClient } from '@supabase/supabase-js';

// Function for client-side usage only
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: {
        getItem: (key) => {
          if (typeof window === 'undefined') return null;
          return localStorage.getItem(key);
        },
        setItem: (key, value) => {
          if (typeof window !== 'undefined') localStorage.setItem(key, value);
        },
        removeItem: (key) => {
          if (typeof window !== 'undefined') localStorage.removeItem(key);
        }
      }
    }
  });
}