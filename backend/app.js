const express = require('express');
const cors = require('cors');
require('dotenv').config();

const animeRoutes = require('./routes/anime');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const aiRoutes = require('./routes/ai');

const app = express();

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const extraOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (defaultOrigins.includes(origin)) return true;
  if (extraOrigins.includes(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    if (hostname.endsWith('.netlify.app')) return true;
  } catch {
    /* ignore */
  }
  return false;
}

if (process.env.CORS_ALLOW_ALL === '1' || process.env.CORS_ALLOW_ALL === 'true') {
  app.use(cors({ origin: true, credentials: true }));
} else {
  app.use(cors({ origin: isAllowedOrigin, credentials: true }));
}
app.use(express.json());

app.use('/api/anime', animeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
