'use client';

import { useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';

export function useSupabaseClient(): SupabaseClient {
  const { user } = useAuth();
  const [client, setClient] = useState<SupabaseClient>(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseKey);
  });

  useEffect(() => {
    const setupAuthenticatedClient = async () => {
      if (!user) return;

      try {
        // Get the token from localStorage
        const tokenString = localStorage.getItem('supabase-auth-token');
        if (!tokenString) return;

        const token = JSON.parse(tokenString);
        const accessToken = token?.access_token;
        
        if (!accessToken) return;

        // Create a new client with the token
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        
        const newClient = createClient(supabaseUrl, supabaseKey, {
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        });
        
        setClient(newClient);
      } catch (err) {
        console.error('Error setting up authenticated Supabase client:', err);
      }
    };

    setupAuthenticatedClient();
  }, [user]);

  return client;
} 