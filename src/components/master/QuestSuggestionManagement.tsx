import React, { useEffect, useState } from 'react';
import { Lightbulb, Check, X } from 'lucide-react';
import { QuestSuggestion } from '../../types/';

interface QuestSuggestionManagementProps {
  suggestions: QuestSuggestion[];
  onApproveSuggestion: (suggestionId: string) => void;
  onRejectSuggestion: (suggestionId: string) => void;
}

export default function QuestSuggestionManagement({ 
  suggestions, 
  onApproveSuggestion, 
  onRejectSuggestion 
}: QuestSuggestionManagementProps) {
  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  const handleApprove = async (suggestionId: string) => {
    await onApproveSuggestion(suggestionId);
  };

  const handleReject = async (suggestionId: string) => {
    await onRejectSuggestion(suggestionId);
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
        {pendingSuggestions.map((suggestion) => (
          <div key={suggestion.id} className="border rounded-lg p-4 bg-purple-50">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold">{suggestion.title}</h3>
                <p className="text-gray-600">{suggestion.description}</p>
                <div className="mt-2 space-y-1 text-sm text-gray-500">
                  <p>Desired Reward: {suggestion.desired_reward} stars</p>
                  <p>Duration: {suggestion.duration}</p>
                  <p>Suggested on: {new Date(suggestion.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(suggestion.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => handleReject(suggestion.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}