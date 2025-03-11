/**
 * Passport Helpers
 * 
 * Utility functions for working with the Intimacy Passport feature.
 */

import { supabase } from './supabase';
import { 
  getPassportQuestions as getStaticPassportQuestions,
  PassportQuestion,
  getQuestionsByCategory,
  getCategoryLabel
} from './passportQuestions';

/**
 * Fetches a user's passport answers from the database
 */
export const getUserPassportAnswers = async (userId: string) => {
  if (!userId) {
    console.error('getUserPassportAnswers: User ID is required');
    throw new Error('User ID is required');
  }
  
  try {
    console.log('Fetching passport answers for user:', userId);
    const { data, error } = await supabase
      .from('passport_answers')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching passport answers:', error);
      throw error;
    }
    
    console.log('Successfully fetched passport answers:', data?.length || 0, 'answers found');
    return data || [];
  } catch (err) {
    console.error('Exception in getUserPassportAnswers:', err);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
};

/**
 * Saves or updates a user's answer to a passport question
 */
export const savePassportAnswer = async (userId: string, questionId: number, answer: string | number) => {
  if (!userId) {
    console.error('savePassportAnswer: User ID is required');
    throw new Error('User ID is required');
  }
  
  try {
    console.log('Saving passport answer:', { userId, questionId, answer });
    
    // First check if the table exists by trying a simple query
    const { error: tableCheckError } = await supabase
      .from('passport_answers')
      .select('count', { count: 'exact', head: true });
      
    if (tableCheckError) {
      console.error('Error accessing passport_answers table (might not exist):', tableCheckError);
      // Create the table structure if it doesn't exist
      console.log('Attempting to create passport answers structure...');
      await createPassportStructure();
    }
    
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
      
    if (error) {
      console.error('Error saving passport answer:', error);
      throw error;
    }
    
    console.log('Successfully saved passport answer');
    return data;
  } catch (err) {
    console.error('Exception in savePassportAnswer:', err);
    throw err;
  }
};

/**
 * Creates the necessary tables for passport functionality if they don't exist
 */
export const createPassportStructure = async () => {
  try {
    // Create passport_answers table
    const createAnswersTable = await supabase.rpc('create_passport_tables');
    console.log('Passport tables creation result:', createAnswersTable);
    return true;
  } catch (err) {
    console.error('Failed to create passport structure:', err);
    return false;
  }
};

/**
 * Calculates a user's passport completion percentage
 */
export const calculatePassportCompletion = async (userId: string, totalQuestions: number) => {
  if (!userId) {
    console.error('calculatePassportCompletion: User ID is required');
    throw new Error('User ID is required');
  }
  
  try {
    console.log('Calculating passport completion for user:', userId);
    const answers = await getUserPassportAnswers(userId);
    
    // Get unique answered questions
    const uniqueQuestionIds = new Set(answers.map(a => a.question_id));
    
    // Calculate percentage
    const percentage = Math.round((uniqueQuestionIds.size / totalQuestions) * 100);
    
    console.log('Passport completion calculation:', { 
      answered: uniqueQuestionIds.size, 
      total: totalQuestions, 
      percentage 
    });
    
    return {
      completionPercentage: percentage,
      answeredQuestions: uniqueQuestionIds.size,
      totalQuestions
    };
  } catch (err) {
    console.error('Exception in calculatePassportCompletion:', err);
    // Return default values instead of throwing to prevent UI crashes
    return {
      completionPercentage: 0,
      answeredQuestions: 0,
      totalQuestions
    };
  }
};

/**
 * Updates the user's profile with their passport completion percentage
 */
export const updatePassportCompletionInProfile = async (userId: string, completionPercentage: number) => {
  if (!userId) {
    console.error('updatePassportCompletionInProfile: User ID is required');
    throw new Error('User ID is required');
  }
  
  try {
    console.log('Updating profile passport completion:', { userId, completionPercentage });
    const { error } = await supabase
      .from('profiles')
      .update({
        passport_completion: completionPercentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error('Error updating passport completion in profile:', error);
      throw error;
    }
    
    console.log('Successfully updated profile passport completion');
    return true;
  } catch (err) {
    console.error('Exception in updatePassportCompletionInProfile:', err);
    return false;
  }
};

/**
 * Fetches all passport questions from the database, or returns the default ones if not in DB
 */
export const getPassportQuestions = async (mode?: 'standard' | 'spicy' | 'all') => {
  try {
    console.log('Fetching passport questions');
    const { data, error } = await supabase
      .from('passport_questions')
      .select('*')
      .order('id', { ascending: true });
      
    if (error) {
      console.error('Error fetching passport questions:', error);
      // Return default questions if database query fails
      console.log('Falling back to default questions');
      return getDefaultPassportQuestions(mode);
    }
    
    if (data && data.length > 0) {
      console.log('Successfully fetched', data.length, 'passport questions from DB');
      // If mode is specified, filter questions by mode
      if (mode && mode !== 'all') {
        return data.filter(q => q.questionMode === mode);
      }
      return data;
    }
    
    // If no questions in DB, return defaults
    console.log('No questions found in DB, using default questions');
    return getDefaultPassportQuestions(mode);
  } catch (err) {
    console.error('Exception in getPassportQuestions:', err);
    return getDefaultPassportQuestions(mode);
  }
};

/**
 * Returns default passport questions when database is not available
 */
export const getDefaultPassportQuestions = (mode?: 'standard' | 'spicy' | 'all') => {
  console.log('Using default passport questions');
  return getStaticPassportQuestions(mode || 'all');
};

/**
 * Gets partner's answers for comparison if a partner connection exists
 */
export const getPartnerPassportAnswers = async (userId: string) => {
  if (!userId) {
    console.error('getPartnerPassportAnswers: User ID is required');
    throw new Error('User ID is required');
  }
  
  try {
    console.log('Fetching partner passport answers for user:', userId);
    // First, get the user's profile to find their partner_id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('partner_id')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw profileError;
    }
    
    // If no partner connection, return empty array
    if (!profileData?.partner_id) {
      console.log('No partner connection found for user:', userId);
      return [];
    }
    
    console.log('Found partner connection:', profileData.partner_id);
    
    // Fetch partner's answers
    const { data, error } = await supabase
      .from('passport_answers')
      .select('*')
      .eq('user_id', profileData.partner_id);
      
    if (error) {
      console.error('Error fetching partner answers:', error);
      throw error;
    }
    
    console.log('Successfully fetched partner answers:', data?.length || 0, 'answers found');
    return data || [];
  } catch (err) {
    console.error('Exception in getPartnerPassportAnswers:', err);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
};

/**
 * Compares user's answers with their partner's and returns compatibility scores
 */
export const comparePassportAnswers = async (userId: string) => {
  if (!userId) {
    console.error('comparePassportAnswers: User ID is required');
    throw new Error('User ID is required');
  }
  
  try {
    console.log('Comparing passport answers for user:', userId);
    // Get user and partner answers
    const userAnswers = await getUserPassportAnswers(userId);
    const partnerAnswers = await getPartnerPassportAnswers(userId);
    
    // If either has no answers or no partner, return null
    if (userAnswers.length === 0 || partnerAnswers.length === 0) {
      console.log('Not enough data for comparison:', { 
        userAnswersCount: userAnswers.length, 
        partnerAnswersCount: partnerAnswers.length 
      });
      return null;
    }
    
    // Get all questions
    const questions = await getPassportQuestions();
    
    // Create a map of question types for easy access
    const questionTypes = new Map(questions.map(q => [q.id, q.type]));
    
    // Create a map of question text for generating insights
    const questionTexts = new Map(questions.map(q => [q.id, q.text]));
    
    // Calculate compatibility scores by category
    const compatibility = {
      overall: 0,
      communication: 0,
      boundaries: 0,
      intimacy: 0,
      // Add more categories as needed
    };
    
    // Track how many questions were compared in each category
    const categoryQuestionCounts = {
      overall: 0,
      communication: 0,
      boundaries: 0,
      intimacy: 0,
    };
    
    // Track insights based on significant differences or similarities
    const insights = {
      strengths: [] as string[],
      opportunities: [] as string[],
      questionSpecific: [] as { questionId: number, text: string, insight: string }[]
    };
    
    // Helper function to get question category from the question
    const getQuestionCategory = (questionId: number) => {
      // Find the question in all possible questions
      const allQuestions = getStaticPassportQuestions('all');
      const question = allQuestions.find(q => q.id === questionId);
      
      if (question) {
        return question.category;
      }
      
      // Fallback to simplified version for legacy questions
      if (questionId === 1 || questionId === 5) return 'communication';
      if (questionId === 3) return 'boundaries';
      if (questionId === 2 || questionId === 4) return 'physical';
      return 'other';
    };
    
    console.log('Starting comparison of', userAnswers.length, 'user answers with', partnerAnswers.length, 'partner answers');
    
    // Calculate compatibility for each question that both partners have answered
    userAnswers.forEach(userAnswer => {
      const partnerAnswer = partnerAnswers.find(a => a.question_id === userAnswer.question_id);
      if (!partnerAnswer) return; // Skip if partner hasn't answered this question
      
      const questionId = userAnswer.question_id;
      const questionType = questionTypes.get(questionId);
      const category = getQuestionCategory(questionId);
      const questionText = questionTexts.get(questionId) || '';
      
      let score = 0;
      
      // Calculate score based on question type
      if (questionType === 'scale') {
        // For scale questions, calculate how close the answers are (0-5 scale)
        const userValue = parseInt(userAnswer.answer);
        const partnerValue = parseInt(partnerAnswer.answer);
        const diff = Math.abs(userValue - partnerValue);
        score = 100 - (diff * 20); // 5 difference = 0% compatibility, 0 difference = 100%
        
        // Generate insights for scale questions
        if (diff === 0 && userValue >= 4) {
          insights.strengths.push(`You both rated "${questionText.toLowerCase()}" highly (${userValue}/5).`);
        } 
        else if (diff >= 3) {
          insights.opportunities.push(`You and your partner have different perspectives on "${questionText.toLowerCase()}".`);
          insights.questionSpecific.push({
            questionId,
            text: questionText,
            insight: `You rated this ${userValue}/5, while your partner rated it ${partnerValue}/5.`
          });
        }
      } 
      else if (questionType === 'multipleChoice') {
        // For multiple choice, exact match = 100%, no match = 0%
        score = userAnswer.answer === partnerAnswer.answer ? 100 : 0;
        
        // Generate insights for multiple choice
        if (score === 100) {
          insights.strengths.push(`You both prefer ${userAnswer.answer.toLowerCase()} as a way to receive affection.`);
        } else {
          insights.questionSpecific.push({
            questionId,
            text: questionText,
            insight: `You prefer "${userAnswer.answer}", while your partner prefers "${partnerAnswer.answer}".`
          });
        }
      }
      else if (questionType === 'openEnded') {
        // For open-ended questions, we can't automatically calculate compatibility
        // Just give a neutral score
        score = 50;
        
        // Add the open-ended response to question-specific insights
        insights.questionSpecific.push({
          questionId,
          text: questionText,
          insight: `Your answer: "${userAnswer.answer}", Your partner's answer: "${partnerAnswer.answer}"`
        });
      }
      
      // Update overall score
      compatibility.overall += score;
      categoryQuestionCounts.overall++;
      
      // Update category score if applicable
      if (category !== 'other' && category in compatibility) {
        compatibility[category as keyof typeof compatibility] += score;
        categoryQuestionCounts[category as keyof typeof categoryQuestionCounts]++;
      }
    });
    
    // Calculate averages
    for (const category in compatibility) {
      const count = categoryQuestionCounts[category as keyof typeof categoryQuestionCounts];
      if (count > 0) {
        compatibility[category as keyof typeof compatibility] = 
          Math.round(compatibility[category as keyof typeof compatibility] / count);
      }
    }
    
    // Generate category-specific insights
    if (compatibility.communication >= 80) {
      insights.strengths.push("You have strong communication compatibility with your partner.");
    } else if (compatibility.communication <= 40) {
      insights.opportunities.push("Communication might be an area to focus on with your partner.");
    }
    
    if (compatibility.boundaries >= 80) {
      insights.strengths.push("You and your partner have similar boundaries.");
    } else if (compatibility.boundaries <= 40) {
      insights.opportunities.push("You might want to discuss boundaries more with your partner.");
    }
    
    if (compatibility.intimacy >= 80) {
      insights.strengths.push("You have strong intimacy compatibility with your partner.");
    } else if (compatibility.intimacy <= 40) {
      insights.opportunities.push("You and your partner have different intimacy preferences to explore.");
    }
    
    console.log('Compatibility calculation complete:', compatibility);
    
    return {
      ...compatibility,
      insights
    };
  } catch (err) {
    console.error('Exception in comparePassportAnswers:', err);
    // Return null instead of throwing to prevent UI crashes
    return null;
  }
}; 