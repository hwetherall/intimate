import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { aiService } from '@/lib/ai-service';
import { coachConfig } from '@/lib/ai-coach-config';

export async function POST(request: NextRequest) {
  try {
    // Get the Supabase client
    const supabase = createServerClient();

    // Get user session from the server-side client
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the current user ID
    const userId = session.user.id;

    // Parse the request body
    const { 
      spiciness,
      duration,
      scenario,
      isPartner = false,
      planId = null,
      previousAnswers = {} 
    } = await request.json();

    // If this is the partner responding, we need to validate the plan
    if (isPartner && planId) {
      // Get the session plan
      const { data: plan, error: planError } = await supabase
        .from('session_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        return NextResponse.json(
          { error: 'Session plan not found' },
          { status: 404 }
        );
      }

      // Verify the user is the partner
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

      // If the user is the initiator, they shouldn't be accessing this as partner
      if (plan.initiator_id === userId) {
        return NextResponse.json(
          { error: 'You are the initiator of this plan, not the partner' },
          { status: 400 }
        );
      }
    }

    // Get both users' preferences
    // First, find the user's couple and partner
    const { data: userCouple, error: coupleError } = await supabase
      .from('user_couples')
      .select('couple_id')
      .eq('user_id', userId)
      .single();

    if (coupleError || !userCouple) {
      return NextResponse.json(
        { error: 'No couple relationship found' },
        { status: 404 }
      );
    }

    // Find the partner
    const { data: partnerRelation, error: partnerError } = await supabase
      .from('user_couples')
      .select('user_id')
      .eq('couple_id', userCouple.couple_id)
      .neq('user_id', userId)
      .single();

    if (partnerError || !partnerRelation) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }

    // Get preferences
    const { data: userPreferences, error: userPrefError } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userPrefError || !userPreferences) {
      return NextResponse.json(
        { error: 'User preferences not found' },
        { status: 404 }
      );
    }

    const { data: partnerPreferences, error: partnerPrefError } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', partnerRelation.user_id)
      .single();

    if (partnerPrefError || !partnerPreferences) {
      return NextResponse.json(
        { error: 'Partner preferences not found' },
        { status: 404 }
      );
    }

    // If we're generating questions for the partner, we need the initiator's answers
    let initiatorAnswers = {};
    if (isPartner && planId) {
      const { data: plan, error: planError } = await supabase
        .from('session_plans')
        .select('initiator_answers')
        .eq('id', planId)
        .single();

      if (!planError && plan) {
        initiatorAnswers = plan.initiator_answers;
      }
    }

    // Generate questions using the AI service
    const questions = await aiService.generateSessionQuestions(
      userPreferences,
      partnerPreferences,
      spiciness,
      duration,
      isPartner ? initiatorAnswers : previousAnswers
    );

    return NextResponse.json({
      success: true,
      questions,
      coachPersonality: {
        name: coachConfig.name,
        greeting: isPartner ? coachConfig.partnerGreeting : coachConfig.initiatorGreeting
      }
    });
  } catch (error) {
    console.error('Error generating session questions:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating questions' },
      { status: 500 }
    );
  }
}