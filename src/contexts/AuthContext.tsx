'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type User = {
  id: string;
  email?: string;
  full_name?: string;
  user_metadata?: any;
} | null;

interface AuthError {
  message: string;
  status?: number;
}

type AuthContextType = {
  user: User;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null, user: User }>;
  signOut: () => Promise<void>;
  loading: boolean;
  getPartner: () => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session on initial load
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name,
          user_metadata: session.user.user_metadata
        });
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name,
            user_metadata: session.user.user_metadata
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as AuthError | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { 
      error: error as AuthError | null, 
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        user_metadata: data.user.user_metadata
      } : null 
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const getPartner = async () => {
    if (!user) return null;
    
    try {
      // First get the user's couple relationship
      const { data: userCouple, error: coupleError } = await supabase
        .from('user_couples')
        .select('couple_id')
        .eq('user_id', user.id)
        .single();
      
      if (coupleError || !userCouple) return null;
      
      // Then find the partner in the same couple
      const { data: partnerRelation, error: partnerRelationError } = await supabase
        .from('user_couples')
        .select('user_id')
        .eq('couple_id', userCouple.couple_id)
        .neq('user_id', user.id)
        .single();
      
      if (partnerRelationError || !partnerRelation) return null;
      
      // Finally get the partner's profile information
      const { data: partnerProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerRelation.user_id)
        .single();
      
      if (profileError) return null;
      
      return partnerProfile;
    } catch (error) {
      console.error('Error fetching partner:', error);
      return null;
    }
  };

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    loading,
    getPartner,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};