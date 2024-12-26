import React from 'react';
import { Sparkles, CheckCircle, PlayCircle, Clock } from 'lucide-react';
import { Quest } from '../../types';

interface QuestListProps {
  quests: Quest[];
  onQuestComplete: (questId: string) => void;
  onQuestStart: (questId: string) => void;
}

function getQuestEndDate(startDate: string, duration: string): Date {
  const start = new Date(startDate);
  if (duration === 'daily') {
    return new Date(start.setDate(start.getDate() + 1));
  } else if (duration === 'weekly') {
    return new Date(start.setDate(start.getDate() + 7));
  }
  return start;
}

function canCompleteQuest(quest: Quest): boolean {
  if (quest.duration === 'none') return true;
  if (!quest.startedAt) return false;

  const now = new Date();
  const endDate = getQuestEndDate(quest.startedAt, quest.duration);
  return now >= endDate;
}

export default function QuestList({ quests, onQuestComplete, onQuestStart }: QuestListProps) {
  if (quests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No quests available right now. Check back soon!
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {quests.map((quest) => {
        const isCompletable = canCompleteQuest(quest);
        const endDate = quest.startedAt ? getQuestEndDate(quest.startedAt, quest.duration) : null;

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
                    {quest.startedAt && (
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
                {isCompletable ? 'Mark as Complete' : 'Complete After ' + endDate?.toLocaleDateString()}
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
  );
}