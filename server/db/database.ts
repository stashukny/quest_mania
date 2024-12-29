import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'dist/server/db/questmania.db');
const schemaPath = path.join(process.cwd(), 'dist/server/db/schema.sql');

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Initialize database with schema
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema, (err) => {
    if (err) {
        console.error('Error initializing database:', err);
    } else {
        console.log('Database initialized successfully');
    }
});

export { db };