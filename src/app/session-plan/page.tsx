'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase';
import SessionPlanningWizard from '@/components/SessionPlanningWizard';
import SessionPlanDisplay from '@/components/SessionPlanDisplay';

export default function SessionPlanPage() {
  const { user, getPartner } = useAuth();
  const router = useRouter();
  const [activePlan, setActivePlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partner, setPartner] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch partner info
        const partnerData = await getPartner();
        setPartner(partnerData);
        
        if (!partnerData) {
          setLoading(false);
          return;
        }

        // Get fresh token
        const supabase = createBrowserClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        
        if (!token) {
          console.error("No access token available");
          setError("Authentication error - please try signing in again");
          setLoading(false);
          return;
        }
        
        // Fetch current session plan with authorization header
        const response = await fetch('/api/session-plan', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
        });
        
        const responseData = await response.json();
        
        if (response.ok && responseData.success) {
          setActivePlan(responseData.plan);
        } else {
          console.error('Error fetching session plan:', responseData.error);
        }
      } catch (error) {
        console.error('Error in session plan page:', error);
        setError('An error occurred while loading the session plan');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [getPartner]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    );
  }

  // Check if partner exists
  if (!partner) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto py-8">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-6 text-center">
            <h2 className="text-xl font-bold mb-4 text-amber-800">No Partner Connected</h2>
            <p className="text-amber-700 mb-4">
              You need to connect with your partner before you can plan a session.
            </p>
            <button
              onClick={() => router.push('/auth/invite')}
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
            >
              Connect with Partner
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
            <h2 className="text-xl font-bold mb-4 text-red-800">Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If there's an active plan in "planning_complete" status, show the plan
  if (activePlan && activePlan.status === 'planning_complete') {
    return <SessionPlanDisplay plan={activePlan} />;
  }

  // If there's an active plan in "pending_partner" status
  if (activePlan && activePlan.status === 'pending_partner') {
    // If current user is the initiator, show waiting screen
    if (activePlan.initiator_id === user?.id) {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-3xl mx-auto py-8">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-6 text-center">
              <h2 className="text-xl font-bold mb-4 text-blue-800">Waiting for Partner</h2>
              <p className="text-blue-700 mb-4">
                Your session plan has been started! Waiting for {partner.full_name} to complete their part.
              </p>
              <div className="animate-pulse flex justify-center mt-4">
                <div className="h-3 w-3 bg-blue-600 rounded-full mx-1"></div>
                <div className="h-3 w-3 bg-blue-600 rounded-full mx-1 animate-delay-200"></div>
                <div className="h-3 w-3 bg-blue-600 rounded-full mx-1 animate-delay-400"></div>
              </div>
            </div>
          </div>
        </div>
      );
    } 
    // If current user is the partner, show the partner wizard
    else {
      return <SessionPlanningWizard 
        planId={activePlan.id} 
        isPartner={true}
        spiciness={activePlan.spiciness_level}
        duration={activePlan.duration}
        scenario={activePlan.selected_scenario}
        onPlanCreated={setActivePlan} 
      />;
    }
  }

  // If no active plan, show the initiator wizard
  return <SessionPlanningWizard onPlanCreated={setActivePlan} />;
}