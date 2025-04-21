import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Function for server-side usage (API routes, server components)
export function createServerClient() {
  // Use the auth-helpers-nextjs for server components
  // The cookies() function needs to be called directly within the options object.
  return createServerComponentClient({ cookies });
}

// Function for client-side usage (exported but not used in this file)
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  return createClient(supabaseUrl, supabaseKey);
}