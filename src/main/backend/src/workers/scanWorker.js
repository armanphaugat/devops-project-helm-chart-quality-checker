import { Worker } from 'bullmq';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
import { redisClient } from '../lib/connections.js';
dotenv.config();

const { default: ScanReport } = await import('../models/ScanReport.js');

const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const LINTER_URL = process.env.LINTER_URL || 'http://linter:8000';

const worker = new Worker('helm-scans', async (job) => {
  const { fileBuffer, filename, userId } = job.data;

  const form = new FormData();
  form.append('file', Buffer.from(fileBuffer, 'base64'), filename);

  const { data } = await axios.post(LINTER_URL + '/lint', form, {
    headers: form.getHeaders(),
    timeout: 30_000,
  });

  await ScanReport.create({
    userId,
    chartName: data.chart_name,
    kind: data.kind,
    score: data.summary.score,
    grade: data.summary.grade,
    issues: data.issues,
  });

  await redisClient.setex('scan:' + filename, 3600, JSON.stringify(data));
  return data;
}, {
  connection: { host: REDIS_HOST, port: REDIS_PORT },
  // ── Retry configuration ──────────────────────────────────────────────────
  defaultJobOptions: {
    attempts: 5,                       // 1 initial attempt + 4 retries
    backoff: {
      type: 'exponential',             // waits 2s → 4s → 8s → 16s
      delay: 2_000,
    },
    removeOnComplete: { count: 100 },  // keep last 100 completed jobs
    removeOnFail: { count: 500 },      // keep last 500 failed jobs for inspection
  },
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed (attempt ${job.attemptsMade})`);
});

worker.on('failed', (job, err) => {
  const attemptsLeft = job.opts.attempts - job.attemptsMade;

  if (attemptsLeft > 0) {
    console.warn(
      `Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}),`,
      `retrying... — ${err.message}`
    );
  } else {
    console.error(
      `Job ${job.id} permanently failed after ${job.attemptsMade} attempts:`,
      err.message
    );
  }
});