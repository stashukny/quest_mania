interface QuestCompletion {
    id: string;
    questId: string;
    seekerId: string;
    status: 'pending' | 'completed' | 'rejected';
    completed_at: string;
} 

export interface Prize {
  id: string;
  name: string;
  description: string;
  stars_cost: number;
  image_url?: string;
  available: boolean;
} 