import { Worker } from 'bullmq';
import axios from 'axios';
import FormData from 'form-data';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Redis from 'ioredis';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/helmchecker');

const redisClient = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

const { default: ScanReport } = await import('../models/ScanReport.js');

const worker = new Worker('helm-scans', async (job) => {
  const { fileBuffer, filename, userId } = job.data;

  const form = new FormData();
  form.append('file', Buffer.from(fileBuffer, 'base64'), filename);

  const { data } = await axios.post(
    `${process.env.LINTER_URL || 'http://linter:8000'}/lint`,
    form, { headers: form.getHeaders() }
  );

  await ScanReport.create({
    userId, chartName: data.chart_name, kind: data.kind,
    score: data.summary.score, grade: data.summary.grade, issues: data.issues
  });

  await redisClient.setex(`scan:${filename}`, 3600, JSON.stringify(data));
  return data;
}, { connection: { host: process.env.REDIS_HOST || 'redis', port: 6379 } });

worker.on('completed', job => console.log(`✅ Job ${job.id} done`));
worker.on('failed', (job, err) => console.error(`❌ Job ${job.id} failed:`, err.message));