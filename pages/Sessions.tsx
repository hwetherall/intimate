import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSessions, createSession, Session } from '../lib/supabase';
import { useMockSessionsIfNeeded, generateMockSession } from '../lib/mockData';

const Sessions = () => {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  // Fetch sessions when component mounts
  useEffect(() => {
    async function fetchSessions() {
      if (!user) return;
      
      try {
        setLoading(true);
        const { sessions: sessionData, error } = await getSessions(user.id);
        
        if (error) {
          console.error('Error fetching sessions:', error);
          
          // Fall back to mock data for testing
          setUseMockData(true);
          const mockSessions = useMockSessionsIfNeeded(true, user.id, profile?.partner_id);
          setSessions(mockSessions);
          setError(null);
        } else {
          setSessions(sessionData);
        }
      } catch (err) {
        console.error('Error in sessions fetch:', err);
        
        // Fall back to mock data for testing
        setUseMockData(true);
        const mockSessions = useMockSessionsIfNeeded(true, user.id, profile?.partner_id);
        setSessions(mockSessions);
        setError(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, [user, profile]);

  // Function to generate a new session
  const handleGenerateSession = async () => {
    if (!user || !profile?.partner_id) return;
    
    try {
      setGenerating(true);
      setError(null);
      
      if (useMockData) {
        // Use mock data for testing
        const mockSession = generateMockSession(user.id, profile.partner_id);
        setSessions(prev => [mockSession, ...prev]);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setGenerating(false);
        return;
      }
      
      // Create a basic session structure
      const newSession: Partial<Session> = {
        title: `Intimacy Session ${new Date().toLocaleDateString()}`,
        description: 'A personalized session based on your preferences',
        status: 'new',
        user_id: user.id,
        partner_id: profile.partner_id,
      };
      
      const { session, error } = await createSession(newSession);
      
      if (error) {
        console.error('Error creating session:', error);
        setError('Failed to create a new session. Please try again.');
        return;
      }
      
      if (session) {
        // Add the new session to the list
        setSessions(prev => [session, ...prev]);
        
        // You would typically redirect to the session details page here
        // history.push(`/sessions/${session.id}`);
      }
    } catch (err) {
      console.error('Error generating session:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Intimacy Sessions</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Discover personalized recommendations for your intimate experiences
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!profile?.partner_id || generating}
          onClick={handleGenerateSession}
        >
          {generating ? 'Generating...' : 'Generate New Session'}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6 dark:bg-red-900/30">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {!profile?.partner_id && (
        <div className="rounded-md bg-yellow-50 p-4 mb-6 dark:bg-yellow-900/30">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Partner connection required
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  You need to connect with your partner before generating session recommendations.{' '}
                  <Link to="/profile" className="font-medium underline">
                    Go to your profile
                  </Link>{' '}
                  to add your partner's ID.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500 dark:text-gray-400">Loading sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center dark:bg-gray-800">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No sessions yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {profile?.partner_id
              ? "You haven't generated any intimacy sessions yet."
              : "Connect with your partner to start generating intimacy sessions."}
          </p>
          {profile?.partner_id && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGenerateSession}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Your First Session'}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg dark:bg-gray-800">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {sessions.map((session) => (
              <li key={session.id} className="px-4 py-4 sm:px-6">
                <Link to={`/sessions/${session.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-primary-600 truncate">
                      {session.title}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {session.status}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        {session.description}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 dark:text-gray-400">
                      <p>
                        Created on {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Sessions;
