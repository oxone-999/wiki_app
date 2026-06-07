// Generates medium-size (~1400px) web versions of every photo so the site can
// be deployed without the 800MB+ of originals. Used by the wiki polaroids, the
// gate portrait, and the gallery click-to-open view. Run: `npm run medium`.
// Idempotent: skips files whose medium already exists.

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = path.join(__dirname, 'photos');
const MEDIUM_DIR = path.join(PHOTOS_DIR, 'medium');

const SRC_EXT = new Set(['.jpg', '.jpeg', '.png']);
const MAX = 1400; // longest side, px

const VF = `scale='min(${MAX},iw)':'min(${MAX},ih)':force_original_aspect_ratio=decrease`;

function ffmpegMedium(src, dest) {
  return new Promise((resolve) => {
    const p = spawn(
      'ffmpeg',
      ['-y', '-loglevel', 'error', '-i', src, '-vf', VF, '-frames:v', '1', '-update', '1', '-q:v', '3', dest],
      { stdio: 'ignore' }
    );
    p.on('close', (code) => resolve(code === 0));
    p.on('error', () => resolve(false));
  });
}

async function run() {
  await fs.mkdir(MEDIUM_DIR, { recursive: true });
  const files = await fs.readdir(PHOTOS_DIR);
  const photos = files.filter((f) => SRC_EXT.has(path.extname(f).toLowerCase()));

  let made = 0;
  let skipped = 0;
  let failed = 0;
  const CONC = 6;
  let idx = 0;

  async function worker() {
    while (idx < photos.length) {
      const f = photos[idx++];
      const dest = path.join(MEDIUM_DIR, `${path.parse(f).name}.jpg`);
      try {
        await fs.access(dest);
        skipped++;
        continue;
      } catch {
        /* needs generating */
      }
      const ok = await ffmpegMedium(path.join(PHOTOS_DIR, f), dest);
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

  console.log(`[medium] ${photos.length} source photos -> ${MEDIUM_DIR}`);
  await Promise.all(Array.from({ length: CONC }, worker));
  console.log(`[medium] done. created=${made} skipped=${skipped} failed=${failed}`);
}

run().catch((e) => {
  console.error('[medium] error:', e);
  process.exit(1);
});
