#!/usr/bin/env python3
"""wordpress-to-hugo.py - Convert WordPress export to Hugo posts.

Converts WordPress.com REST API JSON exports to Hugo-compatible Markdown posts
with WebP images organized by date.
"""

import json
import re
import html
import sys
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse, unquote
from io import BytesIO
from typing import Optional
import hashlib

import requests
from PIL import Image
from bs4 import BeautifulSoup
from markdownify import markdownify as md, MarkdownConverter


# Configuration
WORDPRESS_JSON_FILES = ['wp_posts_1.json', 'wp_posts_2.json']
OUTPUT_POSTS_DIR = Path('content/post/rnm1978')
OUTPUT_IMAGES_DIR = Path('static/images')
WEBP_QUALITY = 85
REQUEST_TIMEOUT = 30


class CustomMarkdownConverter(MarkdownConverter):
    """Custom converter to handle WordPress-specific HTML elements."""

    def convert_pre(self, el, text, convert_as_inline):
        """Handle pre tags, which often contain code."""
        # Check if there's a code tag inside
        code = el.find('code')
        if code:
            return self.convert_code(code, code.get_text(), convert_as_inline)

        # Plain pre tag
        code_text = el.get_text().strip()
        return f'\n```\n{code_text}\n```\n'

    def convert_code(self, el, text, convert_as_inline):
        """Handle code tags with language detection."""
        # Check for language class
        classes = el.get('class', [])
        lang = ''
        for cls in classes:
            if cls.startswith('language-'):
                lang = cls.replace('language-', '')
                break

        if el.parent and el.parent.name == 'pre':
            # Block code
            code_text = el.get_text().strip()
            return f'\n```{lang}\n{code_text}\n```\n'
        else:
            # Inline code
            return f'`{text}`'


def convert_html_to_markdown(html_content: str) -> str:
    """Convert HTML to Markdown using custom converter."""
    return md(html_content,
              strip=['script', 'style'],
              heading_style='atx',
              bullets='-',
              code_language_callback=None)


def convert_sourcecode_blocks(content: str) -> str:
    """Convert WordPress [sourcecode] shortcodes to fenced code blocks."""
    # Handle [sourcecode language="X"] and [sourcecode lang="X"]
    pattern = r'\[sourcecode(?:\s+(?:language|lang)=["\']?(\w+)["\']?)?\s*\](.*?)\[/sourcecode\]'

    def repl(m):
        lang = m.group(1) or ''
        code = html.unescape(m.group(2).strip())
        # Map some language names
        lang_map = {
            'bash': 'bash',
            'shell': 'bash',
            'sql': 'sql',
            'xml': 'xml',
            'java': 'java',
            'javascript': 'javascript',
            'js': 'javascript',
            'python': 'python',
            'text': '',
            'plain': '',
        }
        lang = lang_map.get(lang.lower(), lang.lower())
        return f'\n```{lang}\n{code}\n```\n'

    return re.sub(pattern, repl, content, flags=re.DOTALL | re.IGNORECASE)


def convert_code_blocks(content: str) -> str:
    """Convert WordPress [code] shortcodes to fenced code blocks."""
    pattern = r'\[code(?:\s+(?:language|lang)=["\']?(\w+)["\']?)?\s*\](.*?)\[/code\]'

    def repl(m):
        lang = m.group(1) or ''
        code = html.unescape(m.group(2).strip())
        return f'\n```{lang}\n{code}\n```\n'

    return re.sub(pattern, repl, content, flags=re.DOTALL | re.IGNORECASE)


def convert_escaped_sourcecode_blocks(content: str) -> str:
    """Convert escaped [sourcecode] shortcodes that appear after markdown conversion."""
    # Handle escaped shortcodes like \[sourcecode\] or \\[sourcecode\\]
    patterns = [
        # Escaped with backslashes
        (r'\\?\[sourcecode(?:\s+(?:language|lang)=["\']?(\w+)["\']?)?\s*\\?\](.*?)\\?\[/sourcecode\\?\]', True),
        # HTML-escaped brackets
        (r'&#91;sourcecode(?:\s+(?:language|lang)=["\']?(\w+)["\']?)?\s*&#93;(.*?)&#91;/sourcecode&#93;', False),
    ]

    def repl(m, needs_unescape=True):
        lang = m.group(1) or ''
        code = m.group(2).strip()
        if needs_unescape:
            code = html.unescape(code)
        # Map language names
        lang_map = {
            'bash': 'bash', 'shell': 'bash', 'sql': 'sql', 'xml': 'xml',
            'java': 'java', 'javascript': 'javascript', 'js': 'javascript',
            'python': 'python', 'text': '', 'plain': '',
        }
        lang = lang_map.get(lang.lower(), lang.lower()) if lang else ''
        return f'\n```{lang}\n{code}\n```\n'

    for pattern, needs_unescape in patterns:
        content = re.sub(pattern, lambda m: repl(m, needs_unescape), content, flags=re.DOTALL | re.IGNORECASE)

    return content


def convert_caption_shortcodes(content: str) -> str:
    """Convert WordPress [caption] shortcodes to Markdown figures."""
    # Pattern: [caption id="..." align="..." width="..."]<img>Caption text[/caption]
    pattern = r'\[caption[^\]]*\](.*?)\[/caption\]'

    def repl(m):
        inner = m.group(1).strip()
        # Extract image and caption
        soup = BeautifulSoup(inner, 'html.parser')
        img = soup.find('img')

        if img:
            # Get the remaining text as caption
            img_str = str(img)
            caption = inner.replace(img_str, '').strip()
            # Convert the img to markdown later, just restructure here
            return f'{img_str}\n*{caption}*\n'

        return inner

    return re.sub(pattern, repl, content, flags=re.DOTALL | re.IGNORECASE)


def extract_image_urls(content: str) -> list[str]:
    """Extract all WordPress image URLs from content."""
    urls = []

    # Find all URLs pointing to wordpress.com files
    patterns = [
        r'https?://rnm1978\.files\.wordpress\.com/[^\s"\'<>\)]+',
        r'https?://rnm1978\.wordpress\.com/wp-content/uploads/[^\s"\'<>\)]+',
        r'https?://[^\s"\'<>\)]*\.wp\.com/[^\s"\'<>\)]+',
    ]

    for pattern in patterns:
        matches = re.findall(pattern, content)
        urls.extend(matches)

    # Clean URLs (remove query params that aren't needed, but keep format-related ones)
    cleaned = []
    for url in urls:
        # Remove trailing punctuation that might have been captured
        url = url.rstrip('.,;:')
        if url not in cleaned:
            cleaned.append(url)

    return cleaned


def download_image_as_webp(url: str, dest_dir: Path, post_date: datetime) -> Optional[str]:
    """Download image and convert to WebP, returning the new relative path."""
    try:
        # Parse the URL to get filename
        parsed = urlparse(url)
        original_filename = Path(unquote(parsed.path)).name

        # Remove query parameters from filename
        original_filename = original_filename.split('?')[0]

        # Create destination directory based on post date
        year_month_dir = dest_dir / str(post_date.year) / f'{post_date.month:02d}'
        year_month_dir.mkdir(parents=True, exist_ok=True)

        # Create WebP filename
        name_without_ext = Path(original_filename).stem
        # Clean up the filename
        name_without_ext = re.sub(r'[^\w\-]', '_', name_without_ext)
        webp_filename = f'{name_without_ext}.webp'
        dest_path = year_month_dir / webp_filename

        # Handle filename collisions by adding hash
        if dest_path.exists():
            url_hash = hashlib.md5(url.encode()).hexdigest()[:6]
            webp_filename = f'{name_without_ext}_{url_hash}.webp'
            dest_path = year_month_dir / webp_filename

        # Download the image
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()

        # Open and convert to WebP
        img = Image.open(BytesIO(response.content))

        # Convert to RGB if necessary (for PNG with transparency, etc.)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create white background for transparent images
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # Save as WebP
        img.save(dest_path, 'WEBP', quality=WEBP_QUALITY)

        # Return the Hugo-compatible path (relative to static/)
        relative_path = '/' + str(dest_path.relative_to('static'))
        print(f'  ✓ Downloaded: {original_filename} → {webp_filename}')
        return relative_path

    except Exception as e:
        print(f'  ✗ Failed to download {url}: {e}')
        return None


def replace_image_urls(content: str, url_mapping: dict[str, str]) -> str:
    """Replace WordPress image URLs with local WebP paths."""
    for old_url, new_path in url_mapping.items():
        # Handle various URL formats in the content
        # Escape special regex characters in URL
        escaped_url = re.escape(old_url)
        # Also handle URL with different query params
        base_url = old_url.split('?')[0]
        escaped_base = re.escape(base_url)

        # Replace exact URL
        content = content.replace(old_url, new_path)

        # Replace URL with any query params
        content = re.sub(
            escaped_base + r'(?:\?[^\s"\'<>\)]+)?',
            new_path,
            content
        )

    return content


def generate_slug(title: str, date: datetime) -> str:
    """Generate a URL-friendly slug from the title."""
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = slug.strip('-')
    return slug[:80]  # Limit length


def add_excerpt_marker(content: str) -> str:
    """Add <!--more--> after the first paragraph."""
    # Find the first paragraph break (double newline)
    lines = content.split('\n')
    result = []
    added_marker = False
    blank_line_count = 0

    for i, line in enumerate(lines):
        result.append(line)

        # After first substantial paragraph, add marker
        if not added_marker and line.strip() == '':
            blank_line_count += 1
            # Add after first paragraph (first blank line after content)
            if blank_line_count == 1 and i > 0 and lines[i-1].strip():
                result.append('<!--more-->')
                added_marker = True

    return '\n'.join(result)


def extract_categories(post: dict) -> list[str]:
    """Extract categories from post data."""
    categories = []

    # WordPress API returns categories as a dict with slug: data pairs
    cats = post.get('categories', {})
    for slug, data in cats.items():
        if isinstance(data, dict):
            name = data.get('name', slug)
        else:
            name = slug
        categories.append(name)

    return categories


def convert_post(post: dict, output_dir: Path, images_dir: Path) -> Optional[Path]:
    """Convert a single WordPress post to Hugo markdown."""
    title = html.unescape(post.get('title', 'Untitled'))
    date_str = post.get('date', '')
    slug = post.get('slug', '')
    content_html = post.get('content', '')

    # Parse date
    try:
        # WordPress API date format: "2017-12-15T13:45:00+00:00"
        post_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except (ValueError, TypeError):
        print(f'  ✗ Could not parse date: {date_str}')
        post_date = datetime.now()

    print(f'Converting: {title[:60]}...')

    # Process content
    content = content_html

    # Convert WordPress shortcodes first (before HTML conversion)
    content = convert_sourcecode_blocks(content)
    content = convert_code_blocks(content)
    content = convert_caption_shortcodes(content)

    # Download and replace images
    image_urls = extract_image_urls(content)
    url_mapping = {}
    first_image = None

    for url in image_urls:
        new_path = download_image_as_webp(url, images_dir, post_date)
        if new_path:
            url_mapping[url] = new_path
            if first_image is None:
                first_image = new_path

    # Replace image URLs in content
    content = replace_image_urls(content, url_mapping)

    # Convert HTML to Markdown
    content = convert_html_to_markdown(content)

    # Handle any shortcodes that got escaped during markdown conversion
    content = convert_escaped_sourcecode_blocks(content)

    # Clean up common issues
    content = re.sub(r'\n{3,}', '\n\n', content)  # Multiple blank lines
    content = content.strip()

    # Add excerpt marker
    content = add_excerpt_marker(content)

    # Extract categories
    categories = extract_categories(post)

    # Generate front matter
    front_matter_lines = [
        '---',
        'draft: false',
        f"title: '{title.replace(chr(39), chr(39)+chr(39))}'",  # Escape single quotes
        f'date: "{post_date.strftime("%Y-%m-%dT%H:%M:%S%z")}"',
    ]

    if first_image:
        front_matter_lines.append(f'image: "{first_image}"')

    if categories:
        front_matter_lines.append('categories:')
        for cat in categories:
            front_matter_lines.append(f'- {cat}')

    front_matter_lines.append('---')
    front_matter = '\n'.join(front_matter_lines)

    # Combine front matter and content
    full_content = f'{front_matter}\n\n{content}\n'

    # Generate filename
    if not slug:
        slug = generate_slug(title, post_date)
    filename = f'{slug}.md'

    # Write to file
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / filename

    # Handle filename collision
    if output_path.exists():
        date_prefix = post_date.strftime('%Y%m%d')
        filename = f'{date_prefix}-{slug}.md'
        output_path = output_dir / filename

    output_path.write_text(full_content, encoding='utf-8')

    return output_path


def load_posts_from_json(json_files: list[str]) -> list[dict]:
    """Load posts from WordPress API JSON files."""
    all_posts = []

    for json_file in json_files:
        filepath = Path(json_file)
        if not filepath.exists():
            print(f'Warning: {json_file} not found, skipping')
            continue

        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        posts = data.get('posts', [])
        all_posts.extend(posts)
        print(f'Loaded {len(posts)} posts from {json_file}')

    return all_posts


def main():
    """Main entry point."""
    print('=' * 60)
    print('WordPress to Hugo Migration')
    print('=' * 60)
    print()

    # Load posts
    posts = load_posts_from_json(WORDPRESS_JSON_FILES)

    if not posts:
        print('No posts found! Make sure wp_posts_*.json files exist.')
        sys.exit(1)

    print(f'\nTotal posts to convert: {len(posts)}')
    print()

    # Create output directories
    OUTPUT_POSTS_DIR.mkdir(parents=True, exist_ok=True)

    # Convert posts
    success_count = 0
    error_count = 0
    total_images = 0

    for i, post in enumerate(posts, 1):
        print(f'\n[{i}/{len(posts)}] ', end='')
        try:
            output_path = convert_post(post, OUTPUT_POSTS_DIR, OUTPUT_IMAGES_DIR)
            if output_path:
                success_count += 1
        except Exception as e:
            print(f'  ✗ Error: {e}')
            error_count += 1

    # Summary
    print()
    print('=' * 60)
    print('Migration Complete!')
    print('=' * 60)
    print(f'Successfully converted: {success_count} posts')
    print(f'Errors: {error_count} posts')
    print(f'Output directory: {OUTPUT_POSTS_DIR}')
    print()

    # Reminder for next steps
    print('Next steps:')
    print('1. Run Hugo to check for build errors:')
    print('   docker run --rm -v $(pwd):/src ghcr.io/rmoff/rmoff-blog:0.152.2 --gc')
    print()
    print('2. Check for remaining WordPress references:')
    print(f'   grep -r "wordpress.com" {OUTPUT_POSTS_DIR}')
    print(f'   grep -r "\\[sourcecode" {OUTPUT_POSTS_DIR}')
    print()
    print('3. Start Hugo server to visually inspect:')
    print('   docker run --rm -it -v $(pwd):/src -p 1313:1313 \\')
    print('     ghcr.io/rmoff/rmoff-blog:0.152.2 server --bind 0.0.0.0')


if __name__ == '__main__':
    main()
