import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { aiService } from '@/lib/ai-service';

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
    const { planId, answers } = await request.json();

    if (!planId || !answers) {
      return NextResponse.json(
        { error: 'Plan ID and answers are required' },
        { status: 400 }
      );
    }

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

    // Get both users' preferences
    const { data: initiatorUser, error: initiatorError } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', plan.initiator_id)
      .single();

    if (initiatorError || !initiatorUser) {
      return NextResponse.json(
        { error: 'Initiator preferences not found' },
        { status: 404 }
      );
    }

    const { data: partnerUser, error: partnerError } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (partnerError || !partnerUser) {
      return NextResponse.json(
        { error: 'Partner preferences not found' },
        { status: 404 }
      );
    }

    // Generate the session plan
    const sessionPlanData = await aiService.generateSessionPlan(
      initiatorUser,
      partnerUser,
      plan.initiator_answers,
      answers,
      plan.spiciness_level,
      plan.duration
    );

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