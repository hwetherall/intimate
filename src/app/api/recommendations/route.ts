import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { aiService } from '@/lib/ai-service';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get the auth token from the request header
    const authHeader = request.headers.get('Authorization');
    const customUserIdHeader = request.headers.get('X-Supabase-User-ID');
    const hasCookieAuth = request.cookies.has('supabase-auth-token');
    
    console.log("POST /api/recommendations - Auth Header:", authHeader ? "Present" : "Missing");
    console.log("POST /api/recommendations - Custom User ID:", customUserIdHeader || "Missing");
    console.log("POST /api/recommendations - Cookie Auth:", hasCookieAuth ? "Present" : "Missing");
    
    let userId = null;
    
    // First try to get the user from the custom header set by middleware
    if (customUserIdHeader) {
      userId = customUserIdHeader;
      console.log("Using user ID from custom header:", userId);
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
            console.error("Auth token validation error:", authError);
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 401 }
            );
          }
          
          // Use the authenticated user
          userId = user.id;
          console.log("Using user from auth header:", userId);
        } else {
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

    // Get both users' preferences
    const { data: userPreferences, error: userPrefError } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: partnerPreferences, error: partnerPrefError } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', partnerRelation.user_id)
      .single();

    if (userPrefError || !userPreferences) {
      return NextResponse.json(
        { error: 'User preferences not found' },
        { status: 404 }
      );
    }

    if (partnerPrefError || !partnerPreferences) {
      return NextResponse.json(
        { error: 'Partner preferences not found' },
        { status: 404 }
      );
    }

    // Generate recommendations using the AI service
    const recommendations = await aiService.generateRecommendations(
      userPreferences,
      partnerPreferences
    );

    // Create a new session with the recommendations
    const { data: session_data, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        couple_id: userCouple.couple_id,
        recommendation_data: recommendations,
        status: 'active'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Return the recommendations
    return NextResponse.json({
      success: true,
      session: session_data,
      recommendations
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating recommendations' },
      { status: 500 }
    );
  }
}

// GET route to fetch the latest recommendations for a couple
export async function GET(request: NextRequest) {
  try {
    // Get the auth token from the request header
    const authHeader = request.headers.get('Authorization');
    const customUserIdHeader = request.headers.get('X-Supabase-User-ID');
    const hasCookieAuth = request.cookies.has('supabase-auth-token');
    
    console.log("GET /api/recommendations - Auth Header:", authHeader ? "Present" : "Missing");
    console.log("GET /api/recommendations - Custom User ID:", customUserIdHeader || "Missing");
    console.log("GET /api/recommendations - Cookie Auth:", hasCookieAuth ? "Present" : "Missing");
    
    let userId = null;
    
    // First try to get the user from the custom header set by middleware
    if (customUserIdHeader) {
      userId = customUserIdHeader;
      console.log("Using user ID from custom header:", userId);
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
            console.error("Auth token validation error:", authError);
            return NextResponse.json(
              { error: 'Unauthorized' },
              { status: 401 }
            );
          }
          
          // Use the authenticated user
          userId = user.id;
          console.log("Using user from auth header:", userId);
        } else {
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

    // Get the latest active session for this couple
    const { data: activeSession, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('couple_id', userCouple.couple_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError) {
      // If no active session found, return empty but not an error
      if (sessionError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          session: null,
          recommendations: null
        });
      }

      return NextResponse.json(
        { error: 'Error fetching session' },
        { status: 500 }
      );
    }

    // Return the recommendations
    return NextResponse.json({
      success: true,
      session: activeSession,
      recommendations: activeSession.recommendation_data
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching recommendations' },
      { status: 500 }
    );
  }
}