'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const acceptSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
});

type InviteFormData = z.infer<typeof inviteSchema>;
type AcceptFormData = z.infer<typeof acceptSchema>;

export default function InvitePage() {
  const { sendInvite, acceptInvite } = useAuth();
  const [activeTab, setActiveTab] = useState<'send' | 'accept'>('send');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const {
    register: registerSend,
    handleSubmit: handleSubmitSend,
    formState: { errors: sendErrors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  });

  const {
    register: registerAccept,
    handleSubmit: handleSubmitAccept,
    formState: { errors: acceptErrors },
  } = useForm<AcceptFormData>({
    resolver: zodResolver(acceptSchema),
  });

  const onSendInvite = async (data: InviteFormData) => {
    setIsSubmitting(true);
    setError(null);
    setInviteCode(null);

    try {
      const code = await sendInvite(data.email);
      setInviteCode(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while sending the invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAcceptInvite = async (data: AcceptFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await acceptInvite(data.inviteCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid invite code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border border-foreground/10 p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-1">Partner Connection</h1>
          <p className="text-foreground/70">Link with your partner to enhance your experience</p>
        </div>

        <div className="mb-6 flex border-b border-foreground/10">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-2 text-center ${
              activeTab === 'send'
                ? 'border-b-2 border-foreground font-medium'
                : 'text-foreground/70'
            }`}
          >
            Send Invite
          </button>
          <button
            onClick={() => setActiveTab('accept')}
            className={`flex-1 py-2 text-center ${
              activeTab === 'accept'
                ? 'border-b-2 border-foreground font-medium'
                : 'text-foreground/70'
            }`}
          >
            Accept Invite
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        {inviteCode && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-md">
            <p className="font-medium mb-1">Invite created successfully!</p>
            <p className="text-sm">Share this code with your partner:</p>
            <div className="mt-2 p-2 bg-green-100 rounded font-mono text-center break-all">
              {inviteCode}
            </div>
          </div>
        )}

        {activeTab === 'send' ? (
          <form onSubmit={handleSubmitSend(onSendInvite)} className="space-y-4">
            <div>
              <label htmlFor="partnerEmail" className="block text-sm font-medium mb-1">
                Partner's Email
              </label>
              <input
                id="partnerEmail"
                type="email"
                {...registerSend('email')}
                className="w-full p-2 border border-foreground/20 rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground/30"
                placeholder="Enter your partner's email"
              />
              {sendErrors.email && (
                <p className="mt-1 text-sm text-red-600">{sendErrors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 bg-foreground text-background font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground disabled:opacity-70"
            >
              {isSubmitting ? 'Sending...' : 'Send Invite'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitAccept(onAcceptInvite)} className="space-y-4">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium mb-1">
                Invite Code
              </label>
              <input
                id="inviteCode"
                type="text"
                {...registerAccept('inviteCode')}
                className="w-full p-2 border border-foreground/20 rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground/30"
                placeholder="Enter the invite code"
              />
              {acceptErrors.inviteCode && (
                <p className="mt-1 text-sm text-red-600">{acceptErrors.inviteCode.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 bg-foreground text-background font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-foreground disabled:opacity-70"
            >
              {isSubmitting ? 'Accepting...' : 'Accept Invite'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}