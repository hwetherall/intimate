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
  user_metadata?: Record<string, unknown>;
} | null;

interface AuthError {
  message: string;
  status?: number;
}

interface Partner {
  id: string;
  email?: string;
  full_name?: string;
}

type AuthContextType = {
  user: User;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null, user: User }>;
  signOut: () => Promise<void>;
  getPartner: () => Promise<Partner | null>;
  sendInvite: (email: string) => Promise<string>;
  acceptInvite: (code: string) => Promise<void>;
  connectByEmail: (partnerEmail: string) => Promise<{ error: string | null }>;
  loading: boolean;
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

  const getPartner = async (): Promise<Partner | null> => {
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
      
      // Get the partner's user information
      const { data: partnerUser, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('id', partnerRelation.user_id)
        .single();
      
      if (userError || !partnerUser) return null;
      
      return partnerUser;
    } catch (error) {
      console.error('Error fetching partner:', error);
      return null;
    }
  };

  // Function to send an invite to a partner by email
  const sendInvite = async (email: string): Promise<string> => {
    if (!user) throw new Error('You must be logged in to send invites');
    
    try {
      // Check if the email exists in our system
      const { error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (userError) throw new Error('Error checking user existence');
      
      // Generate a unique invite code (using a simple implementation for testing)
      const inviteCode = `${user.id.substring(0, 8)}-${Date.now().toString(36)}`;
      
      // Store the invite in the database (we would need to create an 'invites' table)
      // For now, we'll just return the code for testing purposes
      
      return inviteCode;
    } catch (error) {
      console.error('Error sending invite:', error);
      throw error;
    }
  };

  // Function to accept an invite code
  const acceptInvite = async (inviteCode: string): Promise<void> => {
    if (!user) throw new Error('You must be logged in to accept invites');
    
    try {
      // In a real implementation, we would validate the invite code
      // and connect the users
      // For now, we'll just simulate success
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return;
    } catch (error) {
      console.error('Error accepting invite:', error);
      throw error;
    }
  };

  // Function to connect with a partner directly by email
  const connectByEmail = async (partnerEmail: string): Promise<{ error: string | null }> => {
    if (!user) return { error: 'You must be logged in to connect with a partner' };
    
    try {
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ partnerEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Failed to connect with partner' };
      }

      return { error: null };
    } catch (error) {
      console.error('Error connecting with partner:', error);
      return { error: 'An error occurred while connecting with partner' };
    }
  };

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    loading,
    getPartner,
    sendInvite,
    acceptInvite,
    connectByEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}