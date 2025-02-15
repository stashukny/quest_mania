import React, { useState, useEffect } from 'react';
import { Gift, Pencil, Trash2, X, Check, Plus } from 'lucide-react';
import { Prize, PrizeRedemption } from '../../types/';

interface PrizeManagementProps {
  prizes: Prize[];
  setPrizes: React.Dispatch<React.SetStateAction<Prize[]>>;
  redemptions: PrizeRedemption[];
}

interface EditablePrizeProps {
  prize: Prize;
  onSave: (updatedPrize: Prize) => void;
  onCancel: () => void;
}

function EditablePrize({ prize, onSave, onCancel }: EditablePrizeProps) {
  const [editedPrize, setEditedPrize] = useState({
    name: prize.name,
    description: prize.description || '',
    stars_cost: prize.stars_cost || 1,
    image_url: prize.image_url || ''
  });

  const handleSave = () => {
    onSave({
      id: prize.id || crypto.randomUUID(),
      name: editedPrize.name,
      description: editedPrize.description,
      stars_cost: editedPrize.stars_cost,
      image_url: editedPrize.image_url,
      available: true
    });
  };

  return (
    <div className="p-4 border rounded-lg bg-purple-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <input
            type="text"
            value={editedPrize.name}
            onChange={(e) => setEditedPrize({ ...editedPrize, name: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Prize Name"
          />
          <textarea
            value={editedPrize.description}
            onChange={(e) => setEditedPrize({ ...editedPrize, description: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Prize Description"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <input
            type="number"
            value={editedPrize.stars_cost}
            onChange={(e) => setEditedPrize({ ...editedPrize, stars_cost: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Star Cost"
            min="1"
          />
          <input
            type="text"
            value={editedPrize.image_url}
            onChange={(e) => setEditedPrize({ ...editedPrize, image_url: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Image URL"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          disabled={!editedPrize.name || editedPrize.stars_cost < 1}
        >
          <Check className="w-4 h-4" />
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PrizeManagement({ prizes, setPrizes, redemptions }: PrizeManagementProps) {
  const [editingPrizeId, setEditingPrizeId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrize, setNewPrize] = useState({
    name: '',
    description: '',
    starsCost: 1,
    imageUrl: ''
  });

  // Fetch prizes on component mount
  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        const response = await fetch('/api/prizes');
        if (!response.ok) throw new Error('Failed to fetch prizes');
        const data = await response.json();
        setPrizes(data);
      } catch (error) {
        console.error('Error fetching prizes:', error);
      }
    };
    fetchPrizes();
  }, [setPrizes]);

  const handleSavePrize = async (prize: Prize) => {
    try {
      const response = await fetch('/api/prizes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prize),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create prize');
      }

      const savedPrize = await response.json();
      setPrizes([...prizes, savedPrize]);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating prize:', error);
    }
  };

  const handleEditPrize = async (updatedPrize: Prize) => {
    try {
      const response = await fetch(`/api/prizes/${updatedPrize.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPrize),
      });

      if (!response.ok) throw new Error('Failed to update prize');
      
      const savedPrize = await response.json();
      setPrizes(prizes.map(p => p.id === savedPrize.id ? savedPrize : p));
      setEditingPrizeId(null);
    } catch (error) {
      console.error('Error updating prize:', error);
    }
  };

  const handleRemovePrize = async (prizeId: string) => {
    const hasRedemptions = redemptions.some(r => r.prizeId === prizeId);
    if (hasRedemptions) {
      alert('Cannot remove this prize as it has been redeemed by seekers.');
      return;
    }

    if (confirm('Are you sure you want to remove this prize?')) {
      try {
        const response = await fetch(`/api/prizes/${prizeId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete prize');
        }

        setPrizes(prizes.filter(p => p.id !== prizeId));
      } catch (error) {
        console.error('Error deleting prize:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete prize');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Gift className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold">Manage Prizes</h2>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Prize
          </button>
        </div>

        <div className="space-y-4">
          {showAddForm && (
            <EditablePrize
              prize={{ id: '', name: '', description: '', stars_cost: 1, image_url: '', available: true }}
              onSave={handleSavePrize}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {prizes.map((prize) => (
            editingPrizeId === prize.id ? (
              <EditablePrize
                key={prize.id}
                prize={prize}
                onSave={handleEditPrize}
                onCancel={() => setEditingPrizeId(null)}
              />
            ) : (
              <div key={prize.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <img
                  src={prize.image_url}
                  alt={prize.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{prize.name}</h3>
                  <p className="text-gray-600">{prize.description}</p>
                  <p className="text-purple-600 font-semibold mt-1">Cost: {prize.stars_cost} stars</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingPrizeId(prize.id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRemovePrize(prize.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}