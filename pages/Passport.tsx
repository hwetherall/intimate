import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { calculatePassportCompletion, getUserPassportAnswers, getPassportQuestions, comparePassportAnswers } from '../lib/passportHelpers';

// Define interfaces for TypeScript
interface PassportData {
  completionPercentage: number;
  answeredQuestions: number;
  totalQuestions: number;
}

interface Question {
  id: number;
  text: string;
  type: 'scale' | 'multipleChoice' | 'openEnded';
  options?: string[] | null;
}

interface Answer {
  question_id: number;
  answer: string;
  updated_at: string;
}

interface CompatibilityData {
  overall: number;
  communication: number;
  boundaries: number;
  intimacy: number;
  insights: {
    strengths: string[];
    opportunities: string[];
    questionSpecific: Array<{
      questionId: number;
      text: string;
      insight: string;
    }>;
  };
}

const Passport = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [passportData, setPassportData] = useState<PassportData>({
    completionPercentage: 0,
    answeredQuestions: 0,
    totalQuestions: 5 // Same as the total questions in Questions.tsx
  });
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [partnerComparison, setPartnerComparison] = useState<CompatibilityData | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Load passport data
  useEffect(() => {
    const loadPassportData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        console.log('Loading passport data for user:', user.id, 'with profile:', profile);
        
        // Load questions
        const fetchedQuestions = await getPassportQuestions();
        setQuestions(fetchedQuestions);
        
        // Load user's answers
        const userAnswers = await getUserPassportAnswers(user.id);
        setAnswers(userAnswers);
        
        // Calculate passport completion
        const completionData = await calculatePassportCompletion(
          user.id, 
          fetchedQuestions.length
        );
        setPassportData(completionData);
        
        // Load partner comparison if user has a partner
        if (profile?.partner_id) {
          setLoadingComparison(true);
          try {
            const comparisonData = await comparePassportAnswers(user.id);
            setPartnerComparison(comparisonData);
          } catch (error) {
            console.error('Error loading partner comparison:', error);
          } finally {
            setLoadingComparison(false);
          }
        }
      } catch (error) {
        console.error('Error loading passport data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPassportData();
  }, [user, profile]);

  const handleStartQuestionnaire = () => {
    navigate('/questions');
  };

  const handleEditAnswer = (questionId: number) => {
    // Find the index of the question in the questions array
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex >= 0) {
      // Navigate to questions page with the specific question index
      navigate(`/questions?question=${questionIndex}`);
    }
  };

  // Function to render answer based on question type
  const renderAnswer = (questionId: number, answerText: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return answerText;

    switch (question.type) {
      case 'scale':
        return (
          <div className="flex items-center">
            <span className="text-lg font-medium mr-2">{answerText}</span>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map(value => (
                <div 
                  key={value} 
                  className={`w-2 h-2 rounded-full ${parseInt(answerText) >= value 
                    ? 'bg-primary-600' 
                    : 'bg-gray-300 dark:bg-gray-600'}`}
                ></div>
              ))}
            </div>
          </div>
        );
      case 'multipleChoice':
        return answerText;
      case 'openEnded':
        return (
          <div className="line-clamp-2 text-sm">{answerText}</div>
        );
      default:
        return answerText;
    }
  };

  // Group questions by category (this is just an example - you might want to add real categories to your questions)
  const getQuestionCategories = () => {
    const categories = [
      { id: 'all', name: 'All Questions' },
      { id: 'communication', name: 'Communication' },
      { id: 'boundaries', name: 'Boundaries' },
      { id: 'intimacy', name: 'Intimacy' },
    ];
    return categories;
  };

  // Filter questions by category
  const getFilteredQuestions = () => {
    if (selectedCategory === 'all') return questions;
    
    // This is a simplified example - in a real app, you would have category data for each question
    switch (selectedCategory) {
      case 'communication':
        return questions.filter(q => q.id === 1 || q.id === 5);
      case 'boundaries':
        return questions.filter(q => q.id === 3);
      case 'intimacy':
        return questions.filter(q => q.id === 2 || q.id === 4);
      default:
        return questions;
    }
  };

  // Render compatibility gauge
  const renderCompatibilityGauge = (score: number, label: string) => {
    const getColor = (value: number) => {
      if (value >= 80) return 'bg-green-500';
      if (value >= 60) return 'bg-primary-500';
      if (value >= 40) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    return (
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{score}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className={`${getColor(score)} h-2.5 rounded-full transition-all duration-500`} 
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Intimacy Passport</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Complete your passport to get personalized recommendations
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg dark:bg-gray-800">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Passport Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Your preferences and boundaries
          </p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-700">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Display name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-white">
                {profile?.display_name || 'Not set'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-800">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">User ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-white">
                {profile?.user_id || 'Not set'}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-700">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Gender</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-white">
                {profile?.gender ? (
                  <span className="capitalize">{profile.gender.replace('_', ' ')}</span>
                ) : (
                  'Not set'
                )}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-800">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Partner status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-white">
                {profile?.partner_id ? 'Connected' : 'Not connected'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow sm:rounded-lg dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Complete your passport
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              <p>
                Answer questions about your preferences, boundaries, and interests to create your
                intimacy passport.
              </p>
            </div>
            <div className="mt-5">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartQuestionnaire}
              >
                {passportData.completionPercentage > 0 ? 'Continue questionnaire' : 'Start questionnaire'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white shadow sm:rounded-lg dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Passport completion
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              <p>Your passport is {loading ? 'loading...' : `${passportData.completionPercentage}% complete`}.</p>
              {!loading && passportData.answeredQuestions > 0 && (
                <p className="mt-1">
                  You've answered {passportData.answeredQuestions} out of {passportData.totalQuestions} questions.
                </p>
              )}
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${loading ? 0 : passportData.completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Your Answers Section */}
      {answers.length > 0 && (
        <div className="mt-8">
          <div className="bg-white shadow sm:rounded-lg dark:bg-gray-800">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Your Answers
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Review and edit your passport answers
              </p>
            </div>
            
            {/* Category tabs */}
            <div className="px-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex overflow-x-auto space-x-4 py-2">
                {getQuestionCategories().map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                      selectedCategory === category.id
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Answered questions list */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {getFilteredQuestions().map(question => {
                const answer = answers.find(a => a.question_id === question.id);
                return (
                  <div key={question.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {question.text}
                      </h4>
                      <button
                        onClick={() => handleEditAnswer(question.id)}
                        className="ml-2 text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="mt-2">
                      {answer ? (
                        renderAnswer(question.id, answer.answer)
                      ) : (
                        <span className="text-sm text-gray-500 italic dark:text-gray-400">
                          Not answered yet
                        </span>
                      )}
                    </div>
                    {answer && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Last updated: {new Date(answer.updated_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Partner Comparison Section - only shown if user has a partner */}
      {profile?.partner_id && (
        <div className="mt-8">
          <div className="bg-white shadow sm:rounded-lg dark:bg-gray-800">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Partner Compatibility
              </h3>
              <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                See how your answers align with your partner's
              </p>
              
              {loadingComparison ? (
                <div className="mt-4 flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : partnerComparison ? (
                <div className="mt-4">
                  {renderCompatibilityGauge(partnerComparison.overall, 'Overall Compatibility')}
                  {renderCompatibilityGauge(partnerComparison.communication, 'Communication')}
                  {renderCompatibilityGauge(partnerComparison.boundaries, 'Boundaries')}
                  {renderCompatibilityGauge(partnerComparison.intimacy, 'Intimacy')}
                  
                  {/* Insights section */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    {partnerComparison.insights.strengths.length > 0 && (
                      <div className="bg-green-50 rounded-md p-4 dark:bg-green-900/20">
                        <h4 className="font-medium text-sm mb-2 text-green-800 dark:text-green-400">
                          Relationship Strengths
                        </h4>
                        <ul className="space-y-2">
                          {partnerComparison.insights.strengths.map((strength, index) => (
                            <li key={index} className="text-sm text-green-700 dark:text-green-300">
                              • {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Opportunities */}
                    {partnerComparison.insights.opportunities.length > 0 && (
                      <div className="bg-amber-50 rounded-md p-4 dark:bg-amber-900/20">
                        <h4 className="font-medium text-sm mb-2 text-amber-800 dark:text-amber-400">
                          Areas to Explore Together
                        </h4>
                        <ul className="space-y-2">
                          {partnerComparison.insights.opportunities.map((opportunity, index) => (
                            <li key={index} className="text-sm text-amber-700 dark:text-amber-300">
                              • {opportunity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Question-specific insights */}
                  {partnerComparison.insights.questionSpecific.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-sm mb-3 text-gray-900 dark:text-white">
                        Question-Specific Insights
                      </h4>
                      <div className="space-y-4">
                        {partnerComparison.insights.questionSpecific.map((item) => (
                          <div key={item.questionId} className="bg-gray-50 rounded-md p-4 dark:bg-gray-700">
                            <h5 className="font-medium text-sm text-gray-900 dark:text-white">
                              {item.text}
                            </h5>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {item.insight}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 p-4 rounded-md bg-gray-50 dark:bg-gray-700">
                    <h4 className="font-medium text-sm mb-2 text-gray-900 dark:text-white">What does this mean?</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      These scores indicate how aligned your preferences and boundaries are with your partner's.
                      Higher compatibility doesn't mean a better relationship - it simply helps you understand
                      areas where you may want to have deeper conversations.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-gray-50 rounded-md dark:bg-gray-700">
                  <p className="text-center text-sm">
                    {profile?.partner_id && answers.length > 0 
                      ? "Your partner needs to complete their passport to see compatibility."
                      : "Complete your passport to see compatibility with your partner."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Passport;
