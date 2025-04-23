'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create a Supabase client for the browser with explicit persisted auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create the Supabase client with localStorage for cookie storage
const supabase = createClient(supabaseUrl, supabaseKey, {
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
          full_name: session.user.user_metadata?.full_name as string || '',
          user_metadata: session.user.user_metadata
        });
        console.log("Auth initialized with user:", session.user.email);
      } else {
        setUser(null);
        console.log("Auth initialized with no session");
      }
      
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name as string || '',
            user_metadata: session.user.user_metadata
          });
          console.log("User updated:", session.user.email);
        } else {
          setUser(null);
          console.log("User cleared");
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Add this to your signIn function in AuthContext.tsx
const signIn = async (email: string, password: string) => {
  console.log("Signing in:", email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error("Sign in error:", error);
  } else {
    console.log("Sign in successful");
    console.log("Session data:", data.session);
    
    // Test if we can access the preferences table
    const { data: prefTest, error: prefError } = await supabase
      .from('preferences')
      .select('count')
      .limit(1);
      
    console.log("Preferences test:", prefTest, prefError);
  }
  
  return { error: error as AuthError | null };
};

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log("Signing up:", email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    
    if (error) {
      console.error("Sign up error:", error);
      return { 
        error: error as AuthError | null,
        user: null
      };
    }
    
    // Successfully signed up with Auth, now add to custom users table
    if (data.user) {
      console.log("Adding user to custom users table");
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
        });
        
      if (insertError) {
        console.error("Error adding user to custom table:", insertError);
      } else {
        console.log("User added to custom users table");
      }
    }
    
    console.log("Sign up successful");
    return { 
      error: null, 
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
        user_metadata: data.user.user_metadata
      } : null 
    };
  };

  const signOut = async () => {
    console.log("Signing out");
    await supabase.auth.signOut();
  };

  const getPartner = async (): Promise<Partner | null> => {
    if (!user) {
      console.log("Can't get partner: No user logged in");
      return null;
    }
    
    try {
      console.log("Getting partner for user:", user.id);
      
      // First get the user's couple relationship
      const { data: userCouple, error: coupleError } = await supabase
        .from('user_couples')
        .select('couple_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      
      if (coupleError) {
        console.error("Error getting user couple:", coupleError);
        return null;
      }
      
      if (!userCouple) {
        console.log("No couple found for user");
        return null;
      }
      
      console.log("Found couple:", userCouple.couple_id);
      
      // Then find the partner in the same couple
      const { data: partnerRelation, error: partnerRelationError } = await supabase
        .from('user_couples')
        .select('user_id')
        .eq('couple_id', userCouple.couple_id)
        .neq('user_id', user.id)
        .single();
      
      if (partnerRelationError) {
        console.error("Error getting partner relation:", partnerRelationError);
        return null;
      }
      
      if (!partnerRelation) {
        console.log("No partner found in couple");
        return null;
      }
      
      console.log("Found partner ID:", partnerRelation.user_id);
      
      // Get the partner's user information
      const { data: partnerUser, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('id', partnerRelation.user_id)
        .single();
      
      if (userError) {
        console.error("Error getting partner user:", userError);
        return null;
      }
      
      if (!partnerUser) {
        console.log("Partner user not found");
        return null;
      }
      
      console.log("Found partner:", partnerUser.email);
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
  const acceptInvite = async (code: string): Promise<void> => {
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
    if (!user) {
      console.error("Can't connect: No user logged in");
      return { error: 'You must be logged in to connect with a partner' };
    }
    
    try {
      console.log("Connecting with partner email:", partnerEmail);
      
      // Get latest auth session before making the request
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        console.error("No access token available for connection request");
        return { error: 'Authentication error - please sign in again' };
      }
      
      // Set explicit auth header
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ partnerEmail }),
        credentials: 'include', // Include cookies
      });

      const data = await response.json();
      console.log("Connect API response:", data);

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