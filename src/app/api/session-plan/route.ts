import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

// POST - Create a new session plan
export async function POST(request: NextRequest) {
  try {
    // Get the auth token from the request header
    const authHeader = request.headers.get('Authorization');
    const customUserIdHeader = request.headers.get('X-Supabase-User-ID');
    
    let userId = null;
    
    // First try to get the user from the custom header set by middleware
    if (customUserIdHeader) {
      userId = customUserIdHeader;
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
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 401 }
            );
          }
          
          // Use the authenticated user
          userId = user.id;
        } else {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
      } else {
        // If we have a session from cookies, use that
        userId = session.user.id;
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
    const { spiciness, duration, selectedScenario, answers } = await request.json();
    
    if (!spiciness || !duration || !selectedScenario) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the user's couple relationship
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

    // Find the partner in the same couple
    const { data: partnerRelation, error: partnerRelationError } = await supabase
      .from('user_couples')
      .select('user_id')
      .eq('couple_id', userCouple.couple_id)
      .neq('user_id', userId)
      .single();

    if (partnerRelationError || !partnerRelation) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }

    // Check if there's already an active plan
    const { data: existingPlan, error: planError } = await supabase
      .from('session_plans')
      .select('*')
      .eq('couple_id', userCouple.couple_id)
      .in('status', ['pending_partner', 'planning_complete'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPlan) {
      return NextResponse.json(
        { error: 'An active session plan already exists', plan: existingPlan },
        { status: 409 }
      );
    }

    // Create a new session plan
    const { data: newPlan, error: createError } = await supabase
      .from('session_plans')
      .insert({
        couple_id: userCouple.couple_id,
        initiator_id: userId,
        spiciness_level: spiciness,
        duration: duration,
        selected_scenario: selectedScenario,
        initiator_answers: answers || {},
        status: 'pending_partner'
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create session plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: newPlan
    });
  } catch (error) {
    console.error('Error creating session plan:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating session plan' },
      { status: 500 }
    );
  }
}

// GET - Fetch the latest session plan
export async function GET(request: NextRequest) {
  try {
    // Get the auth token from the request header
    const authHeader = request.headers.get('Authorization');
    const customUserIdHeader = request.headers.get('X-Supabase-User-ID');
    
    let userId = null;
    
    // First try to get the user from the custom header set by middleware
    if (customUserIdHeader) {
      userId = customUserIdHeader;
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
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 401 }
            );
          }
          
          // Use the authenticated user
          userId = user.id;
        } else {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
      } else {
        // If we have a session from cookies, use that
        userId = session.user.id;
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

    // Find the user's couple relationship
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

    // Get the latest active session plan
    const { data: activePlan, error: planError } = await supabase
      .from('session_plans')
      .select('*')
      .eq('couple_id', userCouple.couple_id)
      .in('status', ['pending_partner', 'planning_complete'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planError) {
      return NextResponse.json(
        { error: 'Error fetching session plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: activePlan || null
    });
  } catch (error) {
    console.error('Error fetching session plan:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching session plan' },
      { status: 500 }
    );
  }
}