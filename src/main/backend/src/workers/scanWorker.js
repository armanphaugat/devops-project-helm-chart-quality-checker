import { Worker } from 'bullmq';
import axios from 'axios';
import FormData from 'form-data';
import ScanReport from '../models/ScanReport.js';
import { redisClient } from '../index.js';

const worker = new Worker('helm-scans', async (job) => {
  const { fileBuffer, filename, userId } = job.data;

  // Prepare file and call Python linter service
  const form = new FormData();
  form.append('file', Buffer.from(fileBuffer, 'base64'), filename);

  const { data } = await axios.post(
    `${process.env.LINTER_URL || 'http://linter:8000'}/lint`,
    form,
    { headers: form.getHeaders() }
  );

  // Persist result to MongoDB
  await ScanReport.create({
    userId,
    chartName: data.chart_name,
    kind: data.kind,
    score: data.summary.score,
    grade: data.summary.grade,
    issues: data.issues
  });

  // Cache in Redis for 1 hour so repeated scans of same file are instant
  await redisClient.setex(`scan:${filename}`, 3600, JSON.stringify(data));

  return data;
}, {
  connection: { host: 'redis', port: 6379 }
});

worker.on('completed', (job) => console.log(`✅ Scan job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`❌ Job ${job.id} failed:`, err.message));