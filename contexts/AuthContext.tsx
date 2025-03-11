// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, signIn, signUp, signOut, getCurrentUser, getProfile } from '../lib/supabase';

type Profile = {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  partner_id?: string;
  created_at?: string;
  passport_completion?: number;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<{ data?: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Ensure we're in a browser context
        if (typeof window === 'undefined') {
          throw new Error('Auth requires a browser environment');
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        // Verify env variables
        if (!supabaseUrl || !supabaseAnonKey) {
          console.error('Missing Supabase config:', {
            url: supabaseUrl ? 'defined' : 'missing',
            key: supabaseAnonKey ? 'defined' : 'missing'
          });
          
          // Still continue but log warning
          console.warn('App will run with limited functionality due to missing Supabase config');
        }
        
        // Get the current user
        try {
          const { user: currentUser, error } = await getCurrentUser();
          
          if (error) {
            console.warn('Auth initialization error (non-critical):', error);
            // Instead of failing, just set the user to null
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }
          
          if (!currentUser) {
            // No user is logged in, but that's not an error
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }
          
          setUser(currentUser);
          
          // Get profile for the user
          try {
            const { profile: userProfile, error: profileError } = await getProfile(currentUser.id);
            
            if (profileError) {
              console.warn('Profile fetch error:', profileError);
              // Continue without profile data
            } else {
              setProfile(userProfile || null);
            }
          } catch (profileError) {
            console.error('Error getting profile:', profileError);
            // Continue without profile data
          }
        } catch (supabaseError) {
          console.error('Supabase client error:', supabaseError);
          // Show more user-friendly error
          setError('Failed to connect to authentication service. Please try again later.');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error loading auth:', error);
        setError(error instanceof Error ? error.message : 'Authentication error');
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    
    try {
      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setUser(session?.user || null);
        
        if (session?.user) {
          try {
            const { profile: userProfile } = await getProfile(session.user.id);
            setProfile(userProfile || null);
          } catch (error) {
            console.error('Error getting profile on auth change:', error);
            // Continue without updating profile
          }
        } else {
          setProfile(null);
        }
      });
      
      authListener = listener;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      // Continue without the auth listener
    }

    return () => {
      if (authListener?.subscription) {
        try {
          authListener.subscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from auth listener:', error);
        }
      }
    };
  }, []);

  const handleSignUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await signUp(email, password);
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error instanceof Error ? error.message : 'Sign up failed');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn(email, password);
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error instanceof Error ? error.message : 'Sign in failed');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signOut();
      return result;
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error instanceof Error ? error.message : 'Sign out failed');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (data: Partial<Profile>) => {
    if (!user) throw new Error('No user is logged in');
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
        
      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    error,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};