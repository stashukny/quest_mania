import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Proxy /api requests to the Python backend
app.use('/api', createProxyMiddleware({ 
  target: 'http://localhost:8000',
  changeOrigin: true
}));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});