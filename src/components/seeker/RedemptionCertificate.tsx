import React from 'react';
import { Award, Download } from 'lucide-react';
import { Prize, QuestSeeker } from '../../types';

interface RedemptionCertificateProps {
  prize: Prize;
  seeker: QuestSeeker;
  onClose: () => void;
  certificateId: string;
}

export default function RedemptionCertificate({ 
  prize, 
  seeker, 
  onClose,
  certificateId
}: RedemptionCertificateProps) {
  const date = new Date().toLocaleDateString();
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <div className="text-center">
          <Award className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Prize Redemption Certificate</h2>
          <p className="text-gray-600 mb-2">Certificate ID: {certificateId}</p>
          <p className="text-gray-600 mb-6">This certificate confirms your prize redemption</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="border-t border-b py-4">
            <p className="text-sm text-gray-600">Awarded to:</p>
            <p className="font-semibold">{seeker.name}</p>
          </div>
          <div className="border-b pb-4">
            <p className="text-sm text-gray-600">Prize:</p>
            <p className="font-semibold">{prize.name}</p>
            <p className="text-sm text-gray-600">{prize.description}</p>
          </div>
          <div className="border-b pb-4">
            <p className="text-sm text-gray-600">Stars Spent:</p>
            <p className="font-semibold">{prize.cost} stars</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date:</p>
            <p className="font-semibold">{date}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}