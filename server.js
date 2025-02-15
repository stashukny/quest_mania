import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('dist'));  // Serve the Vite build output

// Initialize SQLite database
const db = new sqlite3.Database('database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Database connected');
    // Create tables if they don't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS seekers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS quests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT
      )
    `);
    // Add other tables as needed
  }
});

// Get all data
app.get('/api/state', (req, res) => {
  const state = {};
  
  // Get all seekers
  db.all('SELECT * FROM seekers', [], (err, seekers) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    state.seekers = seekers;
    
    // Get all quests
    db.all('SELECT * FROM quests', [], (err, quests) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      state.quests = quests;
      
      // Add other data as needed
      state.suggestions = [];
      state.redemptions = [];
      state.prizes = [];
      
      res.json(state);
    });
  });
});

// Update state
app.post('/api/state', (req, res) => {
  const newState = req.body;
  
  // Clear and insert new seekers
  db.run('DELETE FROM seekers', [], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const stmt = db.prepare('INSERT INTO seekers (name) VALUES (?)');
    newState.seekers.forEach(seeker => {
      stmt.run(seeker);
    });
    stmt.finalize();
    
    // Handle other tables similarly
    
    res.json({ success: true });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Clean up on exit
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});