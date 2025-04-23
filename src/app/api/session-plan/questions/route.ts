import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { aiService } from '@/lib/ai-service';
import { coachConfig } from '@/lib/ai-coach-config';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  console.log("API route hit successfully");
  
  try {
    // Parse the request body first (do this early to catch JSON parsing errors)
    const requestBody = await request.json();
    
    const { 
      spiciness,
      duration,
      scenario,
      isPartner = false,
      planId = null,
      previousAnswers = {},
      isScenarioRequest = false
    } = requestBody;
    
    console.log("Request params:", { spiciness, duration, isScenarioRequest });
    
    // Authentication check
    const authHeader = request.headers.get('Authorization');
    const customUserIdHeader = request.headers.get('X-Supabase-User-ID');
    
    let userId = null;
    
    // First try to get the user from the custom header set by middleware
    if (customUserIdHeader) {
      userId = customUserIdHeader;
      console.log("Using user ID from header:", userId);
    } else {
      // Get the Supabase client
      const supabase = createServerClient();
      
      // Get user session from the server-side client
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // If no session from cookies, try using the auth header
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split('Bearer ')[1];
          
          // Create an admin client to verify the token
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          );
          
          // Verify the token
          const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
          
          if (authError || !user) {
            console.error("Authentication error:", authError);
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 401 }
            );
          }
          
          // Use the authenticated user
          userId = user.id;
          console.log("Using user from auth token:", userId);
        } else {
          console.error("No authentication found");
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
      } else {
        // If we have a session from cookies, use that
        userId = session.user.id;
        console.log("Using user from session cookies:", userId);
      }
    }
    
    if (!userId) {
      console.error("No user ID found after auth checks");
      return NextResponse.json(
        { error: 'Unauthorized - No user ID found' },
        { status: 401 }
      );
    }

    // Handle scenario requests - simple implementation for testing
    if (isScenarioRequest) {
      console.log("Processing scenario request");
      
      // Return hardcoded scenarios to test the flow
      const scenarios = [
        {
          id: "romantic_dinner",
          title: "Romantic Dinner Evening",
          description: "Create a special dinner experience with your favorite foods, candlelight, and intimate conversation prompts.",
          intimacyLevel: spiciness === 'mild' ? 2 : 3
        },
        {
          id: "sensory_exploration",
          title: "Sensory Exploration",
          description: "Engage all five senses through a guided experience with blindfolds, different textures, scents, tastes, and sounds.",
          intimacyLevel: spiciness === 'mild' ? 3 : 4
        },
        {
          id: "fantasy_fulfillment",
          title: "Fantasy Roleplay",
          description: "Share and explore a mutual fantasy in a comfortable, consensual setting that respects both partners' boundaries.",
          intimacyLevel: spiciness === 'mild' ? 3 : 5
        }
      ];
      
      // Add more intense scenarios for spicier levels
      if (spiciness === 'spicy' || spiciness === 'hot' || spiciness === 'wild') {
        scenarios.push({
          id: "passionate_encounter",
          title: "Passionate Encounter",
          description: "An evening focused on passionate physical connection with new techniques and positions to try.",
          intimacyLevel: 5
        });
      }
      
      return NextResponse.json({
        success: true,
        scenarios,
        coachPersonality: {
          name: coachConfig.name,
          greeting: isPartner ? coachConfig.partnerGreeting : coachConfig.initiatorGreeting
        }
      });
    }
    
    // Handle questions request - simple implementation for testing
    console.log("Processing questions request");
    
    // Return hardcoded questions to test the flow
    const questions = [
      {
        id: "comfort_level",
        text: "How comfortable are you with new experiences in your relationship?",
        type: "multiple-choice",
        options: [
          { id: "very", text: "Very comfortable" },
          { id: "somewhat", text: "Somewhat comfortable" },
          { id: "neutral", text: "Neutral" },
          { id: "somewhat_uncomfortable", text: "Somewhat uncomfortable" },
          { id: "very_uncomfortable", text: "Very uncomfortable" }
        ]
      },
      {
        id: "communication_preference",
        text: "How do you prefer to communicate during intimate moments?",
        type: "multiple-choice",
        options: [
          { id: "verbal", text: "Verbal guidance and feedback" },
          { id: "nonverbal", text: "Nonverbal cues and body language" },
          { id: "mixed", text: "A mix of both approaches" }
        ]
      },
      {
        id: "desired_outcome",
        text: "What are you hoping to get from this experience?",
        type: "text"
      }
    ];
    
    return NextResponse.json({
      success: true,
      questions,
      coachPersonality: {
        name: coachConfig.name,
        greeting: isPartner ? coachConfig.partnerGreeting : coachConfig.initiatorGreeting
      }
    });
    
  } catch (error) {
    console.error('Error in session plan questions API:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}