const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
  },
  { timestamps: true, _id: true }
);

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    sha256: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

documentSchema.index({ user: 1, sha256: 1 }, { unique: true });
documentSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
