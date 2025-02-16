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
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api' // keep /api in the path when forwarding to FastAPI
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).json({ error: 'Proxy Error', details: err.message });
  }
}));

// In production, serve static files from the React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // In development, proxy all other requests to the Vite dev server
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:5173', // or whatever port Vite is running on
    changeOrigin: true,
    ws: true, // needed for WebSocket support
  }));
}

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
});