'use client';

import { useState } from 'react';
import { Recommendation } from '@/lib/ai-service';

type RecommendationCardProps = {
  recommendation: Recommendation;
  onFeedback?: (recommendationId: string, feedback: {
    rating: number;
    comment: string;
    completed: boolean;
  }) => void;
};

export default function RecommendationCard({ recommendation, onFeedback }: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const handleSubmitFeedback = () => {
    if (rating !== null && onFeedback) {
      onFeedback(recommendation.id, {
        rating,
        comment,
        completed: isCompleted
      });
      setShowFeedback(false);
    }
  };
  
  // Helper function to get color based on intimacy level
  const getIntimacyLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-green-100 text-green-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="border border-foreground/10 rounded-lg overflow-hidden mb-4">
      <div 
        className="p-4 cursor-pointer flex justify-between items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="font-medium text-lg">{recommendation.title}</h3>
          <div className="flex gap-2 mt-2 items-center text-sm">
            <span className={`px-2 py-1 rounded-full text-xs ${getIntimacyLevelColor(recommendation.intimacyLevel)}`}>
              Level {recommendation.intimacyLevel}
            </span>
            <span className="text-foreground/60">
              {recommendation.durationMinutes} min
            </span>
            <span className="text-foreground/60 capitalize">
              {recommendation.type}
            </span>
          </div>
        </div>
        <div className="text-foreground/60">
          {isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-foreground/10">
          <p className="mb-4 text-foreground/80">{recommendation.description}</p>
          
          {recommendation.preparationNeeded.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Preparation Needed:</h4>
              <ul className="list-disc pl-5 text-foreground/80">
                {recommendation.preparationNeeded.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {recommendation.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {recommendation.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-foreground/5 rounded-full text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {onFeedback && (
            <div className="mt-4 flex justify-end">
              {showFeedback ? (
                <div className="w-full space-y-4 border-t border-foreground/10 pt-4">
                  <div>
                    <p className="font-medium mb-2">Rate this recommendation:</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className={`w-10 h-10 flex items-center justify-center rounded-full border ${
                            rating === value 
                              ? 'bg-foreground text-background border-foreground' 
                              : 'border-foreground/20 hover:border-foreground/60'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor={`comment-${recommendation.id}`} className="block font-medium mb-2">
                      Comment (optional):
                    </label>
                    <textarea
                      id={`comment-${recommendation.id}`}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full p-2 border border-foreground/20 rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-foreground/30"
                      rows={2}
                    ></textarea>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`completed-${recommendation.id}`}
                      checked={isCompleted}
                      onChange={() => setIsCompleted(!isCompleted)}
                      className="mr-2 h-4 w-4"
                    />
                    <label htmlFor={`completed-${recommendation.id}`}>
                      We've completed this activity
                    </label>
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowFeedback(false)}
                      className="px-3 py-1 border border-foreground/20 rounded-md hover:bg-foreground/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitFeedback}
                      disabled={rating === null}
                      className="px-3 py-1 bg-foreground text-background rounded-md disabled:opacity-50"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowFeedback(true)}
                  className="px-3 py-1 border border-foreground/20 rounded-md hover:bg-foreground/5"
                >
                  Give Feedback
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}