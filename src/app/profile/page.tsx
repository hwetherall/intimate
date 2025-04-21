'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, signOut, getPartner } = useAuth();
  const [partner, setPartner] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const partnerData = await getPartner();
        setPartner(partnerData);
      } catch (error) {
        console.error('Error fetching partner:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartner();
  }, [getPartner]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <header className="py-6 border-b border-foreground/10 mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Intimate</h1>
          <button 
            onClick={() => signOut()}
            className="text-sm text-red-600 hover:underline"
          >
            Sign Out
          </button>
        </header>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Your Profile</h2>
          <div className="bg-foreground/5 rounded-lg p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="mb-4">
                  <p className="text-sm text-foreground/60">Full Name</p>
                  <p className="font-medium">{user?.user_metadata?.full_name || 'Not provided'}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-foreground/60">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="mb-4">
                  <h3 className="font-medium text-lg mb-2">Partner Status</h3>
                  {partner ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-green-700">
                        Connected with <span className="font-medium">{partner.full_name}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-amber-700 mb-2">
                        No partner connected yet
                      </p>
                      <Link 
                        href="/auth/invite" 
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Connect with your partner →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Your Preferences</h2>
          {partner ? (
            <div className="bg-foreground/5 rounded-lg p-6">
              <div className="mb-4">
                <p className="mb-4">
                  Complete your preference questionnaire to help us provide personalized recommendations for you and your partner.
                </p>
                <Link
                  href="/profile/preferences"
                  className="inline-block py-2 px-4 bg-foreground text-background font-medium rounded-md"
                >
                  Update Preferences
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-foreground/5 rounded-lg p-6">
              <p className="text-foreground/70">
                Connect with your partner first to access the preferences questionnaire.
              </p>
            </div>
          )}
        </div>

        {partner && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Latest Recommendations</h2>
            <div className="bg-foreground/5 rounded-lg p-6">
              <p className="text-foreground/70 mb-4">
                Complete your preferences to receive personalized recommendations for intimate experiences.
              </p>
              <Link
                href="/profile/preferences"
                className="text-sm text-blue-600 hover:underline"
              >
                Complete preferences to get started →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}