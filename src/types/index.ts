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
  assignedTo: string[]; // array of seeker IDs
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
  suggestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  desiredReward: number;
  duration: QuestDuration;
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