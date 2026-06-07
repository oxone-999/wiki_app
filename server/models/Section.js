import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    order: { type: Number, default: 0 },
    // Body is markdown-ish / plain text with simple line breaks.
    body: { type: String, default: '' },
    // Filenames that live in server/photos/, rendered as polaroids.
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Section', sectionSchema);
