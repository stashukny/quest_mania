import { Quest } from "../types";

const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
    // Seekers
    getSeekers: async () => {
        const response = await fetch(`${API_BASE_URL}/seekers`);
        return response.json();
    },
    
    createSeeker: async (seeker: { id: string; name: string }) => {
        const response = await fetch(`${API_BASE_URL}/seekers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(seeker),
        });
        return response.json();
    },

    // Quests
    getQuests: async () => {
        const response = await fetch(`${API_BASE_URL}/quests`);
        const data = await response.json();
        // Map snake_case to camelCase
        return data.map((quest: any) => ({
            ...quest,
            startedAt: quest.started_at,
            completedAt: quest.completed_at,
            assignedTo: quest.assigned_to
        }));
    },

    createQuest: async (quest: Quest) => {
        const response = await fetch(`${API_BASE_URL}/quests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(quest),
        });
        return response.json();
    },

    updateQuestStatus: async (questId: string, status: string) => {
        const response = await fetch(`${API_BASE_URL}/quests/${questId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                seeker_id: localStorage.getItem('currentSeekerId')
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to complete quest');
        }

        return await response.json();
    },

    submitQuestSuggestion: async (suggestion: {
        title: string;
        description: string;
        suggested_by: string;
        desired_reward: number;
        duration: string;
    }) => {
        const response = await fetch(`${API_BASE_URL}/quest-suggestions`, {
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