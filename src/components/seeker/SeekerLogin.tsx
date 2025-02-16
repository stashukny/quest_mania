import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { QuestSeeker } from '../../types/index';

interface SeekerLoginProps {
  seekers: QuestSeeker[];
  onLogin: (seeker: QuestSeeker) => void;
  onMasterLogin: () => void;
}

export default function SeekerLogin({ seekers, onLogin, onMasterLogin }: SeekerLoginProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const seeker = seekers.find(s => s.pin === pin);
    if (seeker) {
      onLogin(seeker);
    } else {
      setError('Invalid PIN. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          <Wand2 className="w-16 h-16 text-purple-600 mb-4" />
          <h1 className="text-3xl font-bold text-center">Quest Mania</h1>
          <p className="text-gray-600 text-center mt-2">Enter your PIN to begin your quest!</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            maxLength={4}
            placeholder="Enter your PIN"
            value={pin}
            onChange={(e) => {
              setError('');
              setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
            }}
            className="w-full px-4 py-3 text-center text-2xl tracking-widest border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={pin.length !== 4}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enter Quest World
          </button>

          <button
            type="button"
            onClick={onMasterLogin}
            className="w-full px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Quest Master Login
          </button>
        </form>
      </div>
    </div>
  );
}