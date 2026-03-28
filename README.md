# TheWeebly — Anime Streaming Platform

Full-stack anime catalog with mood-based AI recommendations, AniList integration,
admin CRUD, user auth, watchlist/favorites, and a responsive dark-themed UI.

**Stack:** React 19 + Vite | Express + PostgreSQL | Gemini / Groq AI

---

## Project Structure

```
TheWeebly/
├── backend/                 # Express API (port 5000)
│   ├── server.js            # Entry point + routes
│   ├── db.js                # PostgreSQL pool
│   ├── seed.js              # Initial anime + admin seeder
│   ├── middleware.js         # JWT auth + admin guard
│   ├── routes/
│   │   ├── anime.js         # CRUD + AniList extras proxy
│   │   ├── auth.js          # Register / Login
│   │   ├── user.js          # Watchlist, favorites, recently viewed
│   │   └── ai.js            # Mood chatbot (Gemini → Groq → catalog fallback)
│   ├── services/
│   │   └── anilist.js       # AniList GraphQL client
│   ├── scripts/             # One-off maintenance scripts
│   ├── migrate_anilist_columns.js
│   ├── migrate_carousel_poster.js
│   ├── .env                 # Config (DATABASE_URL, API keys, JWT_SECRET)
│   └── .env.example
├── frontend/                # Vite + React (port 5173)
│   ├── src/
│   │   ├── pages/Home.jsx   # Main page
│   │   ├── components/      # Navbar, AnimeModal, ChatBot, AdminPanel, ...
│   │   ├── styles/global.css
│   │   ├── api/client.js    # Axios instance
│   │   ├── context/AuthContext.jsx
│   │   └── utils/anime.js   # normalizeAnime, buildAnilistIndex
│   ├── index.html
│   └── vite.config.js       # Dev proxy → backend
├── scripts/                 # Root helper scripts
│   ├── stop-site.js         # kill-port 5000 5173
│   ├── db-web.js            # pgweb launcher
│   └── db-shell.js          # psql launcher
├── package.json             # Monorepo scripts (start, stop, db:web, db:shell)
├── start-site.cmd           # Double-click to start (Windows)
├── stop-site.cmd            # Double-click to stop  (Windows)
└── db-view.cmd              # Double-click to open DB browser (Windows)
```

---

## Prerequisites

| Tool       | Version  | Notes                          |
|------------|----------|--------------------------------|
| Node.js    | >= 18    | `node -v` to check             |
| npm        | >= 9     | ships with Node                |
| PostgreSQL | >= 14    | running on localhost:5432       |

---

## Quick Start (step by step)

### 1. Clone / open the project

```bash
cd C:\Users\Yash\Desktop\TheWeebly
```

### 2. Create the PostgreSQL database

Open a terminal and run:

```bash
psql -U postgres
```

Inside the psql shell:

```sql
CREATE DATABASE weebly;
\q
```

### 3. Configure environment variables

Edit `backend/.env` (already exists — adjust if needed):

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/weebly
JWT_SECRET=change_this_to_a_long_random_string
PORT=5000

# Optional — the mood bot works without these (catalog-only mode)
GEMINI_API_KEY=
GROQ_API_KEY=
```

### 4. Install dependencies

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 5. Run database migrations + seed

```bash
cd backend
node migrate_anilist_columns.js
node migrate_carousel_poster.js
node seed.js
cd ..
```

`seed.js` creates tables (`anime`, `users`, `watchlist`, `favorites`, `recently_viewed`),
inserts ~60 anime, and creates an admin account:

| Field    | Value          |
|----------|----------------|
| Email    | admin@weebly.com |
| Password | admin123       |

### 6. (Optional) Enrich from AniList

Pull poster art, episodes, scores, tags from AniList for every anime in the DB:

```bash
cd backend
npm run enrich:anilist
cd ..
```

### 7. Start the site

From the project root:

```bash
npm start
```

Or double-click `start-site.cmd`.

This runs backend (port 5000) and frontend (port 5173) simultaneously.

Open **http://localhost:5173** in your browser.

### 8. Stop the site

```bash
npm run stop
```

Or double-click `stop-site.cmd`.

---

## AI Mood Chatbot

The floating robot icon (bottom-right) opens the mood matcher. Type a mood or genre
and it recommends anime.

**How it works:**

1. If `GEMINI_API_KEY` is set → tries Google Gemini first.
2. If Gemini fails or is absent, falls back to Groq (`GROQ_API_KEY`).
3. If both fail or no keys are set → runs in **catalog-only mode**: matches
   keywords from your message against anime titles, genres, and descriptions.
4. If nothing matches → returns top-rated anime from the database.

The bot **never returns a 500 error**. It always responds with anime.

**To enable AI mode:** add one or both keys to `backend/.env` and restart.

---

## Viewing the PostgreSQL Database

### Option A — Web browser UI (pgweb)

```bash
npm run db:web
```

Or double-click `db-view.cmd`. Opens at **http://127.0.0.1:8081**.

### Option B — psql CLI

```bash
npm run db:shell
```

Or double-click `db-shell.cmd` (requires `psql` on PATH).

### Useful SQL queries

```sql
SELECT count(*) FROM anime;
SELECT id, title, rating FROM anime ORDER BY rating DESC LIMIT 10;
SELECT * FROM users;
\dt                        -- list all tables
```

---

## API Endpoints

| Method | Path                       | Auth   | Description                       |
|--------|----------------------------|--------|-----------------------------------|
| GET    | /api/health                | —      | Health check                      |
| GET    | /api/anime                 | —      | List anime (query: genre, year, search, sort) |
| GET    | /api/anime/:id             | —      | Single anime                      |
| GET    | /api/anime/extras/:id      | —      | AniList extras (relations, characters, recommendations) |
| POST   | /api/anime                 | Admin  | Create anime                      |
| PUT    | /api/anime/:id             | Admin  | Update anime                      |
| DELETE | /api/anime/:id             | Admin  | Delete anime                      |
| POST   | /api/auth/register         | —      | Register user                     |
| POST   | /api/auth/login            | —      | Login (returns JWT)               |
| GET    | /api/user/watchlist        | User   | Get watchlist                     |
| POST   | /api/user/watchlist/:id    | User   | Add / save to watchlist           |
| DELETE | /api/user/watchlist/:id    | User   | Remove / unsave from watchlist    |
| GET    | /api/user/favorites        | User   | Get favorites                     |
| POST   | /api/user/favorites/:id    | User   | Add to favorites                  |
| DELETE | /api/user/favorites/:id    | User   | Unfavorite / remove               |
| POST   | /api/ai/chat               | —      | Mood chatbot                      |

---

## Key Features

- **Hero carousel** with wide banner art and auto-advance
- **Browse / filter** by genre, year, rating, title
- **Anime detail modal** with AniList relations, characters, recommendations, score/status distribution
- **Voice search** (Chrome/Edge — click the mic icon)
- **Admin panel** — full CRUD for the anime catalog (login as admin)
- **Watchlist + Favorites** — per-user in PostgreSQL; UI shows **Save / Unsave**, **Favorite / Unfavorite** on the detail modal and hero bookmark toggle; watchlist/favorites browse views include a **remove (×)** on each card
- **Responsive dark theme** optimized for desktop, tablet, and mobile

---

## Team Members

1. Yash Kumar Raut
2. Alok kumar Rai
3. Ayush Raj
4. Rishu Mehta 
5. Nikhil Kumar
