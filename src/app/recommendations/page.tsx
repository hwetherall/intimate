'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import RecommendationCard from '@/components/RecommendationCard';
import { RecommendationSet } from '@/lib/ai-service';

interface Partner {
  id: string;
  email?: string;
  full_name?: string;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  duration?: string;
}

export default function RecommendationsPage() {
  const { user, getPartner } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [recommendationSet, setRecommendationSet] = useState<RecommendationSet | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  // Fetch current recommendations on page load
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch partner info
        const partnerData = await getPartner();
        setPartner(partnerData);
        
        // Fetch current recommendations
        const response = await fetch('/api/recommendations', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          if (data.recommendations) {
            setRecommendationSet(data.recommendations);
            setSessionId(data.session?.id || null);
            setRecommendations(data.recommendations.recommendations || []);
          }
        } else {
          console.error('Error fetching recommendations:', data.error);
        }
      } catch (error) {
        console.error('Error in recommendations page:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [getPartner]);
  
  // Generate new recommendations
  const handleGenerateRecommendations = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setRecommendationSet(data.recommendations);
        setSessionId(data.session?.id || null);
        setRecommendations(data.recommendations.recommendations || []);
      } else {
        setError(data.error || 'Failed to generate recommendations');
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setError('An error occurred while generating recommendations');
    } finally {
      setGenerating(false);
    }
  };
  
  // Submit feedback for a recommendation
  const handleFeedback = async (recommendationId: string, feedback: {
    rating: number;
    comment: string;
    completed: boolean;
  }) => {
    if (!sessionId) return;
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          feedbackData: {
            recommendationId,
            ...feedback,
            timestamp: new Date().toISOString(),
          },
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error submitting feedback:', data.error);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };
  
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
              You need to connect with your partner before you can receive recommendations.
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
  
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <header className="py-6 border-b border-foreground/10 mb-8">
          <h1 className="text-2xl font-bold">Your Recommendations</h1>
          <p className="text-foreground/70">
            Personalized intimate experiences for you and {partner?.full_name || 'your partner'}
          </p>
        </header>
        
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}
        
        {recommendationSet ? (
          <div className="mb-8">
            <div className="bg-foreground/5 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-2">{recommendationSet.title}</h2>
              <p className="text-foreground/80 mb-4">{recommendationSet.description}</p>
              <p className="text-sm text-foreground/60">
                Generated on {new Date(recommendationSet.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <h3 className="text-lg font-medium mb-4">Your Personalized Recommendations</h3>
            
            {recommendationSet.recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onFeedback={handleFeedback}
              />
            ))}
            
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleGenerateRecommendations}
                disabled={generating}
                className="px-6 py-3 bg-foreground text-background font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground disabled:opacity-70"
              >
                {generating ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Generating New Recommendations...
                  </>
                ) : (
                  'Generate New Recommendations'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-foreground/5 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold mb-4">No Recommendations Yet</h2>
            <p className="text-foreground/80 mb-6">
              Generate your first set of personalized recommendations to enhance your relationship.
            </p>
            <button
              onClick={handleGenerateRecommendations}
              disabled={generating}
              className="px-6 py-3 bg-foreground text-background font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground disabled:opacity-70"
            >
              {generating ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Generating Recommendations...
                </>
              ) : (
                'Generate Recommendations'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}