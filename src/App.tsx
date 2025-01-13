import { useEffect, useState } from 'react';
import QuestMasterDashboard from './components/master/QuestMasterDashboard';
import SeekerLogin from './components/seeker/SeekerLogin';
import SeekerDashboard from './components/seeker/SeekerDashboard';
import MasterLogin from './components/master/MasterLogin';
import { QuestSeeker, Quest, QuestSuggestion, PrizeRedemption } from './types/';
import { generateCertificateId } from './utils/certificates';
import { DEFAULT_PRIZES } from './constants/prizes';
import { api } from './api';

const MASTER_PIN = '1234';

export default function App() {
  const [seekers, setSeekers] = useState<QuestSeeker[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [suggestions, setSuggestions] = useState<QuestSuggestion[]>([]);
  const [redemptions, setRedemptions] = useState<PrizeRedemption[]>([]);
  const [prizes, setPrizes] = useState(DEFAULT_PRIZES);
  const [currentSeeker, setCurrentSeeker] = useState<QuestSeeker | null>(null);
  const [isMasterView, setIsMasterView] = useState(false);
  const [showMasterLogin, setShowMasterLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shouldRefetchQuests, setShouldRefetchQuests] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch all data in parallel
        const [questsResponse, seekersResponse, suggestionsResponse, prizesResponse] = await Promise.all([
          fetch('http://localhost:3001/api/quests'),
          fetch('http://localhost:3001/api/seekers'),
          fetch('http://localhost:3001/api/quest-suggestions'),
          fetch('http://localhost:3001/api/prizes')
        ]);

        if (!questsResponse.ok) throw new Error('Failed to fetch quests');
        if (!seekersResponse.ok) throw new Error('Failed to fetch seekers');
        if (!suggestionsResponse.ok) throw new Error('Failed to fetch suggestions');
        if (!prizesResponse.ok) throw new Error('Failed to fetch prizes');

        const [questsData, seekersData, suggestionsData, prizesData] = await Promise.all([
          questsResponse.json(),
          seekersResponse.json(),
          suggestionsResponse.json(),
          prizesResponse.json()
        ]);

        console.log('Fetched quests:', questsData);  // Debug log
        setQuests(questsData);
        setSeekers(seekersData);
        setSuggestions(suggestionsData);
        setPrizes(prizesData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
        setShouldRefetchQuests(false);  // Reset the refetch trigger
      }
    };

    fetchInitialData();
  }, [shouldRefetchQuests]);  // Add shouldRefetchQuests as a dependency

  const handleSeekerLogin = (seeker: QuestSeeker) => {
    localStorage.setItem('currentSeekerId', seeker.id);
    setCurrentSeeker(seeker);
    setShouldRefetchQuests(true);  // Trigger a refetch when logging in
  };

  const handleLogout = () => {
    localStorage.removeItem('currentSeekerId');
    setCurrentSeeker(null);
  };

  const handleQuestComplete = async (questId: string) => {
    if (!currentSeeker) return;
    
    try {
      const updated = await api.updateQuestStatus(questId, 'pending');
      setQuests(quests.map(quest => 
        quest.id === questId ? { ...quest, status: 'pending' } : quest
      ));
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  const handleQuestStart = (questId: string) => {
    setQuests(quests.map(quest => 
      quest.id === questId ? { 
        ...quest, 
        status: 'in_progress',
        started_at: new Date().toISOString()
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
      reward: suggestion.desired_reward,
      assigned_to: suggestion.suggested_by,
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

  const handlePrizeRedeem = async (prizeId: string, starsCost: number) => {
    if (!currentSeeker) return;

    try {
      // Update seeker's stars immediately for better UX
      setCurrentSeeker(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          stars: prev.stars - starsCost
        };
      });

      // Fetch the updated seeker data to ensure consistency
      const response = await fetch(`http://localhost:3001/api/seekers/${currentSeeker.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch updated seeker data');
      }

      const updatedSeeker = await response.json();
      setCurrentSeeker(updatedSeeker);
    } catch (error) {
      console.error('Error updating seeker stars:', error);
      // Optionally, revert the optimistic update if the API call fails
      setCurrentSeeker(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          stars: prev.stars + starsCost
        };
      });
    }
  };

  // const handleMasterLogin = (pin: string) => {
  //   if (pin === MASTER_PIN) {
  //     fetchInitialData();  // Fetch all data when master logs in
  //     setView('master');
  //   } else {
  //     alert('Invalid PIN');
  //   }
  // };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
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
      quests={quests}
      onLogout={handleLogout}
      onQuestComplete={handleQuestComplete}
      onQuestStart={handleQuestStart}
      onRedeemPrize={handlePrizeRedeem}
    />
  );
}