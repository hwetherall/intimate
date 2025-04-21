'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

// Basic preference schema
const preferenceSchema = z.object({
  comfortLevel: z.string().min(1, 'Please select your comfort level'),
  communicationPreference: z.string().min(1, 'Please select your communication preference'),
  idealFrequency: z.string().min(1, 'Please select your ideal frequency'),
  intimacyGoals: z.array(z.string()).min(1, 'Please select at least one goal'),
  additionalNotes: z.string().optional(),
});

type PreferenceFormData = z.infer<typeof preferenceSchema>;

// Define the intimacy goals options
const intimacyGoals = [
  'Improve physical connection',
  'Enhance emotional intimacy',
  'Explore new experiences',
  'Strengthen communication',
  'Rekindle passion',
  'Increase spontaneity',
  'Develop deeper trust',
  'Better understand partner needs',
];

export default function PreferencesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingPreferences, setExistingPreferences] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PreferenceFormData>({
    resolver: zodResolver(preferenceSchema),
    defaultValues: {
      intimacyGoals: [],
    },
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching preferences:', error);
          return;
        }

        if (data) {
          setExistingPreferences(data);
          
          // Set form values from existing preferences
          const preferences = data.preference_data;
          setValue('comfortLevel', preferences.comfortLevel || '');
          setValue('communicationPreference', preferences.communicationPreference || '');
          setValue('idealFrequency', preferences.idealFrequency || '');
          setValue('intimacyGoals', preferences.intimacyGoals || []);
          setValue('additionalNotes', preferences.additionalNotes || '');
        }
      } catch (err) {
        console.error('Error fetching preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user, supabase, setValue]);

  const onSubmit = async (data: PreferenceFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      if (existingPreferences) {
        // Update existing preferences
        const { error } = await supabase
          .from('preferences')
          .update({
            preference_data: data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPreferences.id);

        if (error) throw error;
      } else {
        // Insert new preferences
        const { error } = await supabase
          .from('preferences')
          .insert({
            user_id: user.id,
            preference_data: data,
          });

        if (error) throw error;
      }

      router.push('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <header className="py-6 border-b border-foreground/10 mb-8">
          <h1 className="text-2xl font-bold">Your Preferences</h1>
          <p className="text-foreground/70">
            Help us understand what you're looking for in your intimate experiences
          </p>
        </header>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <label className="block text-lg font-medium mb-4">
              What's your current comfort level with discussing intimacy?
            </label>
            <div className="space-y-2">
              {['Very comfortable', 'Somewhat comfortable', 'Neutral', 'Somewhat uncomfortable', 'Very uncomfortable'].map((level) => (
                <div key={level} className="flex items-center">
                  <input
                    type="radio"
                    id={`comfort-${level}`}
                    value={level}
                    {...register('comfortLevel')}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor={`comfort-${level}`}>{level}</label>
                </div>
              ))}
            </div>
            {errors.comfortLevel && (
              <p className="mt-1 text-sm text-red-600">{errors.comfortLevel.message}</p>
            )}
          </div>

          <div>
            <label className="block text-lg font-medium mb-4">
              How do you prefer to communicate about intimate topics?
            </label>
            <div className="space-y-2">
              {['Direct conversation', 'Hints and subtle cues', 'Written messages', 'Through shared activities', 'With humor and playfulness'].map((pref) => (
                <div key={pref} className="flex items-center">
                  <input
                    type="radio"
                    id={`communication-${pref}`}
                    value={pref}
                    {...register('communicationPreference')}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor={`communication-${pref}`}>{pref}</label>
                </div>
              ))}
            </div>
            {errors.communicationPreference && (
              <p className="mt-1 text-sm text-red-600">{errors.communicationPreference.message}</p>
            )}
          </div>

          <div>
            <label className="block text-lg font-medium mb-4">
              What's your ideal frequency for intimate moments?
            </label>
            <div className="space-y-2">
              {['Multiple times daily', 'Daily', 'Several times a week', 'Weekly', 'A few times a month', 'Monthly', 'Less frequently'].map((freq) => (
                <div key={freq} className="flex items-center">
                  <input
                    type="radio"
                    id={`frequency-${freq}`}
                    value={freq}
                    {...register('idealFrequency')}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor={`frequency-${freq}`}>{freq}</label>
                </div>
              ))}
            </div>
            {errors.idealFrequency && (
              <p className="mt-1 text-sm text-red-600">{errors.idealFrequency.message}</p>
            )}
          </div>

          <div>
            <label className="block text-lg font-medium mb-4">
              What are your goals for enhancing intimacy? (Select all that apply)
            </label>
            <div className="space-y-2">
              {intimacyGoals.map((goal) => (
                <div key={goal} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`goal-${goal}`}
                    value={goal}
                    {...register('intimacyGoals')}
                    className="mr-2 h-4 w-4"
                  />
                  <label htmlFor={`goal-${goal}`}>{goal}</label>
                </div>
              ))}
            </div>
            {errors.intimacyGoals && (
              <p className="mt-1 text-sm text-red-600">{errors.intimacyGoals.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="additionalNotes" className="block text-lg font-medium mb-4">
              Any additional notes or concerns?
            </label>
            <textarea
              id="additionalNotes"
              {...register('additionalNotes')}
              rows={4}
              className="w-full p-2 border border-foreground/20 rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground/30"
              placeholder="Share any additional thoughts, boundaries, or ideas..."
            ></textarea>
          </div>

          <div className="flex justify-between pt-6 border-t border-foreground/10">
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="py-2 px-4 border border-foreground/20 rounded-md hover:bg-foreground/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 bg-foreground text-background font-medium rounded-md disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}