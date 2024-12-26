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
        return response.json();
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

    updateQuestStatus: async (questId: string, status: string, startedAt?: string) => {
        const response = await fetch(`${API_BASE_URL}/quests/${questId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status, startedAt }),
        });
        return response.json();
    },
};