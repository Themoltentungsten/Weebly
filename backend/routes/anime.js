const express = require('express');
const pool = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware');
const { fetchMediaExtras, anilistIdFromPosterUrl, searchAnime } = require('../services/anilist');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { genre, year, search, sort } = req.query;
    let query = 'SELECT * FROM anime WHERE 1=1';
    const params = [];
    let idx = 1;

    if (search) {
      query += ` AND (LOWER(title) LIKE $${idx} OR LOWER(description) LIKE $${idx} OR EXISTS (SELECT 1 FROM unnest(cast_members) AS c WHERE LOWER(c) LIKE $${idx}) OR LOWER(creator) LIKE $${idx} OR LOWER(director) LIKE $${idx})`;
      params.push(`%${search.toLowerCase()}%`);
      idx++;
    }

    if (genre) {
      query += ` AND EXISTS (SELECT 1 FROM unnest(genre) AS g WHERE LOWER(g) LIKE $${idx})`;
      params.push(`%${genre.toLowerCase()}%`);
      idx++;
    }

    if (year) {
      if (year.includes('-')) {
        const [startYear, endYear] = year.split('-').map(Number);
        query += ` AND year >= $${idx} AND year <= $${idx + 1}`;
        params.push(startYear, endYear);
        idx += 2;
      } else {
        query += ` AND year = $${idx}`;
        params.push(parseInt(year));
        idx++;
      }
    }

    if (sort === 'rating') {
      query += ' ORDER BY rating DESC';
    } else if (sort === 'mean_score') {
      query += ' ORDER BY mean_score DESC NULLS LAST';
    } else if (sort === 'year') {
      query += ' ORDER BY year DESC';
    } else if (sort === 'title') {
      query += ' ORDER BY title ASC';
    } else {
      query += ' ORDER BY id ASC';
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get anime error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/** Live AniList data — use /extras/:id (literal first segment) so routing/proxies never 404 */
async function anilistExtrasHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const result = await pool.query('SELECT * FROM anime WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Anime not found' });
    const row = result.rows[0];

    let aid = row.anilist_id ? parseInt(row.anilist_id, 10) : null;
    if (!aid || !Number.isFinite(aid)) aid = anilistIdFromPosterUrl(row.poster);
    if (!aid) {
      const hit = await searchAnime(row.title);
      aid = hit?.anilistId || null;
    }
    if (!aid) {
      return res.json({
        anilistId: null,
        relations: [],
        characters: [],
        recommendations: [],
        statusDistribution: [],
        scoreDistribution: [],
      });
    }

    const extras = await fetchMediaExtras(aid);
    if (!extras) {
      return res.json({
        anilistId: aid,
        relations: [],
        characters: [],
        recommendations: [],
        statusDistribution: [],
        scoreDistribution: [],
      });
    }

    res.json({ anilistId: aid, ...extras });
  } catch (err) {
    console.error('anilist-extras error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

router.get('/extras/:id', anilistExtrasHandler);
/** @deprecated prefer /extras/:id — kept for older frontends */
router.get('/:id/anilist-extras', anilistExtrasHandler);

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM anime WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anime not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get anime by id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, year, genre, rating, poster, carousel_poster, trailer, description, cast_members, creator, director, studio, crunchyroll_url, duration, language, anilist_id } = req.body;
    const aid = anilist_id !== '' && anilist_id != null ? parseInt(anilist_id, 10) : null;
    const result = await pool.query(
      `INSERT INTO anime (title, year, genre, rating, poster, trailer, description, cast_members, creator, director, studio, crunchyroll_url, duration, language, carousel_poster, anilist_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [title, year, genre, rating, poster, trailer, description, cast_members, creator, director, studio, crunchyroll_url, duration, language, carousel_poster || null, Number.isFinite(aid) ? aid : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add anime error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, year, genre, rating, poster, carousel_poster, trailer, description, cast_members, creator, director, studio, crunchyroll_url, duration, language, anilist_id } = req.body;
    const aid = anilist_id !== '' && anilist_id != null ? parseInt(anilist_id, 10) : null;
    const result = await pool.query(
      `UPDATE anime SET title=$1, year=$2, genre=$3, rating=$4, poster=$5, trailer=$6, description=$7, cast_members=$8, creator=$9, director=$10, studio=$11, crunchyroll_url=$12, duration=$13, language=$14, carousel_poster=$15, anilist_id=$16 WHERE id=$17 RETURNING *`,
      [title, year, genre, rating, poster, trailer, description, cast_members, creator, director, studio, crunchyroll_url, duration, language, carousel_poster ?? null, Number.isFinite(aid) ? aid : null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anime not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update anime error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM anime WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anime not found' });
    }
    res.json({ message: 'Anime deleted', id: result.rows[0].id });
  } catch (err) {
    console.error('Delete anime error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
