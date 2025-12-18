# Hugo Upgrade: 0.105.0 → 0.152.2

## Summary

Successfully upgraded Hugo from version 0.105.0 (Nov 2022) to 0.152.2 (Oct 2024).

## Changes Made

### 1. Docker-Based Build System

**New Dockerfile** (`Dockerfile`)
- Base image: `hugomods/hugo:0.152.2`
- Includes: AsciiDoctor, AsciiDoctor-Reveal.js, Rouge 3.30.0
- Published to GitHub Container Registry: `ghcr.io/rmoff/rmoff-blog:0.152.2`

**Benefits:**
- ✅ Identical builds across local, preview, and production environments
- ✅ No environment drift between developer machines and CI/CD
- ✅ Faster CI builds with Docker layer caching
- ✅ Version pinning ensures reproducibility

### 2. Fixed Breaking Changes

**Theme Template Fix** (`themes/story/layouts/_default/baseof.html`)
- Removed deprecated `.Site.GoogleAnalytics` field (deprecated in Hugo 0.120)
- Removed reference to `_internal/google_analytics_async.html` template (removed in Hugo 0.120)

### 3. Workflow Improvements

**All workflows now:**
- Use Docker for Hugo builds (consistency)
- Use `actions/checkout@v3` (was v1 in live deployment)
- Pull Docker image from GitHub Container Registry
- Have proper permissions for package access

**Fixed CloudFlare Preview Workflow:**
- ✅ Added missing `asciidoctor-revealjs` installation
- ✅ Added missing `./build-slides.sh` step
- Previously would fail if posts referenced reveal.js presentations

**New Docker Image Workflow** (`.github/workflows/docker-image.yml`)
- Automatically builds and publishes Docker image on Dockerfile changes
- Triggers on pushes to main/substack branches
- Uses GitHub Actions cache for faster builds
- Can be manually triggered via workflow_dispatch

### 4. Updated Workflows

1. **Live Deployment** (`gh-pages-deployment.yml`)
   - Now uses Docker image from GHCR
   - Updated checkout action to v3

2. **CloudFlare Preview** (`preview-blog-cloudflare.yaml`)
   - Fixed missing dependencies (asciidoctor-revealjs, build-slides.sh)
   - Now uses Docker for consistent builds

3. **Surge Preview** (`preview-blog.yaml`)
   - ❌ Removed (no longer needed)

### 5. Documentation Updates

- `README.adoc`: Updated all Docker commands to use new image
- `content/post/hugo-orbstack.md`: Updated Docker example with note

## Build Pipeline Architecture

### Before
```
Local:    Alpine Linux + Docker (klakegg/hugo:0.105.0)
Preview:  Ubuntu 22.04 + Native installation ❌ DIFFERENT
Live:     Ubuntu 22.04 + Native installation ❌ DIFFERENT
```

### After
```
Local:    Alpine Linux + Docker (ghcr.io/rmoff/rmoff-blog:0.152.2)
Preview:  Ubuntu 22.04 + Docker (ghcr.io/rmoff/rmoff-blog:0.152.2) ✅ SAME
Live:     Ubuntu 22.04 + Docker (ghcr.io/rmoff/rmoff-blog:0.152.2) ✅ SAME
```

## Breaking Changes from Hugo 0.105 → 0.152

### Addressed in this upgrade:
- ✅ `.Site.GoogleAnalytics` field removed (Hugo 0.120)
- ✅ `_internal/google_analytics_async.html` template removed (Hugo 0.120)

### Warnings (non-breaking):
- Twitter shortcodes deprecated in v0.142.0 (use "x" shortcode instead)
  - Currently just warnings, will be removed in future Hugo version
  - Can suppress with: `ignoreLogs = ['shortcode-twitter-getremote']`

## Testing

### Local Testing
```bash
# Build the Docker image
docker build -t rmoff-blog-hugo:0.152.2 .

# Test build
docker run --rm -v $(pwd):/src rmoff-blog-hugo:0.152.2 --buildDrafts --buildFuture

# Test server
docker run --rm -v $(pwd):/src -p 1313:1313 rmoff-blog-hugo:0.152.2 server --bind 0.0.0.0
```

### Build Statistics
- Pages: 2,160
- Build time: ~5.3 seconds
- Static files: 2,326
- No errors

## Migration Steps

### Initial Setup (One-time)

1. **Create dedicated branch and push Dockerfile to trigger image build:**
   ```bash
   git checkout -b hugo-upgrade-0.152.2
   git add Dockerfile .dockerignore .github/workflows/docker-image.yml
   git commit -m "Add Docker image workflow"
   git push origin hugo-upgrade-0.152.2
   ```

2. **Wait for Docker image to build:**
   - Check Actions tab: "Build and Publish Docker Image" workflow
   - Image will be published to: `ghcr.io/rmoff/rmoff-blog:0.152.2`
   - Make sure the package visibility is set to public or accessible to Actions

3. **Then push the workflow updates:**
   ```bash
   git add .github/workflows/*.yml
   git commit -m "Update workflows to use Docker builds"
   git push origin hugo-upgrade-0.152.2
   ```

### Ongoing Development

**Local development workflow unchanged:**
```bash
# Build image (only needed once, or when Dockerfile changes)
docker build -t rmoff-blog-hugo:0.152.2 .

# Run server for development
docker run --rm -it \
  -v $(pwd):/src \
  -p 1313:1313 \
  rmoff-blog-hugo:0.152.2 \
  server --bind 0.0.0.0
```

**CI/CD automatically:**
- Pulls latest Docker image from GHCR
- Builds presentations with local AsciiDoctor
- Builds site with Docker (Hugo + AsciiDoctor)
- Deploys to appropriate environment

## Files Modified

```
.dockerignore                                    (new)
.github/workflows/docker-image.yml               (new)
.github/workflows/gh-pages-deployment.yml        (modified)
.github/workflows/preview-blog.yaml              (modified)
.github/workflows/preview-blog-cloudflare.yaml   (modified)
Dockerfile                                       (new)
README.adoc                                      (modified)
content/post/hugo-orbstack.md                    (modified)
themes/story/layouts/_default/baseof.html        (modified)
```

## Rollback Plan

If issues are encountered:

1. **Revert to native Hugo installation in workflows:**
   - Change workflows back to use `peaceiris/actions-hugo@v2`
   - Restore gem installation steps

2. **Keep Hugo 0.152.2:**
   - The breaking changes are minimal and addressed
   - Staying on 0.152.2 is recommended even if reverting Docker approach

## Future Improvements

- [ ] Consider suppressing Twitter shortcode warnings or migrating to "x" shortcode
- [ ] Evaluate Hugo module system for theme management
- [ ] Consider adding Hugo build caching in workflows
- [ ] Monitor Hugo releases for new features/deprecations

## Notes

- **Presentation builds** still require local AsciiDoctor because `build-slides.sh` runs asciidoctor CLI directly (not through Hugo)
- **Docker image** is cached in GitHub Actions, speeding up builds significantly
- **Version pinning** at 0.152.2 ensures consistency; update by changing version in Dockerfile and workflows
