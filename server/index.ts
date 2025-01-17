import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;
import { Quest } from './types';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(process.cwd(), 'dist')));

// PostgreSQL connection configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Add this before your routes
app.use((req, res, next) => {
    process.stdout.write(`${new Date().toISOString()} ${req.method} ${req.url}\n`);
    next();
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
            'INSERT INTO seekers (id, name, pin, avatarurl, stars) VALUES ($1, $2, $3, $4, $5) RETURNING *',
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
            'UPDATE seekers SET name = $1, pin = $2, avatarurl = $3, stars = $4 WHERE id = $5 RETURNING *',
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
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

app.post('/api/quests', async (req, res) => {
    const { id, title, description, reward, status, duration, assignedTo } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO quests (id, title, description, reward, status, duration, assignedto) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [id, title, description, reward, status, duration, assignedTo]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

app.put('/api/quests/:id', async (req, res) => {
    const questId = req.params.id;
    const { title, description, reward, status, duration, assignedTo } = req.body;
    
    try {
        const { rows } = await pool.query(
            'UPDATE quests SET title = $1, description = $2, reward = $3, status = $4, duration = $5, assignedto = $6 WHERE id = $7 RETURNING *',
            [title, description, reward, status, duration, assignedTo, questId]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

app.delete('/api/quests/:id', async (req, res) => {
    const questId = req.params.id;
    try {
        await pool.query('DELETE FROM quests WHERE id = $1', [questId]);
        res.json({ message: `Quest ${questId} deleted successfully` });
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
            'INSERT INTO quest_suggestions (id, title, description, suggestedby, status, createdat, desiredreward, duration) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
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
            'INSERT INTO prize_redemptions (id, prizeid, seekerid, redeemedat, certificateid, starscost) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
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
            'UPDATE quests SET status = $1, completedat = $2 WHERE id = $3',
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


// Prizes endpoints
app.get('/api/prizes', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, name, description, starscost as "starsCost", imageurl as "imageUrl", available FROM prizes WHERE available = true');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

app.post('/api/prizes', async (req, res) => {
    const { id, name, description, starsCost, imageUrl } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO prizes (id, name, description, starscost, imageurl, available) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [id, name, description, starsCost, imageUrl, true]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error('Error in POST /api/prizes:', {
            error: err,
            stack: err instanceof Error ? err.stack : undefined,
            body: req.body
        });
        res.status(500).json({ 
            error: err instanceof Error ? err.message : 'Unknown error',
            details: process.env.NODE_ENV !== 'production' ? err : undefined
        });
    }
});

app.put('/api/prizes/:id', async (req, res) => {
    const prizeId = req.params.id;
    const { name, description, starsCost, imageUrl, available } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE prizes SET name = $1, description = $2, starscost = $3, imageurl = $4, available = $5 WHERE id = $6 RETURNING *',
            [name, description, starsCost, imageUrl, available, prizeId]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

app.delete('/api/prizes/:id', async (req, res) => {
    const prizeId = req.params.id;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // First check if there are any redemptions
        const { rows } = await client.query(
            'SELECT COUNT(*) as count FROM prize_redemptions WHERE prizeid = $1',
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
        if (err instanceof Error && err.message === 'Cannot delete prize with existing redemptions') {
            res.status(400).json({ error: err.message });
        } else {
            res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
        }
    } finally {
        client.release();
    }
});

app.post('/api/quest-suggestions/:id/approve', async (req, res) => {
    const suggestionId = req.params.id;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Get the suggestion details
        const { rows: [suggestion] } = await client.query(
            'SELECT * FROM quest_suggestions WHERE id = $1',
            [suggestionId]
        );

        const questId = crypto.randomUUID();
        // Create new quest from suggestion - note suggestedby is now directly assigned
        await client.query(
            'INSERT INTO quests (id, title, description, reward, status, duration, assignedto) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [questId, suggestion.title, suggestion.description, suggestion.desiredreward, 'active', suggestion.duration, suggestion.suggestedby]
        );

        // Update suggestion status
        await client.query(
            'UPDATE quest_suggestions SET status = $1 WHERE id = $2',
            ['approved', suggestionId]
        );

        await client.query('COMMIT');
        res.json({
            suggestion: { ...suggestion, status: 'approved' },
            quest: {
                id: questId,
                title: suggestion.title,
                description: suggestion.description,
                reward: suggestion.desiredreward,
                status: 'active',
                duration: suggestion.duration,
                assignedTo: suggestion.suggestedby  // Now a single string
            }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
        client.release();
    }
});

app.post('/api/quest-suggestions/:id/reject', async (req, res) => {
    const suggestionId = req.params.id;
    try {
        await pool.query(
            'UPDATE quest_suggestions SET status = $1 WHERE id = $2',
            ['rejected', suggestionId]
        );
        res.json({ 
            id: suggestionId,
            status: 'rejected'
        });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

app.get('/api/seekers/:id/quests', async (req, res) => {
    process.stdout.write(`Request received for seeker quests: ${req.params.id}\n`);
    const seekerId = req.params.id;
    
    try {
        // First, let's check what quests exist
        const { rows: allQuests } = await pool.query(
            'SELECT id, title, assignedto FROM quests WHERE status IN ($1, $2, $3)',
            ['active', 'in_progress', 'pending']
        );

        // Then run our filtered query
        const { rows } = await pool.query(
            `SELECT * FROM quests 
             WHERE status IN ('active', 'in_progress', 'pending')
             AND assignedto::jsonb ? $1`,
            [seekerId]
        );
        
        const parsedQuests = rows.map(quest => ({
            ...quest,
            assignedTo: quest.assignedto ? JSON.parse(quest.assignedto) : []
        }));
        
        // Return diagnostic info along with the quests
        res.json({
            diagnostics: {
                seekerId,
                totalActiveQuests: allQuests.length,
                allActiveQuestsAssignedTo: allQuests.map(q => ({ 
                    id: q.id, 
                    title: q.title,
                    assignedto: q.assignedto 
                })),
                matchingQuests: rows.length,
            },
            quests: parsedQuests
        });
    } catch (err) {
        res.status(500).json({ 
            error: err instanceof Error ? err.message : 'Unknown error',
            seekerId,
            diagnostic: 'Error occurred while fetching quests'
        });
    }
});

interface RequestParams {
    id: string;
}

interface RequestBody {
    seekerId: string;
}

type RequestHandler = (req: express.Request<RequestParams, any, RequestBody>, res: express.Response) => Promise<any>;

// Use these types for all route handlers
app.post('/api/quests/:id/complete', 
    (async (req, res) => {
    const questId = req.params.id;
    const { seekerId } = req.body;
    const now = new Date().toISOString();
    
    try {
        // First get the quest to verify the seeker
        const { rows: [quest] } = await pool.query(
            'SELECT * FROM quests WHERE id = $1',
            [questId]
        );

        // Verify this seeker is assigned to this quest
        if (quest.assignedto !== seekerId) {
            return res.status(400).json({ error: 'Seeker not assigned to this quest' });
        }

        const { rows } = await pool.query(
            'UPDATE quests SET status = $1, completedat = $2, completedby = $3 WHERE id = $4 RETURNING *',
            ['pending', now, seekerId, questId]
        );
        
        res.json({ 
            status: 'pending',
            completedAt: now,
            completedBy: seekerId
        });
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
}) as RequestHandler);

// Seeker quest management endpoints
app.post('/api/quests/:id/start', async (req, res) => {
    const questId = req.params.id;
    const { seekerId } = req.body;
    const now = new Date().toISOString();
    
    try {
        const { rows } = await pool.query(
            'UPDATE quests SET status = $1, startedat = $2 WHERE id = $3 RETURNING *',
            ['in_progress', now, questId]
        );
        
        res.json({ 
            status: 'in_progress',
            startedAt: now 
        });
    } catch (err) {
        console.error('Error starting quest:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

app.post('/api/quests/:id/complete-request', async (req, res) => {
    const questId = req.params.id;
    const { seekerId } = req.body;
    const completionId = crypto.randomUUID();
    const now = new Date().toISOString();

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if quest is already completed
        const { rows } = await client.query(
            'SELECT * FROM quest_completions WHERE questid = $1 AND seekerid = $2',
            [questId, seekerId]
        );

        if (rows.length > 0) {
            throw new Error('Quest completion already submitted');
        }

        await client.query(
            'INSERT INTO quest_completions (id, questid, seekerid, status, completedat) VALUES ($1, $2, $3, $4, $5)',
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
        res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
        client.release();
    }
});

app.post('/api/quests/:id/reject', async (req, res) => {
    try {
        await pool.query(
            'UPDATE quests SET status = $1, completedat = NULL WHERE id = $2',
            ['in_progress', req.params.id]
        );
        res.json({ 
            status: 'in_progress',
            message: 'Quest completion rejected'
        });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

app.post('/api/quests/:id/assign', async (req, res) => {
    const questId = req.params.id;
    const { seekerId } = req.body;
    
    try {
        const { rows } = await pool.query(
            'UPDATE quests SET assignedto = $1 WHERE id = $2 RETURNING *',
            [seekerId, questId]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
    }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    process.stdout.write(`Error: ${err.message}\n${err.stack}\n`);
    res.status(500).json({ error: err.message });
});

// Serve React app for any other routes - this should be last!
app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist/index.html'));
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
