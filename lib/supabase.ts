// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Get environment variables - use explicit check to avoid falsy values being treated as not defined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log for debugging
console.log('Supabase URL:', supabaseUrl ? 'Defined' : 'Not defined');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Defined' : 'Not defined');

// Verify environment variables before creating client
if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL is required but not defined');
}

if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_ANON_KEY is required but not defined');
}

// Create Supabase client with better storage handling
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',  // Fallback to prevent crash
  supabaseAnonKey || 'placeholder-key',  // Fallback to prevent crash
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Fix for storage access errors
      storage: {
        // Use cookies as fallback if localStorage isn't available
        getItem: (key) => {
          try {
            return localStorage.getItem(key);
          } catch (e) {
            console.warn('localStorage access error, falling back:', e);
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            localStorage.setItem(key, value);
          } catch (e) {
            console.warn('localStorage access error while setting item:', e);
          }
        },
        removeItem: (key) => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn('localStorage access error while removing item:', e);
          }
        }
      }
    }
  }
);

// Add error handling for auth state change to catch any issues
try {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
  });
} catch (error) {
  console.error('Failed to set up auth state change listener:', error);
}

// Helper functions for authentication
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user, error };
};

// Profile functions
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { profile: data, error };
};

export const createProfile = async (userId: string, profileData: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ id: userId, ...profileData }])
    .select();
  return { profile: data?.[0], error };
};

export const updateProfile = async (userId: string, profileData: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', userId)
    .select();
  return { profile: data?.[0], error };
};

// Add your type definitions here as needed
export type Session = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  user_id: string;
  partner_id?: string;
  activities?: SessionActivity[];
};

export type SessionActivity = {
  id: string;
  session_id: string;
  title: string;
  description: string;
  order: number;
  completed: boolean;
};

// Sessions functions
export const getSessions = async (userId: string) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { sessions: data || [], error };
};

export const getSession = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      activities:session_activities(*)
    `)
    .eq('id', sessionId)
    .single();
  
  return { session: data, error };
};

export const createSession = async (sessionData: Partial<Session>) => {
  const { data, error } = await supabase
    .from('sessions')
    .insert([sessionData])
    .select();
  
  return { session: data?.[0], error };
};

export const updateSession = async (sessionId: string, sessionData: Partial<Session>) => {
  const { data, error } = await supabase
    .from('sessions')
    .update(sessionData)
    .eq('id', sessionId)
    .select();
  
  return { session: data?.[0], error };
};

export const deleteSession = async (sessionId: string) => {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);
  
  return { error };
};

export const createSessionActivity = async (activityData: Partial<SessionActivity>) => {
  const { data, error } = await supabase
    .from('session_activities')
    .insert([activityData])
    .select();
  
  return { activity: data?.[0], error };
};

export const updateSessionActivity = async (activityId: string, activityData: Partial<SessionActivity>) => {
  const { data, error } = await supabase
    .from('session_activities')
    .update(activityData)
    .eq('id', activityId)
    .select();
  
  return { activity: data?.[0], error };
};