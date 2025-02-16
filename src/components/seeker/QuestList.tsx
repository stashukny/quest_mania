import { Sparkles, CheckCircle, PlayCircle, Clock, Trophy } from 'lucide-react';
import { Quest } from '../../types/';
import { API_URL } from '../../config';

interface QuestListProps {
  quests: Quest[];
  onQuestComplete: (questId: string) => void;
  onQuestStart: (questId: string) => void;
}

function getQuestEndDate(startDate: string | undefined, duration: string): Date | null {
  console.log('getQuestEndDate called with:', { startDate, duration });
  if (!startDate) {
    console.log('No startDate provided');
    return null;
  }
  
  const start = new Date(startDate);
  console.log('Parsed start date:', start);
  
  if (duration === 'daily') {
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    end.setHours(0, 0, 0, 0);
    console.log('Daily quest end date:', end);
    return end;
  } else if (duration === 'weekly') {
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    end.setHours(0, 0, 0, 0);
    return end;
  } else if (duration === 'none') {
    return start;
  }
  return null;
}

function canCompleteQuest(quest: Quest): boolean {
  if (quest.duration === 'none') return true;
  if (!quest.started_at) return false;

  const now = new Date();
  const endDate = getQuestEndDate(quest.started_at, quest.duration);
  return endDate ? now >= endDate : false;
}

export default function QuestList({ quests, onQuestComplete, onQuestStart }: QuestListProps) {
  console.log('QuestList received quests:', quests);
  
  const handleQuestStart = async (questId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/quests/${questId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error('Failed to start quest');
      onQuestStart(questId);
    } catch (error) {
      console.error('Error starting quest:', error);
    }
  };

  const handleQuestComplete = async (questId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/quests/${questId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) throw new Error('Failed to complete quest');
      onQuestComplete(questId);
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold">Active Quests</h2>
      </div>

      {quests.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No active quests available</p>
      ) : (
        <div className="space-y-4">
          {quests.map((quest) => {
            console.log('Quest data:', {
              id: quest.id,
              status: quest.status,
              started_at: quest.started_at,
              duration: quest.duration
            });
            
            const isCompletable = canCompleteQuest(quest);
            const endDate = quest.started_at ? getQuestEndDate(quest.started_at, quest.duration) : null;
            console.log('Quest end date:', endDate);  // Debug log

            return (
              <div 
                key={quest.id} 
                className={`p-4 border rounded-lg ${
                  quest.status === 'pending' ? 'bg-yellow-50' : 
                  quest.status === 'in_progress' ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{quest.title}</h3>
                    <p className="text-gray-600">{quest.description}</p>
                    {quest.duration !== 'none' && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-500">
                          {quest.duration === 'daily' ? 'Daily Quest' : 'Weekly Quest'}
                        </span>
                        {quest.started_at && (
                          <span className="text-gray-500">
                            • Ends: {endDate?.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
                    <Sparkles className="w-4 h-4" />
                    {quest.reward} stars
                  </div>
                </div>
                
                {quest.status === 'active' && (
                  <button
                    onClick={() => onQuestStart(quest.id)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Start Quest
                  </button>
                )}

                {quest.status === 'in_progress' && (
                  <button
                    onClick={() => onQuestComplete(quest.id)}
                    disabled={!isCompletable}
                    className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isCompletable
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    {isCompletable ? 'Mark as Complete' : 
                      endDate ? `Complete After ${endDate.toLocaleString()}` : 'Start Quest First'}
                  </button>
                )}
                
                {quest.status === 'pending' && (
                  <div className="mt-4 text-yellow-600 text-sm">
                    Waiting for Quest Master's approval...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}