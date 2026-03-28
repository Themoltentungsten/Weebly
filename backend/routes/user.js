const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('../middleware');

const router = express.Router();

// --- Watchlist ---
router.get('/watchlist', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT a.* FROM anime a JOIN watchlist w ON a.id = w.anime_id WHERE w.user_id = $1 ORDER BY a.title',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get watchlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/watchlist/:animeId', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO watchlist (user_id, anime_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.animeId]
    );
    res.json({ message: 'Added to watchlist' });
  } catch (err) {
    console.error('Add watchlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/watchlist/:animeId', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM watchlist WHERE user_id = $1 AND anime_id = $2', [req.user.id, req.params.animeId]);
    res.json({ message: 'Removed from watchlist' });
  } catch (err) {
    console.error('Remove watchlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Favorites ---
router.get('/favorites', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT a.* FROM anime a JOIN favorites f ON a.id = f.anime_id WHERE f.user_id = $1 ORDER BY a.title',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/favorites/:animeId', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO favorites (user_id, anime_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.animeId]
    );
    res.json({ message: 'Added to favorites' });
  } catch (err) {
    console.error('Add favorites error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/favorites/:animeId', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND anime_id = $2', [req.user.id, req.params.animeId]);
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    console.error('Remove favorites error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Recently Viewed ---
router.get('/recently-viewed', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT a.* FROM anime a JOIN recently_viewed rv ON a.id = rv.anime_id WHERE rv.user_id = $1 ORDER BY rv.viewed_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get recently viewed error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/recently-viewed/:animeId', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO recently_viewed (user_id, anime_id, viewed_at) VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, anime_id) DO UPDATE SET viewed_at = NOW()`,
      [req.user.id, req.params.animeId]
    );
    res.json({ message: 'Marked as viewed' });
  } catch (err) {
    console.error('Add recently viewed error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Admin: list users ---
router.get('/all', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    const result = await pool.query('SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    await pool.query('DELETE FROM users WHERE id = $1 AND is_admin = false', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
