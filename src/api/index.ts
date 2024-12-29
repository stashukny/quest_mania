import { API_URL } from '../config';
import { Quest } from "../types";

export const api = {
    // Seekers
    getSeekers: async () => {
        const response = await fetch(`${API_URL}/api/seekers`);
        if (!response.ok) throw new Error('Failed to fetch seekers');
        return response.json();
    },
    
    createSeeker: async (seeker: { id: string; name: string }) => {
        const response = await fetch(`${API_URL}/api/seekers`, {
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
        const response = await fetch(`${API_URL}/api/quests`);
        if (!response.ok) throw new Error('Failed to fetch quests');
        return response.json();
    },

    createQuest: async (quest: Quest) => {
        const response = await fetch(`${API_URL}/api/quests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(quest),
        });
        return response.json();
    },

    updateQuestStatus: async (questId: string, status: string, startedAt?: string) => {
        const response = await fetch(`${API_URL}/api/quests/${questId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status, startedAt }),
        });
        return response.json();
    },
};