import mongoose from 'mongoose';

const topicPerformanceSchema = new mongoose.Schema({
  topic: { type: String, required: true, trim: true, maxlength: 100 },
  total: { type: Number, required: true, min: 0 },
  correct: { type: Number, required: true, min: 0 },
  incorrect: { type: Number, required: true, min: 0 },
  unattempted: { type: Number, required: true, min: 0 },
  score: { type: Number, required: true },
  accuracy: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

/** Stores aggregate results only. Question text, options, answers and explanations are never persisted. */
const mockHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  examType: { type: String, required: true },
  totalQuestions: { type: Number, required: true },
  attempted: { type: Number, required: true },
  correct: { type: Number, required: true },
  incorrect: { type: Number, required: true },
  unattempted: { type: Number, required: true },
  score: { type: Number, required: true },
  maximumMarks: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  timeTaken: { type: Number, required: true },
  autoSubmitted: { type: Boolean, default: false },
  completedAt: { type: Date, required: true },
  topicPerformance: { type: [topicPerformanceSchema], default: [] },
}, { timestamps: true });

mockHistorySchema.index({ userId: 1, completedAt: -1 });

const MockHistory = mongoose.model('MockHistory', mockHistorySchema);
export default MockHistory;
