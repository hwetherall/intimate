import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  getPassportQuestions, 
  getUserPassportAnswers, 
  savePassportAnswer, 
  updatePassportCompletionInProfile 
} from '../lib/passportHelpers';

type Question = {
  id: number;
  text: string;
  type: 'scale' | 'multipleChoice' | 'openEnded';
  options?: string[] | null;
};

type Answer = {
  questionId: number;
  answer: string | number;
};

const Questions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check for question parameter in URL
  useEffect(() => {
    try {
      // Parse query parameters
      const params = new URLSearchParams(location.search);
      const questionParam = params.get('question');
      
      if (questionParam && !isNaN(parseInt(questionParam))) {
        const questionIndex = parseInt(questionParam);
        console.log('Setting question index from URL parameter:', questionIndex);
        setCurrentQuestionIndex(prevIndex => {
          // Only set if within valid range (will be checked after questions load)
          return questionIndex;
        });
      }
    } catch (err) {
      console.error('Error parsing question URL parameter:', err);
    }
  }, [location]);

  // Load questions and user's answers
  useEffect(() => {
    const loadQuestionsAndAnswers = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Loading questions and answers for user:', user.id);
        
        // Fetch questions
        const fetchedQuestions = await getPassportQuestions();
        console.log('Fetched questions:', fetchedQuestions.length);
        setQuestions(fetchedQuestions);
        
        // Fetch user's answers
        const userAnswers = await getUserPassportAnswers(user.id);
        console.log('Fetched user answers:', userAnswers.length);
        
        // Transform data to match our Answer type
        const loadedAnswers = userAnswers.map(item => ({
          questionId: item.question_id,
          answer: item.answer
        }));
        
        setAnswers(loadedAnswers);
        
        // Calculate progress
        const answeredQuestions = new Set(loadedAnswers.map(a => a.questionId));
        const newProgress = Math.round((answeredQuestions.size / fetchedQuestions.length) * 100);
        setProgress(newProgress);
        
        // Ensure URL parameter question index is valid
        const params = new URLSearchParams(location.search);
        const questionParam = params.get('question');
        
        if (questionParam && !isNaN(parseInt(questionParam))) {
          const questionIndex = parseInt(questionParam);
          // Validate the index is within range
          if (questionIndex >= 0 && questionIndex < fetchedQuestions.length) {
            setCurrentQuestionIndex(questionIndex);
          } else {
            console.warn('Question index from URL is out of range:', questionIndex);
            // Find first unanswered question as fallback
            findFirstUnansweredQuestion(answeredQuestions, fetchedQuestions);
          }
        } else {
          // If no URL parameter or invalid, find first unanswered
          findFirstUnansweredQuestion(answeredQuestions, fetchedQuestions);
        }
      } catch (error) {
        console.error('Error loading questions and answers:', error);
        setError('Failed to load questions. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestionsAndAnswers();
  }, [user, location.search]);

  // Helper function to find first unanswered question
  const findFirstUnansweredQuestion = (
    answeredQuestions: Set<number>, 
    fetchedQuestions: Question[]
  ) => {
    if (answeredQuestions.size > 0 && answeredQuestions.size < fetchedQuestions.length) {
      for (let i = 0; i < fetchedQuestions.length; i++) {
        if (!answeredQuestions.has(fetchedQuestions[i].id)) {
          setCurrentQuestionIndex(i);
          break;
        }
      }
    }
  };

  const handleAnswer = async (answer: string | number) => {
    if (!user || questions.length === 0) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Saving answer:', { 
        questionIndex: currentQuestionIndex,
        questionId: questions[currentQuestionIndex]?.id,
        answer 
      });
      
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion) {
        throw new Error('Current question not found');
      }
      
      const existingAnswerIndex = answers.findIndex(a => a.questionId === currentQuestion.id);
      
      let newAnswers = [...answers];
      if (existingAnswerIndex >= 0) {
        // Update existing answer
        newAnswers[existingAnswerIndex] = {
          ...newAnswers[existingAnswerIndex],
          answer
        };
      } else {
        // Add new answer
        newAnswers.push({
          questionId: currentQuestion.id,
          answer
        });
      }
      
      setAnswers(newAnswers);
      
      // Save to database
      await savePassportAnswer(user.id, currentQuestion.id, answer);
      console.log('Answer saved successfully');
      
      // Calculate new progress
      const answeredQuestions = new Set(newAnswers.map(a => a.questionId));
      const newProgress = Math.round((answeredQuestions.size / questions.length) * 100);
      setProgress(newProgress);
      
      // Update profile with passport_completion
      await updatePassportCompletionInProfile(user.id, newProgress);
      console.log('Profile updated with new progress:', newProgress);
      
      // Move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // All questions answered
        console.log('All questions answered, navigating to passport page');
        navigate('/passport');
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      setError('Failed to save your answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    if (loading || questions.length === 0) {
      return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div></div>;
    }
    
    if (error) {
      return (
        <div className="p-4 bg-red-50 text-red-800 rounded-md dark:bg-red-900/20 dark:text-red-400">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm underline"
          >
            Refresh page
          </button>
        </div>
      );
    }

    // Safety check for index
    if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
      console.error('Current question index out of bounds:', currentQuestionIndex);
      return (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md dark:bg-yellow-900/20 dark:text-yellow-400">
          <p>Invalid question selected. Please start over.</p>
          <button
            onClick={() => {
              setCurrentQuestionIndex(0);
              navigate('/questions');
            }}
            className="mt-2 text-sm underline"
          >
            Go to first question
          </button>
        </div>
      );
    }
    
    const question = questions[currentQuestionIndex];
    const existingAnswer = answers.find(a => a.questionId === question.id);
    
    switch (question.type) {
      case 'scale':
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">{question.text}</h3>
            <div className="flex justify-between space-x-2">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  onClick={() => handleAnswer(value)}
                  disabled={isSubmitting}
                  className={`btn-scale ${existingAnswer && existingAnswer.answer == value ? 'bg-primary-600 text-white' : ''}`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs mt-2 text-gray-500">
              <span>Not comfortable</span>
              <span>Very comfortable</span>
            </div>
          </div>
        );
        
      case 'multipleChoice':
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">{question.text}</h3>
            <div className="space-y-2">
              {question.options?.map(option => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={isSubmitting}
                  className={`btn-choice w-full text-left ${existingAnswer && existingAnswer.answer === option ? 'bg-primary-100 border-primary-600 dark:bg-primary-900/30' : ''}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'openEnded':
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 dark:text-white">{question.text}</h3>
            <textarea
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={4}
              placeholder="Your answer..."
              defaultValue={existingAnswer?.answer?.toString() || ''}
              onBlur={(e) => handleAnswer(e.target.value)}
              disabled={isSubmitting}
            ></textarea>
          </div>
        );
        
      default:
        return null;
    }
  };

  const handleFinish = () => {
    console.log('Saving and exiting to passport page');
    navigate('/passport');
  };

  if (!user) {
    return <p>Please log in to access the questionnaire.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Intimacy Passport Questionnaire</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Answer questions to build your intimacy passport
        </p>
      </div>
      
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Question card */}
      <div className="bg-white shadow-md rounded-lg p-6 dark:bg-gray-800">
        {renderQuestion()}
        
        {/* Show loading indicator while submitting */}
        {isSubmitting && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin h-5 w-5 border-2 border-primary-600 rounded-full border-t-transparent"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Saving your answer...</span>
          </div>
        )}
        
        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0 || isSubmitting}
            className="btn btn-secondary"
          >
            Previous
          </button>
          
          <button
            type="button"
            onClick={handleFinish}
            className="btn btn-outline"
          >
            Save and Exit
          </button>
          
          <button
            type="button"
            onClick={() => {
              if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
              } else {
                handleFinish();
              }
            }}
            disabled={isSubmitting}
            className="btn btn-secondary"
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
          </button>
        </div>
      </div>
      
      {/* Question dots navigation */}
      {questions.length > 0 && (
        <div className="mt-6 flex justify-center">
          <div className="flex flex-wrap justify-center gap-2 max-w-full px-4">
            {questions.map((_, index) => {
              // Find if this question has an answer
              const hasAnswer = answers.some(a => a.questionId === questions[index]?.id);
              
              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  disabled={loading || isSubmitting}
                  className={`w-3 h-3 rounded-full ${
                    index === currentQuestionIndex
                      ? 'bg-primary-600'
                      : hasAnswer
                        ? 'bg-primary-300 dark:bg-primary-800'
                        : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  aria-label={`Go to question ${index + 1}`}
                  title={`Question ${index + 1}${hasAnswer ? ' (Answered)' : ''}`}
                ></button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
