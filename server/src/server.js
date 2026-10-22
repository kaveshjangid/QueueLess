import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import { configureSocket } from './socket.js';

const port = Number(process.env.PORT || 5000);
const mongoUri = process.env.MONGODB_URI;

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and configure it.');
  process.exit(1);
}
if (!mongoUri) {
  console.error('MONGODB_URI is missing. Copy .env.example to .env and configure it.');
  process.exit(1);
}

try {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
  const server = http.createServer(app);
  configureSocket(server);
  server.listen(port, () => console.log(`QueueLess API listening on http://localhost:${port}`));
} catch (error) {
  console.error('Could not start QueueLess:', error.message);
  process.exit(1);
}
