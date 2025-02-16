import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { QuestSeeker } from '../../types/';
import { api } from '../../api';

interface SeekerManagementProps {
  seekers: QuestSeeker[];
  setSeekers: React.Dispatch<React.SetStateAction<QuestSeeker[]>>;
}

interface EditableSeekerProps {
  seeker: QuestSeeker;
  onSave: (updatedSeeker: QuestSeeker) => void;
  onCancel: () => void;
}

function EditableSeeker({ seeker, onSave, onCancel }: EditableSeekerProps) {
  const [editedSeeker, setEditedSeeker] = useState({
    name: seeker.name || '',
    avatarUrl: seeker.avatarUrl || '',
    pin: seeker.pin || '',
  });

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-purple-50">
      <img
        src={editedSeeker.avatarUrl || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200'}
        alt={editedSeeker.name}
        className="w-16 h-16 rounded-full object-cover"
      />
      <div className="flex-1 space-y-2">
        <input
          type="text"
          value={editedSeeker.name}
          onChange={(e) => setEditedSeeker({ ...editedSeeker, name: e.target.value })}
          className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Seeker Name"
        />
        <input
          type="text"
          value={editedSeeker.avatarUrl}
          onChange={(e) => setEditedSeeker({ ...editedSeeker, avatarUrl: e.target.value })}
          className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Avatar URL"
        />
        <input
          type="text"
          value={editedSeeker.pin}
          onChange={(e) => setEditedSeeker({ ...editedSeeker, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
          className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="PIN (4 digits)"
          maxLength={4}
        />
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onSave({ ...seeker, ...editedSeeker })}
          className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
          disabled={!editedSeeker.name || editedSeeker.pin.length !== 4}
        >
          <Check className="w-5 h-5" />
        </button>
        <button
          onClick={onCancel}
          className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function SeekerManagement({ seekers, setSeekers }: SeekerManagementProps) {
  const [newSeeker, setNewSeeker] = useState({ name: '', avatarUrl: '' });
  const [editingSeekerIds, setEditingSeekerIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchSeekers = async () => {
      try {
        const data = await api.getSeekers();
        setSeekers(data);
      } catch (err) {
        console.error('Error fetching seekers:', err);
      }
    };

    fetchSeekers();
  }, [setSeekers]);

  const generatePin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleAddSeeker = async () => {
    if (!newSeeker.name) return;
    
    const pin = generatePin();
    const seeker: QuestSeeker = {
      id: crypto.randomUUID(),
      name: newSeeker.name,
      pin,
      avatarUrl: newSeeker.avatarUrl || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200',
      stars: 0
    };

    try {
      const savedSeeker = await api.createSeeker(seeker);
      setSeekers([...seekers, savedSeeker]);
      setNewSeeker({ name: '', avatarUrl: '' });
    } catch (error) {
      console.error('Error adding seeker:', error);
    }
  };

  const handleRemoveSeeker = async (seekerId: string) => {
    if (confirm('Are you sure you want to remove this quest seeker? This action cannot be undone.')) {
      try {
        await api.deleteSeeker(seekerId);
        setSeekers(seekers.filter(s => s.id !== seekerId));
      } catch (error) {
        console.error('Error removing seeker:', error);
      }
    }
  };

  const handleEditSeeker = (seekerId: string) => {
    setEditingSeekerIds(new Set([...editingSeekerIds, seekerId]));
  };

  const handleSaveSeeker = async (updatedSeeker: QuestSeeker) => {
    try {
      const savedSeeker = await api.updateSeeker(updatedSeeker);
      setSeekers(seekers.map(s => s.id === savedSeeker.id ? savedSeeker : s));
      setEditingSeekerIds(new Set([...editingSeekerIds].filter(id => id !== savedSeeker.id)));
    } catch (error) {
      console.error('Error updating seeker:', error);
    }
  };

  const handleCancelEdit = (seekerId: string) => {
    setEditingSeekerIds(new Set([...editingSeekerIds].filter(id => id !== seekerId)));
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-xl p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Add Quest Seeker</h2>
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Seeker Name"
            value={newSeeker.name}
            onChange={(e) => setNewSeeker({ ...newSeeker, name: e.target.value })}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="text"
            placeholder="Avatar URL (optional)"
            value={newSeeker.avatarUrl}
            onChange={(e) => setNewSeeker({ ...newSeeker, avatarUrl: e.target.value })}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleAddSeeker}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add Seeker
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-xl p-6">
        <h2 className="text-2xl font-semibold mb-4">Quest Seekers</h2>
        <div className="grid grid-cols-1 gap-4">
          {seekers.map((seeker) => (
            editingSeekerIds.has(seeker.id) ? (
              <EditableSeeker
                key={seeker.id}
                seeker={seeker}
                onSave={handleSaveSeeker}
                onCancel={() => handleCancelEdit(seeker.id)}
              />
            ) : (
              <div key={seeker.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <img
                  src={seeker.avatarUrl}
                  alt={seeker.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{seeker.name}</h3>
                  <p className="text-gray-600">PIN: {seeker.pin}</p>
                  <p className="text-purple-600">Stars: {seeker.stars}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSeeker(seeker.id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRemoveSeeker(seeker.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          ))}
          {seekers.length === 0 && (
            <p className="text-gray-500 text-center py-8">No quest seekers added yet</p>
          )}
        </div>
      </div>
    </>
  );
}