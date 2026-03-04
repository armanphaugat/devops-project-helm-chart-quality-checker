// src/lib/connections.js
// Shared Redis client and BullMQ queue.
// Extracted here to break the circular import: index.js <-> scan.js

import Redis from 'ioredis';
import { Queue } from 'bullmq';
import dotenv from 'dotenv';
dotenv.config();

const REDIS_URL  = process.env.REDIS_URL  || 'redis://redis:6379';
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

export const redisClient = new Redis(REDIS_URL);
redisClient.on('connect', () => console.log('Redis connected'));
redisClient.on('error',   (err) => console.error('Redis error:', err.message));

// BullMQ uses host/port, not a URL string
export const scanQueue = new Queue('helm-scans', {
  connection: { host: REDIS_HOST, port: REDIS_PORT }
});