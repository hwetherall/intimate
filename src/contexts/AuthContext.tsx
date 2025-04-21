import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getPartner: () => Promise<any | null>;
  sendInvite: (email: string) => Promise<void>;
  acceptInvite: (inviteCode: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign up new user
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Create user record in users table
      if (data.user) {
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
        });

        if (insertError) throw insertError;
      }

      router.push('/profile');
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // Sign in existing user
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      router.push('/profile');
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Sign out user
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Get partner information
  const getPartner = async () => {
    if (!user) return null;

    try {
      // First find the couple ID
      const { data: userCouple, error: coupleError } = await supabase
        .from('user_couples')
        .select('couple_id')
        .eq('user_id', user.id)
        .single();

      if (coupleError || !userCouple) return null;

      // Then find the partner with the same couple ID
      const { data: partnerRelation, error: partnerRelationError } = await supabase
        .from('user_couples')
        .select('user_id')
        .eq('couple_id', userCouple.couple_id)
        .neq('user_id', user.id)
        .single();

      if (partnerRelationError || !partnerRelation) return null;

      // Get the partner user details
      const { data: partner, error: partnerError } = await supabase
        .from('users')
        .select('*')
        .eq('id', partnerRelation.user_id)
        .single();

      if (partnerError) return null;

      return partner;
    } catch (error) {
      console.error('Error getting partner:', error);
      return null;
    }
  };

  // Send partner invite
  const sendInvite = async (email: string) => {
    if (!user) throw new Error('You must be logged in to send an invite.');

    try {
      // Check if user already has a couple
      const { data: existingCouple, error: existingCoupleError } = await supabase
        .from('user_couples')
        .select('couple_id')
        .eq('user_id', user.id);

      if (existingCoupleError) throw existingCoupleError;
      
      // If user already has a couple, don't allow sending another invite
      if (existingCouple && existingCouple.length > 0) {
        throw new Error('You already have a partner linked to your account.');
      }

      // Create a new couple
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .insert({})
        .select();

      if (coupleError || !coupleData || coupleData.length === 0) throw coupleError || new Error('Failed to create couple.');

      const coupleId = coupleData[0].id;

      // Link the current user to the couple
      const { error: linkError } = await supabase
        .from('user_couples')
        .insert({
          user_id: user.id,
          couple_id: coupleId,
        });

      if (linkError) throw linkError;

      // Generate invite code (in a real app, you'd send this via email)
      // For now, we'll just display it to the user
      return coupleId; // This would be the invite code
    } catch (error) {
      console.error('Error sending invite:', error);
      throw error;
    }
  };

  // Accept partner invite
  const acceptInvite = async (inviteCode: string) => {
    if (!user) throw new Error('You must be logged in to accept an invite.');

    try {
      // Check if user already has a couple
      const { data: existingCouple, error: existingCoupleError } = await supabase
        .from('user_couples')
        .select('couple_id')
        .eq('user_id', user.id);

      if (existingCoupleError) throw existingCoupleError;
      
      // If user already has a couple, don't allow accepting another invite
      if (existingCouple && existingCouple.length > 0) {
        throw new Error('You already have a partner linked to your account.');
      }

      // Check if the couple exists
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select()
        .eq('id', inviteCode)
        .single();

      if (coupleError || !coupleData) throw coupleError || new Error('Invalid invite code.');

      // Link the current user to the couple
      const { error: linkError } = await supabase
        .from('user_couples')
        .insert({
          user_id: user.id,
          couple_id: inviteCode,
        });

      if (linkError) throw linkError;

      router.push('/profile');
    } catch (error) {
      console.error('Error accepting invite:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    getPartner,
    sendInvite,
    acceptInvite,
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