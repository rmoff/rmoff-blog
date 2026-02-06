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
Always use Docker to run Hugo:
```bash
docker run --rm -it \
  -v $(pwd):/src \
  -p 1313:1313 \
  ghcr.io/rmoff/rmoff-blog:0.152.2 \
  server --bind 0.0.0.0
```

For background/detached mode, add `-d` flag and `--name hugo-server`.

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
