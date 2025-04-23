'use client';

import { useState } from 'react';
import Link from 'next/link';
import SomethingNewSuggestion from './SomethingNewSuggestion';

type SessionPlan = {
  id: string;
  plan_data: {
    title: string;
    description: string;
    sections: {
      id: string;
      title: string;
      content: string;
      durationMinutes?: number;
    }[];
  };
  spiciness_level: string;
  duration: string;
  created_at: string;
};

type SessionPlanDisplayProps = {
  plan: SessionPlan;
};

export default function SessionPlanDisplay({ plan }: SessionPlanDisplayProps) {
  const [showSomethingNew, setShowSomethingNew] = useState(false);

  if (!plan || !plan.plan_data) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto py-8">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-6 text-center">
            <h2 className="text-xl font-bold mb-4 text-amber-800">No Plan Available</h2>
            <p className="text-amber-700 mb-4">
              No session plan was found. Would you like to create one?
            </p>
            <Link
              href="/session-plan"
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
            >
              Create New Plan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const planData = plan.plan_data;
  const formattedDate = new Date(plan.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Convert spiciness_level and duration to human-readable format
  const spicinessMap: Record<string, string> = {
    'mild': 'Mild Connection',
    'warm': 'Warm Embrace',
    'spicy': 'Spicy Encounter',
    'hot': 'Hot & Heavy',
    'wild': 'Wild Adventure'
  };
  
  const durationMap: Record<string, string> = {
    'quick': 'Quick Connect (15-20 min)',
    'sweet': 'Sweet Spot (30-45 min)',
    'full': 'Full Experience (60-90 min)',
    'evening': 'Evening Journey (2+ hours)'
  };

  const spiciness = spicinessMap[plan.spiciness_level] || plan.spiciness_level;
  const duration = durationMap[plan.duration] || plan.duration;

  const totalMinutes = planData.sections.reduce((acc, section) => acc + (section.durationMinutes || 0), 0);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <header className="py-6 border-b border-foreground/10 mb-8">
          <h1 className="text-2xl font-bold">Your Session Plan</h1>
          <p className="text-foreground/70">
            Created on {formattedDate}
          </p>
        </header>

        <div className="bg-foreground/5 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold">{planData.title}</h2>
          
          <div className="flex flex-wrap gap-2 mt-4 mb-4">
            <span className="px-3 py-1 bg-foreground/10 rounded-full text-sm">
              {spiciness}
            </span>
            <span className="px-3 py-1 bg-foreground/10 rounded-full text-sm">
              {duration}
            </span>
            {totalMinutes > 0 && (
              <span className="px-3 py-1 bg-foreground/10 rounded-full text-sm">
                {totalMinutes} minutes
              </span>
            )}
          </div>
          
          <p className="text-foreground/80 mt-2">{planData.description}</p>
        </div>

        <div className="space-y-6 mb-8">
          {planData.sections.map((section, index) => (
            <div key={section.id} className="border border-foreground/10 rounded-lg overflow-hidden">
              <div className="bg-foreground/5 p-4 border-b border-foreground/10">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">{section.title}</h3>
                  {section.durationMinutes && (
                    <span className="text-sm text-foreground/60">
                      {section.durationMinutes} min
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                {section.content.split('\n').map((paragraph, pIndex) => (
                  <p key={pIndex} className={pIndex > 0 ? 'mt-4' : ''}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!showSomethingNew ? (
          <div className="bg-foreground/5 rounded-lg p-6 mb-8 text-center">
            <h3 className="text-lg font-bold mb-2">Feeling Adventurous?</h3>
            <p className="mb-4">Would you like to add something new to your experience?</p>
            <button
              onClick={() => setShowSomethingNew(true)}
              className="py-2 px-4 bg-foreground text-background font-medium rounded-md"
            >
              Add Something New
            </button>
          </div>
        ) : (
          <SomethingNewSuggestion planId={plan.id} />
        )}

        <div className="flex justify-between">
          <Link
            href="/session-plan"
            className="py-2 px-4 border border-foreground/20 rounded-md hover:bg-foreground/5"
          >
            Create New Plan
          </Link>
          
          <button
            onClick={() => window.print()}
            className="py-2 px-4 bg-foreground text-background font-medium rounded-md"
          >
            Print / Save Plan
          </button>
        </div>
      </div>
    </div>
  );
}