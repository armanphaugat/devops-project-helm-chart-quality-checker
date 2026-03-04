import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
import './src/lib/connections.js';

const app = express();
app.use(cors());
app.use(express.json());

await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/helmchecker');
console.log('MongoDB connected');

import('./src/workers/scanWorker.js');

const { default: authRoutes }   = await import('./src/routes/auth.js');
const { default: scanRoutes }   = await import('./src/routes/scan.js');
const { default: reportRoutes } = await import('./src/routes/reports.js');

app.use('/api/auth',    authRoutes);
app.use('/api/scan',    scanRoutes);
app.use('/api/reports', reportRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('Backend running on port', PORT));