import { Router } from 'express';
import Section from '../models/Section.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

function slugify(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Public: list sections in order.
router.get('/', async (_req, res) => {
  const sections = await Section.find().sort({ order: 1, createdAt: 1 });
  res.json(sections);
});

// Admin: create a section.
router.post('/', requireAdmin, async (req, res) => {
  const { title, body = '', images = [], order } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });

  let slug = slugify(title);
  if (!slug) slug = `section-${Date.now()}`;
  // Ensure unique slug.
  if (await Section.findOne({ slug })) slug = `${slug}-${Date.now()}`;

  const count = await Section.countDocuments();
  const section = await Section.create({
    title,
    slug,
    body,
    images,
    order: typeof order === 'number' ? order : count,
  });
  res.status(201).json(section);
});

// Admin: update a section.
router.put('/:id', requireAdmin, async (req, res) => {
  const { title, body, images, order } = req.body || {};
  const update = {};
  if (title !== undefined) update.title = title;
  if (body !== undefined) update.body = body;
  if (images !== undefined) update.images = images;
  if (order !== undefined) update.order = order;

  const section = await Section.findByIdAndUpdate(req.params.id, update, {
    new: true,
  });
  if (!section) return res.status(404).json({ error: 'not found' });
  res.json(section);
});

// Admin: delete a section.
router.delete('/:id', requireAdmin, async (req, res) => {
  const section = await Section.findByIdAndDelete(req.params.id);
  if (!section) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

export default router;
