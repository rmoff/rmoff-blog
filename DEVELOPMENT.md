# Development Guide - rmoff.net Blog

This is the source for [rmoff.net](https://rmoff.net), built using Hugo and hosted via GitHub Pages.

## Quick Start

```bash
./serve.sh
```

Then visit: http://localhost:1313

To run on a different port (e.g. for worktrees): `./serve.sh 1314`

This builds the Docker image from the Dockerfile and starts the Hugo dev server.

## Tech Stack

- **Hugo**: see `Dockerfile` for current version (static site generator)
- **Content**: Markdown and AsciiDoc
- **Presentations**: Reveal.js (built from AsciiDoc)
- **Theme**: Story (customized, unmaintained)
- **Deployment**: GitHub Pages (live) + CloudFlare Pages (previews)
- **Build System**: Docker — all environments build from the same Dockerfile

## Build System Architecture

All environments build the Docker image from the Dockerfile at that commit. This guarantees what you test locally is exactly what runs in CI and production.

```
Local Dev:    docker build + docker run  (./serve.sh)
PR Previews:  docker build + docker run  (GitHub Actions)
Production:   docker build + docker run  (GitHub Actions)
```

**Docker image includes:**
- Hugo Extended
- AsciiDoctor + AsciiDoctor-Reveal.js
- Rouge 3.30.0 (syntax highlighting) + custom `sql+jinja` lexer
- Alpine Linux base

**Hugo version is defined in one place:** the `FROM` line in `Dockerfile`.

## Development Workflows

### Creating a New Post

```bash
id=my-new-post-slug
git checkout main && git pull && git checkout -b $id

docker build -t rmoff-blog:local .
docker run --rm -it \
  -v $(pwd):/src \
  rmoff-blog:local \
  new content/post/$id.adoc
```

### Building Locally

**Full build:**
```bash
docker build -t rmoff-blog:local .
docker run --rm -v $(pwd):/src rmoff-blog:local
```

**Build with drafts and future posts:**
```bash
docker run --rm -v $(pwd):/src rmoff-blog:local --buildDrafts --buildFuture
```

### Building Presentations

Reveal.js presentations are stored in `content/talk/` as `slides.adoc` files.

```bash
./build-slides.sh
```

This requires local installation of:
```bash
gem install asciidoctor asciidoctor-revealjs
```

Presentations are automatically built before Hugo in CI/CD workflows.

### Link Checking

```bash
docker build -t rmoff-blog:local .
mkdir /tmp/hugo_public && \
docker run --rm -v $(pwd):/src -v /tmp/hugo_public:/tmp/public \
  rmoff-blog:local --buildFuture --buildDrafts -d /tmp/public && \
docker run -v /tmp/hugo_public:/check ghcr.io/untitaker/hyperlink:0.1.26 /check && \
rm -rf /tmp/hugo_public
```

Link checking also runs automatically on PRs.

### dev.to Cross-Posting

New blog posts pushed to `main` are automatically cross-posted to [dev.to](https://dev.to/rmoff) via the `devto-crosspost` GitHub Actions workflow.

**Update an existing article:**
```bash
DEVTO_API_KEY=<key> python scripts/devto_post.py --update-draft <ARTICLE_ID> content/post/my-post.adoc
```

**Manual cross-posting:**
```bash
# Publish directly
DEVTO_API_KEY=<key> python scripts/devto_post.py content/post/my-post.adoc

# Create as draft
DEVTO_API_KEY=<key> python scripts/devto_post.py --draft content/post/my-post.adoc

# Dry run
python scripts/devto_post.py --dry-run content/post/my-post.adoc
```

**Known limitation:** SVG images are broken on dev.to — their CDN proxy cannot render SVGs.

## CI/CD Pipeline

All workflows build the Docker image from the Dockerfile — no pre-built images or registries involved.

### Live Deployment (main branch)

**Workflow:** `.github/workflows/gh-pages-deployment.yml`

1. Builds Docker image from Dockerfile
2. Builds reveal.js presentations (local AsciiDoctor)
3. Builds site with Docker
4. Deploys to `rmoff/rmoff.github.io` (GitHub Pages)

**URL:** https://rmoff.net

### PR Previews

**Workflow:** `.github/workflows/preview-blog-cloudflare.yaml`

1. Builds Docker image from Dockerfile
2. Builds reveal.js presentations
3. Builds site with Docker
4. Deploys to CloudFlare Pages

**URL:** https://preview.rmoff.net/

### Link Checking

**Workflow:** `.github/workflows/pr_check_links.yaml`

1. Builds Docker image from Dockerfile
2. Builds site with Docker
3. Runs hyperlink checker

## Common Tasks

### Update Hugo Version

1. Edit `Dockerfile` — change the `FROM hugomods/hugo:X.Y.Z` line
2. Test locally: `./serve.sh` and run Playwright tests
3. Commit and push — CI will build the new image automatically

That's it. No other files to update.

### Add New Dependencies to Docker Image

1. Edit `Dockerfile`
2. Test locally: `./serve.sh`
3. Commit and push

## Project Structure

```
rmoff-blog/
├── .github/workflows/       # CI/CD workflows
├── .claude/CLAUDE.md         # Claude Code instructions
├── content/
│   ├── post/                # Blog posts (Markdown & AsciiDoc)
│   └── talk/                # Presentations (AsciiDoc -> Reveal.js)
├── layouts/                  # Hugo templates (overrides theme)
├── lib/                      # Custom Rouge lexers (sql+jinja)
├── themes/story/             # Hugo theme (customized, unmaintained)
├── static/                   # Static assets (CSS, images, JS)
├── scripts/                  # Utility scripts (cross-posting, etc.)
├── tests/                    # Playwright tests
├── config.yaml               # Hugo configuration
├── Dockerfile                # Docker image definition (Hugo version lives here)
├── serve.sh                  # Local dev server script
├── build-slides.sh           # Presentation build script
└── DEVELOPMENT.md            # This file
```

## Troubleshooting

**Workflows failing with permission errors:**
- Check workflow has required permissions block
- CloudFlare workflow needs: `deployments: write`

**Push rejected from local machine:**
- Normal! Use the git-sync workflow via `~/work/git-sync.sh --push`

## Upgrade History

- **2026-03**: Upgraded Hugo 0.152.2 -> 0.157.0; added custom `sql+jinja` Rouge lexer
- **2026-03**: Simplified build: all environments build from Dockerfile (no GHCR)
- **2024-12**: Upgraded Hugo 0.105.0 -> 0.152.2; migrated to Docker-only builds
- **2024-12**: Fixed CloudFlare preview workflow; removed Surge preview
