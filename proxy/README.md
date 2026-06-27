# football-data.org proxy

The deployed app (GitHub Pages) is a static site, so it can't call
football-data.org directly: that API sends no CORS headers, and the API token
must never ship in the client bundle. [`cloudflare-worker.js`](cloudflare-worker.js)
is a tiny proxy that solves both — it holds the token as a secret and adds CORS
headers.

> In **local dev** you don't need this. Vite proxies `/football-data` to the API
> (see `vite.config.ts`) and the token is read from `.env`
> (`VITE_FOOTBALL_DATA_TOKEN`).

## Deploy (Cloudflare Workers, free tier)

```bash
npm i -g wrangler
wrangler init wc26-proxy        # or paste cloudflare-worker.js into the dashboard
wrangler secret put FOOTBALL_DATA_TOKEN   # paste your football-data.org token
wrangler deploy
```

This gives you a URL like `https://wc26-proxy.<account>.workers.dev`. Quick check:

```bash
curl https://wc26-proxy.<account>.workers.dev/v4/competitions/WC/matches
```

## Wire it into the production build

Set these on the GitHub repo (Settings → Secrets and variables → Actions →
**Variables**), which `deploy.yml` reads at build time:

- `VITE_DATA_SOURCE = api`
- `VITE_FOOTBALL_DATA_BASE = https://wc26-proxy.<account>.workers.dev`

Leave `VITE_FOOTBALL_DATA_TOKEN` unset in production — the token lives in the
Worker secret, not the client.

For tighter security, set `ALLOWED_ORIGIN` in `cloudflare-worker.js` to your
Pages origin (e.g. `https://madniabdulwahab.github.io`) instead of `*`.
