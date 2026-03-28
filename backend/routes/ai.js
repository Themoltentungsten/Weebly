const express = require('express');
const pool = require('../db');
require('dotenv').config();

const router = express.Router();

async function getAnimeList() {
  const result = await pool.query('SELECT id, title, genre, rating, description FROM anime ORDER BY rating DESC');
  return result.rows;
}

const DESC_LLM = 100;
const CONTEXT_MAX_ANIME = 64;

/** Shorter prompt for Groq/Gemini to avoid TPM / token limits with large catalogs. */
function buildAnimeContextForLlm(animeList) {
  const sorted = [...animeList].sort(
    (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0),
  );
  const slice = sorted.slice(0, Math.min(CONTEXT_MAX_ANIME, sorted.length));
  return slice
    .map((a) => {
      const g = Array.isArray(a.genre) ? a.genre.join(', ') : '';
      const desc = (a.description || '').slice(0, DESC_LLM);
      return `[ID:${a.id}] "${a.title}" | Genres: ${g} | Rating: ${a.rating}/10 | ${desc}`;
    })
    .join('\n');
}

function parseAiJson(rawText) {
  if (!rawText || typeof rawText !== 'string') throw new Error('Empty AI response');
  let text = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) text = text.slice(start, end + 1);
  return JSON.parse(text);
}

function coerceIds(arr, validIds) {
  if (!Array.isArray(arr)) return [];
  const set = new Set(validIds);
  const out = [];
  for (const x of arr) {
    let n;
    if (typeof x === 'number' && Number.isFinite(x)) n = Math.trunc(x);
    else {
      const m = String(x).match(/\d+/);
      n = m ? parseInt(m[0], 10) : NaN;
    }
    if (Number.isFinite(n) && set.has(n) && !out.includes(n)) out.push(n);
    if (out.length >= 8) break;
  }
  return out;
}

function fallbackKeywordMatch(message, animeList) {
  const q = message.toLowerCase().trim();
  let words = q.split(/\s+/).filter((w) => w.length > 1);
  if (words.length === 0 && q.length >= 2) words = [q];
  const scored = animeList.map((a) => {
    const title = (a.title || '').toLowerCase();
    const genres = (Array.isArray(a.genre) ? a.genre : []).map((g) => g.toLowerCase()).join(' ');
    const desc = (a.description || '').toLowerCase();
    let s = 0;
    for (const w of words) {
      if (title.includes(w)) s += 4;
      if (genres.includes(w)) s += 2;
      if (desc.includes(w)) s += 1;
    }
    return { id: a.id, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored.filter((x) => x.s > 0).slice(0, 8).map((x) => x.id);
}

function popularAnimeIds(animeList, n = 8) {
  return [...animeList]
    .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
    .slice(0, n)
    .map((a) => a.id);
}

async function respondCatalog(res, message, animeList, prefix) {
  const kw = fallbackKeywordMatch(message, animeList);
  const ids = kw.length > 0 ? kw : popularAnimeIds(animeList, 8);
  const result = await pool.query('SELECT * FROM anime WHERE id = ANY($1)', [ids]);
  const note =
    kw.length > 0
      ? `${prefix} Here are matches from our catalog.`
      : `${prefix} Here are top-rated picks from our catalog — add API keys in backend/.env for smarter suggestions.`;
  return res.json({ message: note, anime: result.rows });
}

const SYSTEM_PROMPT = `You are Weebly's anime recommendation assistant. The user will describe their mood or what they want to watch. You MUST only recommend anime from the database provided below.

Reply with ONLY valid JSON (no markdown, no code fences) in this shape:
{"ids":[123,456],"message":"short friendly note"}

Rules:
- "ids" must be an array of integers copied EXACTLY from the [ID:...] values in the list below (max 8 ids). Only ids from this list.
- Do not invent ids.
- "message" is one short paragraph.`;

async function tryGemini(userMessage, animeContext) {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) throw new Error('GEMINI_API_KEY not set');
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(key);
  const prompt = `${SYSTEM_PROMPT}\n\nANIME DATABASE:\n${animeContext}\n\nUSER: ${userMessage}`;
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
  let lastErr;
  for (const name of models) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      try {
        return parseAiJson(text);
      } catch {
        return { ids: [], message: text.trim().slice(0, 600) || 'Here are some ideas — try again with a mood or genre.' };
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Gemini failed');
}

async function tryGroq(userMessage, animeContext) {
  const key = (process.env.GROQ_API_KEY || '').trim();
  if (!key) throw new Error('GROQ_API_KEY not set');
  const Groq = require('groq-sdk');
  const groq = new Groq({ apiKey: key });

  const models = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
  let lastErr;
  for (const model of models) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\nANIME DATABASE:\n${animeContext}` },
          { role: 'user', content: userMessage },
        ],
        model,
        temperature: 0.7,
        max_tokens: 1024,
      });

      const text = completion.choices[0]?.message?.content || '';
      try {
        return parseAiJson(text);
      } catch {
        return {
          ids: [],
          message: text.trim().slice(0, 600) || 'Try describing a genre or vibe.',
        };
      }
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Groq failed');
}

router.post('/chat', async (req, res) => {
  let animeList = [];
  try {
    const message = req.body?.message != null ? String(req.body.message).trim() : '';
    if (!message) return res.status(400).json({ error: 'Message is required' });

    try {
      animeList = await getAnimeList();
    } catch (dbErr) {
      console.error('AI chat DB:', dbErr.message);
      return res.status(503).json({
        error: 'Database unavailable',
        message: 'Check DATABASE_URL in backend/.env and that PostgreSQL is running.',
        anime: [],
      });
    }

    if (animeList.length === 0) {
      return res.json({
        message: 'No anime in the database yet — run npm run seed in the backend folder.',
        anime: [],
      });
    }

    const validIds = animeList.map((a) => a.id);
    const llmContext = buildAnimeContextForLlm(animeList);
    const hasGemini = !!(process.env.GEMINI_API_KEY || '').trim();
    const hasGroq = !!(process.env.GROQ_API_KEY || '').trim();

    let aiResponse = null;
    if (hasGemini || hasGroq) {
      try {
        if (hasGemini) {
          aiResponse = await tryGemini(message, llmContext);
        } else {
          aiResponse = await tryGroq(message, llmContext);
        }
      } catch (primaryErr) {
        console.error('Primary AI failed:', primaryErr.message);
        try {
          if (hasGemini && hasGroq) {
            aiResponse = await tryGroq(message, llmContext);
          } else {
            throw primaryErr;
          }
        } catch (fallbackErr) {
          console.error('Fallback AI failed:', fallbackErr.message);
          return respondCatalog(
            res,
            message,
            animeList,
            'AI is unavailable right now.',
          );
        }
      }
    } else {
      return respondCatalog(
        res,
        message,
        animeList,
        'Running in catalog-only mode.',
      );
    }

    const ids = coerceIds(
      Array.isArray(aiResponse?.ids) ? aiResponse.ids : [],
      validIds,
    );
    let msg =
      (aiResponse?.message && String(aiResponse.message).trim()) ||
      'Here are some picks from our catalog:';

    let matchedAnime = [];
    if (ids.length > 0) {
      const result = await pool.query('SELECT * FROM anime WHERE id = ANY($1)', [ids]);
      const byId = new Map(result.rows.map((r) => [r.id, r]));
      matchedAnime = ids.map((id) => byId.get(id)).filter(Boolean);
    } else {
      const fbIds = fallbackKeywordMatch(message, animeList);
      if (fbIds.length > 0) {
        const result = await pool.query('SELECT * FROM anime WHERE id = ANY($1)', [fbIds]);
        matchedAnime = result.rows;
      }
    }

    if (matchedAnime.length === 0) {
      const pop = popularAnimeIds(animeList, 8);
      const result = await pool.query('SELECT * FROM anime WHERE id = ANY($1)', [pop]);
      matchedAnime = result.rows;
      if (matchedAnime.length) {
        msg = 'Here are standout titles from our catalog:';
      }
    }

    res.json({
      message: matchedAnime.length ? msg : 'No titles matched — try another mood or genre.',
      anime: matchedAnime,
    });
  } catch (err) {
    console.error('AI chat error:', err);
    if (animeList.length > 0) {
      return respondCatalog(res, String(req.body?.message || ''), animeList, 'Quick recovery:');
    }
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
