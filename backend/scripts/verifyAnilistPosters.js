/**
 * Compare DB poster URLs with AniList cover art.
 * Lookup order: stored anilist_id → id parsed from AniList CDN poster URL → title search (last resort).
 *
 *   node scripts/verifyAnilistPosters.js
 */
require('dotenv').config();
const pool = require('../db');
const { fetchMediaById, searchAnime, anilistIdFromPosterUrl } = require('../services/anilist');

const SLEEP_MS = 1300;

async function fetchByIdWithRetry(id) {
  let meta = await fetchMediaById(id);
  if (meta) return meta;
  await sleep(3000);
  meta = await fetchMediaById(id);
  if (meta) return meta;
  await sleep(5000);
  return fetchMediaById(id);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isAnilistCdn(url) {
  return typeof url === 'string' && url.includes('anilistcdn');
}

/** Same cover file on AniList CDN: path may differ slightly (large vs medium, bx vs b). */
function coverFingerprint(url) {
  if (!url) return null;
  const path = url.split('?')[0].split('/').pop() || '';
  const m = path.match(/^(bx\d+)-/i) || path.match(/^(b\d+)-/i);
  if (!m) {
    const plain = path.match(/^(\d+)\.(jpe?g|png|webp)$/i);
    if (plain) return `id:${plain[1]}`;
    return path.toLowerCase();
  }
  const idPart = m[1].toLowerCase();
  const num = idPart.replace(/^bx?/, '').replace(/^b/, '');
  return num ? `id:${num}` : idPart;
}

function urlsEquivalent(dbUrl, apiUrl) {
  if (!apiUrl) return false;
  if (!dbUrl) return false;
  const a = dbUrl.split('?')[0].trim().toLowerCase();
  const b = apiUrl.split('?')[0].trim().toLowerCase();
  if (a === b) return true;
  if (isAnilistCdn(dbUrl) && isAnilistCdn(apiUrl)) {
    const fa = coverFingerprint(dbUrl);
    const fb = coverFingerprint(apiUrl);
    if (fa && fb && fa === fb) return true;
  }
  return false;
}

async function main() {
  const col = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'anime' AND column_name = 'anilist_id'`,
  );
  const hasAnilistCol = col.rows.length > 0;
  const { rows } = await pool.query(
    hasAnilistCol
      ? `SELECT id, title, poster, anilist_id FROM anime ORDER BY id`
      : `SELECT id, title, poster FROM anime ORDER BY id`,
  );
  if (!hasAnilistCol) {
    console.log('Note: no anilist_id column — using id from AniList poster URLs + title search fallback.\n');
  }

  const report = {
    ok: [],
    mismatch: [],
    dbNotAnilist: [],
    noApi: [],
    searchUsed: [],
    posterIdUsed: [],
  };

  for (const row of rows) {
    let meta;
    let via = 'search';

    if (hasAnilistCol && row.anilist_id) {
      via = 'anilist_id';
      meta = await fetchByIdWithRetry(row.anilist_id);
    } else {
      const fromPoster = anilistIdFromPosterUrl(row.poster);
      if (fromPoster != null) {
        via = 'poster-url-id';
        meta = await fetchByIdWithRetry(fromPoster);
      } else {
        meta = await searchAnime(row.title);
      }
    }

    if (!meta && via === 'search') {
      await sleep(2500);
      meta = await searchAnime(row.title);
    }

    await sleep(SLEEP_MS);

    if (!meta || !meta.poster) {
      report.noApi.push({
        id: row.id,
        title: row.title,
        via,
        note: 'No AniList media or cover',
      });
      continue;
    }

    if (via === 'search') {
      report.searchUsed.push({ id: row.id, title: row.title, matchedAnilistId: meta.anilistId });
    } else if (via === 'poster-url-id') {
      report.posterIdUsed.push({ id: row.id, title: row.title, parsedId: meta.anilistId });
    }

    const apiPoster = meta.poster;
    const dbPoster = row.poster;

    if (!isAnilistCdn(dbPoster)) {
      report.dbNotAnilist.push({
        id: row.id,
        title: row.title,
        dbPoster: dbPoster || '(null)',
        anilistPoster: apiPoster,
        anilistId: meta.anilistId,
        via,
      });
      continue;
    }

    if (urlsEquivalent(dbPoster, apiPoster)) {
      report.ok.push({ id: row.id, title: row.title, via });
    } else {
      report.mismatch.push({
        id: row.id,
        title: row.title,
        dbPoster,
        anilistPoster: apiPoster,
        anilistId: meta.anilistId,
        via,
      });
    }
  }

  console.log('\n=== AniList poster check ===\n');
  console.log(`Total rows: ${rows.length}`);
  console.log(`Match (AniList CDN, same cover): ${report.ok.length}`);
  console.log(`Mismatch (AniList CDN but different file than API): ${report.mismatch.length}`);
  console.log(`DB uses non-AniList URL (optional compare manually): ${report.dbNotAnilist.length}`);
  console.log(`No API result / no cover: ${report.noApi.length}`);
  console.log(`Resolved via id embedded in poster URL: ${report.posterIdUsed.length}`);
  console.log(`Resolved by title search (least reliable): ${report.searchUsed.length}`);

  if (report.mismatch.length) {
    console.log('\n--- MISMATCHES (fix poster or anilist_id) ---\n');
    for (const m of report.mismatch) {
      console.log(`#${m.id} ${m.title} [${m.via}] anilistId=${m.anilistId}`);
      console.log(`  DB:   ${m.dbPoster}`);
      console.log(`  API:  ${m.anilistPoster}\n`);
    }
  }

  if (report.dbNotAnilist.length) {
    console.log('\n--- Non-AniList poster (optional: align with API URL below) ---\n');
    for (const m of report.dbNotAnilist.slice(0, 40)) {
      console.log(`#${m.id} ${m.title}`);
      console.log(`  DB:   ${m.dbPoster}`);
      console.log(`  API:  ${m.anilistPoster}\n`);
    }
    if (report.dbNotAnilist.length > 40) {
      console.log(`... and ${report.dbNotAnilist.length - 40} more\n`);
    }
  }

  if (report.noApi.length) {
    console.log('\n--- NO API / NO COVER (retry run with stable network; script paces ~76 req/min) ---\n');
    for (const m of report.noApi) {
      console.log(`#${m.id} ${m.title} (${m.via}) ${m.note}`);
    }
    console.log('');
  }

  const fpMap = new Map();
  for (const row of rows) {
    if (!isAnilistCdn(row.poster)) continue;
    const fp = coverFingerprint(row.poster);
    if (!fp || !fp.startsWith('id:')) continue;
    if (!fpMap.has(fp)) fpMap.set(fp, []);
    fpMap.get(fp).push({ id: row.id, title: row.title });
  }
  const sharedArt = [...fpMap.entries()].filter(([, list]) => list.length > 1);
  if (sharedArt.length) {
    console.log('--- SAME ANILIST ART USED ON MULTIPLE ROWS (often wrong for later titles) ---\n');
    for (const [fp, list] of sharedArt) {
      console.log(`${fp}: ${list.map((x) => `#${x.id} ${x.title}`).join(' | ')}`);
    }
    console.log('');
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
