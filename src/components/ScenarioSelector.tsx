'use client';

import { useState } from 'react';

type Scenario = {
  id: string;
  title: string;
  description: string;
};

type ScenarioSelectorProps = {
  scenarios: Scenario[];
  selectedScenario: string;
  onSelect: (scenarioId: string) => void;
  loading: boolean;
};

export default function ScenarioSelector({
  scenarios,
  selectedScenario,
  onSelect,
  loading
}: ScenarioSelectorProps) {
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedScenario(prev => prev === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
        <p className="mt-4 text-foreground/70">Loading scenarios...</p>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground/70">No scenarios available. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-4">Which scenario do you find most appealing?</h2>
      <div className="space-y-4">
        {scenarios.map(scenario => (
          <div 
            key={scenario.id}
            className={`border rounded-md overflow-hidden ${
              selectedScenario === scenario.id 
                ? 'border-foreground' 
                : 'border-foreground/20'
            }`}
          >
            <div 
              className={`p-4 cursor-pointer ${
                selectedScenario === scenario.id ? 'bg-foreground/5' : ''
              }`}
              onClick={() => {
                onSelect(scenario.id);
                toggleExpand(scenario.id);
              }}
            >
              <div className="flex justify-between items-center">
                <div className="font-medium">{scenario.title}</div>
                <button 
                  className="text-foreground/60"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(scenario.id);
                  }}
                >
                  {expandedScenario === scenario.id ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {expandedScenario === scenario.id && (
              <div className="p-4 pt-0 border-t border-foreground/10">
                <p className="text-foreground/80 italic">{scenario.description}</p>
                
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onSelect(scenario.id)}
                    className={`px-4 py-2 rounded-md ${
                      selectedScenario === scenario.id
                        ? 'bg-foreground/20 text-foreground'
                        : 'bg-foreground text-background'
                    }`}
                  >
                    {selectedScenario === scenario.id ? 'Selected' : 'Select This Scenario'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}