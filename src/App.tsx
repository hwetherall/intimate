import React, { useState, useEffect } from 'react';
// Removing TestPage import as we're enabling the full app
// import TestPage from './TestPage';

// Enabling full routing system
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import PrivateRoute from '../components/PrivateRoute';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Passport from '../pages/Passport';
import Questions from '../pages/Questions';
import Sessions from '../pages/Sessions';
import SessionDetails from '../pages/SessionDetails';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';

function App() {
  const [appError, setAppError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize app and catch errors
  useEffect(() => {
    // Simulate initialization and check if the environment is set up correctly
    const initApp = async () => {
      try {
        // Check if we're in a browser context
        if (typeof window === 'undefined') {
          throw new Error('App must run in a browser environment');
        }
        
        // Delay to ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsLoading(false);
      } catch (error) {
        console.error('App initialization error:', error);
        setAppError(error instanceof Error ? error.message : 'Unknown error occurred');
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="p-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Loading IntiMate...</h1>
          <p className="text-gray-600 dark:text-gray-400">Setting up your intimate experience</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (appError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="p-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Something went wrong</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{appError}</p>
          <button 
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }
  
  // Main app with router
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            
            {/* Protected routes */}
            <Route element={<PrivateRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="passport" element={<Passport />} />
              <Route path="questions" element={<Questions />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="sessions/:sessionId" element={<SessionDetails />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
