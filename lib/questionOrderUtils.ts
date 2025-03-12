// lib/questionOrderUtils.ts

import { PassportQuestion } from './passportQuestions';

// Define the preferred order of categories
const categoryOrder = [
  'communication',
  'physical',
  'boundaries',
  'desires',
  'fantasies',
  'mood',
  'kinks',
  'exploration',
  'feedback'
];

// Order questions by category and then by ID within each category
export const orderQuestionsByCategory = (questions: PassportQuestion[]): PassportQuestion[] => {
  return [...questions].sort((a, b) => {
    // Get the index of each category in the categoryOrder array
    const categoryIndexA = categoryOrder.indexOf(a.category);
    const categoryIndexB = categoryOrder.indexOf(b.category);
    
    // If categories are different, sort by category order
    if (categoryIndexA !== categoryIndexB) {
      // Handle categories not in the order list
      if (categoryIndexA === -1) return 1;
      if (categoryIndexB === -1) return -1;
      return categoryIndexA - categoryIndexB;
    }
    
    // If categories are the same, sort by ID
    return a.id - b.id;
  });
};

// Order questions by specific IDs
export const orderQuestionsByCustomOrder = (
  questions: PassportQuestion[], 
  customOrder: number[]
): PassportQuestion[] => {
  // Create a map for quick lookup of position in the customOrder array
  const orderMap = new Map(customOrder.map((id, index) => [id, index]));
  
  return [...questions].sort((a, b) => {
    const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : Number.MAX_SAFE_INTEGER;
    const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : Number.MAX_SAFE_INTEGER;
    
    // If both have custom order positions, sort by those
    if (orderA !== Number.MAX_SAFE_INTEGER && orderB !== Number.MAX_SAFE_INTEGER) {
      return orderA - orderB;
    }
    
    // If only one has a custom order position, prioritize it
    if (orderA !== Number.MAX_SAFE_INTEGER) return -1;
    if (orderB !== Number.MAX_SAFE_INTEGER) return 1;
    
    // If neither has a custom order position, sort by ID as fallback
    return a.id - b.id;
  });
};

// Custom order for standard and spicy questions separately
const standardQuestionOrder = [
  // Communication questions first
  101, 102, 103, 
  // Physical intimacy next
  104, 105, 106, 
  // Boundaries last
  107, 108, 109
];

// Spicy questions in logical flow from easier to more intimate
const spicyQuestionOrder = [
  // Start with desires
  1, 2, 3, 4, 
  // Move to mood and atmosphere 
  13, 14, 15, 16,
  // Then fantasies
  5, 6, 7, 8,
  // Then exploration
  17, 18, 19, 20, 21, 22,
  // Then kinks
  9, 10, 11, 12,
  // End with feedback
  23, 24, 25, 26, 27, 28
];

// Get questions in recommended order based on mode
export const getQuestionsInRecommendedOrder = (
  questions: PassportQuestion[], 
  mode?: 'standard' | 'spicy' | 'all'
): PassportQuestion[] => {
  if (mode === 'standard') {
    return orderQuestionsByCustomOrder(
      questions.filter(q => q.questionMode === 'standard'), 
      standardQuestionOrder
    );
  }
  
  if (mode === 'spicy') {
    return orderQuestionsByCustomOrder(
      questions.filter(q => q.questionMode === 'spicy'), 
      spicyQuestionOrder
    );
  }
  
  // For 'all' or undefined, order standard questions first, then spicy
  const standardQuestions = orderQuestionsByCustomOrder(
    questions.filter(q => q.questionMode === 'standard'),
    standardQuestionOrder
  );
  
  const spicyQuestions = orderQuestionsByCustomOrder(
    questions.filter(q => q.questionMode === 'spicy'),
    spicyQuestionOrder
  );
  
  return [...standardQuestions, ...spicyQuestions];
};