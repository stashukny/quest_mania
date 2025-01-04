-- Drop tables if they exist
DROP TABLE IF EXISTS prize_redemptions;
DROP TABLE IF EXISTS prizes;
DROP TABLE IF EXISTS quest_completions;
DROP TABLE IF EXISTS quest_suggestions;
DROP TABLE IF EXISTS quests;
DROP TABLE IF EXISTS seekers;

-- Create tables
CREATE TABLE seekers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    avatar_url TEXT,
    stars INTEGER DEFAULT 0
);

CREATE TABLE quests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    reward INTEGER,
    status TEXT CHECK (status IN ('active', 'pending', 'completed', 'in_progress')),
    duration TEXT,
    assigned_to TEXT REFERENCES seekers(id),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE quest_suggestions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    desired_reward INTEGER,
    suggested_by TEXT REFERENCES seekers(id),
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration TEXT
);

CREATE TABLE prizes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    stars_cost INTEGER,
    image_url TEXT,
    available BOOLEAN DEFAULT TRUE
);

CREATE TABLE prize_redemptions (
    id TEXT PRIMARY KEY,
    prize_id TEXT REFERENCES prizes(id),
    seeker_id TEXT REFERENCES seekers(id),
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    certificate_id TEXT UNIQUE,
    stars_cost INTEGER,
    CONSTRAINT fk_seeker FOREIGN KEY (seeker_id) REFERENCES seekers(id),
    CONSTRAINT fk_prize FOREIGN KEY (prize_id) REFERENCES prizes(id)
);

CREATE TABLE quest_completions (
    id TEXT PRIMARY KEY,
    quest_id TEXT NOT NULL,
    seeker_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'rejected')),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_quest FOREIGN KEY (quest_id) REFERENCES quests(id),
    CONSTRAINT fk_seeker FOREIGN KEY (seeker_id) REFERENCES seekers(id)
);

-- Create indexes for better performance
CREATE INDEX idx_quests_status ON quests(status);
CREATE INDEX idx_quests_assigned_to ON quests(assigned_to);
CREATE INDEX idx_quest_suggestions_status ON quest_suggestions(status);
CREATE INDEX idx_prize_redemptions_seeker ON prize_redemptions(seeker_id); 