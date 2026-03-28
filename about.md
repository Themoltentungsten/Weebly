# TheWeebly — Kaunsa File Kya Karta Hai (Hinglish Guide)

Neeche har important file ka ek-line explanation hai — **line by line** style mein, taaki tum quickly samajh sako ki codebase mein kya kahan hai.

---

## Root folder (`TheWeebly/`)

- **`package.json`** — Poora project ek saath start/stop karne ke liye npm scripts (`npm start`, `npm run stop`, `db:web`, `db:shell`); yeh root “orchestrator” hai.
- **`package-lock.json`** — Exact dependency versions lock karta hai taaki har machine pe same packages install hon.
- **`README.md`** — Setup steps, features, API list — documentation ka main file.
- **`about.md`** — Yeh wala file: har file ka short Hinglish map (tum abhi padh rahe ho).
- **`.gitignore`** — Git ko batata hai kya commit mat karo (jaise `node_modules`, `.env`, `dist`).
- **`start-site.cmd`** — Windows pe double-click se backend + frontend dono chalu (internally `npm start`).
- **`stop-site.cmd`** — Windows pe ports 5000 aur 5173 par jo bhi chal raha hai use band karta hai.
- **`db-view.cmd`** — PostgreSQL ko browser mein dekhne ke liye pgweb launch (`npm run db:web`).
- **`db-shell.cmd`** — `psql` se direct SQL shell kholne ke liye (`npm run db:shell`).

---

## Root scripts (`scripts/`)

- **`scripts/stop-site.js`** — `kill-port` se API (5000) aur Vite (5173) band karta hai — clean shutdown.
- **`scripts/db-web.js`** — `backend/.env` se `DATABASE_URL` padh kar **pgweb** start karta hai (usually `http://127.0.0.1:8081`).
- **`scripts/db-shell.js`** — Same `DATABASE_URL` se **`psql`** interactive terminal kholta hai (CLI lovers ke liye).

---

## Backend (`backend/`)

- **`backend/server.js`** — Express app ka entry point: CORS, JSON body parser, routes mount (`/api/anime`, `/api/auth`, `/api/user`, `/api/ai`), aur `/api/health` health check.
- **`backend/db.js`** — `pg` Pool banata hai jo PostgreSQL se connect karta hai — saari queries isi pool se hoti hain.
- **`backend/middleware.js`** — JWT verify (`authMiddleware`) aur admin check (`adminMiddleware`) — protected routes ke liye.
- **`backend/.env`** — Secret config: `DATABASE_URL`, `JWT_SECRET`, `PORT`, optional `GEMINI_API_KEY` / `GROQ_API_KEY` (yeh file git mein usually ignore hoti hai).
- **`backend/.env.example`** — Sample env — naye developer ko batata hai kaunse variables chahiye (actual secrets copy mat karna).
- **`backend/package.json`** — Backend dependencies aur scripts (`start`, `seed`, `migrate:*`, `enrich:anilist`, etc.).
- **`backend/package-lock.json`** — Backend ke exact npm versions lock.

### Backend routes (`backend/routes/`)

- **`routes/anime.js`** — Anime list/filter/search, single anime by id, **AniList extras** (`/extras/:id` — relations, characters, recommendations), aur admin-only POST/PUT/DELETE CRUD.
- **`routes/auth.js`** — User **register** aur **login** — password hash + JWT token return.
- **`routes/user.js`** — Logged-in user ke liye watchlist, favorites, recently viewed — **GET** list, **POST** add/save, **DELETE** remove/unsave/unfavorite — teeno tables ke liye alag routes.
- **`routes/ai.js`** — **Mood chatbot** `/api/ai/chat`: Gemini/Groq try karta hai, fail ho to catalog + keyword fallback — hamesha kuch anime suggest karta hai.

### Backend services

- **`services/anilist.js`** — AniList **GraphQL** API calls: search, media details, extras (relations, chars, recs), poster URL se AniList id nikalna — poora “AniList bridge”.

### Backend one-off / maintenance

- **`seed.js`** — Database tables create + anime data seed + default admin user — pehli baar project chalane ke liye zaroori run.
- **`migrate_anilist_columns.js`** — `anilist_id`, `banner`, `episodes`, `mean_score`, tags, etc. columns add karta hai agar purane DB pe upgrade ho.
- **`migrate_carousel_poster.js`** — `carousel_poster` column + kuch default wide images set karta hai hero carousel ke liye.
- **`scripts/enrichFromAnilist.js`** — Har anime row ko AniList se match karke metadata/poster enrich karta hai (rate limit friendly delay ke sath).
- **`scripts/verifyAnilistPosters.js`** — DB posters ko AniList se compare karke mismatch report — debugging/quality check.
- **`scripts/applyPosterCorrections.js`** — Known wrong posters ko title ke hisaab se fixed URLs se update karta hai — manual fixes batch mein.

---

## Frontend (`frontend/`)

- **`frontend/package.json`** — React, Vite, axios, framer-motion, etc. — frontend scripts (`dev`, `build`, `preview`, `lint`).
- **`frontend/package-lock.json`** — Frontend dependency lockfile.
- **`frontend/vite.config.js`** — Dev server port 5173 + **`/api` proxy** backend `localhost:5000` pe — isliye browser se same-origin jaise API calls.
- **`frontend/index.html`** — Single-page app ka HTML shell — `#root` div jahan React mount hota hai.
- **`frontend/eslint.config.js`** — ESLint rules — code quality / React hooks warnings.

### Frontend entry & shell

- **`src/main.jsx`** — React root render, `BrowserRouter`, `AuthProvider`, global CSS import, toast provider.
- **`src/App.jsx`** — Sirf routes define: `/` pe `Home` page — app ka chhota router shell.
- **`src/styles/global.css`** — Poori site ka main styling: layout, modals, chat, carousel, dark theme — **single big stylesheet**.

### Frontend pages

- **`src/pages/Home.jsx`** — **Main page**: anime list, **`savedSets`** (`watchlist` + `favorites` ke liye `Set` of ids), login ke baad `refreshSavedSets()` se sync, hero pe watchlist toggle, detail modal ko `inWatchlist` / `inFavorites` pass karna, browse list se remove handler — sabse zyada state yahi.

### Frontend components (`src/components/`)

- **`Navbar.jsx`** — Top bar: menu, search, watchlist, favorites, recently viewed, random — navigation triggers.
- **`HeroCarousel.jsx`** — Home hero: slides, trailer, **bookmark = Save/Unsave toggle** (same API POST/DELETE), saved pe filled icon + orange highlight.
- **`AnimeGrid.jsx`** — Card grid; optional **`savedListMode`** + **`onRemoveSaved`** BrowseModal se aata hai jab list “saved” wali ho.
- **`AnimeCard.jsx`** — Poster + meta + play; agar `savedListMode` hai to corner pe **×** = Unsave ya Unfavorite (click card se detail, × se list se hatao).
- **`AnimeModal.jsx`** — Detail modal: **Save / Unsave** (watchlist), **Favorite / Unfavorite** (heart toggle), trailer, Crunchyroll, **`AnimeAnilistExtras`**, `onSavedChange` se parent sets refresh.
- **`AnimeAnilistExtras.jsx`** — AniList se relations, characters, recommendations — horizontal carousel + local catalog link jahan match ho.
- **`TrailerModal.jsx`** — Trailer / external link open karne ke liye chhota modal.
- **`SearchOverlay.jsx`** — Search UI overlay — query type karke filter; **AnimeCard** direct (saved remove button yahan nahi).
- **`BrowseModal.jsx`** — Kisi bhi title ke sath list dikhta (Popular, watchlist, Favorites, A–Z, etc.); **My watchlist** / **Favorites** pe cards pe × se unsave/unfavorite.
- **`ChatBot.jsx`** — Floating **Mood matcher** chat: `/api/ai/chat` call, cards dikhao, voice input optional.
- **`AdminPanel.jsx`** — Admin login ke baad anime add/edit/delete — CRUD forms.
- **`LoginModal.jsx`** / **`SignupModal.jsx`** — Auth forms — token save + context update.
- **`Footer.jsx`** — Page footer links / branding.

### Frontend context & utils

- **`src/context/AuthContext.jsx`** — Global user state: login/logout, token, `setAuthToken` sync with axios.
- **`src/api/client.js`** — Axios instance: base URL, optional `VITE_API_URL`, `/api` duplicate fix interceptor, Authorization header.
- **`src/utils/anime.js`** — `normalizeAnime` (DB row → UI shape), `anilistIdFromPosterUrl`, `buildAnilistIndex` — data helpers.

---

## Flow summary (ek minute mein)

1. **`npm start` (root)** → `backend/server.js` + Vite dev server.
2. Browser **`http://localhost:5173`** → **`main.jsx`** → **`Home.jsx`** → cards/grid/modals.
3. API calls **`/api/...`** → Vite proxy → **`server.js`** routes → **`db.js`** / **`anilist.js`** / **`ai.js`**.
4. Mood bot **`ChatBot.jsx`** → **`POST /api/ai/chat`** → **`routes/ai.js`**.
5. DB dekhna → **`npm run db:web`** ya **`db-view.cmd`**.
6. **Save / Favorite** → `POST /api/user/watchlist/:id` ya `POST /api/user/favorites/:id`; **Unsave / Unfavorite** → same path par **`DELETE`**; UI pe state `Home.jsx` ke `savedSets` se — toggle ke baad `refreshSavedSets()`.

---

## Watchlist & favorites — short Hinglish flow

- Login ke baad **Navbar** se watchlist/favorites list kholo → **`BrowseModal`** + **`AnimeGrid`**.
- **Detail** (`AnimeModal`) se **Save** = watchlist mein daalo, **Unsave** = hata do; **Favorite** / **Unfavorite** waise hi hearts ke liye.
- **Hero** pe sirf watchlist toggle hai (bookmark) — same cheez, bas hero slide ke anime ke liye.
- List view (`My watchlist` / `Favorites`) mein card pe **×** = turant remove, list update ho jati hai.

---

## Optional / extra files (agar folder mein hon)

- **`anime_dataset.xlsx`** (agar hai) — Excel dataset; production app runtime isko use nahi karti unless tum manually import script likho — reference/legacy data ho sakta hai.
- **`frontend/public/`** — Static assets jaise `favicon.svg`, `icons.svg` — direct URL se serve hote hain.

---

*Last updated: Save/Unsave + Favorite/Unfavorite + browse-list remove flow add kiya gaya; nayi file add ho to yahan ek line aur likh dena.*
