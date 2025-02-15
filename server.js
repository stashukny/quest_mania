import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting Express server...');
console.log('__dirname:', __dirname);
console.log('Looking for dist in:', path.join(__dirname, 'dist'));

const app = express();
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));
console.log('Set up static file serving');

// The "catchall" handler
app.get('*', (req, res) => {
  console.log('Received request for:', req.url);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});