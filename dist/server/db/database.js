"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initializeDatabase = initializeDatabase;
const sqlite3_1 = __importDefault(require("sqlite3"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.resolve(__dirname, 'quest.db');
const schemaPath = path_1.default.resolve(__dirname, 'schema.sql');
function initializeDatabase() {
    const db = new sqlite3_1.default.Database(dbPath);
    // Check if database needs to be initialized
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='seekers'", (err, row) => {
        if (err) {
            console.error(err);
            return;
        }
        if (!row) {
            const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
            db.exec(schema, (err) => {
                if (err) {
                    console.error('Error initializing database:', err);
                }
                else {
                    console.log('Database initialized successfully');
                }
            });
        }
    });
    return db;
}
exports.db = initializeDatabase();
