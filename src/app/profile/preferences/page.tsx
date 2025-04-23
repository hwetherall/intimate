'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/lib/hooks/useSupabaseClient';

// Updated preference schema for 20 questions
const preferenceSchema = z.object({
  comfortLevel: z.string().min(1, 'Please select your comfort level'),
  communicationStyle: z.string().min(1, 'Please select your communication style'),
  expressionPreference: z.string().min(1, 'Please select how you express desires'),
  preferredTime: z.string().min(1, 'Please select your preferred time'),
  idealFrequency: z.string().min(1, 'Please select your ideal frequency'),
  specialOccasions: z.string().optional(),
  touchPreference: z.string().min(1, 'Please select your touch preference'),
  favoriteAreas: z.array(z.string()).min(1, 'Please select at least one area'),
  noTouchAreas: z.string().optional(),
  emotionalImportance: z.string().min(1, 'Please select importance level'),
  emotionalNeed: z.string().min(1, 'Please select your need level'),
  emotionalConnection: z.array(z.string()).min(1, 'Please select at least one option'),
  explorationOpenness: z.string().min(1, 'Please select your openness level'),
  dominanceSubmissionComfort: z.string().min(1, 'Please select your comfort level with dominance/submission'),
  dominanceSubmission: z.string().min(1, 'Please select your preference for dominance/submission'),
  hardLimits: z.string().optional(),
  newIdeas: z.string().optional(),
  giveFeedback: z.string().min(1, 'Please select how you give feedback'),
  receiveFeedback: z.string().min(1, 'Please select how you receive feedback'),
  intimacyGoals: z.array(z.string()).min(1, 'Please select at least one goal'),
  fantasies: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type PreferenceFormData = z.infer<typeof preferenceSchema>;

// Define options for multi-select questions
const favoriteAreasOptions = ['Neck', 'Back', 'Arms', 'Legs', 'Feet', 'Other'];
const emotionalConnectionOptions = ['Eye contact', 'Verbal affirmations', 'Physical closeness', 'Shared laughter', 'Other'];
const intimacyGoalsOptions = [
  'Improve physical connection',
  'Enhance emotional intimacy',
  'Explore new experiences',
  'Strengthen communication',
  'Rekindle passion',
  'Increase spontaneity',
  'Develop deeper trust',
  'Better understand partner needs',
];

// Define options for dominance/submission
const comfortOptions = ['very_comfortable', 'somewhat_comfortable', 'neutral', 'somewhat_uncomfortable', 'very_uncomfortable'];
const dominanceSubmissionOptions = ['dominant', 'submissive', 'switch', 'not_interested', 'prefer_not_to_say'];

export default function PreferencesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = useSupabaseClient();
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
      favoriteAreas: [],
      emotionalConnection: [],
      intimacyGoals: [],
    },
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          setError(`Failed to load preferences: ${error.message}`);
          return;
        }

        if (data) {
          setExistingPreferences(data);
          const preferences = data.preference_data || {};
          if (typeof preferences === 'object') {
            Object.entries(preferences).forEach(([key, value]) => {
              if (value) setValue(key as keyof PreferenceFormData, value as any);
            });
          }
        }
      } catch (err) {
        setError('Failed to load preferences. Please try again.');
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
        const { error } = await supabase
          .from('preferences')
          .update({
            preference_data: data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPreferences.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('preferences')
          .insert({
            user_id: user.id,
            preference_data: data,
          });

        if (error) throw error;
      }

      router.push('/profile');
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving preferences');
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
            Help us understand your preferences for intimate experiences
          </p>
        </header>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6">
            {/* Comfort and Communication */}
            <label className="block">
              <span className="text-foreground font-medium">1. How comfortable are you discussing intimate desires with your partner?</span>
              <select
                {...register('comfortLevel')}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
              >
                <option value="">Select an option</option>
                <option value="1">1 - Very uncomfortable</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5 - Very comfortable</option>
              </select>
              {errors.comfortLevel && <p className="mt-1 text-red-500 text-sm">{errors.comfortLevel.message}</p>}
            </label>

            <label className="block">
              <span className="text-foreground font-medium">2. When talking about intimacy, do you prefer:</span>
              <select
                {...register('communicationStyle')}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
              >
                <option value="">Select an option</option>
                <option value="direct">Direct, explicit language</option>
                <option value="subtle">Subtle hints and suggestions</option>
                <option value="mixed">A mix of both depending on the situation</option>
              </select>
              {errors.communicationStyle && <p className="mt-1 text-red-500 text-sm">{errors.communicationStyle.message}</p>}
            </label>

            <label className="block">
              <span className="text-foreground font-medium">3. How do you typically express your desires?</span>
              <select
                {...register('expressionPreference')}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
              >
                <option value="">Select an option</option>
                <option value="verbally">Verbally</option>
                <option value="actions">Through actions</option>
                <option value="both">Both</option>
              </select>
              {errors.expressionPreference && <p className="mt-1 text-red-500 text-sm">{errors.expressionPreference.message}</p>}
            </label>

            {/* Frequency and Timing */}
            <label className="block">
              <span className="text-foreground font-medium">4. What time of day do you feel most interested in intimacy?</span>
              <select
                {...register('preferredTime')}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
              >
                <option value="">Select an option</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="late_night">Late night</option>
                <option value="no_preference">No specific preference</option>
              </select>
              {errors.preferredTime && <p className="mt-1 text-red-500 text-sm">{errors.preferredTime.message}</p>}
            </label>

            <label className="block">
              <span className="text-foreground font-medium">5. How often would you ideally like intimate moments?</span>
              <select
                {...register('idealFrequency')}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
              >
                <option value="">Select an option</option>
                <option value="daily">Daily</option>
                <option value="several_times_week">Several times a week</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every other week</option>
                <option value="monthly">Monthly</option>
                <option value="less_often">Less often</option>
              </select>
              {errors.idealFrequency && <p className="mt-1 text-red-500 text-sm">{errors.idealFrequency.message}</p>}
            </label>

            <label className="block">
              <span className="text-foreground font-medium">6. Are there specific days or occasions when you enjoy intimacy? (e.g., weekends, date nights)</span>
              <textarea
                {...register('specialOccasions')}
                rows={2}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
                placeholder="Optional: Add details here..."
              />
            </label>

            {/* Physical Preferences */}
            <label className="block">
              <span className="text-foreground font-medium">7. What types of touch do you find most arousing?</span>
              <select
                {...register('touchPreference')}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
              >
                <option value="">Select an option</option>
                <option value="light">Light, teasing touches</option>
                <option value="firm">Firm, confident touches</option>
                <option value="combination">A combination of both</option>
                <option value="other">Other (specify in notes)</option>
              </select>
              {errors.touchPreference && <p className="mt-1 text-red-500 text-sm">{errors.touchPreference.message}</p>}
            </label>

            <div className="block">
              <span className="text-foreground font-medium">8. Where do you especially enjoy being touched?</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {favoriteAreasOptions.map((area) => (
                  <label key={area} className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      value={area}
                      {...register('favoriteAreas')}
                      className="mt-0.5"
                    />
                    <span>{area}</span>
                  </label>
                ))}
              </div>
              {errors.favoriteAreas && <p className="mt-1 text-red-500 text-sm">{errors.favoriteAreas.message}</p>}
            </div>

            <label className="block">
              <span className="text-foreground font-medium">9. Are there areas you prefer not to be touched?</span>
              <textarea
                {...register('noTouchAreas')}
                rows={2}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
                placeholder="Optional: Specify any boundaries..."
              />
            </label>

            {/* Emotional Connection */}
            <label className="block">
              <span className="text-foreground font-medium">10. How important is emotional connection during intimacy?</span>
              <select
                {...register('emotionalImportance')}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
              >
                <option value="">Select an option</option>
                <option value="extremely">Extremely important</option>
                <option value="very">Very important</option>
                <option value="somewhat">Somewhat important</option>
                <option value="not_very">Not very important</option>
                <option value="not_at_all">Not important at all</option>
              </select>
              {errors.emotionalImportance && <p className="mt-1 text-red-500 text-sm">{errors.emotionalImportance.message}</p>}
            </label>

            <label className="block">
              <span className="text-foreground font-medium">11. Do you need emotional connection to enjoy physical intimacy?</span>
              <select
                {...register('emotionalNeed')}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
              >
                <option value="">Select an option</option>
                <option value="always">Always</option>
                <option value="usually">Usually</option>
                <option value="sometimes">Sometimes</option>
                <option value="rarely">Rarely</option>
                <option value="never">Never</option>
              </select>
              {errors.emotionalNeed && <p className="mt-1 text-red-500 text-sm">{errors.emotionalNeed.message}</p>}
            </label>

            <div className="block">
              <span className="text-foreground font-medium">12. What helps you feel emotionally connected?</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {emotionalConnectionOptions.map((option) => (
                  <label key={option} className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      value={option}
                      {...register('emotionalConnection')}
                      className="mt-0.5"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {errors.emotionalConnection && <p className="mt-1 text-red-500 text-sm">{errors.emotionalConnection.message}</p>}
            </div>

            {/* Exploration and Boundaries */}
            <label className="block">
              <span className="text-foreground font-medium">13. Are you open to trying new things in intimacy?</span>
              <select
                {...register('explorationOpenness')}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
              >
                <option value="">Select an option</option>
                <option value="very_open">Very open</option>
                <option value="somewhat_open">Somewhat open</option>
                <option value="neutral">Neutral</option>
                <option value="somewhat_hesitant">Somewhat hesitant</option>
                <option value="not_open">Not open at all</option>
              </select>
              {errors.explorationOpenness && <p className="mt-1 text-red-500 text-sm">{errors.explorationOpenness.message}</p>}
            </label>

            {/* New question about comfort with dominance/submission */}
            <label className="block">
              <span className="text-foreground font-medium">14. How comfortable are you discussing dominance and submission dynamics?</span>
              <select
                {...register('dominanceSubmissionComfort')}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
              >
                <option value="">Please select</option>
                <option value="very_comfortable">Very comfortable</option>
                <option value="somewhat_comfortable">Somewhat comfortable</option>
                <option value="neutral">Neutral</option>
                <option value="somewhat_uncomfortable">Somewhat uncomfortable</option>
                <option value="very_uncomfortable">Very uncomfortable</option>
              </select>
              {errors.dominanceSubmissionComfort && (
                <p className="mt-1 text-red-500 text-sm">{errors.dominanceSubmissionComfort?.message?.toString()}</p>
              )}
            </label>

            {/* New question about dominance/submission preference */}
            <label className="block">
              <span className="text-foreground font-medium">15. In intimate settings, what role do you prefer regarding dominance and submission?</span>
              <select
                {...register('dominanceSubmission')}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
              >
                <option value="">Please select</option>
                <option value="dominant">Dominant - I prefer to take control</option>
                <option value="submissive">Submissive - I prefer to follow my partner's lead</option>
                <option value="switch">Switch - I enjoy both roles</option>
                <option value="not_interested">Not interested in dominance/submission dynamics</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
              {errors.dominanceSubmission && <p className="mt-1 text-red-500 text-sm">{errors.dominanceSubmission?.message?.toString()}</p>}
            </label>

            <label className="block">
              <span className="text-foreground font-medium">16. What are your hard limits or things you don't want to try?</span>
              <textarea
                {...register('hardLimits')}
                rows={2}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
                placeholder="Optional: Be specific..."
              />
            </label>

            <label className="block">
              <span className="text-foreground font-medium">17. Anything you've always wanted to try but haven't yet?</span>
              <textarea
                {...register('newIdeas')}
                rows={2}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
                placeholder="Optional: Share your ideas..."
              />
            </label>

            {/* Feedback and Improvement */}
            <label className="block">
              <span className="text-foreground font-medium">18. How do you prefer to give feedback about intimate experiences?</span>
              <select
                {...register('giveFeedback')}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
              >
                <option value="">Select an option</option>
                <option value="immediately">Immediately after</option>
                <option value="later">Later, in a separate conversation</option>
                <option value="app">Through the app</option>
                <option value="no_feedback">I prefer not to give feedback</option>
              </select>
              {errors.giveFeedback && <p className="mt-1 text-red-500 text-sm">{errors.giveFeedback.message}</p>}
            </label>

            <label className="block">
              <span className="text-foreground font-medium">19. How do you prefer to receive feedback?</span>
              <select
                {...register('receiveFeedback')}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
              >
                <option value="">Select an option</option>
                <option value="direct">Direct and straightforward</option>
                <option value="gentle">Gently and with suggestions</option>
                <option value="actions">Through actions rather than words</option>
                <option value="no_feedback">I prefer not to receive feedback</option>
              </select>
              {errors.receiveFeedback && <p className="mt-1 text-red-500 text-sm">{errors.receiveFeedback.message}</p>}
            </label>

            <div className="block">
              <span className="text-foreground font-medium">20. What are your goals for enhancing intimacy?</span>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {intimacyGoalsOptions.map((goal) => (
                  <label key={goal} className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      value={goal}
                      {...register('intimacyGoals')}
                      className="mt-0.5"
                    />
                    <span>{goal}</span>
                  </label>
                ))}
              </div>
              {errors.intimacyGoals && <p className="mt-1 text-red-500 text-sm">{errors.intimacyGoals.message}</p>}
            </div>

            {/* Additional Questions */}
            <label className="block">
              <span className="text-foreground font-medium">21. Any specific fantasies or scenarios you'd like to explore?</span>
              <textarea
                {...register('fantasies')}
                rows={3}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
                placeholder="Optional: Share your thoughts..."
              />
            </label>

            <label className="block">
              <span className="text-foreground font-medium">22. Anything else you'd like your partner or the AI to know?</span>
              <textarea
                {...register('additionalNotes')}
                rows={3}
                className="mt-1 block w-full p-2 border border-foreground/20 rounded-md bg-background"
                placeholder="Optional: Add any details..."
              />
            </label>
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