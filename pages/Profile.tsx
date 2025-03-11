import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  username: z.string().min(1, 'Username is required'),
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
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      username: profile?.username || '',
      partner_id: profile?.partner_id || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setMessage(null);

    try {
      await updateProfile(data);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to update profile', type: 'error' });
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
              This information will be displayed publicly so be careful what you share.
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
                    htmlFor="full_name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    className="input mt-1"
                    {...register('full_name')}
                  />
                  {errors.full_name && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.full_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Username
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      id="username"
                      className="input"
                      {...register('username')}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {errors.username.message}
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
