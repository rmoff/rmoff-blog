#!/usr/bin/env python3
import os
import requests
import json

# --- Configuration ---
# It's recommended to use an environment variable for the API token
# export RAINDROP_TOKEN='your_token'
API_TOKEN = os.getenv('RAINDROP_TOKEN')
API_BASE_URL = 'https://api.raindrop.io/rest/v1'
COLLECTION_ID = 38760161

HEADERS = {
    'Authorization': f'Bearer {API_TOKEN}'
}

# --- Functions ---

def get_raindrops_from_collection(collection_id):
    """Fetches all raindrops from a specific collection."""
    if not collection_id:
        return None

    raindrops = []
    page = 0
    while True:
        try:
            params = {'page': page, 'perpage': 50}
            response = requests.get(f'{API_BASE_URL}/raindrops/{collection_id}', headers=HEADERS, params=params)
            response.raise_for_status()
            data = response.json()

            if data['items']:
                raindrops.extend(data['items'])
                page += 1
            else:
                break # No more items
        except requests.exceptions.RequestException as e:
            print(f"Error fetching raindrops: {e}")
            return None
    return raindrops

def write_adoc_file(raindrops, adoc_file_path):
    """Writes the fetched links to an AsciiDoc file."""
    from urllib.parse import urlparse, urlunparse

    try:
        with open(adoc_file_path, 'w') as f:
            f.write("== Fetched Links\n\n")
            for drop in raindrops:
                # Strip query parameters from the link
                parsed_url = urlparse(drop['link'])
                clean_url = urlunparse(parsed_url._replace(query='', fragment=''))
                f.write(f"* {clean_url}[{drop['title']}]\n")

        print(f"Successfully wrote {len(raindrops)} links to '{adoc_file_path}'")
    except Exception as e:
        print(f"An error occurred while writing the AsciiDoc file: {e}")


# --- Main script ---

if __name__ == '__main__':
    adoc_file = '/Users/rmoff/git/rmoff-blog/fetched_links.adoc'
    print(f"Fetching raindrops from collection ID: {COLLECTION_ID}...")
    raindrops = get_raindrops_from_collection(COLLECTION_ID)

    if raindrops:
        print(f"Found {len(raindrops)} raindrops.")
        write_adoc_file(raindrops, adoc_file)
    else:
        print("No raindrops found in the collection.")
