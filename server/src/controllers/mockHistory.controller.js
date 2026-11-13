import mongoose from 'mongoose';
import MockHistory from '../models/MockHistory.js';
import { buildStudyInsights } from '../utils/studyInsights.js';

const toSummary = (record) => ({
  testId: record.testId,
  subject: record.subject,
  examType: record.examType,
  totalQuestions: record.totalQuestions,
  attempted: record.attempted,
  correct: record.correct,
  incorrect: record.incorrect,
  unattempted: record.unattempted,
  score: record.score,
  maximumMarks: record.maximumMarks,
  accuracy: record.accuracy,
  timeTaken: record.timeTaken,
  autoSubmitted: record.autoSubmitted,
  completedAt: record.completedAt,
  topicPerformance: record.topicPerformance,
});

/** Return the signed-in user's paginated completed-test history. */
export const getMockHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const filter = { userId: req.user._id };
    const [records, total] = await Promise.all([
      MockHistory.find(filter).sort({ completedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      MockHistory.countDocuments(filter),
    ]);
    return res.status(200).json({
      success: true,
      data: { items: records.map(toSummary), page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) { return next(error); }
};

/** Return one summary only when it belongs to the signed-in user. */
export const getMockHistoryItem = async (req, res, next) => {
  try {
    const record = await MockHistory.findOne({ testId: req.params.testId, userId: req.user._id }).lean();
    if (!record) return res.status(404).json({ success: false, message: 'Completed test history was not found.' });
    return res.status(200).json({ success: true, data: toSummary(record) });
  } catch (error) { return next(error); }
};

/** Aggregate lifetime and subject-level progress without loading question content. */
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const [overall, subjects, recent, activityRecords] = await Promise.all([
      MockHistory.aggregate([
        { $match: { userId } },
        { $group: {
          _id: null,
          totalTests: { $sum: 1 },
          totalQuestions: { $sum: '$totalQuestions' },
          totalCorrect: { $sum: '$correct' },
          totalAttempted: { $sum: '$attempted' },
          averageAccuracy: { $avg: '$accuracy' },
          bestScore: { $max: '$score' },
          totalTimeTaken: { $sum: '$timeTaken' },
        } },
      ]),
      MockHistory.aggregate([
        { $match: { userId } },
        { $group: {
          _id: '$subject',
          tests: { $sum: 1 },
          questions: { $sum: '$totalQuestions' },
          correct: { $sum: '$correct' },
          attempted: { $sum: '$attempted' },
          averageAccuracy: { $avg: '$accuracy' },
          bestScore: { $max: '$score' },
        } },
        { $sort: { tests: -1, _id: 1 } },
      ]),
      MockHistory.find({ userId }).sort({ completedAt: -1 }).limit(5).lean(),
      MockHistory.find({ userId }).select('attempted completedAt topicPerformance').lean(),
    ]);
    const studyInsights = buildStudyInsights(activityRecords);

    const totals = overall[0] || {
      totalTests: 0, totalQuestions: 0, totalCorrect: 0, totalAttempted: 0,
      averageAccuracy: 0, bestScore: 0, totalTimeTaken: 0,
    };
    return res.status(200).json({
      success: true,
      data: {
        overview: {
          ...totals,
          averageAccuracy: Number((totals.averageAccuracy || 0).toFixed(2)),
          overallAccuracy: totals.totalAttempted
            ? Number(((totals.totalCorrect / totals.totalAttempted) * 100).toFixed(2)) : 0,
          totalTimeTaken: totals.totalTimeTaken || 0,
        },
        subjects: subjects.map((item) => ({
          subject: item._id,
          tests: item.tests,
          questions: item.questions,
          correct: item.correct,
          attempted: item.attempted,
          averageAccuracy: Number((item.averageAccuracy || 0).toFixed(2)),
          bestScore: item.bestScore,
        })),
        recent: recent.map(toSummary),
        studyInsights,
      },
    });
  } catch (error) { return next(error); }
};
