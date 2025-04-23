// File: src/app/api/session-plan/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { aiService } from '@/lib/ai-service';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  console.log("Generate plan API hit successfully");
  
  try {
    // Get the auth token from the request header
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
      return NextResponse.json(
        { error: 'Unauthorized - No user ID found' },
        { status: 401 }
      );
    }
    
    // Get the Supabase client for data operations
    const supabase = createServerClient();
    
    // Parse the request body
    const { planId, answers } = await request.json();
    
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }
    
    console.log("Generating plan for:", planId);
    
    // Get the session plan
    const { data: plan, error: planError } = await supabase
      .from('session_plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (planError || !plan) {
      console.error("Plan not found:", planError);
      return NextResponse.json(
        { error: 'Session plan not found' },
        { status: 404 }
      );
    }
    
    // Verify the user is the partner (not the initiator)
    if (plan.initiator_id === userId) {
      return NextResponse.json(
        { error: 'Only the partner can complete this step' },
        { status: 403 }
      );
    }
    
    // Verify the user is in the couple
    const { data: userCouple, error: coupleError } = await supabase
      .from('user_couples')
      .select('couple_id')
      .eq('user_id', userId)
      .single();
      
    if (coupleError || !userCouple || userCouple.couple_id !== plan.couple_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
// In src/app/api/session-plan/generate/route.ts
// Change the sessionPlanData structure to use "sections" instead of "steps"

const sessionPlanData = {
    id: planId,
    title: "Your Personalized Intimate Experience",
    description: "A carefully crafted plan based on both of your preferences and responses.",
    sections: [  // Change "steps" to "sections"
      {
        id: "1",
        title: "Setting the Scene",
        description: "Start by creating a comfortable environment. Dim the lights, put on soft music, and light some candles if desired. Take a moment to set your intentions for this time together.",
        durationMinutes: 15  // Make sure to use durationMinutes instead of duration
      },
      {
        id: "2",
        title: "Connection Warm-up",
        description: "Sit facing each other and maintain eye contact for 2 minutes without speaking. Focus on your breathing and being present with your partner.",
        durationMinutes: 5
      },
      {
        id: "3",
        title: "Appreciation Exchange",
        description: "Take turns sharing three things you appreciate about your partner. Be specific about qualities, actions, or moments that have meant something to you.",
        durationMinutes: 10
      },
      {
        id: "4",
        title: "Guided Touch",
        description: "Take turns guiding your partner's hand to areas where you enjoy being touched. Focus on building trust and connection.",
        durationMinutes: 15
      },
      {
        id: "5",
        title: "Intimate Connection",
        description: "Building on the previous activities, move into more intimate connection in whatever way feels natural and comfortable for both of you.",
        durationMinutes: 20
      }
    ],
    intimacyLevel: 4,
    estimatedDuration: "60-90 minutes",
    requiredItems: ["Private space", "Comfortable seating", "Optional: music, candles, soft lighting"]
  };
    // Update the session plan
    const { error: updateError } = await supabase
      .from('session_plans')
      .update({
        partner_answers: answers,
        plan_data: sessionPlanData,
        status: 'planning_complete',
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);
      
    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: 'Failed to update session plan' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      plan: {
        ...plan,
        partner_answers: answers,
        plan_data: sessionPlanData,
        status: 'planning_complete'
      }
    });
  } catch (error) {
    console.error('Error generating session plan:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating the session plan' },
      { status: 500 }
    );
  }
}