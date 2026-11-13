#!/usr/bin/env python3
"""Add a cutting from a post I wrote on a social network.

Bluesky posts are fetched from the public API: text, links, mentions, images (with alt
text), a link card or a quoted post. LinkedIn posts are read from LinkedIn's public embed
page: text, links, mentions and images (with alt text). Give it any link to the post, or
the <iframe> from the post's "Embed this post". Anything else takes the text on stdin and
images as files, and so does LinkedIn when the text is piped in.

Usage:
    python3 scripts/add-cutting.py https://bsky.app/profile/rmoff.net/post/3myukwzq5i225

    python3 scripts/add-cutting.py https://lnkd.in/p/dJdbnu44
    python3 scripts/add-cutting.py "$(pbpaste)"      # LinkedIn's <iframe> on the clipboard

    pbpaste | python3 scripts/add-cutting.py https://x.com/rmoff/status/123 \\
        --date 2026-10-22T10:54 --image ~/Desktop/screenshot.png

Options:
    --title TEXT   Title for the cutting (default: the post's first line or sentence)
    --date ISO     When it was posted (not Bluesky; default: from a LinkedIn post's ID, else now)
    --image PATH   Image to include (pasted text only; repeatable)
    --alt TEXT     Alt text for the matching image: --image, or LinkedIn's (repeatable, in the same order)
    --dry-run      Print the cutting instead of writing it

Writes content/cuttings/YYYY/MM/DD/<slug>.md, or <slug>/index.md plus the images.
"""

import argparse
import html
import json
import re
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = "https://public.api.bsky.app/xrpc"
HEADERS = {"User-Agent": "rmoff-blog add-cutting"}
SOURCE_NAMES = {"linkedin.com": "LinkedIn", "x.com": "X", "twitter.com": "X", "bsky.app": "Bluesky"}
EXT = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}
LINKEDIN_NO_ALT = "No alternative text description for this image"


def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
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


def is_linkedin(arg):
    return bool(re.search(r"[/.](?:linkedin\.com|lnkd\.in)/", arg))


def on_linkedin(url):
    host = urllib.parse.urlsplit(url).hostname or ""
    return host == "linkedin.com" or host.endswith(".linkedin.com")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def unshorten(url):
    """Where a lnkd.in link goes: its redirect, or the link on LinkedIn's "you're leaving LinkedIn" page."""
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.build_opener(NoRedirect).open(req, timeout=30) as res:
            page = res.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.headers.get("Location") or url
    except (urllib.error.URLError, TimeoutError):
        return url
    anchor = re.search(r'<a\b[^>]*"external_url_click"[^>]*>', page)
    href = anchor and re.search(r'\bhref="([^"]+)"', anchor.group(0))
    return html.unescape(href.group(1)) if href else url


def linkedin_urn(arg):
    """The post's URN, from any link to it or from the <iframe> LinkedIn gives for embedding it."""
    src = re.search(r'\bsrc="([^"]+)"', arg)
    url = html.unescape(src.group(1)) if "<iframe" in arg and src else arg.strip()
    if re.match(r"https?://lnkd\.in/", url):
        url = unshorten(url)
    url = urllib.parse.unquote(url)
    m = re.search(r"urn:li:(activity|share|ugcPost):(\d+)", url) or re.search(r"[-_](activity|share|ugcPost)-(\d+)", url)
    if not m:
        sys.exit(f"Not a link to a LinkedIn post: {arg}")
    return f"urn:li:{m.group(1)}:{m.group(2)}"


def linkedin_date(urn):
    """When a LinkedIn post was made: the top 41 bits of the ID in its URN are milliseconds since the epoch."""
    return datetime.fromtimestamp((int(urn.rsplit(":", 1)[1]) >> 22) / 1000, timezone.utc).isoformat()


def linkedin_link(href, label):
    """A link in a LinkedIn post as Markdown. Hashtags become plain text, LinkedIn's redirects and lnkd.in
    links are followed to where they go, and links to LinkedIn itself (mentions) lose their tracking."""
    target = href
    if on_linkedin(href):
        query = urllib.parse.parse_qs(urllib.parse.urlsplit(href).query)
        target = (query.get("session_redirect") or query.get("url") or [href])[0]
    if "/feed/hashtag/" in target:
        return escape(label)
    if re.match(r"https?://lnkd\.in/", target):
        target = unshorten(target)
    if on_linkedin(target):
        target = target.split("?")[0]
    label = label.strip()
    if re.match(r"https?://\S+$", label):
        label = target
    return f"[{escape(label)}]({target})"


class LinkedInPost(HTMLParser):
    """What a cutting needs from a post's LinkedIn embed page: its URL, its text as Markdown, its images."""

    def __init__(self):
        super().__init__()
        self.url, self.text, self.images = None, None, []
        self._parts, self._link, self._in_text, self._in_image = [], None, False, False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        test_id = a.get("data-test-id")
        if tag == "meta" and a.get("property") == "og:url":
            self.url = a.get("content")
        elif test_id == "main-feed-activity-embed-card__commentary" and self.text is None:
            self._in_text, self._parts = True, []
        elif test_id == "feed-images-content__list-item":
            self._in_image = True
        elif tag == "img" and self._in_image and (a.get("data-delayed-url") or a.get("src")):
            self.images.append((a.get("data-delayed-url") or a.get("src"), a.get("alt") or ""))
        elif tag == "a" and self._in_text:
            self._link = [a.get("href") or "", ""]
        elif tag == "br" and self._in_text:
            self._parts.append("\n")

    def handle_data(self, data):
        if self._link:
            self._link[1] += data
        elif self._in_text:
            self._parts.append(escape(data))

    def handle_endtag(self, tag):
        if tag == "a" and self._link:
            self._parts.append(linkedin_link(*self._link))
            self._link = None
        elif tag == "p" and self._in_text:
            self.text, self._in_text = "".join(self._parts).strip(), False
        elif tag == "li":
            self._in_image = False


def from_linkedin(arg, args):
    urn = linkedin_urn(arg)
    page = f"https://www.linkedin.com/embed/feed/update/{urn}"
    post = LinkedInPost()
    try:
        post.feed(fetch(page)[0].decode("utf-8", "replace"))
    except urllib.error.HTTPError:
        pass
    if post.text is None:
        sys.exit(f"Couldn't read the post from {page}\n"
                 "Paste its text instead:  pbpaste | python3 scripts/add-cutting.py <link to the post>")
    source = (post.url or f"https://www.linkedin.com/feed/update/{urn}").split("?")[0]
    images = []
    for i, (src, alt) in enumerate(post.images):
        data, content_type = fetch(src)
        alt = args.alt[i] if i < len(args.alt) else "" if alt == LINKEDIN_NO_ALT else alt
        images.append((data, EXT.get(content_type, ".jpg"), alt))
    return {
        "date": posted(args.date) if args.date else linkedin_date(linkedin_urn(source)),
        "source": source,
        "source_name": "LinkedIn",
        "body": post.text,
        "images": images,
    }


def posted(date):
    """A --date as ISO UTC. Without a timezone it's local time."""
    date = datetime.fromisoformat(date)
    if date.tzinfo is None:
        date = date.astimezone()
    return date.astimezone(timezone.utc).isoformat()


def from_stdin(url, args, text):
    if not text:
        sys.exit("Paste the post's text on stdin, e.g.  pbpaste | python3 scripts/add-cutting.py <url>")
    urn = linkedin_urn(url) if is_linkedin(url) else None
    if urn:
        url = f"https://www.linkedin.com/feed/update/{urn}"
    host = (urllib.parse.urlsplit(url).hostname or "").removeprefix("www.")
    images = []
    for i, path in enumerate(args.image):
        p = Path(path).expanduser()
        images.append((p.read_bytes(), p.suffix.lower() or ".png", args.alt[i] if i < len(args.alt) else ""))
    if args.date:
        date = posted(args.date)
    else:
        date = linkedin_date(urn) if urn else datetime.now(timezone.utc).isoformat()
    return {
        "date": date,
        "source": url,
        "source_name": SOURCE_NAMES.get(host, host),
        "body": escape(text),
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

    if "bsky.app/" in args.url:
        c = from_bluesky(args.url)
    else:
        piped = "" if sys.stdin.isatty() else sys.stdin.read().strip()
        c = from_linkedin(args.url, args) if is_linkedin(args.url) and not piped else from_stdin(args.url, args, piped)
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
