import { useEffect, useState } from 'react';
import QuestMasterDashboard from './components/master/QuestMasterDashboard';
import SeekerLogin from './components/seeker/SeekerLogin';
import SeekerDashboard from './components/seeker/SeekerDashboard';
import MasterLogin from './components/master/MasterLogin';
import { QuestSeeker, Quest, QuestSuggestion, PrizeRedemption } from './types';
import { generateCertificateId } from './utils/certificates';
import { DEFAULT_PRIZES } from './constants/prizes';
import { api } from './api';


export default function App() {
  const [seekers, setSeekers] = useState<QuestSeeker[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [suggestions, setSuggestions] = useState<QuestSuggestion[]>([]);
  const [redemptions, setRedemptions] = useState<PrizeRedemption[]>([]);
  const [prizes, setPrizes] = useState(DEFAULT_PRIZES);
  const [currentSeeker, setCurrentSeeker] = useState<QuestSeeker | null>(null);
  const [isMasterView, setIsMasterView] = useState(false);
  const [showMasterLogin, setShowMasterLogin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        const [seekersData, questsData, suggestionsData] = await Promise.all([
            api.getSeekers(),
            api.getQuests(),
            fetch('http://localhost:3001/api/quest-suggestions').then(res => res.json())
        ]);
        setSeekers(seekersData);
        setQuests(questsData);
        setSuggestions(suggestionsData);
    };
    fetchData();
}, []);

  const handleSeekerLogin = (seeker: QuestSeeker) => {
    setCurrentSeeker(seeker);
  };

  const handleQuestComplete = async (questId: string) => {
    const updated = await api.updateQuestStatus(questId, 'pending');
    setQuests(quests.map(quest => 
        quest.id === questId ? updated : quest
    ));
};

  const handleQuestStart = (questId: string) => {
    setQuests(quests.map(quest => 
      quest.id === questId ? { 
        ...quest, 
        status: 'in_progress',
        startedAt: new Date().toISOString()
      } : quest
    ));
  };

  const handleSuggestQuest = (suggestion: Omit<QuestSuggestion, 'id' | 'status'>) => {
    const newSuggestion: QuestSuggestion = {
      ...suggestion,
      id: crypto.randomUUID(),
      status: 'pending'
    };
    setSuggestions([...suggestions, newSuggestion]);
  };

  const handleApproveSuggestion = (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    const newQuest: Quest = {
      id: crypto.randomUUID(),
      title: suggestion.title,
      description: suggestion.description,
      reward: suggestion.desiredReward,
      assignedTo: [suggestion.suggestedBy],
      status: 'active',
      duration: suggestion.duration
    };

    setQuests([...quests, newQuest]);
    setSuggestions(suggestions.map(s => 
      s.id === suggestionId ? { ...s, status: 'approved' } : s
    ));
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    setSuggestions(suggestions.map(s => 
      s.id === suggestionId ? { ...s, status: 'rejected' } : s
    ));
  };

  const handleRedeemPrize = (prizeId: string, starsCost: number): string | null => {
    const certificateId = generateCertificateId();
    const redemption: PrizeRedemption = {
      id: crypto.randomUUID(),
      prizeId,
      seekerId: currentSeeker!.id,
      redeemedAt: new Date().toISOString(),
      certificateId,
      starsCost
    };

    setRedemptions([...redemptions, redemption]);
    return certificateId;
  };

  if (showMasterLogin) {
    return (
      <MasterLogin
        onLogin={() => {
          setIsMasterView(true);
          setShowMasterLogin(false);
        }}
        onBack={() => setShowMasterLogin(false)}
      />
    );
  }

  if (isMasterView) {
    return (
      <QuestMasterDashboard
        seekers={seekers}
        setSeekers={setSeekers}
        quests={quests}
        setQuests={setQuests}
        suggestions={suggestions}
        redemptions={redemptions}
        prizes={prizes}
        setPrizes={setPrizes}
        onApproveSuggestion={handleApproveSuggestion}
        onRejectSuggestion={handleRejectSuggestion}
        onSwitchView={() => setIsMasterView(false)}
      />
    );
  }

  if (!currentSeeker) {
    return (
      <SeekerLogin
        seekers={seekers}
        onLogin={handleSeekerLogin}
        onMasterLogin={() => setShowMasterLogin(true)}
      />
    );
  }

  return (
    <SeekerDashboard
      seeker={currentSeeker}
      onLogout={() => setCurrentSeeker(null)}
      onQuestComplete={handleQuestComplete}
      onQuestStart={handleQuestStart}
      onUpdateSeeker={(updatedSeeker) => {
        setSeekers(seekers.map(s => 
          s.id === updatedSeeker.id ? updatedSeeker : s
        ));
        setCurrentSeeker(updatedSeeker);
      }}
      onRedeemPrize={handleRedeemPrize}
    />
  );
}