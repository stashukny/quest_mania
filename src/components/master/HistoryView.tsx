import React from 'react';
import { Award, CheckCircle } from 'lucide-react';
import { Quest, QuestSeeker, PrizeRedemption } from '../../types';
import { DEFAULT_PRIZES } from '../../constants/prizes';

interface HistoryViewProps {
  quests: Quest[];
  seekers: QuestSeeker[];
  redemptions: PrizeRedemption[];
}

export default function HistoryView({ quests, seekers, redemptions }: HistoryViewProps) {
  const completedQuests = quests.filter(quest => quest.status === 'completed');

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold">Completed Quests</h2>
        </div>
        <div className="space-y-4">
          {completedQuests.map((quest) => {
            const seeker = seekers.find(s => s.id === quest.assigned_to);
            return (
              <div key={quest.id} className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold">{quest.title}</h3>
                <p className="text-gray-600">{quest.description}</p>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Completed by: {seeker?.name || 'Unknown'}</p>
                  <p>Completed on: {quest.completed_at ? new Date(quest.completed_at).toLocaleDateString() : 'Unknown'}</p>
                  <p>Stars awarded: {quest.reward}</p>
                </div>
              </div>
            );
          })}
          {completedQuests.length === 0 && (
            <p className="text-gray-500 text-center py-4">No completed quests yet</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold">Prize Redemptions</h2>
        </div>
        <div className="space-y-4">
          {redemptions.map((redemption) => {
            const seeker = seekers.find(s => s.id === redemption.seekerId);
            const prize = DEFAULT_PRIZES.find(p => p.id === redemption.prizeId);
            return (
              <div key={redemption.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{prize?.name}</h3>
                    <p className="text-gray-600">{prize?.description}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Redeemed by: {seeker?.name}</p>
                      <p>Redeemed on: {new Date(redemption.redeemedAt).toLocaleDateString()}</p>
                      <p>Stars spent: {redemption.starsCost}</p>
                      <p>Certificate ID: {redemption.certificateId}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {redemptions.length === 0 && (
            <p className="text-gray-500 text-center py-4">No prize redemptions yet</p>
          )}
        </div>
      </div>
    </div>
  );
}