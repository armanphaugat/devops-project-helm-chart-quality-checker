import mongoose from 'mongoose';
const issueSchema = new mongoose.Schema({
  severity: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] },
  rule: String,
  message: String,
  fix: String
});
const scanReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chartName: String,
  kind: String,
  score: Number,
  grade: String,
  issues: [issueSchema],
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('ScanReport', scanReportSchema);