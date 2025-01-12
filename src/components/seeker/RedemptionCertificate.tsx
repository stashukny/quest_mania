import React from 'react';
import { QuestSeeker, Prize } from '../../types';
import { Check } from 'lucide-react';

interface RedemptionCertificateProps {
  certificateId: string;
  seeker: QuestSeeker;
  prize: Prize;
  onClose: () => void;
}

export default function RedemptionCertificate({
  certificateId,
  seeker,
  prize,
  onClose
}: RedemptionCertificateProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Prize Redeemed!</h1>
          <p className="text-gray-600 mb-6">
            You have successfully redeemed {prize.name} for {prize.stars_cost} stars
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Certificate ID: {certificateId}
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}