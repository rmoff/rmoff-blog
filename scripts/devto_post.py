#!/usr/bin/env python3
"""Cross-post blog articles to dev.to via API.

The content is pushed directly via the API (not RSS import), so:
  - .md files: raw Markdown body sent as-is (no conversion, no whitespace risk)
  - .adoc files: pandoc converts AsciiDoc→Markdown at AST level (not HTML→Markdown)

Usage:
    # Post specific files (e.g. backfill)
    python scripts/devto_post.py content/post/my-post.md content/post/other.adoc

    # Detect files newly added in the most recent commit (for CI)
    python scripts/devto_post.py --new-in-commit

    # Dry run (no API calls)
    python scripts/devto_post.py --dry-run content/post/my-post.md

Requires:
    DEVTO_API_KEY environment variable
    pandoc installed (for .adoc files)
    pip install requests pyyaml
    Python 3.11+ (for tomllib) or pip install tomli
"""

import argparse
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
import yaml

try:
    import tomllib
except ImportError:
    try:
        import tomli as tomllib
    except ImportError:
        tomllib = None

DEVTO_API_URL = "https://dev.to/api"
SITE_BASE_URL = "https://rmoff.net"

# Hugo slugify: lowercase, strip non-alphanumeric (keep hyphens), collapse hyphens
def hugo_slugify(title: str) -> str:
    s = title.lower()
    # Remove characters that aren't alphanumeric, spaces, or hyphens
    s = re.sub(r"[^\w\s-]", "", s)
    # Replace whitespace runs with a single hyphen
    s = re.sub(r"[\s_]+", "-", s)
    # Collapse multiple hyphens
    s = re.sub(r"-{2,}", "-", s)
    return s.strip("-")


def strip_frontmatter(content: str) -> tuple[str, str, str]:
    """Return (fm_str, body, fmt) where fmt is 'yaml' or 'toml'."""
    if content.startswith("---\n"):
        end = content.find("\n---\n", 4)
        if end != -1:
            return content[4:end], content[end + 5 :], "yaml"
    if content.startswith("+++\n"):
        end = content.find("\n+++\n", 4)
        if end != -1:
            return content[4:end], content[end + 5 :], "toml"
    return "", content, "none"


def parse_frontmatter(fm_str: str, fmt: str) -> dict:
    if fmt == "yaml":
        # Strip AsciiDoc-style comments (// ...) that occasionally appear in frontmatter
        cleaned = "\n".join(
            line for line in fm_str.splitlines() if not line.lstrip().startswith("//")
        )
        try:
            return yaml.safe_load(cleaned) or {}
        except yaml.YAMLError as e:
            print(f"  Warning: YAML parse error: {e}", file=sys.stderr)
            return {}
    if fmt == "toml":
        if tomllib is None:
            print("  Warning: tomllib not available, skipping TOML frontmatter", file=sys.stderr)
            return {}
        try:
            return tomllib.loads(fm_str)
        except Exception as e:
            print(f"  Warning: TOML parse error: {e}", file=sys.stderr)
            return {}
    return {}


def convert_adoc_to_markdown(body: str) -> str:
    """Convert AsciiDoc body to Markdown using pandoc (AST-level, not via HTML)."""
    result = subprocess.run(
        [
            "pandoc",
            "-f", "asciidoc",
            "-t", "markdown+fenced_code_blocks+pipe_tables",
            "--wrap=none",
        ],
        input=body,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"pandoc failed: {result.stderr}")
    return clean_pandoc_markdown(result.stdout)


def clean_pandoc_markdown(md: str) -> str:
    """Post-process pandoc's Markdown output for dev.to compatibility."""
    # Strip Hugo read-more marker. Pandoc escapes HTML comments with backslashes,
    # producing \<!\--more\--\> from <!--more-->
    md = re.sub(r'\\?<\\?!\\?-+more\\?-+\\?>', '', md)

    # Remove section ID anchors like {#_overview} that pandoc adds
    md = re.sub(r'\s*\{#[^}]+\}', '', md)

    # Convert pandoc fenced-div blocks to readable Markdown.
    # Pandoc outputs AsciiDoc admonitions (NOTE/TIP/WARNING) as:
    #   :::: note
    #   ::: title
    #   Note
    #   :::
    #   content
    #   ::::
    # And titled code blocks (listing blocks with titles) as:
    #   :::: {}
    #   ::: title
    #   filename.sql
    #   :::
    #   ``` sql
    #   ...
    #   ::::
    def replace_div(m):
        kind = m.group(1).strip()   # e.g. "note", "tip", "{}"
        inner = m.group(2)
        # Extract the ::: title ... ::: content if present
        title_match = re.match(r'^::: title\n(.*?)\n:::\n\n?', inner, flags=re.DOTALL)
        if title_match:
            title_text = title_match.group(1).strip()
            inner = inner[title_match.end():]
        else:
            title_text = ""
        inner = inner.strip()

        # Generic div (e.g. titled code block) → bold label + content
        if kind in ("{}", ""):
            if title_text:
                return f"**{title_text}**\n\n{inner}\n"
            return inner + "\n"

        # Admonition → blockquote
        label = title_text or kind.capitalize()
        quoted = "\n".join(f"> {line}" if line else ">" for line in inner.splitlines())
        return f"> **{label}:**\n{quoted}\n"

    md = re.sub(
        r'^:{4}\s*(\S*)\n(.*?)^:{4}\s*$',
        replace_div,
        md,
        flags=re.MULTILINE | re.DOTALL,
    )

    return md


def handle_md_shortcodes(body: str) -> str:
    """Convert or strip Hugo shortcodes from Markdown body."""
    # {{< highlight lang [options] >}}...{{< /highlight >}} → fenced code block
    def replace_highlight(m):
        lang = m.group(1).strip().split()[0]  # first word is the language
        code = m.group(2)
        return f"```{lang}\n{code}\n```"

    body = re.sub(
        r'\{\{<\s*highlight\s+(.*?)\s*>\}\}(.*?)\{\{<\s*/highlight\s*>\}\}',
        replace_highlight,
        body,
        flags=re.DOTALL,
    )

    # {{< youtube VIDEO_ID >}} → linked text
    def replace_youtube(m):
        vid = m.group(1).strip()
        return f"[Watch on YouTube](https://www.youtube.com/watch?v={vid})"

    body = re.sub(r'\{\{<\s*youtube\s+(\S+)\s*>\}\}', replace_youtube, body)

    # {{< x TWEET_ID >}} or {{< tweet TWEET_ID >}} → strip (Twitter embeds don't work on dev.to)
    body = re.sub(r'\{\{<\s*(?:x|tweet)\s+[^>]+>\}\}', '', body)

    # Strip any remaining shortcodes (failsafe)
    body = re.sub(r'\{\{<[^>]+>\}\}', '', body)

    # Strip Hugo read-more marker
    body = re.sub(r'<!--\s*more\s*-->', '', body)

    return body


def fix_relative_urls(content: str) -> str:
    """Make relative image and link URLs absolute."""
    # Markdown images: ![alt](/path) → ![alt](https://rmoff.net/path)
    content = re.sub(
        r'!\[([^\]]*)\]\((/[^)]+)\)',
        lambda m: f'![{m.group(1)}]({SITE_BASE_URL}{m.group(2)})',
        content,
    )
    # Markdown links: [text](/path) → [text](https://rmoff.net/path)
    # Exclude already-absolute URLs and anchors
    content = re.sub(
        r'\[([^\]]+)\]\((/[^)]+)\)',
        lambda m: f'[{m.group(1)}]({SITE_BASE_URL}{m.group(2)})',
        content,
    )
    return content


def parse_date(raw_date) -> datetime | None:
    if isinstance(raw_date, datetime):
        return raw_date
    s = str(raw_date).strip()
    # Python 3.11+ fromisoformat handles most ISO 8601, but not trailing Z before 3.11
    s_fixed = s.replace("Z", "+00:00") if s.endswith("Z") else s
    try:
        return datetime.fromisoformat(s_fixed)
    except ValueError:
        pass
    # Fallback for bare date strings
    try:
        return datetime.strptime(s[:10], "%Y-%m-%d")
    except ValueError:
        return None


def get_canonical_url(fm: dict) -> str | None:
    """Derive canonical URL from frontmatter."""
    base = SITE_BASE_URL

    # Explicit url field (e.g. url: '/2025/12/18/a-love-letter-to-raycast/')
    if url := fm.get("url"):
        return base + url.rstrip("/") + "/"

    # Parse the date
    raw_date = fm.get("date")
    if not raw_date:
        return None
    dt = parse_date(raw_date)
    if not dt:
        return None

    date_path = f"{dt.year}/{dt.month:02d}/{dt.day:02d}"

    # Explicit slug
    if slug := fm.get("slug"):
        return f"{base}/{date_path}/{slug}/"

    # Derive slug from title
    title = fm.get("title", "")
    if not title:
        return None
    return f"{base}/{date_path}/{hugo_slugify(title)}/"


def get_devto_tags(fm: dict) -> list[str]:
    """Map Hugo categories to dev.to tags (max 4, alphanumeric only)."""
    categories = fm.get("categories") or fm.get("category") or fm.get("tag") or []
    if isinstance(categories, str):
        categories = [categories]

    # Normalise: lowercase, strip non-alphanumeric
    def normalise(c: str) -> str:
        return re.sub(r"[^a-z0-9]", "", c.lower())

    seen = []
    for cat in categories:
        tag = normalise(str(cat))
        if tag and tag not in seen:
            seen.append(tag)
        if len(seen) == 4:
            break
    return seen


def post_to_devto(
    title: str,
    body_markdown: str,
    canonical_url: str,
    tags: list[str],
    description: str = "",
    main_image: str = "",
    published: bool = False,
    api_key: str = "",
) -> dict:
    article: dict = {
        "title": title,
        "body_markdown": body_markdown,
        "canonical_url": canonical_url,
        "tags": tags,
        "published": published,
    }
    if description:
        article["description"] = description
    if main_image:
        article["main_image"] = main_image

    resp = requests.post(
        f"{DEVTO_API_URL}/articles",
        headers={"api-key": api_key, "Content-Type": "application/json"},
        json={"article": article},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def process_file(filepath: Path, dry_run: bool = False, api_key: str = "") -> bool:
    """Process one blog post file. Returns True on success."""
    print(f"\n→ {filepath}")

    content = filepath.read_text(encoding="utf-8")
    fm_str, body, fmt = strip_frontmatter(content)
    fm = parse_frontmatter(fm_str, fmt)

    # Skip drafts
    if fm.get("draft", False):
        print("  Skip: draft")
        return False

    # Skip posts originally published elsewhere
    if fm.get("original_url") or fm.get("original_source"):
        print("  Skip: originally published externally")
        return False

    title = str(fm.get("title", "")).strip()
    if not title:
        print("  Skip: no title")
        return False

    canonical_url = get_canonical_url(fm)
    if not canonical_url:
        print("  Skip: cannot determine canonical URL (no date/title)")
        return False

    # Convert body
    suffix = filepath.suffix.lower()
    if suffix == ".adoc":
        try:
            body = convert_adoc_to_markdown(body)
        except RuntimeError as e:
            print(f"  Error: {e}")
            return False
    elif suffix == ".md":
        body = handle_md_shortcodes(body)
    else:
        print(f"  Skip: unknown extension {suffix}")
        return False

    body = fix_relative_urls(body)

    tags = get_devto_tags(fm)
    description = str(fm.get("description", "") or "")

    main_image = str(fm.get("image", "") or "")
    if main_image.startswith("/"):
        main_image = SITE_BASE_URL + main_image

    print(f"  Title:     {title}")
    print(f"  Canonical: {canonical_url}")
    print(f"  Tags:      {tags}")
    if main_image:
        print(f"  Image:     {main_image}")

    if dry_run:
        print("  [dry-run] Would POST to dev.to as draft")
        return True

    try:
        result = post_to_devto(
            title=title,
            body_markdown=body,
            canonical_url=canonical_url,
            tags=tags,
            description=description,
            main_image=main_image,
            published=False,
            api_key=api_key,
        )
        devto_url = result.get("url", "?")
        devto_id = result.get("id", "?")
        print(f"  Created draft: {devto_url} (id={devto_id})")
        return True
    except requests.HTTPError as e:
        print(f"  Error: HTTP {e.response.status_code}: {e.response.text[:200]}")
        return False


def get_new_files_in_commit(repo_root: Path) -> list[Path]:
    """Return content/post/ files newly added in the most recent commit."""
    result = subprocess.run(
        ["git", "diff", "--name-only", "--diff-filter=A", "HEAD~1", "HEAD", "--", "content/post/"],
        capture_output=True,
        text=True,
        cwd=repo_root,
    )
    files = []
    for line in result.stdout.splitlines():
        p = repo_root / line.strip()
        if p.suffix.lower() in (".md", ".adoc") and p.exists():
            files.append(p)
    return files


def main():
    parser = argparse.ArgumentParser(description="Cross-post blog articles to dev.to")
    parser.add_argument("files", nargs="*", type=Path, help="Blog post files to post")
    parser.add_argument(
        "--new-in-commit",
        action="store_true",
        help="Auto-detect files newly added in the most recent git commit",
    )
    parser.add_argument("--dry-run", action="store_true", help="Print what would happen, no API calls")
    args = parser.parse_args()

    api_key = os.environ.get("DEVTO_API_KEY", "")
    if not api_key and not args.dry_run:
        print("Error: DEVTO_API_KEY environment variable not set", file=sys.stderr)
        sys.exit(1)

    repo_root = Path(__file__).parent.parent

    if args.new_in_commit:
        files = get_new_files_in_commit(repo_root)
        if not files:
            print("No new content/post/ files in latest commit.")
            return
        print(f"Found {len(files)} new post(s) in latest commit:")
        for f in files:
            print(f"  {f}")
    elif args.files:
        files = [Path(f) for f in args.files]
    else:
        parser.print_help()
        sys.exit(1)

    ok = err = skipped = 0
    for f in files:
        if not f.exists():
            print(f"\n→ {f}\n  Error: file not found")
            err += 1
            continue
        result = process_file(f, dry_run=args.dry_run, api_key=api_key)
        if result is True:
            ok += 1
        elif result is False:
            # Could be skip or error — process_file printed the reason
            skipped += 1

    print(f"\nDone: {ok} posted, {skipped} skipped/errored")


if __name__ == "__main__":
    main()
