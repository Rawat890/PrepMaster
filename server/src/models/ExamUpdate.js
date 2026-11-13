import mongoose from 'mongoose';

const examUpdateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  examName: { type: String, required: true, trim: true, maxlength: 80 },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, enum: ['Notification', 'Application', 'Admit Card', 'Exam Date', 'Answer Key', 'Result', 'Other'], default: 'Other' },
  details: { type: String, trim: true, maxlength: 2000, default: '' },
  sourceUrl: { type: String, trim: true, maxlength: 500, default: '' },
  importantDate: { type: Date, default: null },
  status: { type: String, enum: ['Upcoming', 'In Progress', 'Completed', 'Archived'], default: 'Upcoming' },
}, { timestamps: true });

examUpdateSchema.index({ userId: 1, importantDate: 1 });
export default mongoose.model('ExamUpdate', examUpdateSchema);
