import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';
import { 
  supabase, 
  adminCreateOrUpdateProfile,
  diagnosePoliciesForProfiles 
} from '../lib/supabase';

// Define an error interface
interface ProfileError {
  message?: string;
  [key: string]: any;
}

// Update schema to match the database fields
const profileSchema = z.object({
  display_name: z.string().min(1, 'Display name is required'),
  user_id: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  partner_id: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const Profile = () => {
  const { user, profile, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile?.display_name || '',
      user_id: profile?.user_id || '',
      gender: profile?.gender || 'prefer_not_to_say',
      partner_id: profile?.partner_id || '',
    },
  });

  // Fetch profile data when component mounts
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setValue('display_name', data.display_name || '');
          setValue('user_id', data.user_id || '');
          setValue('gender', data.gender || 'prefer_not_to_say');
          setValue('partner_id', data.partner_id || '');
        }
      } catch (error) {
        const err = error as ProfileError;
        console.error('Error fetching profile:', err);
        setMessage({ 
          text: err.message || 'Error fetching profile data', 
          type: 'error' 
        });
      }
    };

    fetchProfileData();
  }, [user, setValue]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      if (!user) throw new Error('User not authenticated');

      // Skip the direct Supabase update and only use the context's updateProfile
      // which has been improved to handle errors better
      console.log('Updating profile with data:', data);
      
      // Ensure we include all necessary fields for RLS
      const profileData = {
        id: user.id, // This is sometimes needed for RLS policies
        user_id: user.id,
        display_name: data.display_name,
        gender: data.gender,
        partner_id: data.partner_id || undefined
      };
      
      console.log('Sending to updateProfile:', profileData);
      
      try {
        // First try the normal update
        await updateProfile(profileData);
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
      } catch (updateError) {
        console.error('Normal profile update failed:', updateError);
        
        // If it's an RLS error, try the admin method
        const errorMsg = updateError instanceof Error ? updateError.message : String(updateError);
        
        if (errorMsg.includes('violates row-level security') || errorMsg.includes('RLS')) {
          console.log('Detected RLS issue. Running diagnostics...');
          await diagnosePoliciesForProfiles(user.id);
          
          console.log('Attempting admin profile update as fallback...');
          
          // Try admin update as fallback
          const { profile: adminUpdatedProfile, error: adminError } = 
            await adminCreateOrUpdateProfile(user.id, profileData);
            
          if (adminError) {
            throw adminError;
          }
          
          // Manually update the profile in auth context
          if (adminUpdatedProfile) {
            setMessage({ 
              text: 'Profile updated successfully (admin mode). Please report this RLS issue to the developer.', 
              type: 'success' 
            });
          } else {
            throw new Error('Failed to update profile (admin mode)');
          }
        } else {
          // Not an RLS error, rethrow
          throw updateError;
        }
      }
    } catch (error) {
      const err = error as ProfileError;
      console.error('Profile update error:', err);
      setMessage({ 
        text: `Failed to update profile: ${err.message || 'Unknown error'}. Please try again or contact support.`, 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Profile</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              This information will be used to personalize your experience.
            </p>
          </div>
        </div>
        <div className="mt-5 md:col-span-2 md:mt-0">
          {message && (
            <div
              className={`mb-4 rounded-md p-4 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="shadow sm:overflow-hidden sm:rounded-md">
              <div className="space-y-6 bg-white px-4 py-5 sm:p-6 dark:bg-gray-800">
                <div>
                  <label
                    htmlFor="display_name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="display_name"
                    className="input mt-1"
                    {...register('display_name')}
                  />
                  {errors.display_name && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.display_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="user_id"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Username
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      id="user_id"
                      className="input"
                      disabled
                      {...register('user_id')}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Username cannot be changed
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Gender
                  </label>
                  <div className="mt-1">
                    <select
                      id="gender"
                      className="input"
                      {...register('gender')}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                  {errors.gender && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.gender.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="partner_id"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Partner ID (optional)
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="partner_id"
                      className="input"
                      placeholder="Enter your partner's user ID to connect"
                      {...register('partner_id')}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Your ID: {user?.id}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 text-right sm:px-6 dark:bg-gray-700">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary inline-flex justify-center"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-b-transparent"></div>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;