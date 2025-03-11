import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { user } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Load questions and user's answers
  useEffect(() => {
    const loadQuestionsAndAnswers = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch questions
        const fetchedQuestions = await getPassportQuestions();
        setQuestions(fetchedQuestions);
        
        // Fetch user's answers
        const userAnswers = await getUserPassportAnswers(user.id);
        
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
        
        // Find the first unanswered question
        if (answeredQuestions.size > 0 && answeredQuestions.size < fetchedQuestions.length) {
          for (let i = 0; i < fetchedQuestions.length; i++) {
            if (!answeredQuestions.has(fetchedQuestions[i].id)) {
              setCurrentQuestionIndex(i);
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error loading questions and answers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestionsAndAnswers();
  }, [user]);

  const handleAnswer = async (answer: string | number) => {
    if (!user || questions.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      const currentQuestion = questions[currentQuestionIndex];
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
      
      // Calculate new progress
      const answeredQuestions = new Set(newAnswers.map(a => a.questionId));
      const newProgress = Math.round((answeredQuestions.size / questions.length) * 100);
      setProgress(newProgress);
      
      // Update profile with passport_completion
      await updatePassportCompletionInProfile(user.id, newProgress);
      
      // Move to next question or finish
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // All questions answered
        navigate('/passport');
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    if (loading || questions.length === 0) {
      return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div></div>;
    }
    
    const question = questions[currentQuestionIndex];
    
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
                  className="btn-scale"
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
                  className="btn-choice w-full text-left"
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
              onBlur={(e) => handleAnswer(e.target.value)}
              disabled={isSubmitting}
            ></textarea>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (!user) {
    return <p>Please log in to access the questionnaire.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Intimacy Passport Questionnaire</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Help us understand your preferences and boundaries
        </p>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 dark:bg-gray-800">
        {questions.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                {progress}% complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {renderQuestion()}
        
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0 || isSubmitting || loading}
            className="btn btn-outline"
          >
            Previous
          </button>
          <button
            onClick={() => navigate('/passport')}
            className="btn btn-outline"
          >
            Save & Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Questions;
