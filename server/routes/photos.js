import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = path.join(__dirname, '..', 'photos');

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);
const MEDIUM_DIR = path.join(PHOTOS_DIR, 'medium');

async function listImages(dir) {
  const files = await fs.readdir(dir);
  return files.filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase())).sort();
}

// Public: list photo filenames. In production only the medium/ + thumbs/ dirs
// are deployed (originals are too big), so the medium dir is the canonical set.
// Locally, fall back to the top-level originals if medium hasn't been built yet.
router.get('/', async (_req, res) => {
  try {
    let images = [];
    try {
      images = await listImages(MEDIUM_DIR);
    } catch {
      images = [];
    }
    if (images.length === 0) images = await listImages(PHOTOS_DIR);
    res.json(images);
  } catch {
    res.json([]);
  }
});

export default router;
