import React from 'react';
import { Sparkles } from 'lucide-react';
import { Prize } from '../../types/';

interface PrizeCardProps {
  prize: {
    id: string;
    name: string;
    description: string;
    starsCost: number;
    imageUrl?: string;
  };
  canAfford: boolean;
  onRedeem: () => void;
}

export default function PrizeCard({ prize, canAfford, onRedeem }: PrizeCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
      <img
        src={prize.imageUrl}
        alt={prize.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold">{prize.name}</h3>
          <div className="flex items-center gap-1 bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-sm">
            <Sparkles className="w-4 h-4" />
            <span>{prize.starsCost} stars</span>
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-4">{prize.description}</p>
        <button
          onClick={onRedeem}
          disabled={!canAfford}
          className={`w-full px-4 py-2 rounded-lg transition-colors ${
            canAfford
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {canAfford ? 'Redeem Prize' : 'Not Enough Stars'}
        </button>
      </div>
    </div>
  );
}