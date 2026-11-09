#!/usr/bin/env python3
"""Stage 1 of the Cuttings backfill: turn Buffer sent history into one record per shared link.

Reads hist.json (buffer_history) and trickle.json (buffer-trickle posts) exported from D1,
resolves each share's real link (Bluesky facets, t.co, lnkd.in), groups the per-network
copies by link, and fetches page metadata. Writes shares.json.
"""
import html
import json
import re
import ssl
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).parent
SINCE = "2025-01-01"
EXCLUDE = re.compile(r"(^|\.)(rmoff\.net|interestinglinks\.substack\.com|freedium\.cfd)$")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
URL = re.compile(r"https?://[^\s<>\"]+")
TRACKING = re.compile(r"^(utm_|fbclid$|gclid$|mc_|ref$|ref_src$|source$|s$|sk$|triedRedirect$|trk$|li_fat_id$)", re.I)


SSL = ssl.create_default_context(cafile="/etc/ssl/cert.pem")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def location(url):
    opener = urllib.request.build_opener(NoRedirect, urllib.request.HTTPSHandler(context=SSL))
    try:
        opener.open(urllib.request.Request(url, headers={"User-Agent": "curl/8.7.1"}), timeout=15)
    except urllib.error.HTTPError as e:
        if 300 <= e.code < 400:
            return e.headers.get("location")
        raise
    return None


def get(url, timeout=15, accept="text/html"):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    with urllib.request.urlopen(req, timeout=timeout, context=SSL) as res:
        return res.geturl(), res.read(600_000).decode(res.headers.get_content_charset() or "utf-8", "replace")


def normalise(u):
    p = urllib.parse.urlsplit(u)
    q = [(k, v) for k, v in urllib.parse.parse_qsl(p.query) if not TRACKING.match(k)]
    host = p.hostname.lower().removeprefix("www.") if p.hostname else ""
    return host + p.path.rstrip("/") + ("?" + urllib.parse.urlencode(q) if q else "")


def clean_link(u):
    u = u.rstrip(".,);:!?'\"")
    u = re.sub(r"^https?://freedium\.cfd/(?=https?://)", "", u)
    p = urllib.parse.urlsplit(u)
    q = [(k, v) for k, v in urllib.parse.parse_qsl(p.query, keep_blank_values=True) if not TRACKING.match(k)]
    return urllib.parse.urlunsplit((p.scheme, p.netloc, p.path, urllib.parse.urlencode(q), ""))


def resolve(u):
    host = urllib.parse.urlsplit(u).hostname or ""
    try:
        if host == "lnkd.in":
            _, body = get(u)
            m = re.search(r'data-tracking-control-name="external_url_click"[^>]*href="([^"]+)"', body) or re.search(
                r'href="(https?://(?!(?:[\w-]+\.)?(?:linkedin|licdn)\.com)[^"]+)"', body
            )
            return html.unescape(m.group(1)) if m else None
        if host == "t.co":
            return location(u)
    except Exception as e:
        print(f"resolve failed {u}: {e}", file=sys.stderr)
        return None
    return u


def bluesky_posts(rows):
    uris, dids = {}, {}
    for r in rows:
        m = re.search(r"/profile/([^/]+)/post/([^/?#]+)", r["external_link"] or "")
        if m:
            actor = m.group(1)
            if not actor.startswith("did:"):
                if actor not in dids:
                    _, body = get(f"https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle={actor}", accept="application/json")
                    dids[actor] = json.loads(body)["did"]
                actor = dids[actor]
            uris[r["id"]] = f"at://{actor}/app.bsky.feed.post/{m.group(2)}"
    out = {}
    ids = list(uris)
    def fetch(chunk):
        qs = "&".join("uris=" + urllib.parse.quote(uris[k], safe="") for k in chunk)
        try:
            _, body = get(f"https://public.api.bsky.app/xrpc/app.bsky.feed.getPosts?{qs}", accept="application/json")
        except Exception as e:
            if len(chunk) == 1:
                print(f"bluesky fetch failed {uris[chunk[0]]}: {e}", file=sys.stderr)
                return
            for k in chunk:
                fetch([k])
            return
        by_uri = {p["uri"]: p for p in json.loads(body)["posts"]}
        for k in chunk:
            if uris[k] in by_uri:
                out[k] = by_uri[uris[k]]

    for i in range(0, len(ids), 25):
        fetch(ids[i : i + 25])
    return out


def bluesky_links(post):
    rec = post["record"]
    links = [f["uri"] for fc in rec.get("facets") or [] for f in fc["features"] if f.get("$type", "").endswith("#link")]
    emb = rec.get("embed") or {}
    ext = emb.get("external") or (emb.get("media") or {}).get("external")
    if ext and ext.get("uri") and ext["uri"] not in links:
        links.append(ext["uri"])
    return links, ext


def bluesky_text(post):
    """Post text with each link facet's display text replaced by its full URL."""
    rec = post["record"]
    raw = rec.get("text", "").encode()
    spans = sorted(
        ((fc["index"]["byteStart"], fc["index"]["byteEnd"], f["uri"]) for fc in rec.get("facets") or [] for f in fc["features"] if f.get("$type", "").endswith("#link")),
        reverse=True,
    )
    for start, end, uri in spans:
        raw = raw[:start] + uri.encode() + raw[end:]
    return raw.decode("utf-8", "replace")


def meta(body, *names):
    for n in names:
        m = re.search(rf'<meta[^>]+(?:property|name)=["\']{re.escape(n)}["\'][^>]*content=["\']([^"\']*)', body, re.I) or re.search(
            rf'<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:property|name)=["\']{re.escape(n)}["\']', body, re.I
        )
        if m and m.group(1).strip():
            return html.unescape(m.group(1)).strip()
    return None


def ld_author(body):
    for m in re.finditer(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', body, re.S | re.I):
        try:
            data = json.loads(m.group(1))
        except Exception:
            continue
        stack = [data]
        while stack:
            d = stack.pop()
            if isinstance(d, list):
                stack.extend(d)
            elif isinstance(d, dict):
                a = d.get("author")
                if isinstance(a, dict) and isinstance(a.get("name"), str):
                    return a["name"]
                if isinstance(a, list) and a and isinstance(a[0], dict) and isinstance(a[0].get("name"), str):
                    return a[0]["name"]
                if isinstance(a, str) and not a.startswith("http"):
                    return a
                stack.extend(v for v in d.values() if isinstance(v, (dict, list)))
    return None


def byline(body):
    """The Confluent Developer blog's 'by <name>' byline."""
    i = body.find("template-module--authors")
    if i < 0:
        return None
    texts = [t.strip() for t in re.findall(r">([^<>]+)<", body[i : i + 600]) if t.strip()]
    return html.unescape(texts[1]) if len(texts) > 1 and texts[0].lower() == "by" else None


def page_meta(link):
    try:
        final, body = get(link)
    except Exception as e:
        return {"error": str(e)[:120]}
    t = re.search(r"<title[^>]*>(.*?)</title>", body, re.S | re.I)
    author = byline(body) or meta(body, "author", "article:author", "parsely-author", "sailthru.author") or ld_author(body)
    if author and (author.startswith("http") or author.startswith("@") and " " not in author):
        author = ld_author(body) or (author if author.startswith("@") else None)
    return {
        "final": final,
        "og_title": meta(body, "og:title", "twitter:title"),
        "title": html.unescape(re.sub(r"\s+", " ", t.group(1))).strip() if t else None,
        "author": author,
        "site": meta(body, "og:site_name"),
    }


def main():
    rows = [r for r in json.load(open(HERE / "hist.json"))[0]["results"] if (r["sent_at"] or "") >= SINCE]
    trickle = json.load(open(HERE / "trickle.json"))[0]["results"]
    bsky = bluesky_posts([r for r in rows if r["service"] == "bluesky"])

    entries = []
    for r in rows:
        if r["service"] == "bluesky" and r["id"] in bsky:
            links, ext = bluesky_links(bsky[r["id"]])
            text = bluesky_text(bsky[r["id"]])
        else:
            links, ext, text = [u.rstrip(".,);:!?'\"") for u in URL.findall(r["text"] or "")], None, r["text"] or ""
        entries.append({**r, "links": links, "ext": ext, "full_text": text})

    short = {u for e in entries for u in e["links"] if urllib.parse.urlsplit(u).hostname in ("lnkd.in", "t.co")}
    with ThreadPoolExecutor(12) as ex:
        resolved = dict(zip(short, ex.map(resolve, short)))
    for e in entries:
        e["links"] = [clean_link(resolved.get(u, u)) for u in e["links"] if resolved.get(u, u)]
        for u, real in resolved.items():
            if real:
                e["full_text"] = e["full_text"].replace(u, real)

    groups = {}
    for e in entries:
        if not e["links"]:
            continue
        link = e["links"][0]
        key = normalise(link)
        host = urllib.parse.urlsplit(link).hostname or ""
        if EXCLUDE.search(host.removeprefix("www.")):
            continue
        groups.setdefault(key, {"key": key, "link": link, "copies": []})["copies"].append(e)

    with ThreadPoolExecutor(16) as ex:
        metas = dict(zip(groups, ex.map(lambda g: page_meta(g["link"]), groups.values())))

    by_url = {normalise(p["url"]): p for p in trickle}
    out = []
    for key, g in groups.items():
        copies = sorted(g["copies"], key=lambda c: c["sent_at"])
        out.append(
            {
                "key": key,
                "link": g["link"],
                "date": copies[0]["sent_at"],
                "texts": {c["service"]: c["full_text"] for c in copies},
                "ext": next((c["ext"] for c in copies if c["ext"]), None),
                "meta": metas[key],
                "trickle": by_url.get(key),
            }
        )
    out.sort(key=lambda s: s["date"])
    json.dump(out, open(HERE / "shares.json", "w"), indent=1, ensure_ascii=False)
    print(f"{len(rows)} history rows since {SINCE}; {len(out)} shares with a link to others; {sum(1 for s in out if 'error' in s['meta'])} page fetches failed")


if __name__ == "__main__":
    main()
