import { createClient } from '@supabase/supabase-js';

// Singleton pattern for Supabase client
let browserClient: ReturnType<typeof createClient> | null = null;

// Function for client-side usage only
export function createBrowserClient() {
  if (browserClient) return browserClient;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  browserClient = createClient(supabaseUrl, supabaseKey, {
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
  
  return browserClient;
}