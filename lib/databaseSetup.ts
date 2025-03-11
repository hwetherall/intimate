/**
 * Database Setup Script for IntiMate Passport
 * 
 * This file contains SQL statements and helper functions to set up
 * the database tables required for the Passport feature.
 * 
 * To run this script, you would typically execute it against your Supabase database
 * through their SQL editor or another database management tool.
 */

// SQL for creating the passport_answers table
export const createPassportAnswersTableSQL = `
-- Create passport_answers table
CREATE TABLE IF NOT EXISTS passport_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Add RLS policies
ALTER TABLE passport_answers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own answers
CREATE POLICY "Users can insert their own answers"
ON passport_answers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own answers
CREATE POLICY "Users can update their own answers"
ON passport_answers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own answers
CREATE POLICY "Users can view their own answers"
ON passport_answers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can delete their own answers
CREATE POLICY "Users can delete their own answers"
ON passport_answers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
`;

// SQL for altering profiles table to add passport_completion field
export const alterProfilesTableSQL = `
-- Add passport_completion field to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'passport_completion'
  ) THEN
    ALTER TABLE profiles ADD COLUMN passport_completion INTEGER DEFAULT 0;
  END IF;
END $$;
`;

// Sample questions to store in the database (optional)
export const sampleQuestionsSQL = `
-- Create questions table
CREATE TABLE IF NOT EXISTS passport_questions (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample questions
INSERT INTO passport_questions (text, type, options)
VALUES 
  ('How comfortable are you discussing your feelings with your partner?', 'scale', NULL),
  ('What are your preferred ways to receive affection?', 'multipleChoice', '["Physical touch", "Words of affirmation", "Quality time", "Gifts", "Acts of service"]'::JSONB),
  ('What boundaries are important for you to maintain in a relationship?', 'openEnded', NULL),
  ('How important is physical intimacy to you in a relationship?', 'scale', NULL),
  ('What activities help you feel most connected to your partner?', 'openEnded', NULL)
ON CONFLICT (id) DO NOTHING;
`;

/**
 * Instructions for implementing these database changes:
 * 
 * 1. Visit your Supabase project dashboard
 * 2. Go to the SQL Editor
 * 3. Create a new query
 * 4. Paste the SQL statements above
 * 5. Run the query to create the necessary tables and policies
 * 
 * Alternatively, you can use the Supabase client to programmatically execute these queries,
 * but that requires admin privileges and is typically done during initial setup.
 */ 