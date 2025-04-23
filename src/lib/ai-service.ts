// AI service for generating recommendations based on user preferences
import { v4 as uuidv4 } from 'uuid';

// Define types for preferences and recommendations
interface Preference {
  id?: string;
  user_id?: string;
  preference_data: {
    comfortLevel: string;
    communicationPreference: string;
    idealFrequency: string;
    intimacyGoals: string[];
    additionalNotes?: string;
  };
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  intimacyLevel: number;
  durationMinutes: number;
  type: string;
  preparationNeeded: string[];
  tags: string[];
}

export interface RecommendationSet {
  id?: string;
  title: string;
  description: string;
  createdAt: string;
  recommendations: Recommendation[];
}

// New interfaces for session-related features
export interface Question {
  id: string;
  text: string;
  category: string;
  intimacyLevel: number;
  followUp?: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  intimacyLevel: number;
  requiredItems?: string[];
  suggestedLocation?: string;
  estimatedDuration?: string;
}

export interface SessionPlan {
  id: string;
  title: string;
  description: string;
  steps: SessionStep[];
  intimacyLevel: number;
  estimatedDuration: string;
  requiredItems: string[];
}

export interface SessionStep {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'conversation' | 'activity' | 'connection';
}

export interface NewSuggestion {
  id: string;
  title: string;
  description: string;
  intimacyLevel: number;
  reason: string;
}

export const aiService = {
  /**
   * Generate personalized recommendations for a couple based on their preferences
   * @param userPreferences User's preferences
   * @param partnerPreferences Partner's preferences
   * @returns Recommendations object
   */
  async generateRecommendations(
    userPreferences: Preference,
    partnerPreferences: Preference
  ): Promise<RecommendationSet> {
    try {
      // Extract preference data
      const userPrefs = userPreferences.preference_data;
      const partnerPrefs = partnerPreferences.preference_data;

      // Construct the prompt for the AI
      const prompt = this.constructPrompt(userPrefs, partnerPrefs);

      // Call the OpenRouter API
      const response = await this.callAI(prompt);

      // Parse the response into structured recommendations
      const recommendations = this.parseAIResponse(response);

      return {
        title: "Personalized Intimate Experiences",
        description: "Based on your shared preferences, we've curated these experiences to enhance your connection.",
        createdAt: new Date().toISOString(),
        recommendations
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Fallback to provide some default recommendations if AI fails
      return this.getFallbackRecommendations();
    }
  },

  /**
   * Construct a prompt for the AI based on user preferences
   */
  constructPrompt(userPrefs: any, partnerPrefs: any): string {
    return `
You are an expert relationship advisor specializing in creating personalized intimate experiences for couples.

I need you to generate 3-5 recommendations for a couple based on their preferences.

PARTNER 1 PREFERENCES:
- Comfort level: ${userPrefs.comfortLevel}
- Communication preference: ${userPrefs.communicationPreference}
- Ideal frequency: ${userPrefs.idealFrequency}
- Intimacy goals: ${userPrefs.intimacyGoals.join(', ')}
- Additional notes: ${userPrefs.additionalNotes || 'None provided'}

PARTNER 2 PREFERENCES:
- Comfort level: ${partnerPrefs.comfortLevel}
- Communication preference: ${partnerPrefs.communicationPreference}
- Ideal frequency: ${partnerPrefs.idealFrequency}
- Intimacy goals: ${partnerPrefs.intimacyGoals.join(', ')}
- Additional notes: ${partnerPrefs.additionalNotes || 'None provided'}

Generate 3-5 personalized recommendations in JSON format with the following structure:
{
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description of the activity",
      "intimacyLevel": "1-5 rating (1=low, 5=high)",
      "durationMinutes": "Estimated time in minutes",
      "type": "Type of activity (e.g., conversation, physical, emotional)",
      "preparationNeeded": ["List of items or preparations"],
      "tags": ["relevant tags"]
    }
  ]
}

Ensure the recommendations are respectful, considerate of both partners' comfort levels, and focus on enhancing their connection based on their shared goals.
`;
  },

  /**
   * Call the OpenRouter API with the constructed prompt
   */
  async callAI(prompt: string): Promise<string> {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      const apiUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1';
      const modelName = process.env.OPENROUTER_MODEL_NAME || 'x-ai/grok-3-mini-beta';

      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling AI service:', error);
      throw error;
    }
  },

  /**
   * Parse the AI response into structured recommendations
   */
  parseAIResponse(response: string): Recommendation[] {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const responseJson = JSON.parse(jsonMatch[0]);
      
      // Validate and format recommendations
      return (responseJson.recommendations || []).map((rec: any) => ({
        id: uuidv4(),
        title: rec.title,
        description: rec.description,
        intimacyLevel: parseInt(rec.intimacyLevel) || 1,
        durationMinutes: parseInt(rec.durationMinutes) || 30,
        type: rec.type || 'conversation',
        preparationNeeded: Array.isArray(rec.preparationNeeded) ? rec.preparationNeeded : [],
        tags: Array.isArray(rec.tags) ? rec.tags : []
      }));
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw error;
    }
  },

  /**
   * Provide fallback recommendations if the AI call fails
   */
  getFallbackRecommendations(): RecommendationSet {
    return {
      title: "Connection Experience Suggestions",
      description: "A selection of activities to enhance your relationship",
      createdAt: new Date().toISOString(),
      recommendations: [
        {
          id: uuidv4(),
          title: "Guided Intimacy Conversation",
          description: "Set aside 30 minutes with no distractions. Take turns answering questions about your desires, boundaries, and fantasies. Listen actively without judgment.",
          intimacyLevel: 2,
          durationMinutes: 30,
          type: "conversation",
          preparationNeeded: ["List of conversation prompts", "Comfortable seating", "Privacy"],
          tags: ["communication", "emotional intimacy", "bonding"]
        },
        {
          id: uuidv4(),
          title: "Sensory Exploration",
          description: "Create a relaxing environment with soft lighting and music. Take turns being blindfolded while exploring different sensory experiences with your partner, such as gentle touch, feeding each other, or sharing scents.",
          intimacyLevel: 3,
          durationMinutes: 45,
          type: "physical",
          preparationNeeded: ["Blindfold", "Various textures", "Scented oils", "Soft music"],
          tags: ["sensory", "playful", "trust building"]
        },
        {
          id: uuidv4(),
          title: "Shared Relaxation Ritual",
          description: "Transform your bathroom into a spa-like setting. Take turns giving each other a relaxing massage, followed by a warm bath or shower together.",
          intimacyLevel: 4,
          durationMinutes: 60,
          type: "physical",
          preparationNeeded: ["Massage oil", "Candles", "Bath products", "Towels"],
          tags: ["relaxation", "physical touch", "stress relief"]
        }
      ]
    };
  },

  /**
   * Generate session questions based on user preferences
   * @param userPreferences User's preferences
   * @param partnerPreferences Partner's preferences
   * @param spiciness Level of spiciness (mild, moderate, spicy)
   * @param duration Duration of the session
   * @param previousAnswers Previous answers to avoid repetition
   * @returns Array of questions
   */
  async generateSessionQuestions(
    userPreferences: Preference,
    partnerPreferences: Preference,
    spiciness: string,
    duration: string,
    previousAnswers?: any
  ): Promise<Question[]> {
    try {
      const userPrefs = userPreferences.preference_data;
      const partnerPrefs = partnerPreferences.preference_data;
      
      // Construct the prompt for generating questions
      const prompt = `
You are an expert relationship coach specializing in creating meaningful connection experiences for couples.

Generate ${this.getQuestionCountByDuration(duration)} questions for a couple based on their preferences and desired spiciness level.

PARTNER 1 PREFERENCES:
${this.formatPreferencesForPrompt(userPrefs)}

PARTNER 2 PREFERENCES:
${this.formatPreferencesForPrompt(partnerPrefs)}

SPICINESS LEVEL: ${spiciness}
SESSION DURATION: ${duration}

${previousAnswers ? `PREVIOUS QUESTIONS TO AVOID REPETITION: ${JSON.stringify(previousAnswers)}` : ''}

Generate questions that are appropriate for the spiciness level and will foster connection and intimacy between partners.
Return the questions in JSON format:

{
  "questions": [
    {
      "text": "Question text",
      "category": "emotional/physical/intellectual/playful",
      "intimacyLevel": 1-5,
      "followUp": "Optional follow-up prompt"
    }
  ]
}
`;

      const response = await this.callAI(prompt);
      return this.parseQuestionsResponse(response);
    } catch (error) {
      console.error('Error generating session questions:', error);
      return this.getFallbackQuestions(spiciness);
    }
  },

  /**
   * Generate session scenarios based on user preferences
   * @param userPreferences User's preferences
   * @param partnerPreferences Partner's preferences
   * @param spiciness Level of spiciness
   * @returns Array of scenarios
   */
  async generateSessionScenarios(
    userPreferences: Preference,
    partnerPreferences: Preference,
    spiciness: string
  ): Promise<Scenario[]> {
    try {
      const userPrefs = userPreferences.preference_data;
      const partnerPrefs = partnerPreferences.preference_data;
      
      // Construct the prompt for generating scenarios
      const prompt = `
You are an expert relationship advisor specializing in creating intimate scenarios for couples.

Generate 3 intimate scenarios for a couple based on their preferences and desired spiciness level.

PARTNER 1 PREFERENCES:
${this.formatPreferencesForPrompt(userPrefs)}

PARTNER 2 PREFERENCES:
${this.formatPreferencesForPrompt(partnerPrefs)}

SPICINESS LEVEL: ${spiciness}

Generate detailed scenarios that match the spiciness level and take into account both partners' preferences.
Return the scenarios in JSON format:

{
  "scenarios": [
    {
      "title": "Scenario title",
      "description": "Detailed description of the scenario",
      "intimacyLevel": 1-5,
      "requiredItems": ["Optional items needed"],
      "suggestedLocation": "Where this scenario works best",
      "estimatedDuration": "Estimated time"
    }
  ]
}
`;

      const response = await this.callAI(prompt);
      return this.parseScenariosResponse(response);
    } catch (error) {
      console.error('Error generating session scenarios:', error);
      return this.getFallbackScenarios(spiciness);
    }
  },

  /**
   * Generate a session plan based on user preferences and answers
   * @param userPreferences User's preferences
   * @param partnerPreferences Partner's preferences
   * @param initiatorAnswers Initiator's answers to questions
   * @param partnerAnswers Partner's answers to questions
   * @param spiciness Level of spiciness
   * @param duration Session duration
   * @returns Session plan
   */
  async generateSessionPlan(
    userPreferences: Preference,
    partnerPreferences: Preference,
    initiatorAnswers: any,
    partnerAnswers: any,
    spiciness: string,
    duration: string
  ): Promise<SessionPlan> {
    try {
      const userPrefs = userPreferences.preference_data;
      const partnerPrefs = partnerPreferences.preference_data;
      
      // Construct the prompt for generating a session plan
      const prompt = `
You are an expert relationship coach specializing in creating personalized intimacy sessions for couples.

Create a detailed ${duration} intimacy session plan for a couple based on their preferences, answers, and desired spiciness level.

PARTNER 1 PREFERENCES:
${this.formatPreferencesForPrompt(userPrefs)}

PARTNER 2 PREFERENCES:
${this.formatPreferencesForPrompt(partnerPrefs)}

PARTNER 1 ANSWERS:
${JSON.stringify(initiatorAnswers)}

PARTNER 2 ANSWERS:
${JSON.stringify(partnerAnswers)}

SPICINESS LEVEL: ${spiciness}
SESSION DURATION: ${duration}

Generate a step-by-step session plan that incorporates both partners' preferences and answers.
The plan should be respectful of boundaries while encouraging connection and intimacy.
Return the plan in JSON format:

{
  "title": "Session title",
  "description": "Overall description",
  "steps": [
    {
      "title": "Step title",
      "description": "Detailed instructions",
      "duration": "Estimated time",
      "type": "conversation/activity/connection"
    }
  ],
  "intimacyLevel": 1-5,
  "estimatedDuration": "Total time",
  "requiredItems": ["List of items needed"]
}
`;

      const response = await this.callAI(prompt);
      return this.parseSessionPlanResponse(response);
    } catch (error) {
      console.error('Error generating session plan:', error);
      return this.getFallbackSessionPlan(spiciness, duration);
    }
  },

  /**
   * Generate a new suggestion to add variety to an existing session plan
   * @param userPreferences User's preferences
   * @param partnerPreferences Partner's preferences
   * @param existingPlan Existing session plan
   * @returns New suggestion
   */
  async generateSomethingNew(
    userPreferences: Preference,
    partnerPreferences: Preference,
    existingPlan: SessionPlan
  ): Promise<NewSuggestion> {
    try {
      const userPrefs = userPreferences.preference_data;
      const partnerPrefs = partnerPreferences.preference_data;
      
      // Construct the prompt for generating a new suggestion
      const prompt = `
You are an expert relationship coach specializing in adding variety and surprise to intimate experiences.

Generate a new suggestion to add to an existing session plan based on the couple's preferences.

PARTNER 1 PREFERENCES:
${this.formatPreferencesForPrompt(userPrefs)}

PARTNER 2 PREFERENCES:
${this.formatPreferencesForPrompt(partnerPrefs)}

EXISTING PLAN:
${JSON.stringify(existingPlan)}

Generate a novel suggestion that would add excitement or variety to the existing plan while respecting both partners' preferences and comfort levels.
Return the suggestion in JSON format:

{
  "title": "Suggestion title",
  "description": "Detailed description",
  "intimacyLevel": 1-5,
  "reason": "Why this would enhance the existing plan"
}
`;

      const response = await this.callAI(prompt);
      return this.parseNewSuggestionResponse(response);
    } catch (error) {
      console.error('Error generating new suggestion:', error);
      return this.getFallbackNewSuggestion();
    }
  },

  // Helper methods for the new functions
  
  /**
   * Format preferences for inclusion in prompts
   */
  formatPreferencesForPrompt(prefs: any): string {
    let formattedPrefs = '';
    
    for (const [key, value] of Object.entries(prefs)) {
      if (Array.isArray(value)) {
        formattedPrefs += `- ${key}: ${value.join(', ')}\n`;
      } else if (value) {
        formattedPrefs += `- ${key}: ${value}\n`;
      }
    }
    
    return formattedPrefs;
  },

  /**
   * Determine number of questions based on duration
   */
  getQuestionCountByDuration(duration: string): number {
    switch (duration.toLowerCase()) {
      case 'short':
        return 3;
      case 'medium':
        return 5;
      case 'long':
        return 8;
      default:
        return 5;
    }
  },

  /**
   * Parse AI response for questions
   */
  parseQuestionsResponse(response: string): Question[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const responseJson = JSON.parse(jsonMatch[0]);
      
      return (responseJson.questions || []).map((q: any) => ({
        id: uuidv4(),
        text: q.text,
        category: q.category || 'emotional',
        intimacyLevel: parseInt(q.intimacyLevel) || 1,
        followUp: q.followUp
      }));
    } catch (error) {
      console.error('Error parsing questions response:', error);
      throw error;
    }
  },

  /**
   * Parse AI response for scenarios
   */
  parseScenariosResponse(response: string): Scenario[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const responseJson = JSON.parse(jsonMatch[0]);
      
      return (responseJson.scenarios || []).map((s: any) => ({
        id: uuidv4(),
        title: s.title,
        description: s.description,
        intimacyLevel: parseInt(s.intimacyLevel) || 1,
        requiredItems: s.requiredItems || [],
        suggestedLocation: s.suggestedLocation,
        estimatedDuration: s.estimatedDuration
      }));
    } catch (error) {
      console.error('Error parsing scenarios response:', error);
      throw error;
    }
  },

  /**
   * Parse AI response for session plan
   */
  parseSessionPlanResponse(response: string): SessionPlan {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const plan = JSON.parse(jsonMatch[0]);
      
      return {
        id: uuidv4(),
        title: plan.title,
        description: plan.description,
        steps: (plan.steps || []).map((step: any) => ({
          id: uuidv4(),
          title: step.title,
          description: step.description,
          duration: step.duration || '10 minutes',
          type: step.type || 'activity'
        })),
        intimacyLevel: parseInt(plan.intimacyLevel) || 1,
        estimatedDuration: plan.estimatedDuration || '1 hour',
        requiredItems: plan.requiredItems || []
      };
    } catch (error) {
      console.error('Error parsing session plan response:', error);
      throw error;
    }
  },

  /**
   * Parse AI response for new suggestion
   */
  parseNewSuggestionResponse(response: string): NewSuggestion {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const suggestion = JSON.parse(jsonMatch[0]);
      
      return {
        id: uuidv4(),
        title: suggestion.title,
        description: suggestion.description,
        intimacyLevel: parseInt(suggestion.intimacyLevel) || 1,
        reason: suggestion.reason
      };
    } catch (error) {
      console.error('Error parsing new suggestion response:', error);
      throw error;
    }
  },

  /**
   * Provide fallback questions if AI call fails
   */
  getFallbackQuestions(spiciness: string): Question[] {
    const baseQuestions = [
      {
        id: uuidv4(),
        text: "What makes you feel most loved and appreciated?",
        category: "emotional",
        intimacyLevel: 2
      },
      {
        id: uuidv4(),
        text: "What's one thing I do that makes you feel closest to me?",
        category: "emotional",
        intimacyLevel: 2
      },
      {
        id: uuidv4(),
        text: "What's one thing you've always wanted to try together but haven't yet?",
        category: "playful",
        intimacyLevel: 3
      }
    ];
    
    if (spiciness === 'mild') {
      return baseQuestions;
    }
    
    const spicyQuestions = [
      {
        id: uuidv4(),
        text: "What's something that always turns you on?",
        category: "physical",
        intimacyLevel: 4
      },
      {
        id: uuidv4(),
        text: "What's a fantasy you've had but never shared with me?",
        category: "physical",
        intimacyLevel: 5,
        followUp: "What aspects of it appeal to you most?"
      }
    ];
    
    return [...baseQuestions, ...(spiciness === 'spicy' ? spicyQuestions : [spicyQuestions[0]])];
  },

  /**
   * Provide fallback scenarios if AI call fails
   */
  getFallbackScenarios(spiciness: string): Scenario[] {
    const baseScenario = {
      id: uuidv4(),
      title: "Sensory Connection Experience",
      description: "Create a relaxing environment with soft lighting and gentle music. Take turns being blindfolded while the other partner uses different textures and sensations to create a memorable experience.",
      intimacyLevel: 3,
      requiredItems: ["Blindfold", "Various textures (feather, silk, etc.)", "Soft music"],
      suggestedLocation: "Bedroom",
      estimatedDuration: "30-45 minutes"
    };
    
    if (spiciness === 'mild') {
      return [baseScenario];
    }
    
    const moderateScenario = {
      id: uuidv4(),
      title: "Romantic Role Play",
      description: "Pretend you're meeting for the first time at a location of your choice. Flirt, get to know each other, and see where the evening leads.",
      intimacyLevel: 4,
      suggestedLocation: "Home or private space",
      estimatedDuration: "1-2 hours"
    };
    
    const spicyScenario = {
      id: uuidv4(),
      title: "Fantasy Fulfillment",
      description: "Discuss a mutual fantasy beforehand and then set aside time to act it out together in a way that's comfortable for both of you.",
      intimacyLevel: 5,
      requiredItems: ["Depends on fantasy", "Possible props or costumes"],
      suggestedLocation: "Private, comfortable space",
      estimatedDuration: "Varies"
    };
    
    return spiciness === 'spicy' 
      ? [baseScenario, moderateScenario, spicyScenario]
      : [baseScenario, moderateScenario];
  },

  /**
   * Provide fallback session plan if AI call fails
   */
  getFallbackSessionPlan(spiciness: string, duration: string): SessionPlan {
    const baseSteps = [
      {
        id: uuidv4(),
        title: "Connection Warm-up",
        description: "Sit facing each other and maintain eye contact for 2 minutes without speaking. Focus on your breathing and being present with your partner.",
        duration: "5 minutes",
        type: "connection" as const
      },
      {
        id: uuidv4(),
        title: "Appreciation Exchange",
        description: "Take turns sharing three things you appreciate about your partner. Be specific about qualities, actions, or moments that have meant something to you.",
        duration: "10 minutes",
        type: "conversation" as const
      },
      {
        id: uuidv4(),
        title: "Guided Touch",
        description: "Take turns guiding your partner's hand to areas where you enjoy being touched. Focus on non-intimate areas first, building trust and connection.",
        duration: "15 minutes",
        type: "activity" as const
      }
    ];
    
    const spicySteps = [
      {
        id: uuidv4(),
        title: "Desire Sharing",
        description: "Take turns sharing something you desire from your partner. This could be emotional, physical, or a specific experience you'd like to share.",
        duration: "10 minutes",
        type: "conversation" as const
      },
      {
        id: uuidv4(),
        title: "Intimate Connection",
        description: "Building on the previous activities, move into more intimate connection in whatever way feels natural and comfortable for both of you.",
        duration: "20+ minutes",
        type: "activity" as const
      }
    ];
    
    const steps = duration === 'short' 
      ? baseSteps.slice(0, 2)
      : spiciness === 'spicy' 
        ? [...baseSteps, ...spicySteps] 
        : baseSteps;
    
    return {
      id: uuidv4(),
      title: "Connection & Intimacy Session",
      description: "A guided experience to deepen your connection and intimacy through mindful activities and communication.",
      steps,
      intimacyLevel: spiciness === 'spicy' ? 4 : (spiciness === 'moderate' ? 3 : 2),
      estimatedDuration: duration === 'short' ? "15-20 minutes" : (duration === 'medium' ? "30-45 minutes" : "60+ minutes"),
      requiredItems: ["Private, comfortable space", "Optional: soft music", "Optional: dim lighting"]
    };
  },

  /**
   * Provide fallback new suggestion if AI call fails
   */
  getFallbackNewSuggestion(): NewSuggestion {
    return {
      id: uuidv4(),
      title: "Temperature Play",
      description: "Experiment with different temperatures during your intimate time together. Try using ice cubes or warm massage oil to create new sensations and add an element of surprise.",
      intimacyLevel: 4,
      reason: "Adding unexpected sensory elements can heighten awareness and create novel experiences that deepen connection."
    };
  }
};