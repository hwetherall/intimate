import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSession, updateSession, updateSessionActivity, Session, SessionActivity } from '../lib/supabase';
import { generateMockSession } from '../lib/mockData';

const SessionDetails = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    async function fetchSessionDetails() {
      if (!sessionId || !user) return;
      
      try {
        setLoading(true);
        const { session: sessionData, error } = await getSession(sessionId);
        
        if (error) {
          console.error('Error fetching session details:', error);
          
          // Fall back to mock data for testing
          if (sessionId.startsWith('session-')) {
            setUseMockData(true);
            // For mock sessions, generate a consistent mock session based on the ID
            const mockSession = generateMockSession(user.id, profile?.partner_id);
            mockSession.id = sessionId;
            setSession(mockSession);
            setError(null);
          } else {
            setError('Failed to load session details. Please try again later.');
          }
        } else if (!sessionData) {
          if (sessionId.startsWith('session-')) {
            setUseMockData(true);
            // For mock sessions, generate a consistent mock session based on the ID
            const mockSession = generateMockSession(user.id, profile?.partner_id);
            mockSession.id = sessionId;
            setSession(mockSession);
            setError(null);
          } else {
            setError('Session not found.');
          }
        } else if (sessionData.user_id !== user.id) {
          setError('You do not have permission to view this session.');
          navigate('/sessions');
        } else {
          setSession(sessionData);
        }
      } catch (err) {
        console.error('Error in session details fetch:', err);
        
        // Fall back to mock data for testing
        if (sessionId.startsWith('session-')) {
          setUseMockData(true);
          // For mock sessions, generate a consistent mock session based on the ID
          const mockSession = generateMockSession(user.id, profile?.partner_id);
          mockSession.id = sessionId;
          setSession(mockSession);
          setError(null);
        } else {
          setError('An unexpected error occurred. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSessionDetails();
  }, [sessionId, user, navigate, profile]);

  const handleActivityStatusChange = async (activityId: string, completed: boolean) => {
    if (!session) return;
    
    try {
      setSaving(true);
      
      if (useMockData) {
        // For mock data, just update the local state
        setSession(prevSession => {
          if (!prevSession || !prevSession.activities) return prevSession;
          
          const updatedActivities = prevSession.activities.map(activity => 
            activity.id === activityId ? { ...activity, completed } : activity
          );
          
          // Check if all activities are completed
          const allCompleted = updatedActivities.every(activity => activity.completed);
          
          return { 
            ...prevSession, 
            activities: updatedActivities,
            status: allCompleted ? 'completed' : prevSession.status === 'new' ? 'in_progress' : prevSession.status
          };
        });
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setSaving(false);
        return;
      }
      
      // Update the activity in the database
      const { error } = await updateSessionActivity(activityId, { completed });
      
      if (error) {
        console.error('Error updating activity:', error);
        setError('Failed to update activity status. Please try again.');
        return;
      }
      
      // Update the local state
      setSession(prevSession => {
        if (!prevSession || !prevSession.activities) return prevSession;
        
        const updatedActivities = prevSession.activities.map(activity => 
          activity.id === activityId ? { ...activity, completed } : activity
        );
        
        return { ...prevSession, activities: updatedActivities };
      });
      
      // Check if all activities are completed
      const allCompleted = session.activities?.every(activity => 
        activity.id === activityId ? completed : activity.completed
      );
      
      // If all activities are completed, update the session status
      if (allCompleted) {
        const { error: sessionError } = await updateSession(session.id, { status: 'completed' });
        
        if (sessionError) {
          console.error('Error updating session status:', sessionError);
        } else {
          setSession(prevSession => prevSession ? { ...prevSession, status: 'completed' } : null);
        }
      }
    } catch (err) {
      console.error('Error updating activity status:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-gray-500 dark:text-gray-400">Loading session details...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-6 dark:bg-red-900/30">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error || 'Session not found'}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/sessions')}
              >
                Back to Sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {useMockData && (
        <div className="rounded-md bg-blue-50 p-4 mb-6 dark:bg-blue-900/30">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Dev Mode
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>Using mock data for development/testing.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <button
            type="button"
            className="text-primary-600 hover:text-primary-700"
            onClick={() => navigate('/sessions')}
          >
            ← Back to Sessions
          </button>
          <span className={`px-3 py-1 text-xs rounded-full ${
            session.status === 'new' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
            session.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          }`}>
            {session.status === 'new' ? 'New' : 
             session.status === 'in_progress' ? 'In Progress' : 
             'Completed'}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{session.title}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{session.description}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Created on {new Date(session.created_at).toLocaleDateString()}
        </p>
      </div>

      {!session.activities || session.activities.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No activities in this session
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            This session doesn't have any activities yet.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden dark:bg-gray-800">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Activities
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Complete these activities with your partner
            </p>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {session.activities.sort((a, b) => a.order - b.order).map((activity) => (
                <li key={activity.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-start">
                    <div className="mr-4 flex-shrink-0">
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                        checked={activity.completed}
                        onChange={() => handleActivityStatusChange(activity.id, !activity.completed)}
                        disabled={saving}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`text-lg font-medium ${activity.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                        {activity.title}
                      </h4>
                      <p className={`mt-1 ${activity.completed ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        {activity.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDetails; 