import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { db } from './db/database';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(bodyParser.json());

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
    suggestedBy: string;
    status: string;
    createdAt: string;
    desiredReward: number;
    duration: string;
}

// Seekers routes
app.get('/api/seekers', (req, res) => {
    db.all('SELECT * FROM seekers', [], (err, seekers) => {
        if (err) {
            console.error('Error getting seekers:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log('Retrieved seekers:', seekers);
        res.json(seekers);
    });
});

app.post('/api/seekers', (req, res) => {
    const { id, name, pin, avatarUrl, stars } = req.body;
    db.run(
        'INSERT INTO seekers (id, name, pin, avatarUrl, stars) VALUES (?, ?, ?, ?, ?)',
        [id, name, pin, avatarUrl, stars],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(req.body);
        }
    );    
});

app.delete('/api/seekers/:id', (req, res) => {
    const seekerId = req.params.id;
    db.run(
        'DELETE FROM seekers WHERE id = ?',
        [seekerId],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: `Seeker ${seekerId} deleted successfully` });
        }
    );
});

app.put('/api/seekers/:id', (req, res) => {
    const seekerId = req.params.id;
    const { name, pin, avatarUrl, stars } = req.body;
    
    db.run(
        'UPDATE seekers SET name = ?, pin = ?, avatarUrl = ?, stars = ? WHERE id = ?',
        [name, pin, avatarUrl, stars, seekerId],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ 
                id: seekerId,
                name,
                pin,
                avatarUrl,
                stars
            });
        }
    );
});

// Quests routes
app.get('/api/quests', (req, res) => {
    db.all('SELECT * FROM quests', [], (err, quests) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        // Parse the assigned_to JSON string back to an array
        const parsedQuests = quests.map((quest: any) => ({
            ...quest,
            assigned_to: quest.assigned_to ? JSON.parse(quest.assigned_to) : []
        }));
        res.json(parsedQuests);
    });
});

app.post('/api/quests', (req, res) => {
    const { id, title, description, reward, status, duration, assigned_to } = req.body;
    // Stringify the assigned_to array before saving to database
    const assigned_toJson = JSON.stringify(assigned_to);
    
    db.run(
        'INSERT INTO quests (id, title, description, reward, status, duration, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, title, description, reward, status, duration, assigned_toJson],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                ...req.body,
                assigned_to: assigned_to // Send back the original array
            });
        }
    );
});
app.put('/api/quests/:id', (req, res) => {
    const questId = req.params.id;
    const { title, description, reward, status, duration, assigned_to } = req.body;
    // Stringify the assigned_to array
    const assigned_toJson = JSON.stringify(assigned_to);
    
    db.run(
        'UPDATE quests SET title = ?, description = ?, reward = ?, status = ?, duration = ?, assigned_to = ? WHERE id = ?',
        [title, description, reward, status, duration, assigned_toJson, questId],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                id: questId,
                ...req.body,
                assigned_to: assigned_to
            });
        }
    );
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Quest Suggestions endpoints
app.get('/api/quest-suggestions', (req, res) => {
    db.all('SELECT * FROM quest_suggestions', [], (err, suggestions) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(suggestions);
    });
});

app.post('/api/quest-suggestions', (req, res) => {
    const { title, description, suggestedBy, createdAt, desiredReward, duration } = req.body;
    const id = crypto.randomUUID();
    
    db.run(
        'INSERT INTO quest_suggestions (id, title, description, suggestedBy, status, createdAt, desiredReward, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, title, description, suggestedBy, 'pending', createdAt, desiredReward, duration],
        (err) => {
            if (err) {
                console.error('Error creating quest suggestion:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                id,
                title,
                description,
                suggestedBy,
                status: 'pending',
                createdAt,
                desiredReward,
                duration
            });
        }
    );
});

app.put('/api/quest-suggestions/:id', (req, res) => {
    const suggestionId = req.params.id;
    const { title, description, desiredReward, status, duration } = req.body;
    db.run(
        'UPDATE quest_suggestions SET title = ?, description = ?, desiredReward = ?, status = ?, duration = ? WHERE id = ?',
        [title, description, desiredReward, status, duration, suggestionId],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: suggestionId, ...req.body });
        }
    );
});

app.delete('/api/quest-suggestions/:id', (req, res) => {
    const suggestionId = req.params.id;
    db.run(
        'DELETE FROM quest_suggestions WHERE id = ?',
        [suggestionId],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: `Quest suggestion ${suggestionId} deleted successfully` });
        }
    );
});

// Prize Redemptions endpoints
app.get('/api/prize-redemptions', (req, res) => {
    db.all('SELECT * FROM prize_redemptions', [], (err, redemptions) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(redemptions);
    });
});

app.post('/api/prize-redemptions', (req, res) => {
    const { id, prizeId, seekerId, redeemedAt, certificateId, starsCost } = req.body;
    db.run(
        'INSERT INTO prize_redemptions (id, prizeId, seekerId, redeemedAt, certificateId, starsCost) VALUES (?, ?, ?, ?, ?, ?)',
        [id, prizeId, seekerId, redeemedAt, certificateId, starsCost],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(req.body);
        }
    );
});

// Prizes endpoints
app.get('/api/prizes', (req, res) => {
    db.all('SELECT * FROM prizes WHERE available = 1', [], (err, prizes) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(prizes);
    });
});

app.post('/api/prizes', (req, res) => {
    const { id, name, description, cost, imageUrl } = req.body;
    db.run(
        'INSERT INTO prizes (id, name, description, starsCost, imageUrl, available) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name, description, cost, imageUrl, true],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id, name, description, cost, imageUrl, available: true });
        }
    );
});

app.put('/api/prizes/:id', (req, res) => {
    const prizeId = req.params.id;
    const { name, description, cost, imageUrl, available } = req.body;
    db.run(
        'UPDATE prizes SET name = ?, description = ?, starsCost = ?, imageUrl = ?, available = ? WHERE id = ?',
        [name, description, cost, imageUrl, available, prizeId],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: prizeId, name, description, cost, imageUrl, available });
        }
    );
});

app.delete('/api/prizes/:id', (req, res) => {
    const prizeId = req.params.id;
    
    // First check if there are any redemptions
    db.get(
        'SELECT COUNT(*) as count FROM prize_redemptions WHERE prizeId = ?',
        [prizeId],
        (err, result: { count: number }) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (result.count > 0) {
                res.status(400).json({ error: 'Cannot delete prize with existing redemptions' });
                return;
            }

            // If no redemptions, proceed with deletion
            db.run('DELETE FROM prizes WHERE id = ?', [prizeId], (deleteErr) => {
                if (deleteErr) {
                    res.status(500).json({ error: deleteErr.message });
                    return;
                }
                res.json({ message: 'Prize deleted successfully' });
            });
        }
    );
});

app.delete('/api/quests/:id', (req, res) => {
    const questId = req.params.id;
    db.run(
        'DELETE FROM quests WHERE id = ?',
        [questId],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: `Quest ${questId} deleted successfully` });
        }
    );
});

// PUT endpoint for quests (full update)
app.put('/api/quests/:id', (req, res) => {
    const questId = req.params.id;
    const { title, description, reward, status, duration, assigned_to, isTeamQuest } = req.body;
    
    db.run(
        'UPDATE quests SET title = ?, description = ?, reward = ?, status = ?, duration = ?, assigned_to = ?, isTeamQuest = ? WHERE id = ?',
        [title, description, reward, status, duration, assigned_to, isTeamQuest, questId],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: questId, ...req.body });
        }
    );
});

// Seeker quest management endpoints
app.post('/api/quests/:id/start', (req, res) => {
    const questId = req.params.id;
    const { seekerId } = req.body;
    const now = new Date().toISOString();

    db.run(
        'UPDATE quests SET status = ?, started_at = ? WHERE id = ?',
        ['in_progress', now, questId],
        (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ 
                status: 'in_progress',
                started_at: now 
            });
        }
    );
});

app.post('/api/quests/:id/complete-request', (req, res) => {
    const questId = req.params.id;
    const { seekerId } = req.body;
    const completionId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Check if quest is already completed by this seeker
    db.get(
        'SELECT * FROM quest_completions WHERE questId = ? AND seekerId = ?',
        [questId, seekerId],
        (err, existing) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (existing) {
                res.status(400).json({ error: 'Quest completion already submitted' });
                return;
            }

            db.run(
                'INSERT INTO quest_completions (id, questId, seekerId, status, completed_at) VALUES (?, ?, ?, ?, ?)',
                [completionId, questId, seekerId, 'pending', now],
                (err) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json({ 
                        id: completionId, 
                        status: 'pending', 
                        completed_at: now 
                    });
                }
            );
        }
    );
});

app.get('/api/seekers/:id/quests', (req, res) => {
    const seekerId = req.params.id;
    
    db.all(
        `SELECT q.* FROM quests q 
         WHERE q.status IN ('active', 'in_progress', 'pending')`,
        [],
        (err, quests: DbQuest[]) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const parsedQuests = quests.map(quest => ({
                ...quest,
                assigned_to: JSON.parse(quest.assigned_to || '[]')
            }));
            
            res.json(parsedQuests);
        }
    );
});

app.post('/api/quests/:id/complete', (req, res) => {
    const questId = req.params.id;
    const { seekerId } = req.body;
    const now = new Date().toISOString();
    
    // Update quest status
    db.run(
        'UPDATE quests SET status = ?, completed_at = ? WHERE id = ?',
        ['pending', now, questId],
        (err) => {
            if (err) {
                console.error('Update error:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                status: 'pending',
                completed_at: now 
            });
        }
    );
});

app.get('/api/quests/:id', (req, res) => {
    const questId = req.params.id;

    db.get('SELECT * FROM quests WHERE id = ?', [questId], (err, quest: DbQuest) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!quest) {
            res.status(404).json({ error: 'Quest not found' });
            return;
        }

        // Parse assigned_to field
        quest.assigned_to = JSON.parse(quest.assigned_to || '[]');
        res.json(quest);
    });
});

// Add these endpoints for quest approval/rejection
app.post('/api/quests/:id/approve', (req, res) => {
    const questId = req.params.id;
    const { seekerId } = req.body;
    const now = new Date().toISOString();

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Update quest status to completed
        db.run(
            'UPDATE quests SET status = ?, completed_at = ? WHERE id = ?',
            ['completed', now, questId],
            (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }

                // Update seeker's stars
                db.get('SELECT reward FROM quests WHERE id = ?', [questId], (err, quest: { reward: number }) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }

                    db.run(
                        'UPDATE seekers SET stars = stars + ? WHERE id = ?',
                        [quest.reward, seekerId],
                        (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: err.message });
                            }

                            db.run('COMMIT');
                            res.json({ 
                                status: 'completed',
                                completed_at: now,
                                reward: quest.reward
                            });
                        }
                    );
                });
            }
        );
    });
});

app.post('/api/quests/:id/reject', (req, res) => {
    const questId = req.params.id;
    
    // Set quest back to in_progress status
    db.run(
        'UPDATE quests SET status = ?, completed_at = NULL WHERE id = ?',
        ['in_progress', questId],
        (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                status: 'in_progress',
                message: 'Quest completion rejected'
            });
        }
    );
});

// Update the quest suggestions endpoints
app.post('/api/quest-suggestions/:id/approve', (req, res) => {
    const suggestionId = req.params.id;
    const now = new Date().toISOString();

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Get the suggestion details
        db.get('SELECT * FROM quest_suggestions WHERE id = ?', [suggestionId], (err, suggestion: DbQuestSuggestion) => {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }

            const questId = crypto.randomUUID();
            // Create new quest from suggestion
            db.run(
                'INSERT INTO quests (id, title, description, reward, status, duration, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [questId, suggestion.title, suggestion.description, suggestion.desiredReward, 'active', suggestion.duration, JSON.stringify([suggestion.suggestedBy])],
                (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }

                    // Update suggestion status
                    db.run(
                        'UPDATE quest_suggestions SET status = ? WHERE id = ?',
                        ['approved', suggestionId],
                        (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: err.message });
                            }

                            db.run('COMMIT');
                            res.json({
                                suggestion: { ...suggestion, status: 'approved' },
                                quest: {
                                    id: questId,
                                    title: suggestion.title,
                                    description: suggestion.description,
                                    reward: suggestion.desiredReward,
                                    status: 'active',
                                    duration: suggestion.duration,
                                    assigned_to: [suggestion.suggestedBy]
                                }
                            });
                        }
                    );
                }
            );
        });
    });
});

app.post('/api/quest-suggestions/:id/reject', (req, res) => {
    const suggestionId = req.params.id;
    
    db.run(
        'UPDATE quest_suggestions SET status = ? WHERE id = ?',
        ['rejected', suggestionId],
        (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                id: suggestionId,
                status: 'rejected'
            });
        }
    );
});

app.post('/api/prizes/redeem', (req, res) => {
    const { prizeId, seekerId, starsCost } = req.body;
    const certificateId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Update seeker's stars
        db.run(
            'UPDATE seekers SET stars = stars - ? WHERE id = ? AND stars >= ?',
            [starsCost, seekerId, starsCost],
            (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }

                // Create redemption record
                db.run(
                    'INSERT INTO prize_redemptions (id, prizeId, seekerId, redeemedAt, certificateId, starsCost) VALUES (?, ?, ?, ?, ?, ?)',
                    [crypto.randomUUID(), prizeId, seekerId, now, certificateId, starsCost],
                    (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: err.message });
                        }

                        db.run('COMMIT');
                        res.json({ certificateId });
                    }
                );
            }
        );
    });
});