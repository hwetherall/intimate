// src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute: React.FC = () => {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
      </div>
    );
  }

  // If there's an authentication error, show a friendly message
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Authentication Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              className="btn btn-primary w-full sm:w-auto"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
            <button 
              className="btn btn-outline w-full sm:w-auto"
              onClick={() => window.location.href = '/login'}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Use mock data for development when no user is available
  const useMockData = !user && process.env.NODE_ENV === 'development';
  
  if (useMockData) {
    console.log('Using mock data for development (no user authenticated)');
    // In development, we'll allow access to protected routes without authentication
    return <Outlet />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;