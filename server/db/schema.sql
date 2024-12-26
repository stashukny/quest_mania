CREATE TABLE seekers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    avatarUrl TEXT,
    stars INTEGER DEFAULT 0
);

CREATE TABLE quests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    reward INTEGER,
    status TEXT,
    duration INTEGER,
    startedAt TEXT,
    assignedTo TEXT
);

CREATE TABLE quest_suggestions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    desiredReward INTEGER,
    suggestedBy TEXT,
    status TEXT,
    duration INTEGER,
    FOREIGN KEY(suggestedBy) REFERENCES seekers(id)
);

CREATE TABLE prize_redemptions (
    id TEXT PRIMARY KEY,
    prizeId TEXT NOT NULL,
    seekerId TEXT NOT NULL,
    redeemedAt TEXT,
    certificateId TEXT,
    starsCost INTEGER,
    FOREIGN KEY(seekerId) REFERENCES seekers(id)
);

CREATE TABLE prizes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    starsCost INTEGER,
    available BOOLEAN,
    imageUrl TEXT
);

CREATE TABLE quest_completions (
    id TEXT PRIMARY KEY,
    questId TEXT NOT NULL,
    seekerId TEXT NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'completed', 'rejected'
    completedAt TEXT,
    FOREIGN KEY(questId) REFERENCES quests(id),
    FOREIGN KEY(seekerId) REFERENCES seekers(id)
);