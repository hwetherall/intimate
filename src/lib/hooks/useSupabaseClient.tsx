// src/lib/hooks/useSupabaseClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';

export function useSupabaseClient(): SupabaseClient {
  const { user } = useAuth();
  const [client, setClient] = useState<SupabaseClient>(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    // Log the configuration to help with debugging
    console.log(`Creating Supabase client with URL: ${supabaseUrl.substring(0, 15)}...`);
    console.log(`API key set: ${!!supabaseKey}`);
    
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  });

  // Test the connection when the component mounts
  useEffect(() => {
    const testConnection = async () => {
      try {
        // Simple test query to see if we can connect
        const { data, error } = await client
          .from('users')
          .select('count')
          .limit(1);
          
        if (error) {
          console.error('Supabase test query failed:', error);
        } else {
          console.log('Supabase connection test successful');
        }
      } catch (err) {
        console.error('Supabase connection test error:', err);
      }
    };
    
    testConnection();
  }, [client]);

  return client;
}