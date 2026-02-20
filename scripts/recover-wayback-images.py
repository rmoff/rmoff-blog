#!/usr/bin/env python3
"""Recover broken blogspot images from Wayback Machine."""

import re
import json
import hashlib
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse, unquote, quote
from io import BytesIO

import requests
from PIL import Image

POSTS_DIR = Path('content/post/rnm1978')
IMAGES_DIR = Path('static/images')
WEBP_QUALITY = 85
REQUEST_TIMEOUT = 30

def get_wayback_url(original_url: str) -> str | None:
    """Check Wayback Machine for archived version of URL."""
    api_url = f"http://archive.org/wayback/available?url={quote(original_url, safe='')}"
    try:
        response = requests.get(api_url, timeout=REQUEST_TIMEOUT)
        data = response.json()
        snapshots = data.get('archived_snapshots', {})
        closest = snapshots.get('closest', {})
        if closest.get('available'):
            return closest.get('url')
    except Exception as e:
        print(f"  Error checking Wayback: {e}")
    return None


def download_and_convert(url: str, dest_dir: Path, filename_base: str) -> str | None:
    """Download image and convert to WebP."""
    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()

        img = Image.open(BytesIO(response.content))

        # Convert to RGB if necessary
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[-1])
            else:
                background.paste(img)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # Clean filename
        clean_name = re.sub(r'[^\w\-]', '_', filename_base)
        webp_filename = f'{clean_name}.webp'
        dest_path = dest_dir / webp_filename

        # Handle collision
        if dest_path.exists():
            url_hash = hashlib.md5(url.encode()).hexdigest()[:6]
            webp_filename = f'{clean_name}_{url_hash}.webp'
            dest_path = dest_dir / webp_filename

        img.save(dest_path, 'WEBP', quality=WEBP_QUALITY)
        return '/' + str(dest_path.relative_to('static'))

    except Exception as e:
        print(f"  Error downloading: {e}")
        return None


def main():
    # Find all blogspot image URLs
    blogspot_pattern = re.compile(r'https?://[0-9]+\.bp\.blogspot\.com/[^)"\'>\s]+')
    wp_blogspot_pattern = re.compile(r'https?://i[0-9]\.wp\.com/[0-9]+\.bp\.blogspot\.com/[^)"\'>\s]+')

    # Collect all URLs and their locations
    url_locations = {}  # url -> list of (file, line)

    for md_file in POSTS_DIR.glob('*.md'):
        content = md_file.read_text()

        for pattern in [blogspot_pattern, wp_blogspot_pattern]:
            for match in pattern.finditer(content):
                url = match.group(0)
                # Normalize: remove wp.com proxy prefix
                if 'wp.com' in url:
                    # Extract the actual blogspot URL
                    actual_url = re.sub(r'https?://i[0-9]\.wp\.com/', 'http://', url)
                else:
                    actual_url = url

                if actual_url not in url_locations:
                    url_locations[actual_url] = []
                url_locations[actual_url].append(md_file)

    print(f"Found {len(url_locations)} unique blogspot image URLs")

    # Process each URL
    recovered = 0
    failed = 0
    url_mapping = {}  # original_url -> new_path

    for url in url_locations:
        print(f"\nProcessing: {url[:80]}...")

        # Check Wayback Machine
        wayback_url = get_wayback_url(url)
        if not wayback_url:
            print(f"  ✗ Not found in Wayback Machine")
            failed += 1
            continue

        print(f"  Found in Wayback: {wayback_url[:60]}...")

        # Extract filename from URL
        parsed = urlparse(url)
        filename = Path(unquote(parsed.path)).stem

        # Determine date folder (use 2009 as default for old blogspot)
        year_month_dir = IMAGES_DIR / '2009' / '07'
        year_month_dir.mkdir(parents=True, exist_ok=True)

        # Download and convert
        new_path = download_and_convert(wayback_url, year_month_dir, filename)
        if new_path:
            url_mapping[url] = new_path
            recovered += 1
            print(f"  ✓ Recovered: {new_path}")
        else:
            failed += 1

    # Update markdown files
    print(f"\n\nUpdating markdown files...")
    files_updated = 0

    for md_file in POSTS_DIR.glob('*.md'):
        content = md_file.read_text()
        original = content

        for old_url, new_path in url_mapping.items():
            # Replace both the direct URL and wp.com proxied versions
            content = content.replace(old_url, new_path)
            # Also replace wp.com version
            wp_url = old_url.replace('http://', 'https://i0.wp.com/')
            content = content.replace(wp_url, new_path)

        if content != original:
            md_file.write_text(content)
            files_updated += 1

    print(f"\n{'='*60}")
    print(f"Recovery Complete!")
    print(f"{'='*60}")
    print(f"Recovered: {recovered} images")
    print(f"Failed: {failed} images")
    print(f"Files updated: {files_updated}")


if __name__ == '__main__':
    main()
