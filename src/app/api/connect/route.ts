import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get the Supabase client
    const supabase = createServerClient();

    // Get user session
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
    const { partnerEmail } = body;

    if (!partnerEmail) {
      return NextResponse.json(
        { error: 'Partner email is required' },
        { status: 400 }
      );
    }

    // Find the partner by email
    const { data: partnerUser, error: partnerError } = await supabase
      .from('users')
      .select('id')
      .eq('email', partnerEmail)
      .single();

    if (partnerError || !partnerUser) {
      return NextResponse.json(
        { error: 'User with that email not found' },
        { status: 404 }
      );
    }

    // Prevent connecting to yourself
    if (userId === partnerUser.id) {
      return NextResponse.json(
        { error: 'You cannot connect with yourself' },
        { status: 400 }
      );
    }

    // Check if either user is already in a couple
    const { data: existingUserCouple, error: userCoupleError } = await supabase
      .from('user_couples')
      .select('couple_id')
      .eq('user_id', userId);

    const { data: existingPartnerCouple, error: partnerCoupleError } = await supabase
      .from('user_couples')
      .select('couple_id')
      .eq('user_id', partnerUser.id);

    if (
      (existingUserCouple && existingUserCouple.length > 0) ||
      (existingPartnerCouple && existingPartnerCouple.length > 0)
    ) {
      return NextResponse.json(
        { error: 'One or both users are already in a relationship' },
        { status: 400 }
      );
    }

    // Create a new couple
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .insert({})
      .select()
      .single();

    if (coupleError || !couple) {
      return NextResponse.json(
        { error: 'Failed to create couple relationship' },
        { status: 500 }
      );
    }

    // Add both users to the couple
    const { error: userCoupleInsertError } = await supabase
      .from('user_couples')
      .insert({
        user_id: userId,
        couple_id: couple.id
      });

    const { error: partnerCoupleInsertError } = await supabase
      .from('user_couples')
      .insert({
        user_id: partnerUser.id,
        couple_id: couple.id
      });

    if (userCoupleInsertError || partnerCoupleInsertError) {
      return NextResponse.json(
        { error: 'Failed to create user-couple relationships' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully connected with partner'
    });
  } catch (error) {
    console.error('Error connecting partner:', error);
    return NextResponse.json(
      { error: 'An error occurred while connecting partner' },
      { status: 500 }
    );
  }
}