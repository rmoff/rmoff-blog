# Development Guide - rmoff.net Blog

This is the source for [rmoff.net](https://rmoff.net), built using Hugo and hosted via GitHub Pages.

## Quick Start

**Run the development server:**
```bash
docker run --rm -it \
  -v $(pwd):/src \
  -p 1313:1313 \
  ghcr.io/rmoff/rmoff-blog:0.152.2 \
  server --bind 0.0.0.0
```

Then visit: http://localhost:1313

## Tech Stack

- **Hugo**: 0.152.2 (static site generator)
- **Content**: Markdown and AsciiDoc
- **Presentations**: Reveal.js (built from AsciiDoc)
- **Theme**: Story (customized, unmaintained)
- **Deployment**: GitHub Pages (live) + CloudFlare Pages (previews)
- **Build System**: Docker (for consistency across environments)

## Build System Architecture

### Docker-Based Builds

All environments (local, preview, production) use the same Docker image for consistency:

```
Local Dev:    ghcr.io/rmoff/rmoff-blog:0.152.2
PR Previews:  ghcr.io/rmoff/rmoff-blog:0.152.2
Production:   ghcr.io/rmoff/rmoff-blog:0.152.2
```

**Docker image includes:**
- Hugo 0.152.2 Extended
- AsciiDoctor + AsciiDoctor-Reveal.js
- Rouge (syntax highlighting)
- Alpine Linux base

**Multi-platform support:**
- linux/amd64 (GitHub Actions runners)
- linux/arm64 (M1/M2 Macs)

### Docker Image Updates

The Docker image is automatically built and published when:
- `Dockerfile` is modified
- `.github/workflows/docker-image.yml` is modified
- Manually triggered via workflow_dispatch

Published to: `ghcr.io/rmoff/rmoff-blog:0.152.2` (public package)

## Development Workflows

### Creating a New Post

```bash
# Create new branch
id=my-new-post-slug
git checkout main && git pull && git checkout -b $id

# Create new post
docker run --rm -it \
  -v $(pwd):/src \
  ghcr.io/rmoff/rmoff-blog:0.152.2 \
  new content/post/$id.adoc

# Edit the post, then commit and use bundle workflow to push
```

### Building Locally

**Full build:**
```bash
docker run --rm -v $(pwd):/src ghcr.io/rmoff/rmoff-blog:0.152.2
```

**Build with drafts and future posts:**
```bash
docker run --rm -v $(pwd):/src ghcr.io/rmoff/rmoff-blog:0.152.2 --buildDrafts --buildFuture
```

### Building Presentations

Reveal.js presentations are stored in `content/talk/` as `slides.adoc` files.

**Build presentations:**
```bash
./build-slides.sh
```

This requires local installation of:
```bash
gem install asciidoctor asciidoctor-revealjs
```

Presentations are automatically built before Hugo in CI/CD workflows.

### Link Checking

Check for broken links locally:
```bash
mkdir /tmp/hugo_public && \
docker run --rm -v $(pwd):/src -v /tmp/hugo_public:/tmp/public \
  ghcr.io/rmoff/rmoff-blog:0.152.2 --buildFuture --buildDrafts -d /tmp/public && \
docker run -v /tmp/hugo_public:/check ghcr.io/untitaker/hyperlink:0.1.26 /check && \
rm -rf /tmp/hugo_public
```

## CI/CD Pipeline

### Live Deployment (main branch)

**Workflow:** `.github/workflows/gh-pages-deployment.yml`

**Triggers:** Push to `main` branch

**Process:**
1. Checkout code
2. Build reveal.js presentations (local AsciiDoctor)
3. Build site with Docker
4. Deploy to `rmoff/rmoff.github.io` (GitHub Pages)

**URL:** https://rmoff.net

### PR Previews

**Workflow:** `.github/workflows/preview-blog-cloudflare.yaml`

**Triggers:** Pull requests

**Process:**
1. Checkout code
2. Build reveal.js presentations
3. Build site with Docker
4. Deploy to CloudFlare Pages

**URL:** https://preview.rmoff.net/

### Docker Image Build

**Workflow:** `.github/workflows/docker-image.yml`

**Triggers:**
- Push to `main` with Dockerfile changes
- Manual workflow_dispatch

**Outputs:**
- `ghcr.io/rmoff/rmoff-blog:0.152.2`
- `ghcr.io/rmoff/rmoff-blog:latest`
- `ghcr.io/rmoff/rmoff-blog:<branch>-<sha>`

## Building the Docker Image Locally (Optional)

If you need to modify the Dockerfile:

```bash
# Build
docker build -t rmoff-blog-hugo:0.152.2 .

# Use local image
docker run --rm -it \
  -v $(pwd):/src \
  -p 1313:1313 \
  rmoff-blog-hugo:0.152.2 \
  server --bind 0.0.0.0
```

## Project Structure

```
rmoff-blog/
├── .github/workflows/       # CI/CD workflows
├── content/
│   ├── post/               # Blog posts (Markdown & AsciiDoc)
│   └── talk/               # Presentations (AsciiDoc → Reveal.js)
├── themes/story/           # Hugo theme (customized)
├── static/                 # Static assets
├── public/                 # Generated site (git-ignored)
├── config.yaml             # Hugo configuration
├── Dockerfile              # Docker image definition
├── build-slides.sh         # Presentation build script
├── HUGO_UPGRADE.md         # Hugo 0.152.2 upgrade documentation
└── DEVELOPMENT.md          # This file
```

## Hugo Configuration

Key settings in `config.yaml`:

- **Theme**: story (unmaintained, locally modified)
- **BaseURL**: https://rmoff.net
- **Timeout**: 120s (for long builds)
- **Markup**:
  - AsciiDoc (with custom attributes)
  - Goldmark (for Markdown, unsafe HTML enabled)
- **Outputs**: HTML, JSON, RSS for various page types

## Theme Customizations

The Story theme has been modified to:
- Remove deprecated Google Analytics code (Hugo 0.120+ compatibility)
- Fix `.HugoGenerator` deprecation

**Location:** `themes/story/layouts/_default/baseof.html`

## Common Tasks

### Update Hugo Version

1. Edit `Dockerfile` - change Hugo version
2. Update version in all workflow files
3. Update this documentation
4. Test locally
5. Commit and push (via bundle workflow)
6. Docker image will auto-build
7. Create PR to test preview deployment
8. Merge to deploy to production

### Add New Dependencies to Docker Image

1. Edit `Dockerfile`
2. Build locally and test
3. Commit and push
4. Docker image will auto-rebuild with new dependencies

### Troubleshooting

**Issue: Docker image not pulling**
- Check package visibility: https://github.com/rmoff/rmoff-blog/pkgs/container/rmoff-blog
- Must be set to "Public"

**Issue: Workflows failing with permission errors**
- Check workflow has required permissions block
- Docker workflows need: `packages: read`
- CloudFlare workflow needs: `deployments: write`

**Issue: ARM64 Mac can't pull image**
- Ensure Dockerfile builds are multi-platform
- Check `.github/workflows/docker-image.yml` has: `platforms: linux/amd64,linux/arm64`

**Issue: Push rejected from local machine**
- Normal! Use the git bundle workflow described above
- Never try to push directly

## Migration History

- **2024-12-18**: Upgraded Hugo 0.105.0 → 0.152.2
- **2024-12-18**: Migrated from mixed native/Docker builds to Docker-only
- **2024-12-18**: Fixed CloudFlare preview workflow (missing dependencies)
- **2024-12-18**: Removed Surge preview workflow
- **2024-12-18**: Added multi-platform Docker support

See `HUGO_UPGRADE.md` for detailed upgrade documentation.

## Resources

- **Live site**: https://rmoff.net
- **Repository**: https://github.com/rmoff/rmoff-blog
- **Docker image**: https://github.com/rmoff/rmoff-blog/pkgs/container/rmoff-blog
- **Hugo docs**: https://gohugo.io/documentation/
- **AsciiDoc syntax**: https://docs.asciidoctor.org/asciidoc/latest/

## Getting Help

When asking for help (from humans or AI):
1. Mention you're using Docker-based builds
2. Reference this file: "See DEVELOPMENT.md"
3. Include Hugo version (0.152.2)
4. Note the git bundle workflow if push-related
