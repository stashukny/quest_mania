import React from 'react';
import { CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';
import { Quest, QuestSeeker } from '../../types';

interface QuestStatusManagementProps {
  quests: Quest[];
  seekers: QuestSeeker[];
  onApproveQuest: (questId: string, seekerId: string) => void;
  onRejectQuest: (questId: string) => void;
}

export default function QuestStatusManagement({ 
  quests, 
  seekers,
  onApproveQuest,
  onRejectQuest 
}: QuestStatusManagementProps) {
  const pendingQuests = quests.filter(quest => quest.status === 'pending');

  const handleApproveQuest = async (questId: string, seekerId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/quests/${questId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seekerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve quest');
      }

      const data = await response.json();
      
      // Update the seeker's stars in the parent component
      const seeker = seekers.find(s => s.id === seekerId);
      if (seeker) {
        const updatedSeeker = {
          ...seeker,
          stars: seeker.stars + data.reward
        };
        // Call the parent component's handler
        onApproveQuest(questId, seekerId);
      }
    } catch (error) {
      console.error('Error approving quest:', error);
    }
  };

  const handleRejectQuest = async (questId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/quests/${questId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reject quest');
      }

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
        <p className="text-gray-500 text-center py-8">No quests pending approval</p>
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
          const seeker = seekers.find(s => quest.assignedTo.includes(s.id));
          
          return (
            <div key={quest.id} className="border rounded-lg p-4 bg-yellow-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{quest.title}</h3>
                  <p className="text-gray-600">{quest.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Completed by: {seeker?.name || 'Team Quest'}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
                  <Sparkles className="w-4 h-4" />
                  {quest.reward} stars
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproveQuest(quest.id, seeker?.id || '')}
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