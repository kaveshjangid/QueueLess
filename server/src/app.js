import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import serviceRoutes from './routes/services.js';
import queueRoutes from './routes/queue.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'QueueLess API' }));
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }));

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid identifier.' });
  res.status(500).json({ message: 'Unexpected server error.' });
});

export default app;
