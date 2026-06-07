// One-time thumbnail generator for the 3D photo gallery.
// Uses ffmpeg (already required for heic conversion). Run: `npm run thumbs`.
// For each photo it writes a small (~320px) jpg with a white polaroid border
// baked in, into server/photos/thumbs/. Idempotent: skips thumbs that exist.

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = path.join(__dirname, 'photos');
const THUMBS_DIR = path.join(PHOTOS_DIR, 'thumbs');

const SRC_EXT = new Set(['.jpg', '.jpeg', '.png']);
const MAX = 320; // longest side, px

// scale longest side to MAX (never upscale) then pad a white polaroid border.
const VF =
  `scale='min(${MAX},iw)':'min(${MAX},ih)':force_original_aspect_ratio=decrease,` +
  `pad=ceil(iw*1.12/2)*2:ceil(ih*1.22/2)*2:(ow-iw)/2:(oh-iw)/2:white`;

function ffmpegThumb(src, dest) {
  return new Promise((resolve) => {
    const p = spawn(
      'ffmpeg',
      ['-y', '-loglevel', 'error', '-i', src, '-vf', VF, '-frames:v', '1', '-update', '1', '-q:v', '4', dest],
      { stdio: 'ignore' }
    );
    p.on('close', (code) => resolve(code === 0));
    p.on('error', () => resolve(false));
  });
}

async function run() {
  await fs.mkdir(THUMBS_DIR, { recursive: true });
  const files = await fs.readdir(PHOTOS_DIR);
  const photos = files.filter((f) => SRC_EXT.has(path.extname(f).toLowerCase()));

  let made = 0;
  let skipped = 0;
  let failed = 0;

  // Limited concurrency so we don't spawn 500 ffmpeg processes at once.
  const CONC = 6;
  let idx = 0;

  async function worker() {
    while (idx < photos.length) {
      const f = photos[idx++];
      const dest = path.join(THUMBS_DIR, `${path.parse(f).name}.jpg`);
      try {
        await fs.access(dest);
        skipped++;
        continue;
      } catch {
        /* needs generating */
      }
      const ok = await ffmpegThumb(path.join(PHOTOS_DIR, f), dest);
      if (ok) made++;
      else {
        failed++;
        console.error('FAIL:', f);
      }
      if ((made + skipped + failed) % 25 === 0) {
        console.log(`  ...${made + skipped + failed}/${photos.length}`);
      }
    }
  }

  console.log(`[thumbs] ${photos.length} source photos -> ${THUMBS_DIR}`);
  await Promise.all(Array.from({ length: CONC }, worker));
  console.log(`[thumbs] done. created=${made} skipped=${skipped} failed=${failed}`);
}

run().catch((e) => {
  console.error('[thumbs] error:', e);
  process.exit(1);
});
