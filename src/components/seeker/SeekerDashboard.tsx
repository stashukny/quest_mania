import React, { useEffect, useState } from 'react';
import { Trophy, Star, Gift } from 'lucide-react';
import { QuestSeeker } from '../../types';

interface PrizeRedemption {
  id: string;
  prize_name: string;
  certificate_id: string;
  redeemed_at: string;
  stars_cost: number;
}

interface SeekerDashboardProps {
  seeker: QuestSeeker;
}

export default function SeekerDashboard({ seeker }: SeekerDashboardProps) {
  const [redemptions, setRedemptions] = useState<PrizeRedemption[]>([]);

  useEffect(() => {
    fetch(`http://localhost:3001/api/seekers/${seeker.id}/redemptions`)
      .then(res => res.json())
      .then(data => setRedemptions(data))
      .catch(err => console.error('Error fetching redemptions:', err));
  }, [seeker.id]);

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <div className="flex items-center gap-4 mb-6">
        {seeker.avatar_url && (
          <img
            src={seeker.avatar_url}
            alt={seeker.name}
            className="w-16 h-16 rounded-full"
          />
        )}
        <div>
          <h2 className="text-2xl font-semibold">{seeker.name}</h2>
          <div className="flex items-center gap-1 text-purple-600">
            <Star className="w-5 h-5" />
            <span>{seeker.stars} stars collected</span>
          </div>
        </div>
      </div>

      {redemptions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-600" />
            Prize Redemption History
          </h3>
          <div className="space-y-3">
            {redemptions.map((redemption) => (
              <div
                key={redemption.id}
                className="bg-purple-50 rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-medium">{redemption.prize_name}</h4>
                  <p className="text-sm text-gray-600">
                    Certificate ID: {redemption.certificate_id}
                  </p>
                  <p className="text-sm text-gray-600">
                    Redeemed: {new Date(redemption.redeemed_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-purple-100 text-purple-600 px-3 py-1 rounded-full">
                  <Star className="w-4 h-4" />
                  <span>{redemption.stars_cost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}