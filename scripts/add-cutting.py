#!/usr/bin/env python3
"""Add a cutting from a post I wrote on a social network.

Bluesky posts are fetched from the public API: text, links, mentions, images (with alt
text), a link card or a quoted post. Anything else (e.g. LinkedIn, which has no public
API for this) takes the text on stdin and images as files.

Usage:
    python3 scripts/add-cutting.py https://bsky.app/profile/rmoff.net/post/3myukwzq5i225

    pbpaste | python3 scripts/add-cutting.py https://www.linkedin.com/feed/update/urn:li:activity:123 \\
        --date 2026-10-22T10:54 --image ~/Desktop/screenshot.png

Options:
    --title TEXT   Title for the cutting (default: the post's first line or sentence)
    --date ISO     When it was posted (non-Bluesky only; default: now)
    --image PATH   Image to include (non-Bluesky only; repeatable)
    --alt TEXT     Alt text for the matching --image (repeatable, in the same order)
    --dry-run      Print the cutting instead of writing it

Writes content/cuttings/YYYY/MM/DD/<slug>.md, or <slug>/index.md plus the images.
"""

import argparse
import json
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://public.api.bsky.app/xrpc"
SOURCE_NAMES = {"linkedin.com": "LinkedIn", "x.com": "X", "twitter.com": "X", "bsky.app": "Bluesky"}
EXT = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "rmoff-blog add-cutting"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read(), res.headers.get_content_type()


def api(method, **params):
    body, _ = fetch(f"{API}/{method}?{urllib.parse.urlencode(params, doseq=True)}")
    return json.loads(body)


def bluesky_markdown(record):
    """Post text as Markdown, with link and mention facets turned into links."""
    raw = record.get("text", "").encode()
    out, pos = [], 0
    for facet in sorted(record.get("facets") or [], key=lambda f: f["index"]["byteStart"]):
        start, end = facet["index"]["byteStart"], facet["index"]["byteEnd"]
        if start < pos:
            continue
        label = raw[start:end].decode("utf-8", "replace")
        target = None
        for feature in facet["features"]:
            kind = feature.get("$type", "")
            if kind.endswith("#link"):
                target = feature["uri"]
            elif kind.endswith("#mention"):
                target = f"https://bsky.app/profile/{label.lstrip('@')}"
        out.append(escape(raw[pos:start].decode("utf-8", "replace")))
        out.append(f"[{escape(label)}]({target})" if target else escape(label))
        pos = end
    out.append(escape(raw[pos:].decode("utf-8", "replace")))
    return "".join(out).strip()


def escape(text):
    text = re.sub(r"([\\`*_\[\]<>])", r"\\\1", text)
    return re.sub(r"^(\s*)([#>+-]|\d+\.)(\s)", r"\1\\\2\3", text, flags=re.M)


def plain(markdown):
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", markdown)
    return re.sub(r"\\(.)", r"\1", text)


def from_bluesky(url):
    m = re.match(r"https://bsky\.app/profile/([^/]+)/post/([^/?#]+)", url)
    if not m:
        sys.exit(f"Not a Bluesky post URL: {url}")
    actor, rkey = m.groups()
    did = actor if actor.startswith("did:") else api("com.atproto.identity.resolveHandle", handle=actor)["did"]
    posts = api("app.bsky.feed.getPosts", uris=[f"at://{did}/app.bsky.feed.post/{rkey}"])["posts"]
    if not posts:
        sys.exit(f"Bluesky has no post at {url}")
    post = posts[0]
    record = post["record"]
    cutting = {
        "date": record["createdAt"],
        "source": f"https://bsky.app/profile/{post['author']['handle']}/post/{rkey}",
        "source_name": "Bluesky",
        "body": bluesky_markdown(record),
        "images": [],
    }

    embed = post.get("embed") or {}
    kind = embed.get("$type", "")
    media = (embed.get("media") or {}) if kind.endswith("recordWithMedia#view") else embed
    for image in media.get("images") or []:
        data, content_type = fetch(image["fullsize"])
        cutting["images"].append((data, EXT.get(content_type, ".jpg"), image.get("alt", "")))

    external = media.get("external") if media.get("$type", "").endswith("external#view") else None
    if external:
        cutting["link"] = external["uri"]
        cutting["title"] = external.get("title") or None
        cutting["body"] = re.sub(r"\[[^\]]*\]\(" + re.escape(external["uri"]) + r"\)", "", cutting["body"]).strip()

    quoted = (embed.get("record") or {}) if kind.endswith("record#view") else ((embed.get("record") or {}).get("record") or {})
    if quoted.get("value", {}).get("text"):
        q_rkey = quoted["uri"].rsplit("/", 1)[-1]
        cutting["quote"] = bluesky_markdown(quoted["value"])
        cutting["quote_author"] = quoted["author"].get("displayName") or quoted["author"]["handle"]
        cutting.setdefault("link", f"https://bsky.app/profile/{quoted['author']['handle']}/post/{q_rkey}")
    return cutting


def from_stdin(url, args):
    if sys.stdin.isatty():
        sys.exit("Paste the post's text on stdin, e.g.  pbpaste | python3 scripts/add-cutting.py <url>")
    host = (urllib.parse.urlsplit(url).hostname or "").removeprefix("www.")
    images = []
    for i, path in enumerate(args.image):
        p = Path(path).expanduser()
        images.append((p.read_bytes(), p.suffix.lower() or ".png", args.alt[i] if i < len(args.alt) else ""))
    date = datetime.fromisoformat(args.date) if args.date else datetime.now(timezone.utc)
    if date.tzinfo is None:
        date = date.astimezone()
    return {
        "date": date.astimezone(timezone.utc).isoformat(),
        "source": url,
        "source_name": SOURCE_NAMES.get(host, host),
        "body": escape(sys.stdin.read().strip()),
        "images": images,
    }


def title_for(body):
    text = " ".join(plain(body).split())
    if len(text) <= 120 and "\n" not in plain(body).strip():
        return text, True
    first = re.split(r"(?<=[.!?])\s|\n", plain(body).strip(), maxsplit=1)[0].strip()
    if len(first) > 90:
        first = first[:90].rsplit(" ", 1)[0] + "…"
    return first, False


def slugify(text):
    s = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return (s[:60].rsplit("-", 1)[0] if len(s) > 60 else s) or "cutting"


def render(c):
    lines = ["---", f"title: {json.dumps(c['title'], ensure_ascii=False)}", f"date: {c['date'][:19]}Z"]
    if c.get("link"):
        lines.append(f"link: {json.dumps(c['link'])}")
        lines.append(f"domain: {(urllib.parse.urlsplit(c['link']).hostname or '').removeprefix('www.')}")
    lines.append(f"source: {json.dumps(c['source'])}")
    lines.append(f"source_name: {c['source_name']}")
    if c.get("quote"):
        lines.append("quote: |")
        lines += [f"  {l}" if l else "" for l in c["quote"].split("\n")]
    if c.get("quote_author"):
        lines.append(f"quote_author: {json.dumps(c['quote_author'], ensure_ascii=False)}")
    if c["media"]:
        lines.append("media:")
        for name, alt in c["media"]:
            lines.append(f"- src: {name}")
            lines.append(f"  alt: {json.dumps(alt, ensure_ascii=False)}")
    lines.append("---")
    return "\n".join(lines) + "\n" + (c["body"] + "\n" if c["body"] else "")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("url")
    parser.add_argument("--title")
    parser.add_argument("--date")
    parser.add_argument("--image", action="append", default=[])
    parser.add_argument("--alt", action="append", default=[])
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    c = from_bluesky(args.url) if "bsky.app/" in args.url else from_stdin(args.url, args)
    if args.title or c.get("title"):
        c["title"] = args.title or c["title"]
    else:
        c["title"], whole = title_for(c["body"])
        if whole:
            c["body"] = ""

    day = c["date"][:10].replace("-", "/")
    slug = slugify(c["title"])
    c["media"] = [(f"image-{i}{ext}", alt) for i, (_, ext, alt) in enumerate(c["images"], 1)]
    base = ROOT / "content" / "cuttings" / day
    target = base / slug / "index.md" if c["images"] else base / f"{slug}.md"
    text = render(c)
    if args.dry_run:
        print(f"# would write {target.relative_to(ROOT)}\n{text}")
        return
    if target.exists() or (base / f"{slug}.md").exists() or (base / slug / "index.md").exists():
        sys.exit(f"Already exists: {target.relative_to(ROOT)}")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text)
    for (data, _, _), (name, _) in zip(c["images"], c["media"]):
        (target.parent / name).write_bytes(data)
    print(target.relative_to(ROOT))


if __name__ == "__main__":
    main()
