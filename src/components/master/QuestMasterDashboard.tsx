import React, { useState, useEffect } from 'react';
import { Wand2, Users, ScrollText, Clock, Lightbulb, History, Gift } from 'lucide-react';
import { Quest, QuestSeeker, QuestSuggestion, PrizeRedemption, Prize } from '../../types/';
import SeekerManagement from './SeekerManagement';
import QuestManagement from './QuestManagement';
import QuestStatusManagement from './QuestStatusManagement';
import QuestSuggestionManagement from './QuestSuggestionManagement';
import HistoryView from './HistoryView';
import PrizeManagement from './PrizeManagement';

interface QuestMasterDashboardProps {
  seekers: QuestSeeker[];
  setSeekers: React.Dispatch<React.SetStateAction<QuestSeeker[]>>;
  quests: Quest[];
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>;
  suggestions: QuestSuggestion[];
  redemptions: PrizeRedemption[];
  prizes: Prize[];
  setPrizes: React.Dispatch<React.SetStateAction<Prize[]>>;
  onApproveSuggestion: (suggestionId: string) => void;
  onRejectSuggestion: (suggestionId: string) => void;
  onSwitchView: () => void;
}

type TabType = 'seekers' | 'quests' | 'approvals' | 'suggestions' | 'history' | 'prizes';

function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
      {count}
    </span>
  );
}

export default function QuestMasterDashboard({
  seekers,
  setSeekers,
  quests,
  setQuests,
  suggestions,
  redemptions,
  prizes,
  setPrizes,
  onApproveSuggestion,
  onRejectSuggestion,
  onSwitchView
}: QuestMasterDashboardProps) {
  const pendingApprovalsCount = quests.filter(q => q.status === 'pending').length;
  const pendingSuggestionsCount = suggestions.filter(s => s.status === 'pending').length;

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (pendingApprovalsCount > 0) return 'approvals';
    if (pendingSuggestionsCount > 0) return 'suggestions';
    return 'seekers';
  });

  useEffect(() => {
    if (pendingApprovalsCount > 0 && activeTab === 'seekers') {
      setActiveTab('approvals');
    }
  }, [pendingApprovalsCount, activeTab]);

  const handleApproveQuest = (questId: string, seekerId: string) => {
    const quest = quests.find(q => q.id === questId);
    const seeker = seekers.find(s => s.id === seekerId);
    
    if (!quest || !seeker) return;

    setQuests(quests.map(q => 
      q.id === questId ? { 
        ...q, 
        status: 'completed',
        completed_at: new Date().toISOString(),
        completedBy: seekerId
      } : q
    ));

    setSeekers(seekers.map(s => 
      s.id === seekerId ? { ...s, stars: s.stars + quest.reward } : s
    ));
  };

  const handleRejectQuest = (questId: string) => {
    setQuests(quests.map(q => 
      q.id === questId ? { ...q, status: 'active' } : q
    ));
  };

  const handleApproveSuggestion = async (suggestionId: string) => {
    try {
      const response = await fetch(`/api/quest-suggestions/${suggestionId}/approve`, {
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
      const response = await fetch(`/api/quest-suggestions/${suggestionId}/reject`, {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Quest Master Dashboard</h1>
          <button
            onClick={onSwitchView}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
          >
            Switch to Seeker View
          </button>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('seekers')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'seekers'
                ? 'bg-white text-purple-600'
                : 'bg-purple-700 text-white hover:bg-purple-800'
            }`}
          >
            <Users className="w-5 h-5" />
            Manage Seekers
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'quests'
                ? 'bg-white text-purple-600'
                : 'bg-purple-700 text-white hover:bg-purple-800'
            }`}
          >
            <ScrollText className="w-5 h-5" />
            Manage Quests
          </button>
          <div className="relative">
            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                activeTab === 'approvals'
                  ? 'bg-white text-purple-600'
                  : 'bg-purple-700 text-white hover:bg-purple-800'
              }`}
            >
              <Clock className="w-5 h-5" />
              Quest Approvals
            </button>
            <NotificationBadge count={pendingApprovalsCount} />
          </div>
          <div className="relative">
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`relative flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                activeTab === 'suggestions'
                  ? 'bg-white text-purple-600'
                  : 'bg-purple-700 text-white hover:bg-purple-800'
              }`}
            >
              <Lightbulb className="w-5 h-5" />
              Quest Suggestions
              <NotificationBadge count={pendingSuggestionsCount} />
            </button>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-purple-600'
                : 'bg-purple-700 text-white hover:bg-purple-800'
            }`}
          >
            <History className="w-5 h-5" />
            History
          </button>
          <button
            onClick={() => setActiveTab('prizes')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              activeTab === 'prizes'
                ? 'bg-white text-purple-600'
                : 'bg-purple-700 text-white hover:bg-purple-800'
            }`}
          >
            <Gift className="w-5 h-5" />
            Manage Prizes
          </button>
        </div>

        {activeTab === 'seekers' && (
          <SeekerManagement seekers={seekers} setSeekers={setSeekers} />
        )}
        {activeTab === 'quests' && (
          <QuestManagement seekers={seekers} quests={quests} setQuests={setQuests} />
        )}
        {activeTab === 'approvals' && (
          <QuestStatusManagement
            quests={quests}
            seekers={seekers}
            onApproveQuest={handleApproveQuest}
            onRejectQuest={handleRejectQuest}
          />
        )}
        {activeTab === 'suggestions' && (
          <QuestSuggestionManagement
            suggestions={suggestions}
            onApproveSuggestion={handleApproveSuggestion}
            onRejectSuggestion={handleRejectSuggestion}
          />
        )}
        {activeTab === 'history' && (
          <HistoryView
            quests={quests}
            seekers={seekers}
            redemptions={redemptions}
          />
        )}
        {activeTab === 'prizes' && (
          <PrizeManagement
            prizes={prizes}
            setPrizes={setPrizes}
            redemptions={redemptions}
          />
        )}
      </div>
    </div>
  );
}