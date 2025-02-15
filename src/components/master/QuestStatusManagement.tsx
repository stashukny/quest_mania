import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';
import { Quest, QuestSeeker } from '../../types/';

interface QuestStatusManagementProps {
  quests: Quest[];
  seekers: QuestSeeker[];
  onApproveQuest: (questId: string, seekerId: string) => void;
  onRejectQuest: (questId: string) => void;
}

export default function QuestStatusManagement({ 
  quests: questsProp,
  seekers,
  onApproveQuest,
  onRejectQuest 
}: QuestStatusManagementProps) {
  const [localQuests, setLocalQuests] = useState<Quest[]>([]);

  const currentSeekerId = seekers[0]?.id;

  useEffect(() => {
    fetch(`/api/quests`)
      .then(res => res.json())
      .then(data => {
        console.log('All quests:', data);
        setLocalQuests(data);
      })
      .catch(err => console.error('Error fetching quests:', err));
  }, []);

  const pendingQuests = localQuests.filter(quest => 
    quest.status === 'pending'
  );

  const handleApproveQuest = async (questId: string, seekerId: string) => {
    try {
      const response = await fetch(`/api/quests/${questId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seekerId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to approve quest');
      }

      const data = await response.json();
      setLocalQuests(localQuests.filter(quest => quest.id !== questId));
      onApproveQuest(questId, seekerId);
    } catch (error) {
      console.error('Error approving quest:', error);
    }
  };

  const handleRejectQuest = async (questId: string) => {
    try {
      const response = await fetch(`/api/quests/${questId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reject quest');
      }

      setLocalQuests(localQuests.filter(quest => quest.id !== questId));
      onRejectQuest(questId);
    } catch (error) {
      console.error('Error rejecting quest:', error);
    }
  };

  if (pendingQuests.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold">Pending Approvals</h2>
        </div>
        <p className="text-gray-500 text-center py-8">No quests pending</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold">Pending Approvals</h2>
      </div>
      <div className="space-y-4">
        {pendingQuests.map((quest) => {
          const seeker = seekers.find(s => s.id === quest.assigned_to);
          
          return (
            <div key={quest.id} className="border rounded-lg p-4 bg-yellow-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{quest.title}</h3>
                  <p className="text-gray-600">{quest.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Completed by: {seeker?.name || 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
                  <Sparkles className="w-4 h-4" />
                  {quest.reward} stars
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproveQuest(quest.id, quest.assigned_to)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleRejectQuest(quest.id)}
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