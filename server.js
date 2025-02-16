import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Use environment variable for API URL with fallback
const isProduction = process.env.NODE_ENV === 'production';
const API_URL = isProduction 
  ? `https://${process.env.APP_NAME}.herokuapp.com` 
  : 'http://localhost:8000';

// In development, proxy requests to the Python backend
if (!isProduction) {
  app.use('/api', createProxyMiddleware({ 
    target: 'http://localhost:8000',
    changeOrigin: true,
    pathRewrite: {
      '^/api': '/api'
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log('Proxying request:', req.method, req.url, 'to', API_URL + req.url);
    },
    onError: (err, req, res) => {
      console.error('Proxy Error:', err);
      res.status(500).json({ error: 'Proxy Error', details: err.message });
    }
  }));
}

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Express server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`API URL: ${API_URL}`);
});