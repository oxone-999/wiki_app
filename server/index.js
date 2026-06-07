import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { ensureSeed } from './seed.js';
import authRoutes from './routes/auth.js';
import sectionRoutes from './routes/sections.js';
import wishRoutes from './routes/wishes.js';
import photoRoutes from './routes/photos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Allow the Netlify frontend (and local dev). Set CLIENT_ORIGIN on Render to
// your Netlify URL; comma-separate multiple origins if needed.
const allowed = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(
  cors({
    origin: allowed.length ? allowed : true,
  })
);
app.use(express.json());

// Static photos dropped into server/photos/ are served at /photos/<file>.
app.use('/photos', express.static(path.join(__dirname, 'photos')));

app.use('/api/auth', authRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/wishes', wishRoutes);
app.use('/api/photos', photoRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => ensureSeed().catch((e) => console.error('[seed] boot error:', e.message)))
  .finally(() => {
    app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
  });
