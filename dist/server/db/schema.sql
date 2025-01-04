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
    assignedto TEXT,
    startedat TEXT,
    completedat TEXT
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
    starscost INTEGER NOT NULL,
    imageurl TEXT,
    available BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS prize_redemptions (
    id TEXT PRIMARY KEY,
    prizeId TEXT NOT NULL,
    seekerId TEXT NOT NULL,
    redeemedAt TEXT NOT NULL,
    certificateId TEXT NOT NULL,
    starsCost INTEGER NOT NULL
);