# Development Guide - rmoff.net Blog

This is the source for [rmoff.net](https://rmoff.net), built using Hugo and hosted via GitHub Pages.

## Quick Start

**Run the development server:**
```bash
docker run --rm -it \
  -v $(pwd):/src \
  -p 1313:1313 \
  ghcr.io/rmoff/rmoff-blog:0.157.0 \
  server --bind 0.0.0.0
```

Then visit: http://localhost:1313

## Tech Stack

- **Hugo**: 0.157.0 (static site generator)
- **Content**: Markdown and AsciiDoc
- **Presentations**: Reveal.js (built from AsciiDoc)
- **Theme**: Story (customized, unmaintained)
- **Deployment**: GitHub Pages (live) + CloudFlare Pages (previews)
- **Build System**: Docker (for consistency across environments)

## Build System Architecture

All environments use the same Docker image for consistency:

```
Local Dev:    ghcr.io/rmoff/rmoff-blog:0.157.0
PR Previews:  ghcr.io/rmoff/rmoff-blog:0.157.0
Production:   ghcr.io/rmoff/rmoff-blog:0.157.0
```

**Docker image includes:**
- Hugo 0.157.0 Extended
- AsciiDoctor + AsciiDoctor-Reveal.js
- Rouge 3.30.0 (syntax highlighting) + custom `sql+jinja` lexer
- Alpine Linux base

**Multi-platform support:**
- linux/amd64 (GitHub Actions runners)
- linux/arm64 (M1/M2 Macs)

## Development Workflows

### Creating a New Post

```bash
id=my-new-post-slug
git checkout main && git pull && git checkout -b $id

docker run --rm -it \
  -v $(pwd):/src \
  ghcr.io/rmoff/rmoff-blog:0.157.0 \
  new content/post/$id.adoc
```

### Building Locally

**Full build:**
```bash
docker run --rm -v $(pwd):/src ghcr.io/rmoff/rmoff-blog:0.157.0
```

**Build with drafts and future posts:**
```bash
docker run --rm -v $(pwd):/src ghcr.io/rmoff/rmoff-blog:0.157.0 --buildDrafts --buildFuture
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
mkdir /tmp/hugo_public && \
docker run --rm -v $(pwd):/src -v /tmp/hugo_public:/tmp/public \
  ghcr.io/rmoff/rmoff-blog:0.157.0 --buildFuture --buildDrafts -d /tmp/public && \
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

### Live Deployment (main branch)

**Workflow:** `.github/workflows/gh-pages-deployment.yml`

1. If `Dockerfile` or `lib/` changed, rebuilds the Docker image first
2. Builds reveal.js presentations (local AsciiDoctor)
3. Builds site with Docker
4. Deploys to `rmoff/rmoff.github.io` (GitHub Pages)

**URL:** https://rmoff.net

### PR Previews

**Workflow:** `.github/workflows/preview-blog-cloudflare.yaml`

1. Builds reveal.js presentations
2. Builds site with Docker
3. Deploys to CloudFlare Pages

**URL:** https://preview.rmoff.net/

### Docker Image Build

**Workflow:** `.github/workflows/docker-image.yml`

**Triggers:** Manual (workflow_dispatch) or called by deploy workflow when needed.

**Outputs:**
- `ghcr.io/rmoff/rmoff-blog:0.157.0`
- `ghcr.io/rmoff/rmoff-blog:latest`
- `ghcr.io/rmoff/rmoff-blog:<branch>-<sha>`

### Building the Docker Image Locally

If you need to modify the Dockerfile:

```bash
docker build -t rmoff-blog-hugo:local .

docker run --rm -it \
  -v $(pwd):/src \
  -p 1313:1313 \
  rmoff-blog-hugo:local \
  server --bind 0.0.0.0
```

## Common Tasks

### Update Hugo Version

1. Edit `Dockerfile` — change Hugo base image version
2. Update version in all workflow files (`.github/workflows/`)
3. Update version references in `README.adoc`, `DEVELOPMENT.md`, `.claude/CLAUDE.md`
4. Test locally with full Playwright suite
5. Commit and push
6. Docker image will auto-build on deploy
7. Create PR to test preview deployment
8. Merge to deploy to production

### Add New Dependencies to Docker Image

1. Edit `Dockerfile`
2. Build locally and test
3. Commit and push — image auto-rebuilds on deploy

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
├── Dockerfile                # Docker image definition
├── build-slides.sh           # Presentation build script
└── DEVELOPMENT.md            # This file
```

## Troubleshooting

**Docker image not pulling:**
- Check package visibility: https://github.com/rmoff/rmoff-blog/pkgs/container/rmoff-blog
- Must be set to "Public"

**Workflows failing with permission errors:**
- Check workflow has required permissions block
- Docker workflows need: `packages: read`
- CloudFlare workflow needs: `deployments: write`

**ARM64 Mac can't pull image:**
- Ensure Dockerfile builds are multi-platform
- Check `.github/workflows/docker-image.yml` has: `platforms: linux/amd64,linux/arm64`

**Push rejected from local machine:**
- Normal! Use the git-sync workflow via `~/work/git-sync.sh --push`

## Upgrade History

- **2026-03**: Upgraded Hugo 0.152.2 -> 0.157.0; added custom `sql+jinja` Rouge lexer
- **2024-12**: Upgraded Hugo 0.105.0 -> 0.152.2; migrated to Docker-only builds
- **2024-12**: Fixed CloudFlare preview workflow; removed Surge preview
- **2024-12**: Added multi-platform Docker support
