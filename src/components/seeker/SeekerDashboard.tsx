import React, { useState, useEffect } from 'react';
import { Sparkles, Award, LogOut } from 'lucide-react';
import { Quest, QuestSeeker, Prize, QuestSuggestion } from '../../types';
import QuestList from './QuestList';
import PrizeStore from './PrizeStore';
import RedemptionCertificate from './RedemptionCertificate';
import QuestSuggestionForm from './QuestSuggestion';

interface SeekerDashboardProps {
  seeker: QuestSeeker;
  onLogout: () => void;
  onQuestComplete: (questId: string) => void;
  onQuestStart: (questId: string) => void;
  onUpdateSeeker: (updatedSeeker: QuestSeeker) => void;
  onRedeemPrize: (prizeId: string, starsCost: number) => string | null;
}

export default function SeekerDashboard({ 
  seeker, 
  onLogout,
  onQuestComplete,
  onQuestStart,
  onUpdateSeeker,
  onRedeemPrize
}: SeekerDashboardProps) {
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/prizes')
        .then(res => res.json())
        .then(data => setPrizes(data))
        .catch(err => console.error('Error fetching prizes:', err));
  }, []);

  useEffect(() => {
    const fetchQuests = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/seekers/${seeker.id}/quests`);
            if (!response.ok) throw new Error('Failed to fetch quests');
            const data = await response.json();
            setQuests(data);
        } catch (error) {
            console.error('Error fetching quests:', error);
        } finally {
            setLoading(false);
        }
    };
    fetchQuests();
  }, [seeker.id]);

  const assignedQuests = loading ? [] : quests.filter(quest => 
    quest.assignedTo?.includes(seeker.id)
  );

  const handleRedeemPrize = (prizeId: string, starsCost: number) => {
    if (seeker.stars < starsCost) return;

    const newCertificateId = onRedeemPrize(prizeId, starsCost);
    if (!newCertificateId) return;

    const updatedSeeker = {
      ...seeker,
      stars: seeker.stars - starsCost
    };
    
    onUpdateSeeker(updatedSeeker);
    setSelectedPrize(prizes.find(p => p.id === prizeId) || null);
    setCertificateId(newCertificateId);
  };

  const handleQuestStart = async (questId: string) => {
    try {
        const response = await fetch(`http://localhost:3001/api/quests/${questId}/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ seekerId: seeker.id }),
        });

        if (!response.ok) throw new Error('Failed to start quest');
        
        const data = await response.json();
        await fetchQuestDetails(questId);
        
        setQuests(quests.map(quest => 
            quest.id === questId 
                ? { ...quest, status: data.status, startedAt: data.startedAt }
                : quest
        ));
    } catch (error) {
        console.error('Error starting quest:', error);
    }
  };

  const handleQuestComplete = async (questId: string) => {
    try {
        const response = await fetch(`http://localhost:3001/api/quests/${questId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ seekerId: seeker.id }),
        });

        if (!response.ok) throw new Error('Failed to complete quest');
        
        const data = await response.json();
        setQuests(quests.map(quest => 
            quest.id === questId 
                ? { ...quest, status: 'pending' }
                : quest
        ));
    } catch (error) {
        console.error('Error completing quest:', error);
    }
  };

  const fetchQuestDetails = async (questId: string) => {
    try {
        const response = await fetch(`http://localhost:3001/api/quests/${questId}`);
        if (!response.ok) throw new Error('Failed to fetch quest details');
        
        const questDetails = await response.json();
        setQuests(quests.map(quest => 
            quest.id === questId 
                ? { ...quest, ...questDetails }
                : quest
        ));
    } catch (error) {
        console.error('Error fetching quest details:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <img
              src={seeker.avatarUrl}
              alt={seeker.name}
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome, {seeker.name}!</h1>
              <div className="flex items-center gap-1 bg-white/20 text-white px-3 py-1 rounded-full">
                <Sparkles className="w-4 h-4" />
                <span>{seeker.stars} stars collected</span>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <div className="grid gap-6">
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold">Your Active Quests</h2>
            </div>
            <QuestList 
              quests={assignedQuests} 
              onQuestComplete={handleQuestComplete}
              onQuestStart={handleQuestStart}
            />
          </div>

          <QuestSuggestionForm
            seekerId={seeker.id}
          />

          <PrizeStore 
            seeker={seeker}
            onRedeemPrize={handleRedeemPrize}
          />
        </div>
      </div>

      {selectedPrize && certificateId && (
        <RedemptionCertificate
          prize={selectedPrize}
          seeker={seeker}
          certificateId={certificateId}
          onClose={() => {
            setSelectedPrize(null);
            setCertificateId(null);
          }}
        />
      )}
    </div>
  );
}