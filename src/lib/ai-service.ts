/**
 * AI Service for generating personalized recommendations using OpenRouter
 * and Grok-3-mini-reasoning model through OpenRouter's API
 */

import { Database } from '@/types/database.types';

// Types for OpenRouter API responses
type OpenRouterMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type OpenRouterCompletionRequest = {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
};

type OpenRouterCompletionResponse = {
  id: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    index: number;
    finish_reason: string;
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

// Types for recommendations
export type RecommendationType = 'experience' | 'activity' | 'conversation';

export type Recommendation = {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  durationMinutes: number;
  preparationNeeded: string[];
  intimacyLevel: 1 | 2 | 3 | 4 | 5;
  tags: string[];
};

export type RecommendationSet = {
  id: string;
  title: string;
  description: string;
  recommendations: Recommendation[];
  createdAt: string;
};

// Main AI Service class
export class AIService {
  private apiKey: string;
  private apiUrl: string;
  private modelName: string;
  
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.apiUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1';
    this.modelName = process.env.OPENROUTER_MODEL_NAME || 'anthropic/grok-3-mini-reasoning';
    
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required');
    }
  }
  
  /**
   * Generate personalized recommendations based on both partners' preferences
   */
  async generateRecommendations(
    userPreferences: Database['public']['Tables']['preferences']['Row'],
    partnerPreferences: Database['public']['Tables']['preferences']['Row']
  ): Promise<RecommendationSet> {
    // Extract preference data
    const userPreferenceData = userPreferences.preference_data as any;
    const partnerPreferenceData = partnerPreferences.preference_data as any;
    
    // Create a prompt for the AI
    const prompt = this.createRecommendationPrompt(userPreferenceData, partnerPreferenceData);
    
    // Call the OpenRouter API
    const response = await this.callOpenRouter(prompt);
    
    // Parse the response
    const recommendationSet = this.parseRecommendationResponse(response);
    
    return recommendationSet;
  }
  
  /**
   * Generate follow-up questions based on preferences to learn more
   */
  async generateFollowUpQuestions(
    userPreferences: Database['public']['Tables']['preferences']['Row']
  ): Promise<string[]> {
    const preferenceData = userPreferences.preference_data as any;
    
    // Create a prompt for follow-up questions
    const prompt = this.createFollowUpQuestionsPrompt(preferenceData);
    
    // Call the OpenRouter API
    const response = await this.callOpenRouter(prompt);
    
    // Parse the response as an array of questions
    try {
      const questions = JSON.parse(response);
      if (Array.isArray(questions)) {
        return questions.slice(0, 5); // Limit to 5 questions max
      }
    } catch (error) {
      console.error('Error parsing follow-up questions:', error);
      
      // Fallback parsing if JSON parse fails
      const lines = response.split('\n').filter(line => line.trim().length > 0);
      const questions = lines.slice(0, 5).map(line => {
        // Remove numbered bullets if present
        return line.replace(/^\d+[\.\)]\s*/, '').trim();
      });
      
      return questions;
    }
    
    // Fallback
    return ['What aspects of intimacy are most important to you?'];
  }
  
  /**
   * Private method to call OpenRouter API
   */
  private async callOpenRouter(prompt: string): Promise<string> {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: 'You are an AI assistant that helps couples enhance their relationship through personalized recommendations based on their preferences. You provide thoughtful, respectful suggestions tailored to their unique dynamics.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];
    
    const requestBody: OpenRouterCompletionRequest = {
      model: this.modelName,
      messages,
      temperature: 0.7,
      max_tokens: 2000
    };
    
    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Intimate App'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      }
      
      const data = await response.json() as OpenRouterCompletionResponse;
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      throw error;
    }
  }
  
  /**
   * Create a prompt for recommendation generation
   */
  private createRecommendationPrompt(
    userPreferenceData: any,
    partnerPreferenceData: any
  ): string {
    return `
I need you to generate personalized intimate experience recommendations for a couple based on their preferences.

User's preferences:
- Comfort level: ${userPreferenceData.comfortLevel}
- Communication preference: ${userPreferenceData.communicationPreference}
- Ideal frequency: ${userPreferenceData.idealFrequency}
- Intimacy goals: ${userPreferenceData.intimacyGoals.join(', ')}
- Additional notes: ${userPreferenceData.additionalNotes || 'None provided'}

Partner's preferences:
- Comfort level: ${partnerPreferenceData.comfortLevel}
- Communication preference: ${partnerPreferenceData.communicationPreference}
- Ideal frequency: ${partnerPreferenceData.idealFrequency}
- Intimacy goals: ${partnerPreferenceData.intimacyGoals.join(', ')}
- Additional notes: ${partnerPreferenceData.additionalNotes || 'None provided'}

Based on these preferences, generate a set of 3-5 personalized recommendations that would be suitable for this couple. 
Consider their comfort levels, communication styles, and goals. 

Provide your response in JSON format with the following structure:
{
  "title": "Weekly theme or overall recommendation title",
  "description": "A brief description of the overall theme",
  "recommendations": [
    {
      "type": "experience|activity|conversation",
      "title": "Title of the recommendation",
      "description": "Detailed description of what to do",
      "durationMinutes": estimated time in minutes,
      "preparationNeeded": ["item1", "item2"],
      "intimacyLevel": number from 1-5,
      "tags": ["tag1", "tag2"]
    }
  ]
}

The recommendations should be respectful, consent-focused, and sensitive to both partners' boundaries.
`;
  }
  
  /**
   * Create a prompt for follow-up questions
   */
  private createFollowUpQuestionsPrompt(preferenceData: any): string {
    return `
Based on the following user preferences, I'd like you to generate 3-5 thoughtful follow-up questions that would help us learn more about this person's preferences and create better intimate experience recommendations.

User's current preferences:
- Comfort level: ${preferenceData.comfortLevel}
- Communication preference: ${preferenceData.communicationPreference}
- Ideal frequency: ${preferenceData.idealFrequency}
- Intimacy goals: ${preferenceData.intimacyGoals.join(', ')}
- Additional notes: ${preferenceData.additionalNotes || 'None provided'}

Please provide just the questions in a JSON array format. The questions should be respectful, open-ended, and help us understand this person's desires, boundaries, and relationship goals better.
`;
  }
  
  /**
   * Parse the AI response into a recommendation set
   */
  private parseRecommendationResponse(response: string): RecommendationSet {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(response);
      
      // Generate a unique ID for the recommendation set
      const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      
      // Add IDs to each recommendation
      const recommendations = parsed.recommendations.map((rec: any) => ({
        ...rec,
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
      }));
      
      return {
        id,
        title: parsed.title,
        description: parsed.description,
        recommendations,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.log('Raw response:', response);
      
      // Fallback when JSON parsing fails
      return {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        title: 'Connection Recommendations',
        description: 'Here are some personalized recommendations for enhancing your relationship.',
        recommendations: [
          {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            type: 'conversation',
            title: 'Deep Connection Conversation',
            description: 'Take time to share your feelings and desires with each other in a safe, judgment-free space.',
            durationMinutes: 30,
            preparationNeeded: ['Comfortable seating', 'Privacy'],
            intimacyLevel: 3,
            tags: ['communication', 'emotional']
          }
        ],
        createdAt: new Date().toISOString()
      };
    }
  }
}

// Create and export an instance of the service
export const aiService = new AIService();