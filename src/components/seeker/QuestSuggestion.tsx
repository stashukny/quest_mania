import React, { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import type { QuestSuggestion as QuestSuggestionType, QuestDuration } from '../../types/';

interface QuestSuggestionProps {
  seekerId: string;
}

export default function QuestSuggestionForm({ seekerId }: QuestSuggestionProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    desiredReward: 1,
    duration: 'none' as QuestDuration
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || isSubmitting) return;

    setIsSubmitting(true);
    
    const newSuggestion = {
        id: crypto.randomUUID(),
        title: formData.title,
        description: formData.description,
        suggested_by: seekerId,
        desired_reward: formData.desiredReward,
        duration: formData.duration,
        status: 'pending',
        created_at: new Date().toISOString()
    };

    try {
        const response = await fetch('/api/quest-suggestions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newSuggestion),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to submit quest suggestion');
        }

        setFormData({
            title: '',
            description: '',
            desiredReward: 1,
            duration: 'none'
        });
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
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <textarea
          placeholder="Quest Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              value={formData.desiredReward}
              onChange={(e) => setFormData({ ...formData, desiredReward: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quest Duration
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value as QuestDuration })}
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
          disabled={!formData.title || !formData.description || isSubmitting}
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          {isSubmitting ? 'Submitting...' : 'Submit Quest Suggestion'}
        </button>
      </div>
    </div>
  );
}