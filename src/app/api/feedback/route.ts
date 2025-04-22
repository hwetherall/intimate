import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

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
    const body = await request.json();
    const { sessionId, feedbackData } = body;

    if (!sessionId || !feedbackData) {
      return NextResponse.json(
        { error: 'Session ID and feedback data are required' },
        { status: 400 }
      );
    }

    // Check if the session exists and belongs to the user's couple
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

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('couple_id', userCouple.couple_id)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Check if feedback already exists for this user and session
    const { data: existingFeedback, error: existingFeedbackError } = await supabase
      .from('session_feedback')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    if (existingFeedback) {
      // Update existing feedback
      const { error: updateError } = await supabase
        .from('session_feedback')
        .update({
          feedback_data: feedbackData,
          created_at: new Date().toISOString(),
        })
        .eq('id', existingFeedback.id);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update feedback' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Feedback updated successfully',
      });
    } else {
      // Create new feedback
      const { error: insertError } = await supabase
        .from('session_feedback')
        .insert({
          session_id: sessionId,
          user_id: userId,
          feedback_data: feedbackData,
        });

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to submit feedback' },
          { status: 500 }
        );
      }

      // Check if both partners have submitted feedback
      const { data: feedbackCount, error: countError } = await supabase
        .from('session_feedback')
        .select('id')
        .eq('session_id', sessionId);

      if (!countError && feedbackCount && feedbackCount.length >= 2) {
        // Both partners have submitted feedback, mark session as completed
        await supabase
          .from('sessions')
          .update({ status: 'completed' })
          .eq('id', sessionId);
      }

      return NextResponse.json({
        success: true,
        message: 'Feedback submitted successfully',
      });
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'An error occurred while submitting feedback' },
      { status: 500 }
    );
  }
}

// GET feedback for a specific session
export async function GET(request: NextRequest) {
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

    // Get the session ID from the query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Check if the session exists and belongs to the user's couple
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

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('couple_id', userCouple.couple_id)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Get feedback for this session
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('session_feedback')
      .select('*, users(full_name)')
      .eq('session_id', sessionId);

    if (feedbackError) {
      return NextResponse.json(
        { error: 'Error fetching feedback' },
        { status: 500 }
      );
    }

    // Return the feedback data
    return NextResponse.json({
      success: true,
      feedback: feedbackData || []
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching feedback' },
      { status: 500 }
    );
  }
}