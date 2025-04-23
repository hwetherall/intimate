// src/components/AskAdviceForm.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase';

export default function AskAdviceForm() {
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get fresh token
      const { data: sessionData } = await createBrowserClient().auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        setError("Authentication error - please try signing in again");
        setIsLoading(false);
        return;
      }
      
      // Call a new API endpoint for Q&A
      const response = await fetch('/api/ask-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResponse(data.response);
        
        // Store question and response in history
        await fetch('/api/question-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            question, 
            response: data.response 
          }),
          credentials: 'include',
        });
      } else {
        setError(data.error || 'Failed to get response');
      }
    } catch (error) {
      setError('An error occurred while processing your question');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-foreground/10 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Ask for Advice</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="question" className="block text-sm font-medium mb-2">
            What would you like advice on?
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full p-3 border border-foreground/20 rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground/30"
            rows={3}
            placeholder="Ask a question about intimacy, communication, or relationship dynamics..."
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="py-2 px-4 bg-foreground text-background font-medium rounded-md disabled:opacity-70"
        >
          {isLoading ? 'Getting advice...' : 'Get Advice'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}
      
      {response && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Advice:</h3>
          <div className="p-4 bg-foreground/5 rounded-lg">
            {response.split('\n').map((paragraph, i) => (
              <p key={i} className={i > 0 ? 'mt-4' : ''}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}