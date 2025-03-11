import { Session, SessionActivity } from './supabase';

// Mock helper to generate session data for testing
export const generateMockSession = (userId: string, partnerId?: string): Session => {
  const sessionId = `session-${Math.random().toString(36).substring(2, 10)}`;
  
  const mockSession: Session = {
    id: sessionId,
    user_id: userId,
    partner_id: partnerId,
    title: `Intimacy Session ${new Date().toLocaleDateString()}`,
    description: 'A personalized session based on your preferences',
    status: 'new',
    created_at: new Date().toISOString(),
    activities: generateMockActivities(sessionId),
  };
  
  return mockSession;
};

// Generate mock activities for a session
const generateMockActivities = (sessionId: string): SessionActivity[] => {
  const activityTypes = [
    {
      title: 'Appreciation Exercise',
      description: 'Take turns expressing three things you appreciate about each other, being as specific as possible.',
    },
    {
      title: 'Eye Gazing',
      description: 'Sit comfortably facing each other and maintain eye contact for 5 minutes without speaking. Notice what emotions arise.',
    },
    {
      title: 'Mindful Touch',
      description: 'Take turns giving each other a gentle hand or shoulder massage for 5 minutes each, focusing on being present with the sensation.',
    },
    {
      title: 'Vulnerability Sharing',
      description: 'Share something you\'ve been hesitant to express, while your partner listens without judgment.',
    },
    {
      title: 'Breathwork Together',
      description: 'Sit facing each other and synchronize your breathing for 3 minutes, inhaling and exhaling together.',
    },
    {
      title: 'Future Visioning',
      description: 'Discuss one aspect of your future together that excites you, being specific about what you look forward to.',
    },
    {
      title: 'Gratitude Practice',
      description: 'Express gratitude for three ways your partner has supported you recently.',
    },
    {
      title: 'Active Listening',
      description: 'Take turns speaking for 3 minutes about your day while the other person listens without interrupting, then summarizes what they heard.',
    },
  ];
  
  // Select 3-5 random activities
  const numberOfActivities = Math.floor(Math.random() * 3) + 3; // 3 to 5 activities
  const selectedActivities = [...activityTypes].sort(() => 0.5 - Math.random()).slice(0, numberOfActivities);
  
  return selectedActivities.map((activity, index) => ({
    id: `activity-${Math.random().toString(36).substring(2, 10)}`,
    session_id: sessionId,
    title: activity.title,
    description: activity.description,
    order: index + 1,
    completed: false,
  }));
};

// Helper function to use mock data if Supabase connection fails
export const useMockSessionsIfNeeded = (enabled: boolean, userId: string, partnerId?: string): Session[] => {
  if (!enabled) return [];
  
  const numberOfSessions = Math.floor(Math.random() * 3) + 2; // 2 to 4 sessions
  const mockSessions: Session[] = [];
  
  for (let i = 0; i < numberOfSessions; i++) {
    mockSessions.push(generateMockSession(userId, partnerId));
  }
  
  return mockSessions;
}; 