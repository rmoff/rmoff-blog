# popular-links Worker

A tiny read-only Cloudflare Worker that sits in front of PostHog and returns the
most-clicked outbound links from the [Interesting Links](https://rmoff.net/categories/interesting-links/)
series. The blog's `popular-links.js` fetches this; the `/links/popular/` page and
a widget on each IL post render it.

## Why a Worker?

The PostHog **personal** API key (`phx_…`) can read *and write* the whole org, so
it can never ship in browser JS. The Worker keeps the key server-side (as a
secret) and exposes only one fixed, cached query. This is a separate Worker from
the `bobby.moffatt.me` ingestion proxy, which only carries the public `phc_` key.

## API

```
GET /                       → { "links": [{ "url", "text", "clicks" }], "generated_at" }
GET /?limit=50              → top 50 (1..100, default 10)
GET /?path=/2026/05/28/foo/ → scope to clicks on one post page (site-wide if omitted)
```

`text` is the most *frequent* anchor text seen for each URL (`topK`), so a single
oddball click — e.g. a browser auto-translating the page — can't hijack the label.

Results are edge-cached for 1 hour, so PostHog is hit at most once per hour per
`limit`, regardless of blog traffic. CORS is locked to `rmoff.net` (plus
localhost for dev).

The query strips the Freedium-mirror prefix (`https://freedium-mirror.cfd/https://medium.com/…`
→ `https://medium.com/…`), which also dedupes mirrored vs. original clicks, and
excludes `rmoff.net` self-links.

## Deploy

```bash
cd workers/popular-links
npx wrangler secret put POSTHOG_API_KEY    # paste the phx_ key (read access to project 39273)
npx wrangler deploy
```

Then set the deployed URL in the blog's `config.yaml`:

```yaml
params:
  popularLinksEndpoint: "https://popular-links.<your-account>.workers.dev"
```

## Local dev / test

```bash
cd workers/popular-links
printf 'POSTHOG_API_KEY=phx_xxx\n' > .dev.vars   # gitignored
npx wrangler dev
curl 'http://localhost:8787/?limit=20'
```
