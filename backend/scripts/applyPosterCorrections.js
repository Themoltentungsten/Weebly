/**
 * Updates posters to match AniList (verified media ids). Run if DB was seeded before fixes:
 *   node scripts/applyPosterCorrections.js
 */
require('dotenv').config();
const pool = require('../db');

const fixes = [
  ['Fruits Basket (2001)', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120-Z5i1sw1xboQP.jpg'],
  ['Demon Slayer: Infinity Castle Arc', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx178788-zm3gtpB9TpRt.jpg'],
  ['Jujutsu Kaisen: The Culling Game', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx209895-rrl9Ys8iVTiV.jpg'],
  ['Solo Leveling Season 2: Arise from the Shadow', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx176496-9BDMjAZGEbq4.png'],
  ['Oshi No Ko Season 2', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx166531-dAL5MsqDHUkj.jpg'],
  ['Dandadan Season 2', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx185660-uB8RUMBGovGr.jpg'],
  ['Kaiju No. 8 Season 2', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx178754-Dgrub8xgC03M.jpg'],
  ['Re:Zero Season 3', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163134-yieRFbvUOH9a.jpg'],
  ['Lazarus', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx167336-KpGIIBie71OX.png'],
  ['Apothecary Diaries Season 2', 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx176301-TIGmldLffQGX.jpg'],
];

(async () => {
  let n = 0;
  for (const [title, poster] of fixes) {
    const r = await pool.query('UPDATE anime SET poster = $1 WHERE title = $2', [poster, title]);
    if (r.rowCount > 0) n += r.rowCount;
    else console.warn('No row matched:', title);
  }
  console.log('Poster corrections applied:', n, 'row(s)');
  await pool.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
