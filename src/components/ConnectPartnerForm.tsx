// src/components/ConnectPartnerForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const connectSchema = z.object({
  partnerEmail: z.string().email('Please enter a valid email address'),
});

type ConnectFormData = z.infer<typeof connectSchema>;

export default function ConnectPartnerForm() {
  const { connectByEmail } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConnectFormData>({
    resolver: zodResolver(connectSchema),
  });

  const onSubmit = async (data: ConnectFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await connectByEmail(data.partnerEmail);
      
      if (error) {
        setError(error);
      } else {
        setSuccess(true);
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/profile');
          router.refresh(); // Force a refresh to update partner status
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect with partner');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-foreground/10 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-medium mb-4">Connect with your Partner</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-md text-sm">
          Successfully connected with partner! Redirecting to your profile...
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="partnerEmail" className="block text-sm font-medium mb-1">
            Partner's Email
          </label>
          <input
            id="partnerEmail"
            type="email"
            {...register('partnerEmail')}
            className="w-full p-2 border border-foreground/20 rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground/30"
            placeholder="Enter your partner's email address"
          />
          {errors.partnerEmail && (
            <p className="mt-1 text-sm text-red-600">{errors.partnerEmail.message}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-foreground text-background font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground disabled:opacity-70"
        >
          {isSubmitting ? 'Connecting...' : 'Connect with Partner'}
        </button>
      </form>
    </div>
  );
}