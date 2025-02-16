import { Quest, QuestSeeker } from "../types/";

// Use relative path for API requests - will be handled by Express server in both dev and prod
export const BASE_URL = '/api';

export const api = {
    // Seekers
    getSeekers: async () => {
        const response = await fetch(`${BASE_URL}/seekers`);
        if (!response.ok) throw new Error('Failed to fetch seekers');
        return response.json();
    },
    
    createSeeker: async (seeker: QuestSeeker) => {
        const response = await fetch(`${BASE_URL}/seekers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(seeker),
        });
        if (!response.ok) throw new Error('Failed to create seeker');
        return response.json();
    },

    updateSeeker: async (seeker: QuestSeeker) => {
        const response = await fetch(`${BASE_URL}/seekers/${seeker.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(seeker),
        });
        if (!response.ok) throw new Error('Failed to update seeker');
        return response.json();
    },

    deleteSeeker: async (seekerId: string) => {
        const response = await fetch(`${BASE_URL}/seekers/${seekerId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) throw new Error('Failed to delete seeker');
        return response.json();
    },

    // Quests
    getQuests: async () => {
        const response = await fetch(`${BASE_URL}/quests`);
        const data = await response.json();
        // Map snake_case to camelCase
        return data.map((quest: any) => ({
            ...quest,
            started_at: quest.started_at,
            completed_at: quest.completed_at,
            assigned_to: quest.assigned_to
        }));
    },

    createQuest: async (quest: Quest) => {
        const response = await fetch(`${BASE_URL}/quests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(quest),
        });
        return response.json();
    },

    updateQuestStatus: async (questId: string, status: string) => {
        const response = await fetch(`${BASE_URL}/quests/${questId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Failed to update quest status');
        return response.json();
    },

    submitQuestSuggestion: async (suggestion: {
        title: string;
        description: string;
        suggested_by: string;
        desired_reward: number;
        duration: string;
    }) => {
        const response = await fetch(`${BASE_URL}/quest-suggestions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...suggestion,
                id: crypto.randomUUID(),
                status: 'pending',
                created_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to submit quest suggestion');
        }

        return await response.json();
    },
};