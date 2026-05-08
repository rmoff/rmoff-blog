#!/usr/bin/env python3
"""Find and fix dev.to articles whose body has pandoc-div leakage (e.g. literal
`::: note` text from earlier broken cross-posts). Re-converts the source post
with the current devto_post.py logic and PUTs the updated body.

Usage:
    DEVTO_API_KEY=... python3 scripts/devto_fix_existing.py [--dry-run]

Use --dry-run to list affected articles without touching them.
"""

import argparse
import os
import re
import sys
import time
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).parent))
from devto_post import (
    DEVTO_API_URL,
    SITE_BASE_URL,
    convert_adoc_to_markdown,
    fix_relative_urls,
    get_canonical_url,
    handle_md_shortcodes,
    parse_frontmatter,
    strip_frontmatter,
    update_devto_article,
)

# Patterns that indicate unprocessed pandoc/Hugo artefacts in the body:
#  - bare fenced-div markers (`::: note` etc)
#  - escaped Hugo read-more comment (with smart-typography arrow variant)
#  - pandoc-emitted backslash escapes around straight quotes/apostrophes
LEAK_RE = re.compile(
    r'^ *:{3,}(\s|$)|\\?<\\?!\\?-+more(?:\\?-+\\?>|-?→)|\\["\']',
    re.MULTILINE,
)


def _strip_code(md: str) -> str:
    """Replace fenced and inline code with placeholders so leak detection
    doesn't flag legitimate backslash escapes that belong inside code (e.g.
    bash `\\"` in a grep pattern)."""
    md = re.sub(r'```.*?```', '```...```', md, flags=re.DOTALL)
    md = re.sub(r'`[^`\n]+`', '``', md)
    return md


def has_leak(body: str) -> bool:
    return bool(LEAK_RE.search(_strip_code(body)))


def count_leaks(body: str) -> int:
    return len(LEAK_RE.findall(_strip_code(body)))


def list_my_articles(api_key: str) -> list[dict]:
    """Fetch all articles (published + drafts) for the authenticated user."""
    out = []
    for kind in ("published", "unpublished"):
        page = 1
        while True:
            r = requests.get(
                f"{DEVTO_API_URL}/articles/me/{kind}",
                headers={"api-key": api_key},
                params={"page": page, "per_page": 1000},
                timeout=30,
            )
            r.raise_for_status()
            batch = r.json()
            if not batch:
                break
            out.extend(batch)
            if len(batch) < 1000:
                break
            page += 1
    return out


def build_source_index(repo_root: Path) -> dict[str, Path]:
    """Map canonical_url → source file path."""
    index: dict[str, Path] = {}
    for path in (repo_root / "content" / "post").glob("*"):
        if path.suffix.lower() not in (".adoc", ".md"):
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        fm_str, _, fmt = strip_frontmatter(content)
        fm = parse_frontmatter(fm_str, fmt)
        url = get_canonical_url(fm)
        if url:
            index[url.rstrip("/") + "/"] = path
    return index


def regenerate_body(source: Path) -> str:
    content = source.read_text(encoding="utf-8")
    _, body, _ = strip_frontmatter(content)
    if source.suffix.lower() == ".adoc":
        body = convert_adoc_to_markdown(body)
    else:
        body = handle_md_shortcodes(body)
    return fix_relative_urls(body)


# Strip the same artefacts as clean_pandoc_markdown / handle_md_shortcodes
# would, but applied to an already-published body (no source needed).
_CLEANUP_PATTERNS = [
    (re.compile(r'\\?<\\?!\\?-+more(?:\\?-+\\?>|-?→)'), ''),
    (re.compile(r'<!--\s*more\s*-->'), ''),
    (re.compile(r'\\(["\'])'), r'\1'),  # unescape pandoc's quote backslashes
]

# Match a fenced code block (``` ... ```) or an inline code span (`...`).
# We don't apply cleanup inside these to avoid mangling literal escapes that
# belong in code (e.g. bash `\"`).
_CODE_SEGMENT_RE = re.compile(r'```.*?```|`[^`\n]+`', re.DOTALL)


def cleanup_body_in_place(body: str) -> str:
    out = []
    pos = 0
    for m in _CODE_SEGMENT_RE.finditer(body):
        prose = body[pos:m.start()]
        for pat, repl in _CLEANUP_PATTERNS:
            prose = pat.sub(repl, prose)
        out.append(prose)
        out.append(m.group(0))  # code segment passes through untouched
        pos = m.end()
    tail = body[pos:]
    for pat, repl in _CLEANUP_PATTERNS:
        tail = pat.sub(repl, tail)
    out.append(tail)
    return ''.join(out)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="List affected articles, no updates")
    parser.add_argument("--limit", type=int, default=0, help="Stop after N updates (for safety)")
    args = parser.parse_args()

    api_key = os.environ.get("DEVTO_API_KEY", "")
    if not api_key:
        print("Error: DEVTO_API_KEY environment variable not set", file=sys.stderr)
        return 1

    repo_root = Path(__file__).resolve().parent.parent
    source_index = build_source_index(repo_root)
    print(f"Indexed {len(source_index)} source posts.")

    articles = list_my_articles(api_key)
    print(f"Fetched {len(articles)} dev.to articles.\n")

    affected = []
    for art in articles:
        body = art.get("body_markdown", "") or ""
        if not has_leak(body):
            continue
        canonical = (art.get("canonical_url") or "").rstrip("/") + "/"
        source = source_index.get(canonical)
        affected.append({
            "id": art["id"],
            "title": art.get("title", ""),
            "url": art.get("url", ""),
            "canonical": canonical,
            "source": source,
            "body": body,
            "leak_count": count_leaks(body),
        })

    if not affected:
        print("No articles need fixing.")
        return 0

    print(f"Found {len(affected)} affected article(s):\n")
    for a in affected:
        src = a["source"].relative_to(repo_root) if a["source"] else "(no matching source)"
        print(f"  [{a['id']}] {a['title']}")
        print(f"      {a['url']}")
        print(f"      leaks: {a['leak_count']} | source: {src}")

    if args.dry_run:
        print("\nDry run — no updates performed.")
        return 0

    print()
    updated = errored = skipped = 0
    for a in affected:
        if args.limit and updated >= args.limit:
            print(f"Hit --limit={args.limit}, stopping.")
            break

        # Prefer a full regen from source when we have one — it catches all
        # artefacts. Fall back to in-place cleanup of the existing body when
        # there's no source match (e.g. native-on-dev.to posts or renamed sources).
        if a["source"]:
            try:
                new_body = regenerate_body(a["source"])
                mode = "regen"
            except Exception as e:
                print(f"  ERR  [{a['id']}] {a['title']} — regen failed: {e}")
                errored += 1
                continue
        else:
            new_body = cleanup_body_in_place(a["body"])
            mode = "tidy"

        if has_leak(new_body):
            print(f"  SKIP [{a['id']}] {a['title']} — output still leaks ({mode})")
            skipped += 1
            continue
        if new_body == a["body"]:
            print(f"  SKIP [{a['id']}] {a['title']} — no change after {mode}")
            skipped += 1
            continue
        try:
            update_devto_article(article_id=a["id"], body_markdown=new_body, api_key=api_key)
            print(f"  OK   [{a['id']}] {a['title']} ({mode})")
            updated += 1
        except requests.HTTPError as e:
            print(f"  ERR  [{a['id']}] HTTP {e.response.status_code}: {e.response.text[:200]}")
            errored += 1
        time.sleep(1.0)  # dev.to rate limits at ~30/min

    print(f"\nDone: {updated} updated, {skipped} skipped, {errored} errored")
    return 0 if errored == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
