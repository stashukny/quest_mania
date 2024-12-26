import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(__dirname, 'quest.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

export function initializeDatabase(): Database {
    const db = new sqlite3.Database(dbPath);
    
    // Check if database needs to be initialized
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='seekers'", (err, row) => {
        if (err) {
            console.error(err);
            return;
        }
        
        if (!row) {
            const schema = fs.readFileSync(schemaPath, 'utf8');
            db.exec(schema, (err) => {
                if (err) {
                    console.error('Error initializing database:', err);
                } else {
                    console.log('Database initialized successfully');
                }
            });
        }
    });

    return db;
}

export const db = initializeDatabase();