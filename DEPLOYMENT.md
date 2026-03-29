# Deploying TheWeebly (Netlify + Render)

Netlify serves the **React frontend** (static files). The **Express API**, **PostgreSQL**, and **AI keys** run on **Render** (or any Node host). This split is standard: Netlify does not run a long-lived Node/Express server or a managed Postgres instance tied to the same deploy.

## 1. Deploy the API on Render (from GitHub)

1. Push this repo to GitHub (e.g. [Themoltentungsten/Weebly](https://github.com/Themoltentungsten/Weebly)).
2. In [Render](https://dashboard.render.com): **New → PostgreSQL** → create a database (free tier is fine for demos). Copy the **Internal Database URL** (or External if you use tools outside Render).
3. **New → Web Service** → Connect the same GitHub repo.
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. **Environment variables** (Render → your web service → Environment):

   | Key | Value |
   |-----|--------|
   | `DATABASE_URL` | PostgreSQL connection string from step 2 |
   | `JWT_SECRET` | Long random string (e.g. 32+ chars) |
   | `GEMINI_API_KEY` | Optional — enables Gemini for the mood bot |
   | `GROQ_API_KEY` | Optional — fallback LLM |
   | `NODE_VERSION` | `20` (optional; can also set in Render) |

5. Deploy. When the service is **Live**, note the public URL, e.g. `https://weebly-api.onrender.com`.

6. **One-time database setup** (Render → your web service → **Shell**):

   ```bash
   node seed.js
   ```

   This creates tables, loads the anime catalog, and an admin user (`admin@weebly.com` / `admin123` — change password after first login in production).

7. Optional: run migrations if your DB predates certain columns:

   ```bash
   node migrate_anilist_columns.js
   node migrate_carousel_poster.js
   ```

8. Confirm the API: open `https://YOUR-API.onrender.com/api/health` — you should see `{ "status": "ok", ... }`.

**Cold starts:** Free Render web services sleep after inactivity. The first request after sleep can take ~30–60 seconds. Upgrade or keep the service warm for demos.

---

## 2. Deploy the frontend on Netlify (from GitHub)

1. [Netlify](https://app.netlify.com) → **Add new site** → **Import an existing project** → GitHub → select this repo.
2. Build settings (also in `netlify.toml`):

   - **Base directory:** `frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `frontend/dist` (path from **repository root**)

3. **Environment variables** (Site settings → Environment variables → **Build**):

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://YOUR-API.onrender.com` — **no trailing slash** |

   Vite embeds this at **build time**. After changing it, trigger **Deploys → Trigger deploy → Clear cache and deploy site**.

4. Deploy. Open your Netlify URL (e.g. `https://something.netlify.app`).

The backend already allows any `*.netlify.app` origin for CORS. For a **custom domain**, add it in Netlify and set `CORS_ORIGINS` on Render to `https://yourdomain.com` (comma-separated if multiple).

---

## 3. AI mood bot on production

- Set `GEMINI_API_KEY` and/or `GROQ_API_KEY` on **Render** (not Netlify).
- Redeploy or restart the Render web service after changing env vars.
- If keys are missing, the bot still responds using **catalog-only** mode (keyword + top-rated picks).

---

## 4. Troubleshooting

| Issue | What to check |
|--------|----------------|
| Blank data / failed fetches | `VITE_API_URL` matches Render URL exactly; rebuild Netlify after changing it. |
| CORS errors | Custom domain → add `CORS_ORIGINS` on Render. Netlify subdomains are allowed by default. |
| 503 / DB errors | `DATABASE_URL` on Render; Postgres instance running; run `node seed.js` once. |
| Slow first load | Render free tier cold start — wait and retry. |

---

## 5. Optional: `render.yaml` Blueprint

You can use **Blueprint** in Render to apply `render.yaml` from the repo. You still need to create/link the PostgreSQL database and set secrets (`DATABASE_URL`, `JWT_SECRET`, API keys) in the dashboard if not defined in the file.
