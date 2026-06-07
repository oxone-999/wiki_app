import { Router } from 'express';
import Wish from '../models/Wish.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// Public: make a wish (saved to the wishes collection in the DB).
router.post('/', async (req, res) => {
  let { messages } = req.body || {};
  if (typeof messages === 'string') messages = [messages];
  messages = (messages || [])
    .map((m) => String(m).trim())
    .filter(Boolean)
    .slice(0, 20);

  if (messages.length === 0) {
    return res.status(400).json({ error: 'at least one wish required' });
  }

  const userAgent = req.headers['user-agent'] || '';
  await Wish.create({ messages, userAgent });

  // Always reassure the wisher — this is the surprise.
  res.status(201).json({ ok: true });
});

// Admin: read received wishes.
router.get('/', requireAdmin, async (_req, res) => {
  const wishes = await Wish.find().sort({ createdAt: -1 });
  res.json(wishes);
});

export default router;
