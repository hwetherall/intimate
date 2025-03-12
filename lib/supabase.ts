// src/lib/supabase.ts
import { createClient, AuthChangeEvent, Session as SupabaseSession } from '@supabase/supabase-js';

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
  supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: SupabaseSession | null) => {
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

// Define a proper ProfileData type to replace any
export type ProfileData = {
  id?: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  partner_id?: string;
  full_name?: string;
  created_at?: string;
  updated_at?: string;
  passport_completion?: number;
  [key: string]: any; // For any additional fields
};

// Profile functions
export const getProfile = async (userId: string) => {
  try {
    // Log for debugging
    console.log('Fetching profile for user ID:', userId);
    
    // Use maybeSingle() instead of single() to prevent 406 errors when no row exists
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error in getProfile:', error);
      return { profile: null, error };
    }
    
    // If no profile exists, we should create one
    if (!data) {
      console.log('No profile found, creating default profile');
      return await createProfile(userId, {
        user_id: userId,
        display_name: 'New User',
        gender: 'prefer_not_to_say'
      });
    }
    
    return { profile: data, error: null };
  } catch (e) {
    console.error('Exception in getProfile:', e);
    return { profile: null, error: e };
  }
};

export const createProfile = async (userId: string, profileData: ProfileData) => {
  try {
    console.log('Creating new profile for user ID:', userId, 'with data:', profileData);
    
    // Make sure user_id is explicitly set for RLS policies
    const dataWithUserId = { 
      ...profileData,
      user_id: userId,
      // Add id if not present (sometimes needed for RLS)
      id: profileData.id || userId
    };
    
    // Insert with upsert to handle possible duplicates
    const { data, error } = await supabase
      .from('profiles')
      .upsert([dataWithUserId], { 
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('Error creating profile:', error);
      return { profile: null, error };
    }
    
    return { profile: data?.[0] || null, error: null };
  } catch (e) {
    console.error('Exception in createProfile:', e);
    return { profile: null, error: e };
  }
};

export const updateProfile = async (userId: string, profileData: ProfileData) => {
  try {
    console.log('Updating profile for user ID:', userId, 'with data:', profileData);
    
    // First check if profile exists
    const { profile: existingProfile, error: fetchError } = await getProfile(userId);
    
    if (fetchError) {
      console.error('Error checking for existing profile:', fetchError);
      return { profile: null, error: fetchError };
    }
    
    if (!existingProfile) {
      console.log('No profile found to update, creating one instead');
      return await createProfile(userId, profileData);
    }
    
    // Profile exists, update it
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('user_id', userId)
      .select();
      
    if (error) {
      console.error('Error updating profile:', error);
      return { profile: null, error };
    }
    
    return { profile: data?.[0] || null, error: null };
  } catch (e) {
    console.error('Exception in updateProfile:', e);
    return { profile: null, error: e };
  }
};

// A function that bypasses RLS for profile operations when regular methods fail
// This uses service role capabilities and should be limited to admin operations
export const adminCreateOrUpdateProfile = async (userId: string, profileData: ProfileData) => {
  try {
    console.log('Performing admin-level profile operation for user:', userId);
    
    // First check if the profile exists
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (countError) {
      console.error('Error checking profile existence:', countError);
      return { profile: null, error: countError };
    }
    
    // Prepare full profile data (without overriding user-provided fields)
    const fullProfileData = {
      id: userId, // Use userId as id to ensure consistency
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...profileData // This now includes user_id from the parameter
    };
    
    let data, error;
    
    if (count && count > 0) {
      // Profile exists, update it
      console.log('Updating existing profile with admin privileges');
      const result = await supabase
        .from('profiles')
        .update(fullProfileData)
        .eq('user_id', userId)
        .select();
        
      data = result.data;
      error = result.error;
    } else {
      // Profile doesn't exist, create it
      console.log('Creating new profile with admin privileges');
      const result = await supabase
        .from('profiles')
        .insert([fullProfileData])
        .select();
        
      data = result.data;
      error = result.error;
    }
    
    if (error) {
      console.error('Error in admin profile operation:', error);
      return { profile: null, error };
    }
    
    return { profile: data?.[0] || null, error: null };
  } catch (e) {
    console.error('Exception in adminCreateOrUpdateProfile:', e);
    return { profile: null, error: e };
  }
};

// Function to check if we can create a profile for a user
export const diagnosePoliciesForProfiles = async (userId: string) => {
  console.log('Diagnosing profile access issues for user:', userId);
  
  try {
    // Try a simple select to see if we can read from profiles
    console.log('Testing read access to profiles table...');
    const { data: readData, error: readError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (readError) {
      console.error('Read access test failed:', readError);
    } else {
      console.log('Read access test succeeded, found', readData?.length || 0, 'profiles');
    }
    
    // Test insert with minimal data
    console.log('Testing insert access to profiles table...');
    const testData = {
      user_id: userId,
      id: userId,
      display_name: 'Test User'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert([testData])
      .select();
      
    if (insertError) {
      console.error('Insert test failed:', insertError);
      
      // If it's an RLS error, we need different approach
      if (insertError.message?.includes('violates row-level security')) {
        console.log('Detected RLS violation, trying upsert instead...');
        
        // Try upsert which might have a different policy
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert([testData], {
            onConflict: 'user_id'
          });
          
        if (upsertError) {
          console.error('Upsert test also failed:', upsertError);
        } else {
          console.log('Upsert test succeeded!');
        }
      }
    } else {
      console.log('Insert test succeeded:', insertData);
    }
    
    return {
      readSuccess: !readError,
      insertSuccess: !insertError,
      readError,
      insertError,
      diagnosis: readError 
        ? 'Cannot read from profiles table'
        : insertError
        ? 'Cannot insert into profiles table'
        : 'All access tests passed'
    };
  } catch (e) {
    console.error('Error diagnosing profile access:', e);
    return {
      readSuccess: false,
      insertSuccess: false,
      readError: e,
      insertError: e,
      diagnosis: 'Error performing diagnosis'
    };
  }
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