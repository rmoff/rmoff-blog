/**
 * popular-links — Cloudflare Worker
 *
 * Read-only proxy in front of PostHog. Keeps the PostHog personal API key
 * server-side (a Wrangler secret); the browser only ever sees the result.
 * Two routes:
 *
 * GET /            -> { links: [{ url, text, clicks }], generated_at }
 *   ?limit=N       -> number of links (1..MAX_LIMIT, default DEFAULT_LIMIT)
 *   ?path=/p/      -> scope to il_link_clicked on one post page; omit for site-wide
 *
 * GET /views       -> { views, scope, generated_at }   (old-school hit counter)
 *   ?path=/p/      -> $pageview count for that page; omit for the whole-site total
 *
 * Secret required:  POSTHOG_API_KEY  (a phx_ personal key with read access to
 *                   project PROJECT_ID).  Set with: wrangler secret put POSTHOG_API_KEY
 */

const POSTHOG_HOST = "https://eu.posthog.com";
const PROJECT_ID = "39273";
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const CACHE_TTL = 3600; // edge-cache results for 1 hour

const EXACT_ORIGINS = [
  "http://localhost:1313",
  "http://localhost:1314",
];
// Pattern-matched origins: rmoff.net (+ any subdomain, e.g. preview.rmoff.net) and
// the Cloudflare Pages preview project (per-deploy <hash>.rmoff-blog-preview.pages.dev).
const ORIGIN_PATTERNS = [
  /^https:\/\/([a-z0-9-]+\.)?rmoff\.net$/,
  /^https:\/\/([a-z0-9-]+\.)?rmoff-blog-preview\.pages\.dev$/,
];

function allowedOrigin(origin) {
  if (EXACT_ORIGINS.includes(origin)) return origin;
  if (ORIGIN_PATTERNS.some(function (re) { return re.test(origin); })) return origin;
  return "https://rmoff.net";
}

// Whitelist to safe path chars so an interpolated value can't break out of the
// single-quoted HogQL string literal.
function sanitizePath(p) {
  return (p || "").replace(/[^a-zA-Z0-9\/_.-]/g, "").slice(0, 256);
}

// Most-clicked Interesting Links. Strips the Freedium-mirror prefix (so
// freedium-mirror.cfd/https://medium.com/... -> https://medium.com/...) which also
// dedupes mirrored vs. original; label = most-frequent anchor text (topK).
function linksQuery(limit, path) {
  const pathFilter = path ? `AND properties.$pathname = '${path}'` : "";
  return `
    SELECT
      replaceRegexpOne(properties.link_url, '^https?://[^/]*freedium[^/]*/', '') AS url,
      topK(1)(properties.link_text)[1] AS text,
      count() AS clicks
    FROM events
    WHERE event = 'il_link_clicked'
      AND properties.link_url NOT ILIKE '%rmoff.net%'
      ${pathFilter}
    GROUP BY url
    ORDER BY clicks DESC
    LIMIT ${limit}`;
}

// Pageview count for the hit counter. With a path -> that page; without -> site total.
function viewsQuery(path) {
  const pathFilter = path ? `AND properties.$pathname = '${path}'` : "";
  return `SELECT count() AS views FROM events WHERE event = '$pageview' ${pathFilter}`;
}

function corsHeaders(origin) {
  return { "Access-Control-Allow-Origin": allowedOrigin(origin), "Vary": "Origin" };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// Shared: serve a HogQL query through the edge cache. The cached copy omits the
// per-origin CORS header; it is re-applied on every hit.
async function runCachedQuery(cacheKey, hogql, transform, env, ctx, cors) {
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) {
    const r = new Response(hit.body, hit);
    Object.entries(cors).forEach(([k, v]) => r.headers.set(k, v));
    return r;
  }

  if (!env.POSTHOG_API_KEY) {
    return json({ error: "Worker not configured (missing POSTHOG_API_KEY)" }, 500, cors);
  }

  let phRes;
  try {
    phRes = await fetch(`${POSTHOG_HOST}/api/projects/${PROJECT_ID}/query/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.POSTHOG_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query: hogql } }),
    });
  } catch (e) {
    return json({ error: "Upstream fetch failed" }, 502, cors);
  }

  if (!phRes.ok) {
    const detail = (await phRes.text()).slice(0, 500);
    return json({ error: "PostHog query failed", status: phRes.status, detail }, 502, cors);
  }

  const data = await phRes.json();
  const bodyStr = JSON.stringify(transform(data));
  const cacheable = { "Content-Type": "application/json", "Cache-Control": `public, max-age=${CACHE_TTL}` };
  ctx.waitUntil(cache.put(cacheKey, new Response(bodyStr, { headers: cacheable })));
  return new Response(bodyStr, { headers: { ...cors, ...cacheable } });
}

export default {
  async fetch(request, env, ctx) {
    const cors = corsHeaders(request.headers.get("Origin") || "");

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          ...cors,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405, cors);
    }

    const reqUrl = new URL(request.url);
    const path = sanitizePath(reqUrl.searchParams.get("path"));

    // --- Hit counter: /views ---
    if (reqUrl.pathname === "/views") {
      const cacheKey = new Request(`https://popular-links/views?path=${encodeURIComponent(path)}`);
      return runCachedQuery(
        cacheKey,
        viewsQuery(path),
        (data) => ({
          views: (data.results && data.results[0] && Number(data.results[0][0])) || 0,
          scope: path || "site",
          generated_at: new Date().toISOString(),
        }),
        env, ctx, cors
      );
    }

    // --- Most-clicked links: / (default) ---
    let limit = parseInt(reqUrl.searchParams.get("limit"), 10);
    if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    const cacheKey = new Request(`https://popular-links/?limit=${limit}&path=${encodeURIComponent(path)}`);
    return runCachedQuery(
      cacheKey,
      linksQuery(limit, path),
      (data) => ({
        links: (data.results || []).map(([url, text, clicks]) => ({ url, text, clicks })),
        generated_at: new Date().toISOString(),
      }),
      env, ctx, cors
    );
  },
};
