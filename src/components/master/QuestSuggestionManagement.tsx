import React from 'react';
import { CheckCircle, XCircle, Lightbulb, Clock } from 'lucide-react';
import { QuestSuggestion, QuestSeeker } from '../../types';

interface QuestSuggestionManagementProps {
  suggestions: QuestSuggestion[];
  seekers: QuestSeeker[];
  onApproveSuggestion: (suggestionId: string) => void;
  onRejectSuggestion: (suggestionId: string) => void;
}

export default function QuestSuggestionManagement({
  suggestions,
  seekers,
  onApproveSuggestion,
  onRejectSuggestion,
}: QuestSuggestionManagementProps) {
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  console.log('All suggestions:', suggestions);
  console.log('Pending suggestions:', pendingSuggestions);

  const handleApproveSuggestion = async (suggestionId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/quest-suggestions/${suggestionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) throw new Error('Failed to approve suggestion');
      onApproveSuggestion(suggestionId);
    } catch (error) {
      console.error('Error approving suggestion:', error);
    }
  };

  const handleRejectSuggestion = async (suggestionId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/quest-suggestions/${suggestionId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) throw new Error('Failed to reject suggestion');

      onRejectSuggestion(suggestionId);
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
    }
  };

  if (pendingSuggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold">Quest Suggestions</h2>
        </div>
        <p className="text-gray-500 text-center py-8">No pending suggestions</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold">Quest Suggestions</h2>
      </div>
      <div className="space-y-4">
        {pendingSuggestions.map((suggestion) => {
          const seeker = seekers.find(s => s.id === suggestion.suggestedBy);
          
          return (
            <div key={suggestion.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{suggestion.title}</h3>
                  <p className="text-gray-600">{suggestion.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <p>Suggested by: {seeker?.name}</p>
                    <p>Desired Reward: {suggestion.desiredReward} stars</p>
                    <p>Duration: {suggestion.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4" />
                  Pending
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproveSuggestion(suggestion.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleRejectSuggestion(suggestion.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}