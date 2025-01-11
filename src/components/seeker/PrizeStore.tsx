import React, { useState, useEffect } from 'react';
import { ShoppingBag, Sparkles, Gift } from 'lucide-react';
import { QuestSeeker, Prize } from '../../types';

interface PrizeStoreProps {
  seeker: QuestSeeker;
  onRedeemPrize: (prizeId: string, starsCost: number) => void;
}

export default function PrizeStore({ seeker, onRedeemPrize }: PrizeStoreProps) {
  const [prizes, setPrizes] = useState<Prize[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/prizes')
      .then(res => res.json())
      .then(data => setPrizes(data))
      .catch(err => console.error('Error fetching prizes:', err));
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Gift className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-semibold">Prize Store</h2>
        </div>
        <div className="flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
          <Sparkles className="w-4 h-4" />
          <span>{seeker.stars} stars available</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prizes.map((prize) => (
          <div key={prize.id} className="border rounded-lg overflow-hidden">
            {prize.image_url && (
              <img
                src={prize.image_url}
                alt={prize.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold">{prize.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{prize.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
                  <Sparkles className="w-4 h-4" />
                  <span>{prize.stars_cost} stars</span>
                </div>
                <button
                  onClick={() => onRedeemPrize(prize.id, prize.stars_cost)}
                  disabled={seeker.stars < prize.stars_cost}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    seeker.stars >= prize.stars_cost
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {seeker.stars >= prize.stars_cost ? (
                    <>
                      <Gift className="w-4 h-4" />
                      Redeem
                    </>
                  ) : (
                    'Not Enough Stars'
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}