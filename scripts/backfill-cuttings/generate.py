#!/usr/bin/env python3
"""Stage 2 of the Cuttings backfill: write one cutting per share in shares.json.

Usage: generate.py <rmoff-blog checkout>
Writes content/cuttings/YYYY/MM/DD/<slug>.md and review.tsv (next to this script).
"""
import json
import re
import sys
import unicodedata
import urllib.parse
from pathlib import Path

HERE = Path(__file__).parent
URL = re.compile(r"https?://[^\s<>\"]+")
CITE = re.compile(r"^\s*(?:--?|[–—~])\s*(\S.*)$")
GENERIC_TITLES = {"Pony Mail"}
SEP = re.compile(r"\s+[-–—]\s+")


def words(s):
    s = unicodedata.normalize("NFKD", s or "").lower().replace("’", "'")
    return " ".join(re.findall(r"[\w']+", s))


TRACKING = re.compile(r"^(utm_|fbclid$|gclid$|mc_|ref$|ref_src$|source$|s$|sk$|triedRedirect$|trk$|li_fat_id$)", re.I)


def normalise(u):
    p = urllib.parse.urlsplit(u)
    q = [(k, v) for k, v in urllib.parse.parse_qsl(p.query) if not TRACKING.match(k)]
    host = p.hostname.lower().removeprefix("www.") if p.hostname else ""
    return host + p.path.rstrip("/") + ("?" + urllib.parse.urlencode(q) if q else "")


def domain(link):
    return (urllib.parse.urlsplit(link).hostname or "").removeprefix("www.")


def strip_site(title, site, link):
    if not title:
        return title
    labels = {words(site)} if site else set()
    labels |= {words(p) for p in domain(link).split(".")[:-1]}
    for sep in (" | ", " – ", " — ", " - ", " · ", " :: "):
        if sep in title:
            head, tail = title.rsplit(sep, 1)
            t = words(tail)
            if sep == " | " or t in labels or any(l and l in t for l in labels) or re.search(r"\b(blog|engineering|medium|substack)\b", t):
                return head.strip()
    return title.strip()


def candidate_lines(text):
    """Lines that carry a link, or the line just above a line that is only a link."""
    lines = [l for l in text.splitlines() if l.strip()]
    for i, line in enumerate(lines):
        if URL.search(line):
            bare = URL.sub("", line).strip()
            if bare:
                yield bare
            elif i:
                yield lines[i - 1].strip()


def overlap(a, b):
    wa, wb = set(words(a).split()), set(words(b).split())
    return len(wa & wb) / max(1, len(wa))


def attribution(text, page_title=None):
    """'Author - Title' (or 'Title - Author') from the line that carries the link, if Robin wrote one."""
    for bare in candidate_lines(text):
        bare = bare.rstrip(":").strip()
        parts = SEP.split(bare, maxsplit=1)
        if len(parts) != 2 or not all(parts):
            continue
        a, t = (x.strip().lstrip(".") for x in parts)
        if t.startswith("@") and " " not in t or (page_title and overlap(a, page_title) > overlap(t, page_title) + 0.3):
            a, t = t, a
        if len(a.split()) <= 4 and not re.search(r"[\"“”?!:]|\.$", a) and not ("@" in a and " " in a):
            return a, t
    return None, None


def handle_link(m):
    h = m.group(1)
    return f"[@{h}](https://bsky.app/profile/{h})"


def comment_from(text, link, title, author, service):
    lines = []
    key = normalise(link)
    for line in text.splitlines():
        line = URL.sub(lambda m: "" if normalise(m.group(0).rstrip(".,);:!?'\"")) == key else m.group(0), line)
        stripped = line.strip()
        if re.fullmatch(r"(#\w+\s*)+", stripped):
            continue
        rest = words(stripped)
        for drop in (title, author):
            if drop:
                rest = rest.replace(words(drop), " ")
        if title and words(title) in words(stripped) and len(rest.split()) <= 3:
            continue
        if title and stripped and words(stripped) in words(title):
            continue
        if author and title and words(stripped) in (words(f"{author} {title}"), words(f"{title} {author}")):
            continue
        lines.append(line.rstrip())
    out = "\n".join(lines)
    out = re.sub(r"(?<![\w/])#(\w)", r"\1", out)
    out = re.sub(r"\(\s*via\s", "(via ", out)
    out = re.sub(r"\s+\)", ")", out)
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r"[ \t]+\n", "\n", out)
    out = re.sub(r"\n{3,}", "\n\n", out).strip().rstrip(":").strip()
    out = URL.sub(lambda m: f"<{m.group(0)}>", out)
    if service == "bluesky":
        out = re.sub(r"(?<![\w\[/])@([a-z0-9-]+(?:\.[a-z0-9-]+)+)", handle_link, out, flags=re.I)
    return out


def quote_from(card):
    if not card:
        return None, None
    lines = card.replace("\r\n", "\n").split("\n")
    author = None
    while lines and not lines[-1].strip():
        lines.pop()
    if lines and CITE.match(lines[-1]) and any(l.lstrip().startswith(">") for l in lines):
        author = CITE.match(lines.pop()).group(1).strip()
    text = "\n".join(re.sub(r"^\s*>\s?", "", l) for l in lines).strip()
    return text or None, author


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:70].rsplit("-", 1)[0] if len(s) > 70 else s or "cutting"


def yaml_str(s):
    return json.dumps(s, ensure_ascii=False)


def build(share):
    link, meta, ext, trickle = share["link"], share["meta"], share["ext"] or {}, share["trickle"]
    service = next(s for s in ("bluesky", "twitter", "linkedin") if s in share["texts"])
    text = share["texts"][service]

    page_title = strip_site(meta.get("og_title") or ext.get("title") or meta.get("title"), meta.get("site"), link)
    author, title = attribution(trickle["text"], page_title) if trickle else (None, None)
    if not author:
        for s in ("bluesky", "twitter", "linkedin"):
            if s in share["texts"]:
                author, title = attribution(share["texts"][s], page_title)
                if author:
                    break
    title = title or page_title
    if title in GENERIC_TITLES:
        first = next((URL.sub("", l).strip() for l in text.splitlines() if URL.sub("", l).strip()), "")
        title = re.sub(r"^@\S+\s+", "", first).replace("#", "")[:100] or title
    if author and author.startswith("@") and meta.get("author") and not meta["author"].startswith("@"):
        author = meta["author"]
    author = author or meta.get("author")
    title = title or (trickle or {}).get("title") or domain(link)

    quote, quote_author = quote_from(trickle["card_text"]) if trickle else (None, None)
    comment = comment_from(text, link, title, author, service)
    return {
        "title": title,
        "date": share["date"],
        "link": link,
        "domain": domain(link),
        "author": author,
        "quote": quote,
        "quote_author": quote_author,
        "comment": comment,
        "service": service,
    }


def render(c):
    fm = ["---", f"title: {yaml_str(c['title'])}", f"date: {c['date'][:19]}Z", f"link: {yaml_str(c['link'])}", f"domain: {c['domain']}"]
    if c["author"]:
        fm.append(f"author: {yaml_str(c['author'])}")
    if c["quote"]:
        fm.append("quote: |")
        fm += [f"  {l}" if l else "" for l in c["quote"].split("\n")]
    if c["quote_author"]:
        fm.append(f"quote_author: {yaml_str(c['quote_author'])}")
    fm.append("---")
    body = re.sub(r"^(\s*)([#>])", r"\1\\\2", c["comment"], flags=re.M)
    return "\n".join(fm) + "\n" + (body + "\n" if body else "")


def main():
    blog = Path(sys.argv[1])
    shares = json.load(open(HERE / "shares.json"))
    manifest = HERE / "written.txt"
    if manifest.exists():
        for rel in manifest.read_text().split():
            (blog / rel).unlink(missing_ok=True)
    seen = set()
    review = ["date\ttitle\tauthor\tdomain\tcomment\tfile"]
    skipped = 0
    for share in shares:
        c = build(share)
        if (c["author"] or "").lower() == "robin moffatt" or re.match(r"(github\.com/rmoff|strava\.com|strava\.app\.link)(/|$)", normalise(c["link"])):
            skipped += 1
            continue
        d = c["date"][:10].replace("-", "/")
        slug = slugify(c["title"])
        path = f"content/cuttings/{d}/{slug}.md"
        n = 2
        while path in seen:
            path = f"content/cuttings/{d}/{slug}-{n}.md"
            n += 1
        seen.add(path)
        out = blog / path
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render(c))
        review.append("\t".join([c["date"][:10], c["title"], c["author"] or "", c["domain"], c["comment"].replace("\n", " ⏎ ")[:200], path]))
    manifest.write_text("\n".join(sorted(seen)) + "\n")
    (HERE / "review.tsv").write_text("\n".join(review) + "\n")
    print(f"wrote {len(seen)} cuttings; skipped {skipped} of your own")


if __name__ == "__main__":
    main()
