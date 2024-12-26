import React, { useState, useEffect } from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { QuestSeeker, Prize } from '../../types';
import PrizeCard from './PrizeCard';

interface PrizeStoreProps {
  seeker: QuestSeeker;
  onRedeemPrize: (prizeId: string, starsCost: number) => void;
}

export default function PrizeStore({ seeker, onRedeemPrize }: PrizeStoreProps) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/prizes');
        if (!response.ok) throw new Error('Failed to fetch prizes');
        const data = await response.json();
        setPrizes(data);
      } catch (error) {
        console.error('Error fetching prizes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrizes();
  }, []);

  const handleRedeemPrize = async (prizeId: string, starsCost: number) => {
    try {
      const response = await fetch('http://localhost:3001/api/prizes/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prizeId,
          seekerId: seeker.id,
          starsCost
        }),
      });

      if (!response.ok) throw new Error('Failed to redeem prize');
      
      const { certificateId } = await response.json();
      onRedeemPrize(prizeId, starsCost);
    } catch (error) {
      console.error('Error redeeming prize:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-6">
        <p className="text-center">Loading prizes...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingBag className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold">Prize Store</h2>
        <div className="ml-auto flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
          <Sparkles className="w-4 h-4" />
          <span>{seeker.stars} stars available</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prizes.map((prize) => (
          <PrizeCard
            key={prize.id}
            prize={prize}
            canAfford={seeker.stars >= prize.starsCost}
            onRedeem={() => handleRedeemPrize(prize.id, prize.starsCost)}
          />
        ))}
      </div>
    </div>
  );
}