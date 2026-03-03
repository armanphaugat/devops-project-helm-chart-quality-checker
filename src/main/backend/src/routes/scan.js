import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', authMiddleware, upload.single('chart'), async (req, res) => {
  try {
    const { scanQueue, redisClient } = await import('../index.js');

    const cacheKey = `scan:${req.file.originalname}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json({ source: 'cache', result: JSON.parse(cached) });

    const job = await scanQueue.add('scan-chart', {
      userId: req.user.id,
      fileBuffer: req.file.buffer.toString('base64'),
      filename: req.file.originalname
    });

    res.json({ jobId: job.id, status: 'queued' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/status/:jobId', authMiddleware, async (req, res) => {
  try {
    const { scanQueue } = await import('../index.js');
    const job = await scanQueue.getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const state = await job.getState();
    res.json({ jobId: req.params.jobId, state, result: job.returnvalue || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;