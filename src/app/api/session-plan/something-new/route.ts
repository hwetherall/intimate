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
    const { planId } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
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
    const { data: initiatorPreferences, error: initiatorError } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', plan.initiator_id)
      .single();

    if (initiatorError || !initiatorPreferences) {
      return NextResponse.json(
        { error: 'Initiator preferences not found' },
        { status: 404 }
      );
    }

    // Find the partner
    const { data: partnerRelation, error: partnerError } = await supabase
      .from('user_couples')
      .select('user_id')
      .eq('couple_id', userCouple.couple_id)
      .neq('user_id', plan.initiator_id)
      .single();

    if (partnerError || !partnerRelation) {
      return NextResponse.json(
        { error: 'Partner not found' },
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

    // Generate a new suggestion
    const suggestion = await aiService.generateSomethingNew(
      initiatorPreferences,
      partnerPreferences,
      plan.plan_data
    );

    return NextResponse.json({
      success: true,
      suggestion: suggestion.description || coachConfig.responseTemplates.somethingNew
    });
  } catch (error) {
    console.error('Error generating new suggestion:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating a new suggestion' },
      { status: 500 }
    );
  }
} 