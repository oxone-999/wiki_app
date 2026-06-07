import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import Section from './models/Section.js';
import Admin from './models/Admin.js';

// Placeholder, third-person bio sections. Edit freely from the /admin UI.
const PLACEHOLDER_SECTIONS = [
  {
    title: 'Early Life',
    order: 0,
    body:
      'She was born on a day the world quietly got brighter. ' +
      '[Add the story of where she grew up, her family, and the little moments that shaped her.]',
  },
  {
    title: 'Interests',
    order: 1,
    body:
      'She is endlessly curious. ' +
      '[List the things she loves to do — her hobbies, the books, the music, the places she dreams of.]',
  },
  {
    title: 'Characteristics',
    order: 2,
    body:
      'Those who know her describe her as warm, sharp, and impossible to forget. ' +
      '[Describe her personality, the way she laughs, the way she lights up a room.]',
  },
  {
    title: 'Likes',
    order: 3,
    body:
      'She has a soft spot for the small, beautiful things. ' +
      '[Add her favorite foods, colors, flowers, songs, and everything that makes her smile.]',
  },
  {
    title: 'Journey',
    order: 4,
    body:
      'Her story is still being written, and every chapter so far has been remarkable. ' +
      '[Add milestones, achievements, and the road she has travelled.]',
  },
];

// Idempotent: upserts the admin and adds placeholder sections only if empty.
// Reused both by `npm run seed` (CLI) and automatically on server boot, so a
// fresh Render deploy is usable immediately without a manual seed step.
export async function ensureSeed() {
  const username = process.env.ADMIN_USERNAME || 'owner';
  const password = process.env.ADMIN_PASSWORD || 'change_me';
  const passwordHash = await bcrypt.hash(password, 10);
  await Admin.findOneAndUpdate(
    { username },
    { username, passwordHash },
    { upsert: true, new: true }
  );
  console.log(`[seed] admin ready: ${username}`);

  const count = await Section.countDocuments();
  if (count === 0) {
    for (const s of PLACEHOLDER_SECTIONS) {
      const slug = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await Section.create({ ...s, slug });
    }
    console.log(`[seed] created ${PLACEHOLDER_SECTIONS.length} placeholder sections`);
  } else {
    console.log(`[seed] ${count} sections already exist — skipping`);
  }
}

// CLI entry: `npm run seed`
const isCli = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isCli) {
  connectDB()
    .then(ensureSeed)
    .then(() => mongoose.disconnect())
    .then(() => {
      console.log('[seed] done');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[seed] error:', err);
      process.exit(1);
    });
}
