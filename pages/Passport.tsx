import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { calculatePassportCompletion } from '../lib/passportHelpers';

// Define interfaces for TypeScript
interface PassportData {
  completionPercentage: number;
  answeredQuestions: number;
  totalQuestions: number;
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

  // Load passport data
  useEffect(() => {
    const loadPassportData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Calculate passport completion
        const completionData = await calculatePassportCompletion(user.id, passportData.totalQuestions);
        setPassportData(completionData);
      } catch (error) {
        console.error('Error loading passport data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPassportData();
  }, [user]);

  const handleStartQuestionnaire = () => {
    navigate('/questions');
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
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-white">
                {profile?.full_name || 'Not set'}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-800">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Username</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 dark:text-white">
                {profile?.username || 'Not set'}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 dark:bg-gray-700">
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
    </div>
  );
};

export default Passport;
