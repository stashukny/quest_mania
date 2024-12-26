interface QuestCompletion {
    id: string;
    questId: string;
    seekerId: string;
    status: 'pending' | 'completed' | 'rejected';
    completedAt: string;
} 

interface Prize {
  id: string;
  name: string;
  description: string;
  cost: number;
  imageUrl?: string;
  available: boolean;
} 