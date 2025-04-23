'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase';
import ScenarioSelector from './ScenarioSelector';

type Question = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  type: 'multiple-choice' | 'text';
};

type CoachPersonality = {
  name: string;
  greeting: string;
};

type WizardProps = {
  planId?: string;
  isPartner?: boolean;
  spiciness?: string;
  duration?: string;
  scenario?: string;
  onPlanCreated: (plan: any) => void;
};

const SPICINESS_LEVELS = [
  { id: 'mild', label: 'Mild Connection', description: 'Focused on emotional intimacy and gentle touch' },
  { id: 'warm', label: 'Warm Embrace', description: 'Affectionate and sensual but not explicitly sexual' },
  { id: 'spicy', label: 'Spicy Encounter', description: 'Moderately passionate with clear sexual elements' },
  { id: 'hot', label: 'Hot & Heavy', description: 'Intensely passionate with adventurous elements' },
  { id: 'wild', label: 'Wild Adventure', description: 'Boundary-pushing exploration for experienced couples' },
];

const DURATION_OPTIONS = [
  { id: 'quick', label: 'Quick Connect', description: '15-20 min - Brief but meaningful connection' },
  { id: 'sweet', label: 'Sweet Spot', description: '30-45 min - Balanced experience with time for connection and passion' },
  { id: 'full', label: 'Full Experience', description: '60-90 min - Extended session with multiple elements' },
  { id: 'evening', label: 'Evening Journey', description: '2+ hours - Immersive experience with multiple phases' },
];

export default function SessionPlanningWizard({
  planId,
  isPartner = false,
  spiciness: initialSpiciness,
  duration: initialDuration,
  scenario: initialScenario,
  onPlanCreated
}: WizardProps) {
  const { user } = useAuth();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [step, setStep] = useState(isPartner ? 3 : 0);
  const [spiciness, setSpiciness] = useState(initialSpiciness || '');
  const [duration, setDuration] = useState(initialDuration || '');
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState(initialScenario || '');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coachPersonality, setCoachPersonality] = useState<CoachPersonality>({
    name: 'AI Coach',
    greeting: 'Let\'s plan your next intimate experience!'
  });

  // Fetch scenarios when spiciness changes
  useEffect(() => {
    const fetchScenarios = async () => {
      if (!spiciness || step !== 2) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        
        if (!token) {
          setError('Authentication error - please try signing in again');
          setLoading(false);
          return;
        }
        
        // Make API call to get scenarios
        const response = await fetch('/api/session-plan/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            spiciness,
            duration,
            isScenarioRequest: true
          }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setScenarios(data.scenarios || []);
          if (data.coachPersonality) {
            setCoachPersonality(data.coachPersonality);
          }
        } else {
          setError(data.error || 'Failed to load scenarios');
        }
      } catch (error) {
        console.error('Error fetching scenarios:', error);
        setError('An error occurred while loading scenarios');
      } finally {
        setLoading(false);
      }
    };
    
    fetchScenarios();
  }, [spiciness, step, supabase]);

  // Fetch questions when needed
  useEffect(() => {
    const fetchQuestions = async () => {
      if ((step !== 3 && step !== 4) || loading) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        
        if (!token) {
          setError('Authentication error - please try signing in again');
          setLoading(false);
          return;
        }
        
        // Make API call to get questions
        const response = await fetch('/api/session-plan/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            spiciness,
            duration,
            scenario: selectedScenario,
            isPartner,
            planId,
            previousAnswers: answers
          }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setQuestions(data.questions || []);
          if (data.coachPersonality) {
            setCoachPersonality(data.coachPersonality);
          }
        } else {
          setError(data.error || 'Failed to load questions');
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
        setError('An error occurred while loading questions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [step, spiciness, duration, selectedScenario, planId, isPartner, answers, loading, supabase]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleInitiatorComplete = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        setError('Authentication error - please try signing in again');
        setLoading(false);
        return;
      }
      
      // Make API call to create session plan
      const response = await fetch('/api/session-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          spiciness,
          duration,
          selectedScenario,
          answers
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        onPlanCreated(data.plan);
      } else {
        setError(data.error || 'Failed to create session plan');
      }
    } catch (error) {
      console.error('Error creating session plan:', error);
      setError('An error occurred while creating the session plan');
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerComplete = async () => {
    if (!planId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        setError('Authentication error - please try signing in again');
        setLoading(false);
        return;
      }
      
      // Make API call to generate final plan
      const response = await fetch('/api/session-plan/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId,
          answers
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        onPlanCreated(data.plan);
      } else {
        setError(data.error || 'Failed to generate session plan');
      }
    } catch (error) {
      console.error('Error generating session plan:', error);
      setError('An error occurred while generating the session plan');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    // Validation logic
    if (step === 0 && !spiciness) {
      setError('Please select a spiciness level');
      return;
    }
    
    if (step === 1 && !duration) {
      setError('Please select a duration');
      return;
    }
    
    if (step === 2 && !selectedScenario) {
      setError('Please select a scenario');
      return;
    }
    
    if (step === 3) {
      // Check if we have answers for all questions
      const unansweredQuestions = questions.filter(q => !answers[q.id]);
      if (unansweredQuestions.length > 0) {
        setError('Please answer all questions before continuing');
        return;
      }
      
      // If the user is the initiator, create the session plan
      if (!isPartner) {
        handleInitiatorComplete();
        return;
      }
    }
    
    if (step === 4) {
      // Check if the partner has answered all questions
      const unansweredQuestions = questions.filter(q => !answers[q.id]);
      if (unansweredQuestions.length > 0) {
        setError('Please answer all questions before continuing');
        return;
      }
      
      // Generate the final session plan
      handlePartnerComplete();
      return;
    }
    
    // Clear error and move to next step
    setError(null);
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    if (step === 0 || (isPartner && step === 3)) return;
    setStep(prev => prev - 1);
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">How spicy would you like this experience?</h2>
            <div className="space-y-4">
              {SPICINESS_LEVELS.map(level => (
                <div 
                  key={level.id}
                  className={`p-4 border rounded-md cursor-pointer ${
                    spiciness === level.id 
                      ? 'border-foreground bg-foreground/5' 
                      : 'border-foreground/20 hover:border-foreground/40'
                  }`}
                  onClick={() => setSpiciness(level.id)}
                >
                  <div className="font-medium">{level.label}</div>
                  <div className="text-foreground/70 text-sm mt-1">{level.description}</div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">How much time would you like to set aside?</h2>
            <div className="space-y-4">
              {DURATION_OPTIONS.map(option => (
                <div 
                  key={option.id}
                  className={`p-4 border rounded-md cursor-pointer ${
                    duration === option.id 
                      ? 'border-foreground bg-foreground/5' 
                      : 'border-foreground/20 hover:border-foreground/40'
                  }`}
                  onClick={() => setDuration(option.id)}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-foreground/70 text-sm mt-1">{option.description}</div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 2:
        return (
          <ScenarioSelector 
            scenarios={scenarios}
            selectedScenario={selectedScenario}
            onSelect={setSelectedScenario}
            loading={loading}
          />
        );
      
      case 3:
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-4">
              {step === 3 && !isPartner && "Let's personalize your experience"}
              {step === 3 && isPartner && "Your partner has started planning"}
              {step === 4 && "A few more questions to perfect your plan"}
            </h2>
            
            {coachPersonality.greeting && (
              <div className="p-4 bg-foreground/5 rounded-md mb-6">
                <p className="italic text-foreground/80">{coachPersonality.greeting}</p>
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {questions.map((question, index) => (
                  <div key={question.id} className="border border-foreground/10 rounded-md p-4">
                    <div className="font-medium mb-3">{index + 1}. {question.text}</div>
                    
                    {question.type === 'multiple-choice' ? (
                      <div className="space-y-2">
                        {question.options.map(option => (
                          <label key={option.id} className="flex items-start p-2 border border-foreground/10 rounded cursor-pointer hover:bg-foreground/5">
                            <input 
                              type="radio"
                              name={question.id}
                              value={option.id}
                              checked={answers[question.id] === option.id}
                              onChange={() => handleAnswerChange(question.id, option.id)}
                              className="mt-1 mr-3"
                            />
                            <span>{option.text}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        className="w-full p-2 border border-foreground/20 rounded-md bg-transparent"
                        rows={3}
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="Share your thoughts..."
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <header className="py-6 border-b border-foreground/10 mb-8">
          <h1 className="text-2xl font-bold">Plan Your Next Session</h1>
          <p className="text-foreground/70">
            Create a personalized intimate experience together
          </p>
        </header>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {/* Progress indicator */}
        {!isPartner && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <div className={`text-sm ${step >= 0 ? 'text-foreground' : 'text-foreground/40'}`}>Spiciness</div>
              <div className={`text-sm ${step >= 1 ? 'text-foreground' : 'text-foreground/40'}`}>Duration</div>
              <div className={`text-sm ${step >= 2 ? 'text-foreground' : 'text-foreground/40'}`}>Scenario</div>
              <div className={`text-sm ${step >= 3 ? 'text-foreground' : 'text-foreground/40'}`}>Questions</div>
            </div>
            <div className="h-2 bg-foreground/10 rounded-full">
              <div 
                className="h-2 bg-foreground rounded-full transition-all"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Step content */}
        <div className="bg-background border border-foreground/10 rounded-lg p-6 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={step === 0 || (isPartner && step === 3) || loading}
            className="py-2 px-4 border border-foreground/20 rounded-md hover:bg-foreground/5 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNextStep}
            disabled={loading}
            className="py-2 px-4 bg-foreground text-background font-medium rounded-md disabled:opacity-70 flex items-center"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {step < 3 && 'Next'}
            {step === 3 && !isPartner && 'Submit & Invite Partner'}
            {step === 3 && isPartner && 'Next'}
            {step === 4 && 'Generate Session Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}