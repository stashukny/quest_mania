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
  description: string;
  reward: number;
  assigned_to: string;
  status: 'active' | 'pending' | 'completed' | 'in_progress';
  isTeamQuest?: boolean;
  completedAt?: string;
  completedBy?: string;
  duration: QuestDuration;
  startedAt?: string;
  endDate?: string;
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
  cost: number;
  imageUrl?: string;
}

export interface PrizeRedemption {
  id: string;
  prizeId: string;
  seekerId: string;
  redeemedAt: string;
  certificateId: string;
  starsCost: number;
}