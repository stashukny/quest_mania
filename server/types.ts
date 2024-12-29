export interface Quest {
    id: string;
    title: string;
    description: string;
    reward: number;
    status: string;
    duration: string;
    assignedTo: string;
    startedAt?: string;
    completedAt?: string;
    isTeamQuest?: boolean;
}

export interface QuestSeeker {
    id: string;
    name: string;
    pin: string;
    avatarUrl: string;
    stars: number;
}

export interface QuestSuggestion {
    id: string;
    title: string;
    description: string;
    suggestedBy: string;
    status: string;
    createdAt: string;
    desiredReward: number;
    duration: string;
}

export interface Prize {
    id: string;
    name: string;
    description: string;
    starsCost: number;
    imageUrl: string;
    available: boolean;
} 