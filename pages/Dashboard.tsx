import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, profile } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'User'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Passport Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg dark:bg-gray-800">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-md p-3 dark:bg-primary-900">
                <svg className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">Your Passport</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">Complete your profile</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3 dark:bg-gray-700">
            <div className="text-sm">
              <Link to="/passport" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                View details
              </Link>
            </div>
          </div>
        </div>

        {/* Partner Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg dark:bg-gray-800">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-secondary-100 rounded-md p-3 dark:bg-secondary-900">
                <svg className="h-6 w-6 text-secondary-600 dark:text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">Partner Connection</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {profile?.partner_id ? 'Connected' : 'Not connected'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3 dark:bg-gray-700">
            <div className="text-sm">
              <Link to="/profile" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                {profile?.partner_id ? 'View partner' : 'Connect with partner'}
              </Link>
            </div>
          </div>
        </div>

        {/* Sessions Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg dark:bg-gray-800">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-pink-100 rounded-md p-3 dark:bg-pink-900">
                <svg className="h-6 w-6 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate dark:text-gray-400">Intimacy Sessions</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">Explore recommendations</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3 dark:bg-gray-700">
            <div className="text-sm">
              <Link to="/sessions" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
                View sessions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
