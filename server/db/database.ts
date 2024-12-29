import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Convert your schema to PostgreSQL syntax
const schema = `
CREATE TABLE IF NOT EXISTS seekers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    avatarUrl TEXT,
    stars INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    reward INTEGER NOT NULL,
    status TEXT NOT NULL,
    duration TEXT NOT NULL,
    assignedTo TEXT,
    startedAt TEXT,
    completedAt TEXT
);

CREATE TABLE IF NOT EXISTS quest_suggestions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    suggestedBy TEXT NOT NULL,
    status TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    desiredReward INTEGER NOT NULL,
    duration TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prizes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    starsCost INTEGER NOT NULL,
    imageUrl TEXT,
    available BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS prize_redemptions (
    id TEXT PRIMARY KEY,
    prizeId TEXT NOT NULL,
    seekerId TEXT NOT NULL,
    redeemedAt TEXT NOT NULL,
    certificateId TEXT NOT NULL,
    starsCost INTEGER NOT NULL
);
`;

pool.query(schema).catch((err: Error) => {
    console.error('Error initializing database:', err);
});

export { pool as db };