import React, { useEffect, useState } from 'react';
import { Sparkles, Pencil, Trash2, X, Check } from 'lucide-react';
import { Quest, QuestSeeker, QuestDuration } from '../../types';

interface QuestManagementProps {
  seekers: QuestSeeker[];
  quests: Quest[];
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>;
}

interface EditableQuestProps {
  quest: Quest;
  seekers: QuestSeeker[];
  onSave: (updatedQuest: Quest) => void;
  onCancel: () => void;
}

function EditableQuest({ quest, seekers, onSave, onCancel }: EditableQuestProps) {
  const [editedQuest, setEditedQuest] = useState({
    title: quest.title,
    description: quest.description,
    reward: quest.reward,
    assignedTo: quest.assignedTo,
    duration: quest.duration,
  });

  return (
    <div className="p-4 border rounded-lg bg-purple-50">
      <div className="space-y-4">
        <input
          type="text"
          value={editedQuest.title}
          onChange={(e) => setEditedQuest({ ...editedQuest, title: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Quest Title"
        />
        <textarea
          value={editedQuest.description}
          onChange={(e) => setEditedQuest({ ...editedQuest, description: e.target.value })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
          placeholder="Quest Description"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Star Reward
            </label>
            <input
              type="number"
              min="1"
              value={editedQuest.reward}
              onChange={(e) => setEditedQuest({ ...editedQuest, reward: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <select
              value={editedQuest.duration}
              onChange={(e) => setEditedQuest({ ...editedQuest, duration: e.target.value as QuestDuration })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="none">No Time Limit</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              multiple
              value={editedQuest.assignedTo}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setEditedQuest({ ...editedQuest, assignedTo: selected });
              }}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {seekers.map((seeker) => (
                <option key={seeker.id} value={seeker.id}>
                  {seeker.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => onSave({ ...quest, ...editedQuest })}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          disabled={!editedQuest.title || !editedQuest.description}
        >
          <Check className="w-4 h-4" />
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function QuestManagement({ seekers, quests, setQuests }: QuestManagementProps) {
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    reward: 1,
    assignedTo: [] as string[],
    duration: 'none' as QuestDuration,
  });
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);

  // Fetch quests on component mount
  useEffect(() => {
    fetch('http://localhost:3001/api/quests')
      .then(res => res.json())
      .then(data => setQuests(data))
      .catch(err => console.error('Error fetching quests:', err));
  }, [setQuests]);

  const handleCreateQuest = async () => {
    if (!newQuest.title || !newQuest.description) return;

    const assignedTo = newQuest.assignedTo.length === 0 
      ? seekers.map(seeker => seeker.id)
      : newQuest.assignedTo;

    const quest: Quest = {
      id: crypto.randomUUID(),
      title: newQuest.title,
      description: newQuest.description,
      reward: newQuest.reward,
      assignedTo,
      status: 'active',
      isTeamQuest: newQuest.assignedTo.length === 0,
      duration: newQuest.duration,
    };

    try {
      const response = await fetch('http://localhost:3001/api/quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quest),
      });

      if (!response.ok) {
        throw new Error('Failed to create quest');
      }

      const savedQuest = await response.json();
      setQuests([...quests, savedQuest]);
      setNewQuest({
        title: '',
        description: '',
        reward: 1,
        assignedTo: [],
        duration: 'none',
      });
    } catch (error) {
      console.error('Error creating quest:', error);
    }
  };

  const handleEditQuest = async (updatedQuest: Quest) => {
    try {
      const response = await fetch(`http://localhost:3001/api/quests/${updatedQuest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedQuest),
      });

      if (!response.ok) {
        throw new Error('Failed to update quest');
      }

      setQuests(quests.map(q => q.id === updatedQuest.id ? updatedQuest : q));
      setEditingQuestId(null);
    } catch (error) {
      console.error('Error updating quest:', error);
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    if (quest.status === 'completed') {
      alert('Cannot delete a completed quest as it is part of history.');
      return;
    }

    if (confirm('Are you sure you want to delete this quest?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/quests/${questId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete quest');
        }

        setQuests(quests.filter(q => q.id !== questId));
      } catch (error) {
        console.error('Error deleting quest:', error);
      }
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Create New Quest</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Quest Title"
            value={newQuest.title}
            onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <textarea
            placeholder="Quest Description"
            value={newQuest.description}
            onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Star Reward
              </label>
              <input
                type="number"
                min="1"
                value={newQuest.reward}
                onChange={(e) => setNewQuest({ ...newQuest, reward: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <select
                value={newQuest.duration}
                onChange={(e) => setNewQuest({ ...newQuest, duration: e.target.value as QuestDuration })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="none">No Time Limit</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To
              </label>
              <select
                multiple
                value={newQuest.assignedTo}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setNewQuest({ ...newQuest, assignedTo: selected });
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {seekers.map((seeker) => (
                  <option key={seeker.id} value={seeker.id}>
                    {seeker.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Leave empty to assign to all team members
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateQuest}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Create Quest
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-xl p-6">
        <h2 className="text-2xl font-semibold mb-4">Active Quests</h2>
        <div className="grid grid-cols-1 gap-4">
          {quests.map((quest) => (
            editingQuestId === quest.id ? (
              <EditableQuest
                key={quest.id}
                quest={quest}
                seekers={seekers}
                onSave={handleEditQuest}
                onCancel={() => setEditingQuestId(null)}
              />
            ) : (
              <div key={quest.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{quest.title}</h3>
                    <p className="text-gray-600">{quest.description}</p>
                    <div className="mt-2 space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {quest.duration === 'none' ? 'No Time Limit' : 
                         quest.duration === 'daily' ? 'Daily Quest' : 'Weekly Quest'}
                      </span>
                      {quest.startedAt && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Started: {new Date(quest.startedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
                      <Sparkles className="w-4 h-4" />
                      {quest.reward} stars
                    </div>
                    <button
                      onClick={() => setEditingQuestId(quest.id)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuest(quest.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {quest.isTeamQuest ? (
                    <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                      Team Quest
                    </span>
                  ) : (
                    <span>
                      Assigned to:{' '}
                      {seekers
                        .filter((s) => quest.assignedTo.includes(s.id))
                        .map((s) => s.name)
                        .join(', ')}
                    </span>
                  )}
                </div>
              </div>
            )
          ))}
          {quests.length === 0 && (
            <p className="text-gray-500 text-center py-8">No quests created yet</p>
          )}
        </div>
      </div>
    </>
  );
}