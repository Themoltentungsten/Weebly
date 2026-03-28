/**
 * Pull metadata & art from AniList (GraphQL) into PostgreSQL.
 * College project: run after seed — `npm run enrich:anilist`
 *
 * Options:
 *   --force     Re-fetch every row (not only missing anilist_id)
 *   --desc      Overwrite description when AniList has text
 *   --delay=ms  Pause between API calls (default 1300; be kind to the API)
 */
require('dotenv').config();
const pool = require('../db');
const { searchAnime } = require('../services/anilist');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const UPDATE_DESC = args.includes('--desc');
const delayArg = args.find((a) => a.startsWith('--delay='));
const DELAY_MS = delayArg ? Math.max(500, parseInt(delayArg.split('=')[1], 10) || 1300) : 1300;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function enrichRow(row) {
  const data = await searchAnime(row.title);
  if (!data) {
    console.warn('  no match:', row.title);
    return false;
  }

  const desc = UPDATE_DESC && data.description
    ? data.description
    : row.description;

  await pool.query(
    `UPDATE anime SET
      anilist_id = COALESCE($1::int, anime.anilist_id),
      banner = COALESCE($2, anime.banner),
      anilist_status = COALESCE($3, anime.anilist_status),
      episodes = COALESCE($4, anime.episodes),
      anilist_format = COALESCE($5, anime.anilist_format),
      mean_score = COALESCE($6, anime.mean_score),
      anilist_tags = COALESCE($7::text[], anime.anilist_tags),
      poster = COALESCE($8, anime.poster),
      description = $9
    WHERE id = $10`,
    [
      data.anilistId,
      data.banner,
      data.anilistStatus,
      data.episodes,
      data.anilistFormat,
      data.meanScore,
      data.anilistTags.length ? data.anilistTags : null,
      data.poster,
      desc,
      row.id,
    ],
  );
  return true;
}

async function main() {
  const where = FORCE ? 'TRUE' : 'anilist_id IS NULL';
  const { rows } = await pool.query(
    `SELECT id, title, description FROM anime WHERE ${where} ORDER BY id`,
  );
  console.log(`Enriching ${rows.length} row(s) from AniList (delay ${DELAY_MS}ms)…\n`);

  let ok = 0;
  for (const row of rows) {
    process.stdout.write(`${row.id}. ${row.title.slice(0, 50)}… `);
    try {
      const done = await enrichRow(row);
      if (done) {
        ok += 1;
        console.log('ok');
      } else console.log('skip');
    } catch (e) {
      console.log('ERR', e.message);
    }
    await sleep(DELAY_MS);
  }
  console.log(`\nDone: ${ok}/${rows.length} updated.`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
