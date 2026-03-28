/**
 * Adds AniList enrichment columns (nullable). Safe to run multiple times.
 * Run after deploy: node migrate_anilist_columns.js
 */
const pool = require('./db');
require('dotenv').config();

const alters = [
  'ALTER TABLE anime ADD COLUMN IF NOT EXISTS anilist_id INTEGER',
  'ALTER TABLE anime ADD COLUMN IF NOT EXISTS banner TEXT',
  'ALTER TABLE anime ADD COLUMN IF NOT EXISTS anilist_status VARCHAR(50)',
  'ALTER TABLE anime ADD COLUMN IF NOT EXISTS episodes INTEGER',
  'ALTER TABLE anime ADD COLUMN IF NOT EXISTS anilist_format VARCHAR(50)',
  'ALTER TABLE anime ADD COLUMN IF NOT EXISTS mean_score INTEGER',
  'ALTER TABLE anime ADD COLUMN IF NOT EXISTS anilist_tags TEXT[]',
];

async function migrate() {
  const c = await pool.connect();
  try {
    for (const sql of alters) {
      await c.query(sql);
    }
    await c.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS anime_anilist_id_key ON anime (anilist_id) WHERE anilist_id IS NOT NULL`,
    );
    console.log('Migration anilist columns: OK');
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    c.release();
    await pool.end();
  }
}

migrate();
