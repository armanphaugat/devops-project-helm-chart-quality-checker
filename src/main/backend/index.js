import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import { Queue } from 'bullmq';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB
await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/helmchecker');
console.log('✅ MongoDB connected');

// Redis
export const redisClient = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
console.log('✅ Redis connected');

// BullMQ Queue
export const scanQueue = new Queue('helm-scans', {
  connection: { host: 'redis', port: 6379 }
});

// Start worker in background
import('./workers/scanWorker.js');

// Routes
const { default: authRoutes }   = await import('./routes/auth.js');
const { default: scanRoutes }   = await import('./routes/scan.js');
const { default: reportRoutes } = await import('./routes/reports.js');

app.use('/api/auth',    authRoutes);
app.use('/api/scan',    scanRoutes);
app.use('/api/reports', reportRoutes);
app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(process.env.PORT || 8080, () =>
  console.log(`🚀 Backend running on port ${process.env.PORT || 8080}`)
);