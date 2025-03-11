// lib/passportQuestions.ts

// Define the question interface
export interface PassportQuestion {
  id: number;
  text: string;
  type: 'scale' | 'multipleChoice' | 'openEnded';
  options?: string[] | null;
  category: string;
  questionMode: 'standard' | 'spicy';
}

// The main function to get all questions with mode filtering
export const getPassportQuestions = (mode?: 'standard' | 'spicy' | 'all'): PassportQuestion[] => {
  const selectedMode = mode || 'all';
  console.log(`Getting passport questions with mode: ${selectedMode}`);
  
  const allQuestions = [
    ...getStandardPassportQuestions().map(q => ({ ...q, questionMode: 'standard' as const })),
    ...getSpicyPassportQuestions().map(q => ({ ...q, questionMode: 'spicy' as const })),
  ] as PassportQuestion[];
  
  if (selectedMode === 'all') {
    return allQuestions;
  }
  
  return allQuestions.filter(q => q.questionMode === selectedMode);
};

// Standard relationship-focused questions
export const getStandardPassportQuestions = () => {
  console.log('Loading standard passport questions');
  return [
    // Communication Category
    {
      id: 101,
      text: "How comfortable are you discussing your desires and boundaries with your partner?",
      type: "scale" as const,
      options: null,
      category: "communication"
    },
    {
      id: 102,
      text: "How do you prefer to give feedback during intimate moments?",
      type: "multipleChoice" as const,
      options: ["Direct verbal guidance", "Non-verbal cues", "Showing what I like", "Discussing afterward", "A mix of approaches"],
      category: "communication"
    },
    {
      id: 103,
      text: "What helps you feel safe expressing your intimate needs?",
      type: "openEnded" as const,
      options: null,
      category: "communication"
    },

    // Physical Intimacy Category
    {
      id: 104,
      text: "How important is physical intimacy to you in your relationship?",
      type: "scale" as const,
      options: null,
      category: "physical"
    },
    {
      id: 105,
      text: "What forms of non-sexual touch help you feel connected?",
      type: "multipleChoice" as const,
      options: ["Holding hands", "Cuddling", "Massage", "Playful touches", "Embracing"],
      category: "physical"
    },
    {
      id: 106,
      text: "How often would your ideal frequency of sexual intimacy be?",
      type: "multipleChoice" as const,
      options: ["Multiple times daily", "Daily", "Several times weekly", "Once a week", "A few times monthly"],
      category: "physical"
    },

    // Boundaries & Consent Category
    {
      id: 107,
      text: "How comfortable are you expressing when something doesn't feel right?",
      type: "scale" as const,
      options: null,
      category: "boundaries"
    },
    {
      id: 108,
      text: "What's your preferred way to check in about consent during intimate moments?",
      type: "multipleChoice" as const,
      options: ["Verbal check-ins", "Established safe words", "Non-verbal signals", "Paying attention to body language", "Prior discussion of boundaries"],
      category: "boundaries"
    },
    {
      id: 109,
      text: "What boundaries are absolute must-respects for you?",
      type: "openEnded" as const,
      options: null,
      category: "boundaries"
    }
  ];
};

// Spicy questions focused on sexual intimacy - this is the updated list from the user
export const getSpicyPassportQuestions = (): Omit<PassportQuestion, 'questionMode'>[] => {
  console.log('Using spicy passport questions with exploration for IntiMate');
  return [
    // Desires & Turn-Ons Category
    {
      id: 1,
      text: "What's the hottest thing your partner could whisper in your ear to turn you on?",
      type: "openEnded" as const,
      options: null,
      category: "desires"
    },
    {
      id: 2,
      text: "How much do you enjoy teasing or being teased before things heat up?",
      type: "scale" as const,
      options: null,
      category: "desires"
    },
    {
      id: 3,
      text: "What kind of touch drives you wild?",
      type: "multipleChoice" as const,
      options: ["Slow and sensual", "Rough and passionate", "Light and teasing", "Firm and commanding", "Surprise me"],
      category: "desires"
    },
    {
      id: 4,
      text: "What's a secret turn-on you've never shared?",
      type: "openEnded" as const,
      options: null,
      category: "desires"
    },

    // Fantasies & Role-Play Category
    {
      id: 5,
      text: "What fantasy scenario would you love to act out with your partner?",
      type: "openEnded" as const,
      options: null,
      category: "fantasies"
    },
    {
      id: 6,
      text: "Which role-play idea excites you most?",
      type: "multipleChoice" as const,
      options: ["Strangers meeting at a bar", "Boss and employee", "Teacher and student", "Superhero and villain", "A wild, slutty hookup"],
      category: "fantasies"
    },
    {
      id: 7,
      text: "How comfortable are you with dressing up or using props for a fantasy?",
      type: "scale" as const,
      options: null,
      category: "fantasies"
    },
    {
      id: 8,
      text: "What's a risky or forbidden place you'd fantasize about getting it on?",
      type: "openEnded" as const,
      options: null,
      category: "fantasies"
    },

    // Kinks & Experiments Category
    {
      id: 9,
      text: "How open are you to trying a new kink or toy in the bedroom?",
      type: "scale" as const,
      options: null,
      category: "kinks"
    },
    {
      id: 10,
      text: "Which spicy experiment sounds most tempting?",
      type: "multipleChoice" as const,
      options: ["Blindfolds or restraints", "Temperature play (ice/hot wax)", "Spanking or light dominance", "A daring new position", "Enthusiastic finishing moves (e.g., facial)"],
      category: "kinks"
    },
    {
      id: 11,
      text: "What's a boundary you're curious to push, even just a little?",
      type: "openEnded" as const,
      options: null,
      category: "kinks"
    },
    {
      id: 12,
      text: "How much do you enjoy taking control vs. letting your partner lead?",
      type: "scale" as const,
      options: null,
      category: "kinks"
    },

    // Mood & Atmosphere Category
    {
      id: 13,
      text: "What kind of vibe gets you in the mood for a wild night?",
      type: "multipleChoice" as const,
      options: ["Dark and sultry", "Playful and flirty", "Romantic and slow-burn", "Adventurous and spontaneous", "Kinky and intense"],
      category: "mood"
    },
    {
      id: 14,
      text: "What scent or sound would make the bedroom feel irresistible?",
      type: "openEnded" as const,
      options: null,
      category: "mood"
    },
    {
      id: 15,
      text: "How much does lingerie, costumes, or special outfits heat things up for you?",
      type: "scale" as const,
      options: null,
      category: "mood"
    },
    {
      id: 16,
      text: "What's the perfect way to start a steamy encounter?",
      type: "multipleChoice" as const,
      options: ["A seductive massage", "A slow striptease", "A flirty game", "A bold command", "A surprise pounce"],
      category: "mood"
    },

    // Exploration Category (Mojo Upgrade Style)
    {
      id: 17,
      text: "Trying blindfolds or light bondage:",
      type: "multipleChoice" as const,
      options: ["Not into it", "Into it", "Would be into it if my partner is"],
      category: "exploration"
    },
    {
      id: 18,
      text: "Acting out a 'slutty' fantasy with lots of enthusiasm and bold outfits:",
      type: "multipleChoice" as const,
      options: ["Not into it", "Into it", "Would be into it if my partner is"],
      category: "exploration"
    },
    {
      id: 19,
      text: "Incorporating a vibrator or sex toy:",
      type: "multipleChoice" as const,
      options: ["Not into it", "Into it", "Would be into it if my partner is"],
      category: "exploration"
    },
    {
      id: 20,
      text: "Experimenting with a spanking paddle:",
      type: "multipleChoice" as const,
      options: ["Not into it", "Into it", "Would be into it if my partner is"],
      category: "exploration"
    },
    {
      id: 21,
      text: "Role-playing a naughty scenario (e.g., strangers or power dynamics):",
      type: "multipleChoice" as const,
      options: ["Not into it", "Into it", "Would be into it if my partner is"],
      category: "exploration"
    },
    {
      id: 22,
      text: "Getting frisky in a semi-public place (e.g., car, secluded park):",
      type: "multipleChoice" as const,
      options: ["Not into it", "Into it", "Would be into it if my partner is"],
      category: "exploration"
    },

    // Feedback & Refinement Category
    {
      id: 23,
      text: "What was the sexiest moment from our last time together?",
      type: "openEnded" as const,
      options: null,
      category: "feedback"
    },
    {
      id: 24,
      text: "How spicy do you want our next encounter to be?",
      type: "scale" as const,
      options: null,
      category: "feedback"
    },
    {
      id: 25,
      text: "What could we tweak to make things even hotter next time?",
      type: "openEnded" as const,
      options: null,
      category: "feedback"
    },
    {
      id: 26,
      text: "Which past suggestion from IntiMate did you enjoy most?",
      type: "openEnded" as const,
      options: null,
      category: "feedback"
    },
    {
      id: 27,
      text: "What would you like more of in our sex life?",
      type: "openEnded" as const,
      options: null,
      category: "feedback"
    },
    {
      id: 28,
      text: "What would you like less of in our sex life?",
      type: "openEnded" as const,
      options: null,
      category: "feedback"
    }
  ];
};

// Get category labels for UI display
export const getCategoryLabel = (category: string, mode: 'standard' | 'spicy' = 'standard'): string => {
  if (mode === 'spicy') {
    return getSpicyCategoryLabel(category);
  }
  return getStandardCategoryLabel(category);
};

// Standard category labels
export const getStandardCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    "communication": "Communication",
    "physical": "Physical Intimacy",
    "emotional": "Emotional Connection",
    "boundaries": "Boundaries & Consent",
    "values": "Relationship Values" 
  };
  
  return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
};

// Spicy category labels
export const getSpicyCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    "desires": "Desires & Turn-Ons",
    "fantasies": "Fantasies & Role-Play",
    "kinks": "Kinks & Experiments",
    "mood": "Mood & Atmosphere",
    "exploration": "Sexual Exploration",
    "feedback": "Feedback & Refinement"
  };
  
  return labels[category] || category.charAt(0).toUpperCase() + category.slice(1);
};

// Helper function to get questions by category
export const getQuestionsByCategory = (questions: PassportQuestion[], category: string): PassportQuestion[] => {
  return questions.filter(q => q.category === category);
};

// Get all available categories from the questions, optionally filtered by mode
export const getCategories = (questions: PassportQuestion[], mode?: 'standard' | 'spicy'): string[] => {
  let filteredQuestions = questions;
  if (mode) {
    filteredQuestions = questions.filter(q => q.questionMode === mode);
  }
  
  const categories = new Set(filteredQuestions.map(q => q.category));
  return Array.from(categories);
};

// Default export for backward compatibility
export default getPassportQuestions; 