'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';

type SomethingNewSuggestionProps = {
  planId: string;
};

export default function SomethingNewSuggestion({ planId }: SomethingNewSuggestionProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestion = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const supabase = createBrowserClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        
        if (!token) {
          setError('Authentication error - please try signing in again');
          setLoading(false);
          return;
        }
        
        // Call the API to get a new suggestion
        const response = await fetch('/api/session-plan/something-new', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            planId
          }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setSuggestion(data.suggestion);
        } else {
          setError(data.error || 'Failed to get a suggestion');
        }
      } catch (error) {
        console.error('Error fetching suggestion:', error);
        setError('An error occurred while getting a suggestion');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestion();
  }, [planId]);

  if (loading) {
    return (
      <div className="bg-foreground/5 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold mb-4">Finding Something New...</h3>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-foreground"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-bold mb-2 text-red-800">Oops!</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
      <h3 className="text-lg font-bold mb-2 text-blue-800">Something New to Try</h3>
      <div className="bg-white rounded-md p-4 my-4 border border-blue-100">
        <p className="italic text-blue-900">{suggestion}</p>
      </div>
      <p className="text-sm text-blue-700">
        This suggestion is based on your preferences and is meant to add a new element to your experience.
        Feel free to incorporate it if it sounds appealing to both of you.
      </p>
    </div>
  );
}