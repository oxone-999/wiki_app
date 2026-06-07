import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/birthday_wiki';
  try {
    await mongoose.connect(uri);
    console.log('[db] connected to MongoDB');
  } catch (err) {
    console.error('[db] connection error:', err.message);
    // We assume a connection exists per project requirements; keep the
    // server up so static + non-DB routes still work during local dev.
  }
}
