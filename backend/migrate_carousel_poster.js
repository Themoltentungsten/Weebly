/**
 * Adds carousel_poster for wide/hero art (nullable). Safe to run multiple times.
 */
const pool = require('./db');
require('dotenv').config();

const defaults = [
  ['Demon Slayer: Infinity Castle Arc', 'https://4kwallpapers.com/images/walls/thumbs_3t/23615.jpg'],
  ['Dandadan', 'https://4kwallpapers.com/images/walls/thumbs_3t/23797.jpg'],
  ['Dandadan Season 2', 'https://4kwallpapers.com/images/walls/thumbs_3t/23797.jpg'],
  ['Jujutsu Kaisen: The Culling Game', 'https://4kwallpapers.com/images/walls/thumbs_3t/25001.jpg'],
  ['Chainsaw Man: The Movie - Reze Arc', 'https://4kwallpapers.com/images/walls/thumbs_3t/22996.jpg'],
];

async function migrate() {
  const c = await pool.connect();
  try {
    await c.query('ALTER TABLE anime ADD COLUMN IF NOT EXISTS carousel_poster TEXT');
    for (const [title, url] of defaults) {
      await c.query('UPDATE anime SET carousel_poster = $2 WHERE title = $1 AND (carousel_poster IS NULL OR carousel_poster = \'\')', [title, url]);
    }
    console.log('Migration carousel_poster: OK');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    c.release();
    await pool.end();
  }
}

migrate();
