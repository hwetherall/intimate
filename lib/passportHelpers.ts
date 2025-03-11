/**
 * Passport Helpers
 * 
 * Utility functions for working with the Intimacy Passport feature.
 */

import { supabase } from './supabase';

/**
 * Fetches a user's passport answers from the database
 */
export const getUserPassportAnswers = async (userId: string) => {
  if (!userId) throw new Error('User ID is required');
  
  const { data, error } = await supabase
    .from('passport_answers')
    .select('*')
    .eq('user_id', userId);
    
  if (error) throw error;
  return data || [];
};

/**
 * Saves or updates a user's answer to a passport question
 */
export const savePassportAnswer = async (userId: string, questionId: number, answer: string | number) => {
  if (!userId) throw new Error('User ID is required');
  
  const { data, error } = await supabase
    .from('passport_answers')
    .upsert({
      user_id: userId,
      question_id: questionId,
      answer: answer.toString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,question_id'
    });
    
  if (error) throw error;
  return data;
};

/**
 * Calculates a user's passport completion percentage
 */
export const calculatePassportCompletion = async (userId: string, totalQuestions: number) => {
  if (!userId) throw new Error('User ID is required');
  
  const answers = await getUserPassportAnswers(userId);
  
  // Get unique answered questions
  const uniqueQuestionIds = new Set(answers.map(a => a.question_id));
  
  // Calculate percentage
  const percentage = Math.round((uniqueQuestionIds.size / totalQuestions) * 100);
  
  return {
    completionPercentage: percentage,
    answeredQuestions: uniqueQuestionIds.size,
    totalQuestions
  };
};

/**
 * Updates the user's profile with their passport completion percentage
 */
export const updatePassportCompletionInProfile = async (userId: string, completionPercentage: number) => {
  if (!userId) throw new Error('User ID is required');
  
  const { error } = await supabase
    .from('profiles')
    .update({
      passport_completion: completionPercentage,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
    
  if (error) throw error;
  return true;
};

/**
 * Fetches all passport questions from the database, or returns the default ones if not in DB
 */
export const getPassportQuestions = async () => {
  const { data, error } = await supabase
    .from('passport_questions')
    .select('*')
    .order('id', { ascending: true });
    
  if (error) {
    console.error('Error fetching passport questions:', error);
    // Return default questions if database query fails
    return getDefaultPassportQuestions();
  }
  
  if (data && data.length > 0) {
    return data;
  }
  
  // If no questions in DB, return defaults
  return getDefaultPassportQuestions();
};

/**
 * Returns default passport questions when database is not available
 */
export const getDefaultPassportQuestions = () => {
  return [
    {
      id: 1,
      text: "How comfortable are you discussing your feelings with your partner?",
      type: "scale",
      options: null
    },
    {
      id: 2,
      text: "What are your preferred ways to receive affection?",
      type: "multipleChoice",
      options: ["Physical touch", "Words of affirmation", "Quality time", "Gifts", "Acts of service"]
    },
    {
      id: 3,
      text: "What boundaries are important for you to maintain in a relationship?",
      type: "openEnded",
      options: null
    },
    {
      id: 4,
      text: "How important is physical intimacy to you in a relationship?",
      type: "scale",
      options: null
    },
    {
      id: 5,
      text: "What activities help you feel most connected to your partner?",
      type: "openEnded",
      options: null
    }
  ];
}; 