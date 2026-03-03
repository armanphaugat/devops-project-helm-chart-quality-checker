import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from 'ioredis';
import { Queue } from 'bullmq';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/helmchecker');
console.log('✅ MongoDB connected');

// Redis connection (same pattern as stock trading project)
export const redisClient = new (await import('ioredis')).default(
  process.env.REDIS_URL || 'redis://redis:6379'
);

// BullMQ scan queue
export const scanQueue = new Queue('helm-scans', {
  connection: { host: 'redis', port: 6379 }
});

// Routes
const { default: authRoutes } = await import('./routes/auth.js');
const { default: scanRoutes } = await import('./routes/scan.js');
const { default: reportRoutes } = await import('./routes/reports.js');

app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/reports', reportRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(8080, () => console.log('🚀 Backend running on port 8080'));