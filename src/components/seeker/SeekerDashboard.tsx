import React, { useEffect, useState } from 'react';
import { Trophy, Star, Gift, LogOut } from 'lucide-react';
import { QuestSeeker, Quest, PrizeRedemption } from '../../types';
import QuestList from './QuestList';
import QuestSuggestionForm from './QuestSuggestion';
import PrizeStore from './PrizeStore';

interface PrizeRedemptionWithDetails {
  id: string;
  prize_name: string;
  certificate_id: string;
  redeemed_at: string;
  stars_cost: number;
}

interface SeekerDashboardProps {
  seeker: QuestSeeker;
  quests: Quest[];
  onQuestComplete: (questId: string) => void;
  onRedeemPrize: (prizeId: string, starsCost: number) => void;
  onLogout: () => void;
}

export default function SeekerDashboard({ 
  seeker, 
  quests = [],
  onQuestComplete,
  onRedeemPrize,
  onLogout 
}: SeekerDashboardProps) {
  const [redemptions, setRedemptions] = useState<PrizeRedemptionWithDetails[]>([]);

  useEffect(() => {
    const fetchRedemptions = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/seekers/${seeker.id}/redemptions`);
        if (!response.ok) {
          throw new Error('Failed to fetch redemptions');
        }
        const data = await response.json();
        setRedemptions(data);
      } catch (err) {
        console.error('Error fetching redemptions:', err);
      }
    };

    fetchRedemptions();
  }, [seeker.id, seeker.stars]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Seeker Info and Logout */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {seeker.avatar_url && (
                <img
                  src={seeker.avatar_url}
                  alt={seeker.name}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h2 className="text-2xl font-semibold">{seeker.name}</h2>
                <div className="flex items-center gap-1 text-purple-600">
                  <Star className="w-5 h-5" />
                  <span>{seeker.stars} stars available</span>
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Active Quests */}
        <QuestList 
          quests={(quests || []).filter(q => q.assigned_to === seeker.id)} 
          onQuestComplete={onQuestComplete}
        />

        {/* Quest Suggestion Form */}
        <QuestSuggestionForm seekerId={seeker.id} />

        {/* Prize Store */}
        <PrizeStore seeker={seeker} onRedeemPrize={onRedeemPrize} />

        {/* Prize Redemption History */}
        {redemptions.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-600" />
              Prize Redemption History
            </h3>
            <div className="space-y-3">
              {redemptions.map((redemption) => (
                <div
                  key={redemption.id}
                  className="bg-purple-50 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-medium">{redemption.prize_name}</h4>
                    <p className="text-sm text-gray-600">
                      Certificate ID: {redemption.certificate_id}
                    </p>
                    <p className="text-sm text-gray-600">
                      Redeemed: {new Date(redemption.redeemed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4" />
                    <span>{redemption.stars_cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}