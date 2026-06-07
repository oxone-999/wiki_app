import mongoose from 'mongoose';

const wishSchema = new mongoose.Schema(
  {
    // Multiple wishes can be made at once. No author field on purpose —
    // it stays "anonymous" so the surprise (private to her) holds up.
    messages: { type: [String], default: [] },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Wish', wishSchema);
