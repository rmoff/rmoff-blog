/**
 * popular-links — Cloudflare Worker
 *
 * Read-only proxy in front of PostHog. Runs one fixed HogQL query against the
 * `il_link_clicked` events and returns the most-clicked outbound links from the
 * Interesting Links series as JSON. The PostHog personal API key never leaves
 * the Worker (it is a Wrangler secret); the browser only ever sees the result.
 *
 * GET /            -> { links: [{ url, text, clicks }], generated_at }
 *   ?limit=N       -> number of links (1..MAX_LIMIT, default DEFAULT_LIMIT)
 *   ?path=/p/       -> scope to clicks on one post page ($pathname); omit for site-wide
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

// Strip the Freedium-mirror prefix so e.g.
//   https://freedium-mirror.cfd/https://medium.com/...  ->  https://medium.com/...
// This also dedupes mirrored vs. original clicks, since they group to one URL.
// No capture group / backreference needed: we match only the prefix and drop it.
// `path` (optional) scopes results to clicks that happened on one post page,
// via the $pathname captured on every event. It is whitelist-sanitized by the
// caller to [A-Za-z0-9/_.-] only, so it cannot break out of the string literal.
function buildQuery(limit, path) {
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

function corsHeaders(origin) {
  return { "Access-Control-Allow-Origin": allowedOrigin(origin), "Vary": "Origin" };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
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
    let limit = parseInt(reqUrl.searchParams.get("limit"), 10);
    if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    // Optional per-post scope. Whitelist to safe path chars (no quotes possible).
    const path = (reqUrl.searchParams.get("path") || "")
      .replace(/[^a-zA-Z0-9\/_.-]/g, "")
      .slice(0, 256);

    // Edge cache, keyed by limit + path (origin-agnostic so all readers share it).
    const cache = caches.default;
    const cacheKey = new Request(`https://popular-links/?limit=${limit}&path=${encodeURIComponent(path)}`);
    const hit = await cache.match(cacheKey);
    if (hit) {
      // Re-apply per-request CORS on top of the cached body.
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
        body: JSON.stringify({ query: { kind: "HogQLQuery", query: buildQuery(limit, path) } }),
      });
    } catch (e) {
      return json({ error: "Upstream fetch failed" }, 502, cors);
    }

    if (!phRes.ok) {
      const detail = (await phRes.text()).slice(0, 500);
      return json({ error: "PostHog query failed", status: phRes.status, detail }, 502, cors);
    }

    const data = await phRes.json();
    const links = (data.results || []).map(([url, text, clicks]) => ({ url, text, clicks }));

    const response = json({ links, generated_at: new Date().toISOString() }, 200, {
      ...cors,
      "Cache-Control": `public, max-age=${CACHE_TTL}`,
    });
    // Cache a copy without the per-origin CORS header (re-applied on hit above).
    const toCache = new Response(JSON.stringify({ links, generated_at: new Date().toISOString() }), {
      headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${CACHE_TTL}` },
    });
    ctx.waitUntil(cache.put(cacheKey, toCache));
    return response;
  },
};
