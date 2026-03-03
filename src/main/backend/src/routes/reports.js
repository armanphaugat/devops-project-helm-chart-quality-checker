import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import ScanReport from '../models/ScanReport.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const reports = await ScanReport.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;