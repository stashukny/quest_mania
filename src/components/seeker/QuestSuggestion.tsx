import React, { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import type { QuestSuggestion as QuestSuggestionType, QuestDuration } from '../../types';

interface QuestSuggestionProps {
  seekerId: string;
}

export default function QuestSuggestionForm({ seekerId }: QuestSuggestionProps) {
  const [suggestion, setSuggestion] = useState({
    title: '',
    description: '',
    desiredReward: 1,
    duration: 'none' as QuestDuration
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!suggestion.title || !suggestion.description || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/quest-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: suggestion.title,
          description: suggestion.description,
          suggestedBy: seekerId,
          createdAt: new Date().toISOString(),
          desiredReward: suggestion.desiredReward,
          duration: suggestion.duration
        }),
      });

      if (!response.ok) throw new Error('Failed to submit quest suggestion');

      // Reset form on success
      setSuggestion({ title: '', description: '', desiredReward: 1, duration: 'none' });
    } catch (error) {
      console.error('Error submitting quest suggestion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" />
        Suggest a New Quest
      </h2>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Quest Title"
          value={suggestion.title}
          onChange={(e) => setSuggestion({ ...suggestion, title: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <textarea
          placeholder="Quest Description"
          value={suggestion.description}
          onChange={(e) => setSuggestion({ ...suggestion, description: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desired Star Reward
            </label>
            <input
              type="number"
              min="1"
              value={suggestion.desiredReward}
              onChange={(e) => setSuggestion({ ...suggestion, desiredReward: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quest Duration
            </label>
            <select
              value={suggestion.duration}
              onChange={(e) => setSuggestion({ ...suggestion, duration: e.target.value as QuestDuration })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="none">No Time Limit</option>
              <option value="daily">Daily Quest</option>
              <option value="weekly">Weekly Quest</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!suggestion.title || !suggestion.description || isSubmitting}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          {isSubmitting ? 'Submitting...' : 'Submit Quest Suggestion'}
        </button>
      </div>
    </div>
  );
}