# Blog Project Instructions

## Git Workflow

**NEVER work directly on main.** Always create a feature branch for any changes:
```bash
git checkout -b <descriptive-branch-name>
```

## Content Files

This blog contains **both AsciiDoc (`.adoc`) and Markdown (`.md`) files**. When making bulk changes or searching for content patterns, always check both file types.

## Development Environment

### Hugo Server
Always use `./serve.sh` to run Hugo locally. It builds the Docker image from the Dockerfile and starts the dev server. Use `./serve.sh 1314` for a different port (e.g. in worktrees).

For background/detached mode, build and run manually:
```bash
docker build -t rmoff-blog:local .
docker run --rm -d --name hugo-server -v $(pwd):/src -p 1313:1313 rmoff-blog:local server --bind 0.0.0.0
```

### CSS Changes
Hugo fingerprints CSS via `resources.Get | fingerprint` in `layouts/_default/baseof.html`. The fingerprinted CSS file is cached and **does not update on live reload**. After any CSS edit, you must **stop and restart** the Hugo Docker container to regenerate the fingerprinted file, then hard-refresh the browser. `docker restart` alone is NOT sufficient — the container must be fully stopped and started fresh.

### Validation
**MANDATORY:** For any website changes (layouts, templates, CSS, JavaScript, configuration, etc.) other than new articles, you MUST run Playwright tests to validate the changes before considering the work complete. Run tests to verify visual and functional changes work correctly.

## Proofreading

When asked to proofread or review a blog post:
- Use `/proofread-blog` for regular articles
- Use `/proofread-links` for "Interesting Links" posts (files matching `il-*.adoc` or posts mentioning "Interesting Links")
  - Switch to Haiku first for cost efficiency: `/model haiku`

## CI/CD Changes

When adding or modifying build steps in GitHub Actions workflows:
1. Check ALL workflow files in `.github/workflows/`
2. Identify which workflows build/deploy the site (e.g., production AND preview deployments)
3. Apply the change consistently to all relevant workflows
