// src/app/api/ask-advice/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

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

    // Get the question from the request body
    const { question } = await request.json();
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
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

    // Get both users' preferences
    const { data: userPreferences, error: userPrefError } = await supabase
      .from('preferences')
      .select('preference_data')
      .eq('user_id', userId)
      .single();

    const { data: partnerPreferences, error: partnerPrefError } = await supabase
      .from('preferences')
      .select('preference_data')
      .eq('user_id', partnerRelation.user_id)
      .single();

    // Call OpenRouter API
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      const apiUrl = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1';
      const modelName = process.env.OPENROUTER_MODEL_NAME || 'x-ai/grok-3-mini-beta';

      // Construct prompt
      const prompt = `
You are a supportive, knowledgeable relationship advisor helping a couple enhance their intimate relationship. 
You provide thoughtful, personalized advice that respects both partners' preferences.

USER'S PREFERENCES:
${userPreferences ? JSON.stringify(userPreferences.preference_data, null, 2) : 'No preferences set yet'}

PARTNER'S PREFERENCES:
${partnerPreferences ? JSON.stringify(partnerPreferences.preference_data, null, 2) : 'No preferences set yet'}

USER'S QUESTION:
${question}

Provide supportive, practical advice that's tailored to their specific preferences and situation. 
Be respectful, empathetic, and focus on enhancing communication and connection.
Limit your response to 3-4 paragraphs maximum.
`;

      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Store question and response in history
      await supabase
        .from('question_history')
        .insert({
          user_id: userId,
          question,
          response: aiResponse
        });

      return NextResponse.json({
        success: true,
        response: aiResponse
      });
    } catch (error) {
      console.error('Error calling AI service:', error);
      return NextResponse.json(
        { error: 'Failed to generate advice' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing advice request:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}