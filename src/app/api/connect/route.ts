import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    
    // Debug log
    console.log("Auth header:", authHeader ? "Present" : "Missing");
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid token format' },
        { status: 401 }
      );
    }
    
    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    // Create a Supabase client with the provided token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Verify the token is valid by getting the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the current user ID
    const userId = user.id;
    console.log("User ID in API:", userId);

    // Parse the request body
    const body = await request.json();
    const { partnerEmail } = body;

    if (!partnerEmail) {
      return NextResponse.json(
        { error: 'Partner email is required' },
        { status: 400 }
      );
    }

    // Find the partner by email in our custom users table
    const { data: partnerUser, error: partnerError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', partnerEmail)
      .single();

    // If not found in custom table, throw a clear error message
    if (partnerError || !partnerUser) {
      console.log("Partner not found in custom users table:", partnerEmail);
      
      // First, make sure the current user exists in the users table
      // (This helps ensure we don't have a similar problem later)
      const { data: currentUserCheck, error: currentUserError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (!currentUserCheck) {
        console.log("Current user not in custom table, adding them");
        
        // Get current user details
        const { data: { user: currentUser }, error: getUserError } = await supabase.auth.getUser();
        
        if (currentUser) {
          // Add current user to custom table
          await supabase
            .from('users')
            .insert({
              id: currentUser.id,
              email: currentUser.email,
              full_name: currentUser.user_metadata?.full_name || '',
            });
            
          console.log("Added current user to custom users table");
        }
      }
      
      return NextResponse.json(
        { error: `The email ${partnerEmail} is not registered. Please ask your partner to sign up first.` },
        { status: 404 }
      );
    }

    console.log("Partner lookup result:", partnerUser);

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

    if (userCoupleError) {
      console.error("Error checking user couple:", userCoupleError);
    }

    const { data: existingPartnerCouple, error: partnerCoupleError } = await supabase
      .from('user_couples')
      .select('couple_id')
      .eq('user_id', partnerUser.id);

    if (partnerCoupleError) {
      console.error("Error checking partner couple:", partnerCoupleError);
    }

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

    if (coupleError) {
      console.error("Error creating couple:", coupleError);
      return NextResponse.json(
        { error: 'Failed to create couple relationship' },
        { status: 500 }
      );
    }

    if (!couple) {
      return NextResponse.json(
        { error: 'Failed to create couple - no data returned' },
        { status: 500 }
      );
    }

    console.log("Created couple:", couple.id);

    // Add both users to the couple
    const { error: userCoupleInsertError } = await supabase
      .from('user_couples')
      .insert({
        user_id: userId,
        couple_id: couple.id
      });

    if (userCoupleInsertError) {
      console.error("Error creating user couple:", userCoupleInsertError);
      return NextResponse.json(
        { error: 'Failed to link current user to couple' },
        { status: 500 }
      );
    }

    const { error: partnerCoupleInsertError } = await supabase
      .from('user_couples')
      .insert({
        user_id: partnerUser.id,
        couple_id: couple.id
      });

    if (partnerCoupleInsertError) {
      console.error("Error creating partner couple:", partnerCoupleInsertError);
      return NextResponse.json(
        { error: 'Failed to link partner to couple' },
        { status: 500 }
      );
    }

    console.log("Successfully connected users");
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