/**
 * Cloudflare Worker — football-data.org proxy for the World Cup 2026 app.
 *
 * Why this exists:
 *  - football-data.org does not send CORS headers, so the browser cannot call
 *    it directly from the deployed (static) GitHub Pages site.
 *  - The API token must NOT ship in the client bundle. This Worker holds it as
 *    a secret and injects it server-side.
 *
 * Deploy:
 *  1. Create a Worker (dashboard or `wrangler init`), paste this file.
 *  2. Add a secret named FOOTBALL_DATA_TOKEN with your football-data.org token:
 *       wrangler secret put FOOTBALL_DATA_TOKEN
 *  3. (Recommended) restrict ALLOWED_ORIGIN below to your Pages origin.
 *  4. Deploy, then set VITE_FOOTBALL_DATA_BASE to the Worker URL in the build.
 *
 * The app calls e.g. `<worker>/v4/competitions/WC/matches`; the Worker forwards
 * the path to https://api.football-data.org with the token attached.
 */

const UPSTREAM = 'https://api.football-data.org';

// Lock this to your site in production, e.g. 'https://madniabdulwahab.github.io'.
const ALLOWED_ORIGIN = '*';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: corsHeaders(),
      });
    }

    const url = new URL(request.url);
    const upstreamUrl = `${UPSTREAM}${url.pathname}${url.search}`;

    const upstream = await fetch(upstreamUrl, {
      headers: { 'X-Auth-Token': env.FOOTBALL_DATA_TOKEN ?? '' },
    });

    // Pass the body through, add CORS, and let the browser cache briefly.
    const headers = new Headers(corsHeaders());
    headers.set(
      'Content-Type',
      upstream.headers.get('Content-Type') ?? 'application/json',
    );
    headers.set('Cache-Control', 'public, max-age=60');

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  },
};
