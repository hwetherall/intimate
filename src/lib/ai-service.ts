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
  }
};