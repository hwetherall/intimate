import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';
import { createProfile } from '../lib/supabase';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  fullName: z.string().min(1, 'Please enter your full name'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Register the user
      const { data: authData, error: authError } = await signUp(data.email, data.password);
      
      if (authError) {
        throw authError;
      }
      
      if (authData?.user) {
        // Create user profile
        const { error: profileError } = await createProfile(authData.user.id, {
          full_name: data.fullName,
          username: data.email.split('@')[0],
        });
        
        if (profileError) {
          throw profileError;
        }
        
        navigate('/login', { state: { message: 'Registration successful! Please confirm your email before logging in.' } });
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Create a new account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10 dark:bg-gray-800">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/30">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
              >
                Full Name
              </label>
              <div className="mt-2">
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  {...register('fullName')}
                  className="input"
                />
                {errors.fullName && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="input"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
              >
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  className="input"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200"
              >
                Confirm Password
              </label>
              <div className="mt-2">
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className="input"
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full flex justify-center"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-b-transparent"></div>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
