import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(process.cwd(), 'dist')));

// PostgreSQL connection configuration
const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'questdb',
    password: process.env.PGPASSWORD || 'postgres',
    port: parseInt(process.env.PGPORT || '5432', 10),
});

// Seekers routes
app.get('/api/seekers', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM seekers');
        res.json(rows);
    } catch (err) {
        console.error('Error getting seekers:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

app.post('/api/seekers', async (req, res) => {
    const { id, name, pin, avatarUrl, stars } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO seekers (id, name, pin, avatar_url, stars) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id, name, pin, avatarUrl, stars]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

app.delete('/api/seekers/:id', async (req, res) => {
    const seekerId = req.params.id;
    try {
        await pool.query('DELETE FROM seekers WHERE id = $1', [seekerId]);
        res.json({ message: `Seeker ${seekerId} deleted successfully` });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

app.put('/api/seekers/:id', async (req, res) => {
    const seekerId = req.params.id;
    const { name, pin, avatarUrl, stars } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE seekers SET name = $1, pin = $2, avatar_url = $3, stars = $4 WHERE id = $5 RETURNING *',
            [name, pin, avatarUrl, stars, seekerId]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

// Quests routes
app.get('/api/quests', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM quests');
        const parsedQuests = rows.map(quest => ({
            ...quest,
            assignedTo: quest.assigned_to ? JSON.parse(quest.assigned_to) : []
        }));
        res.json(parsedQuests);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

app.post('/api/quests', async (req, res) => {
    const { id, title, description, reward, status, duration, assignedTo } = req.body;
    const assignedToJson = JSON.stringify(assignedTo);
    try {
        const { rows } = await pool.query(
            'INSERT INTO quests (id, title, description, reward, status, duration, assigned_to) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [id, title, description, reward, status, duration, assignedToJson]
        );
        res.json({
            ...rows[0],
            assignedTo: assignedTo
        });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

app.put('/api/quests/:id', async (req, res) => {
    const questId = req.params.id;
    const { title, description, reward, status, duration, assignedTo, isTeamQuest } = req.body;
    const assignedToJson = JSON.stringify(assignedTo);
    
    try {
        const { rows } = await pool.query(
            'UPDATE quests SET title = $1, description = $2, reward = $3, status = $4, duration = $5, assigned_to = $6, is_team_quest = $7 WHERE id = $8 RETURNING *',
            [title, description, reward, status, duration, assignedToJson, isTeamQuest, questId]
        );
        res.json({
            ...rows[0],
            assignedTo: assignedTo
        });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

// Quest Suggestions routes
app.get('/api/quest-suggestions', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM quest_suggestions');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

app.post('/api/quest-suggestions', async (req, res) => {
    const { title, description, suggestedBy, createdAt, desiredReward, duration } = req.body;
    const id = crypto.randomUUID();
    
    try {
        const { rows } = await pool.query(
            'INSERT INTO quest_suggestions (id, title, description, suggested_by, status, created_at, desired_reward, duration) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [id, title, description, suggestedBy, 'pending', createdAt, desiredReward, duration]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error('Error creating quest suggestion:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

app.put('/api/quest-suggestions/:id', async (req, res) => {
    const suggestionId = req.params.id;
    const { title, description, desiredReward, status, duration } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE quest_suggestions SET title = $1, description = $2, desired_reward = $3, status = $4, duration = $5 WHERE id = $6 RETURNING *',
            [title, description, desiredReward, status, duration, suggestionId]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

// Prize Redemptions routes
app.post('/api/prizes/redeem', async (req, res) => {
    const { prizeId, seekerId, starsCost } = req.body;
    const certificateId = crypto.randomUUID();
    const now = new Date().toISOString();

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update seeker's stars
        await client.query(
            'UPDATE seekers SET stars = stars - $1 WHERE id = $2 AND stars >= $1',
            [starsCost, seekerId]
        );

        // Create redemption record
        const { rows } = await client.query(
            'INSERT INTO prize_redemptions (id, prize_id, seeker_id, redeemed_at, certificate_id, stars_cost) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [crypto.randomUUID(), prizeId, seekerId, now, certificateId, starsCost]
        );

        await client.query('COMMIT');
        res.json({ certificateId });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
        client.release();
    }
});

// Quest approval routes
app.post('/api/quests/:id/approve', async (req, res) => {
    const questId = req.params.id;
    const { seekerId } = req.body;
    const now = new Date().toISOString();

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update quest status
        await client.query(
            'UPDATE quests SET status = $1, completed_at = $2 WHERE id = $3',
            ['completed', now, questId]
        );

        // Get quest reward
        const { rows: [quest] } = await client.query(
            'SELECT reward FROM quests WHERE id = $1',
            [questId]
        );

        // Update seeker's stars
        await client.query(
            'UPDATE seekers SET stars = stars + $1 WHERE id = $2',
            [quest.reward, seekerId]
        );

        await client.query('COMMIT');
        res.json({
            status: 'completed',
            completedAt: now,
            reward: quest.reward
        });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
        client.release();
    }
});

// Serve React app for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist/index.html'));
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});