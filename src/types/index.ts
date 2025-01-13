export interface QuestSeeker {
  id: string;
  name: string;
  pin: string;
  avatarUrl: string;
  stars: number;
}

export type QuestDuration = 'daily' | 'weekly' | 'none';

export interface Quest {
  id: string;
  title: string;
  description?: string;
  reward: number;
  status: string;
  duration: string;
  assigned_to: string;
  started_at?: string;
  completed_at?: string;
}

export interface QuestSuggestion {
  id: string;
  title: string;
  description: string;
  suggested_by: string;
  status: string;
  created_at: string;
  desired_reward: number;
  duration: string;
}

export interface Prize {
  id: string;
  name: string;
  description: string;
  stars_cost: number;
  image_url?: string;
  available: boolean
}

export interface PrizeRedemption {
  id: string;
  prizeId: string;
  seekerId: string;
  redeemedAt: string;
  certificateId: string;
  stars_cost: number;
}