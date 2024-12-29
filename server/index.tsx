import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database interfaces
interface DbQuest {
    id: string;
    title: string;
    description: string;
    reward: number;
    status: string;
    duration: string;
    assigned_to: string;
    started_at?: string;
    completed_at?: string;
}

interface DbQuestSuggestion {
    id: string;
    title: string;
    description: string;
    suggested_by: string;
    status: string;
    created_at: string;
    desired_reward: number;
    duration: string;
}

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
        console.log('Retrieved seekers:', rows);
        res.json(rows);
    } catch (err) {
        console.error('Error getting seekers:', err);
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/seekers/:id', async (req, res) => {
    const seekerId = req.params.id;
    try {
        await pool.query('DELETE FROM seekers WHERE id = $1', [seekerId]);
        res.json({ message: `Seeker ${seekerId} deleted successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

// Quests routes
app.get('/api/quests', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM quests');
        const parsedQuests = rows.map((quest: any) => ({
            ...quest,
            assignedTo: quest.assigned_to ? JSON.parse(quest.assigned_to) : []
        }));
        res.json(parsedQuests);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

// Quest Suggestions endpoints
app.get('/api/quest-suggestions', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM quest_suggestions');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

// Quest approval/rejection endpoints
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
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.post('/api/quests/:id/reject', async (req, res) => {
    const questId = req.params.id;
    try {
        await pool.query(
            'UPDATE quests SET status = $1, completed_at = NULL WHERE id = $2',
            ['in_progress', questId]
        );
        res.json({
            status: 'in_progress',
            message: 'Quest completion rejected'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Prizes endpoints
app.get('/api/prizes', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM prizes WHERE available = true');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/prizes', async (req, res) => {
    const { id, name, description, cost, imageUrl } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO prizes (id, name, description, stars_cost, image_url, available) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [id, name, description, cost, imageUrl, true]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/prizes/:id', async (req, res) => {
    const prizeId = req.params.id;
    const { name, description, cost, imageUrl, available } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE prizes SET name = $1, description = $2, stars_cost = $3, image_url = $4, available = $5 WHERE id = $6 RETURNING *',
            [name, description, cost, imageUrl, available, prizeId]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/prizes/:id', async (req, res) => {
    const prizeId = req.params.id;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // First check if there are any redemptions
        const { rows } = await client.query(
            'SELECT COUNT(*) as count FROM prize_redemptions WHERE prize_id = $1',
            [prizeId]
        );

        if (rows[0].count > 0) {
            throw new Error('Cannot delete prize with existing redemptions');
        }

        // If no redemptions, proceed with deletion
        await client.query('DELETE FROM prizes WHERE id = $1', [prizeId]);
        
        await client.query('COMMIT');
        res.json({ message: 'Prize deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.message === 'Cannot delete prize with existing redemptions') {
            res.status(400).json({ error: err.message });
        } else {
            res.status(500).json({ error: err.message });
        }
    } finally {
        client.release();
    }
});

// Prize redemption endpoint
app.post('/api/prizes/redeem', async (req, res) => {
    const { prizeId, seekerId, starsCost } = req.body;
    const certificateId = crypto.randomUUID();
    const now = new Date().toISOString();

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update seeker's stars
        const updateResult = await client.query(
            'UPDATE seekers SET stars = stars - $1 WHERE id = $2 AND stars >= $1 RETURNING stars',
            [starsCost, seekerId]
        );

        if (updateResult.rows.length === 0) {
            throw new Error('Insufficient stars');
        }

        // Create redemption record
        const redemptionId = crypto.randomUUID();
        await client.query(
            'INSERT INTO prize_redemptions (id, prize_id, seeker_id, redeemed_at, certificate_id, stars_cost) VALUES ($1, $2, $3, $4, $5, $6)',
            [redemptionId, prizeId, seekerId, now, certificateId, starsCost]
        );

        await client.query('COMMIT');
        res.json({ certificateId });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Seeker quest management endpoints
app.get('/api/seekers/:id/quests', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT q.* FROM quests q 
             WHERE q.status IN ('active', 'in_progress', 'pending')`
        );
        
        const parsedQuests = rows.map(quest => ({
            ...quest,
            assignedTo: JSON.parse(quest.assigned_to || '[]')
        }));
        
        res.json(parsedQuests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Quest completion endpoints
app.post('/api/quests/:id/complete-request', async (req, res) => {
    const questId = req.params.id;
    const { seekerId } = req.body;
    const completionId = crypto.randomUUID();
    const now = new Date().toISOString();

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if quest is already completed
        const existingCompletion = await client.query(
            'SELECT * FROM quest_completions WHERE quest_id = $1 AND seeker_id = $2',
            [questId, seekerId]
        );

        if (existingCompletion.rows.length > 0) {
            throw new Error('Quest completion already submitted');
        }

        // Insert completion record
        const { rows } = await client.query(
            'INSERT INTO quest_completions (id, quest_id, seeker_id, status, completed_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [completionId, questId, seekerId, 'pending', now]
        );

        await client.query('COMMIT');
        res.json({
            id: completionId,
            status: 'pending',
            completedAt: now
        });
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.message === 'Quest completion already submitted') {
            res.status(400).json({ error: err.message });
        } else {
            res.status(500).json({ error: err.message });
        }
    } finally {
        client.release();
    }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});