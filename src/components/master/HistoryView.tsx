import React, { useState, useEffect } from 'react';
import { History, Star, Gift } from 'lucide-react';
import { Quest, QuestSeeker, PrizeRedemption } from '../../types/';
import { API_URL } from '../../config';

interface HistoryViewProps {
  quests: Quest[];
  seekers: QuestSeeker[];
  redemptions: PrizeRedemption[];
}

interface CompletedQuest extends Quest {
  seeker_name: string;
}

interface RedemptionWithDetails {
  id: string;
  certificate_id: string;
  redeemed_at: string;
  stars_cost: number;
  prize_name: string;
  seeker_name: string;
}

export default function HistoryView({ quests, seekers }: HistoryViewProps) {
  const [completedQuests, setCompletedQuests] = useState<CompletedQuest[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionWithDetails[]>([]);

  useEffect(() => {
    // Fetch redemptions
    fetch(`${API_URL}/api/prize-redemptions`)
      .then(res => res.json())
      .then(data => setRedemptions(data))
      .catch(err => console.error('Error fetching redemptions:', err));

    // Get completed quests with seeker names
    const completed = quests
      .filter(q => q.status === 'completed')
      .map(quest => ({
        ...quest,
        seeker_name: seekers.find(s => s.id === quest.assigned_to)?.name || 'Unknown Seeker'
      }));
    setCompletedQuests(completed);
  }, [quests, seekers]);

  return (
    <div className="space-y-6">
      {/* Completed Quests Section */}
      <div className="bg-white rounded-lg shadow-xl p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <History className="w-6 h-6 text-purple-600" />
          Completed Quests
        </h2>
        <div className="space-y-4">
          {completedQuests.map((quest) => (
            <div key={quest.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{quest.title}</h3>
                  <p className="text-gray-600">{quest.description}</p>
                  <p className="text-sm text-gray-500">
                    Completed by: {quest.seeker_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Completed on: {new Date(quest.completed_at!).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
                  <Star className="w-4 h-4" />
                  <span>{quest.reward}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prize Redemptions Section */}
      <div className="bg-white rounded-lg shadow-xl p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Gift className="w-6 h-6 text-purple-600" />
          Prize Redemptions
        </h2>
        <div className="space-y-4">
          {redemptions.map((redemption) => (
            <div key={redemption.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{redemption.prize_name}</h3>
                  <p className="text-sm text-gray-500">
                    Redeemed by: {redemption.seeker_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Certificate ID: {redemption.certificate_id}
                  </p>
                  <p className="text-sm text-gray-500">
                    Redeemed on: {new Date(redemption.redeemed_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
                  <Star className="w-4 h-4" />
                  <span>{redemption.stars_cost}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}