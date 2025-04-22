import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Function for server-side usage (API routes, server components)
export function createServerClient() {
  try {
    // Log debug info about the cookie store
    console.log("Creating server client with cookies");
    
    // Use the auth-helpers-nextjs for server components
    // The cookies() function needs to be called directly within the options object.
    return createServerComponentClient({ cookies });
  } catch (error) {
    console.error("Error creating server client:", error);
    // Fallback to anon client if there's an error
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseKey);
  }
} 