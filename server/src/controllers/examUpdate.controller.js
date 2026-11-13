import ExamUpdate from '../models/ExamUpdate.js';

const allowedCategories = ['Notification', 'Application', 'Admit Card', 'Exam Date', 'Answer Key', 'Result', 'Other'];
const allowedStatuses = ['Upcoming', 'In Progress', 'Completed', 'Archived'];
const cleanPayload = (body = {}) => ({
  examName: String(body.examName || '').trim(),
  title: String(body.title || '').trim(),
  category: allowedCategories.includes(body.category) ? body.category : 'Other',
  details: String(body.details || '').trim(),
  sourceUrl: String(body.sourceUrl || '').trim(),
  importantDate: body.importantDate ? new Date(body.importantDate) : null,
  status: allowedStatuses.includes(body.status) ? body.status : 'Upcoming',
});

export const listExamUpdates = async (req, res, next) => {
  try {
    const items = await ExamUpdate.find({ userId: req.user._id }).sort({ importantDate: 1, createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: items });
  } catch (error) { next(error); }
};

export const createExamUpdate = async (req, res, next) => {
  try {
    const payload = cleanPayload(req.body);
    if (!payload.examName || !payload.title) return res.status(400).json({ success: false, message: 'Exam name and update title are required.' });
    if (payload.sourceUrl && !/^https?:\/\//i.test(payload.sourceUrl)) return res.status(400).json({ success: false, message: 'Source URL must start with http:// or https://.' });
    if (payload.importantDate && Number.isNaN(payload.importantDate.getTime())) return res.status(400).json({ success: false, message: 'Please provide a valid important date.' });
    const item = await ExamUpdate.create({ ...payload, userId: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (error) { next(error); }
};

export const updateExamUpdate = async (req, res, next) => {
  try {
    const payload = cleanPayload(req.body);
    if (!payload.examName || !payload.title) return res.status(400).json({ success: false, message: 'Exam name and update title are required.' });
    if (payload.sourceUrl && !/^https?:\/\//i.test(payload.sourceUrl)) return res.status(400).json({ success: false, message: 'Source URL must start with http:// or https://.' });
    if (payload.importantDate && Number.isNaN(payload.importantDate.getTime())) return res.status(400).json({ success: false, message: 'Please provide a valid important date.' });
    const item = await ExamUpdate.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, payload, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Exam update not found.' });
    res.status(200).json({ success: true, data: item });
  } catch (error) { next(error); }
};

export const deleteExamUpdate = async (req, res, next) => {
  try {
    const item = await ExamUpdate.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!item) return res.status(404).json({ success: false, message: 'Exam update not found.' });
    res.status(200).json({ success: true, message: 'Exam update deleted.' });
  } catch (error) { next(error); }
};
