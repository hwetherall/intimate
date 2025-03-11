-- Migration: Create Passport Tables
-- This file contains SQL to create the tables required for the IntiMate app's passport feature

-- First, check if the passport_questions table exists
CREATE TABLE IF NOT EXISTS passport_questions (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('scale', 'multipleChoice', 'openEnded')),
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Next, create the passport_answers table
CREATE TABLE IF NOT EXISTS passport_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES passport_questions (id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, question_id)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE passport_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE passport_answers ENABLE ROW LEVEL SECURITY;

-- Create policies for passport_questions
CREATE POLICY "Anyone can read passport questions"
    ON passport_questions
    FOR SELECT
    USING (true);
    
CREATE POLICY "Only authenticated users can insert passport questions"
    ON passport_questions
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
    
CREATE POLICY "Only authenticated users can update passport questions"
    ON passport_questions
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Create policies for passport_answers
CREATE POLICY "Users can read their own passport answers"
    ON passport_answers
    FOR SELECT
    USING (auth.uid() = user_id);
    
CREATE POLICY "Partners can read each other's passport answers"
    ON passport_answers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE (profiles.id = auth.uid() AND profiles.partner_id = user_id)
            OR (profiles.id = user_id AND profiles.partner_id = auth.uid())
        )
    );
    
CREATE POLICY "Users can insert their own passport answers"
    ON passport_answers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update their own passport answers"
    ON passport_answers
    FOR UPDATE
    USING (auth.uid() = user_id);
    
CREATE POLICY "Users can delete their own passport answers"
    ON passport_answers
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add function to create passport tables that can be called from the application
CREATE OR REPLACE FUNCTION create_passport_tables()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check and create passport_questions table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'passport_questions') THEN
        CREATE TABLE public.passport_questions (
            id SERIAL PRIMARY KEY,
            text TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('scale', 'multipleChoice', 'openEnded')),
            options JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        ALTER TABLE public.passport_questions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Anyone can read passport questions"
            ON public.passport_questions
            FOR SELECT
            USING (true);
    END IF;
    
    -- Check and create passport_answers table
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'passport_answers') THEN
        CREATE TABLE public.passport_answers (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
            question_id INTEGER NOT NULL,
            answer TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (user_id, question_id)
        );
        
        ALTER TABLE public.passport_answers ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can read their own passport answers"
            ON public.passport_answers
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
    
    -- Insert default questions if none exist
    IF NOT EXISTS (SELECT 1 FROM public.passport_questions LIMIT 1) THEN
        INSERT INTO public.passport_questions (id, text, type, options) VALUES
        (1, 'How comfortable are you discussing your feelings with your partner?', 'scale', NULL),
        (2, 'What are your preferred ways to receive affection?', 'multipleChoice', '["Physical touch", "Words of affirmation", "Quality time", "Gifts", "Acts of service"]'),
        (3, 'What boundaries are important for you to maintain in a relationship?', 'openEnded', NULL),
        (4, 'How important is physical intimacy to you in a relationship?', 'scale', NULL),
        (5, 'What activities help you feel most connected to your partner?', 'openEnded', NULL);
    END IF;
    
    RETURN 'Passport tables created successfully';
END;
$$;

-- Add passport_completion column to profiles table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'passport_completion'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN passport_completion INTEGER DEFAULT 0;
    END IF;
END $$; 