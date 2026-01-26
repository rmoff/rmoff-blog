# Blog Project Instructions

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
Use Playwright for validating UI changes. Run tests to verify visual and functional changes work correctly.

## Proofreading

When asked to proofread or review a blog post:
- Use `/proofread-blog` for regular articles
- Use `/proofread-links` for "Interesting Links" posts (files matching `il-*.adoc` or posts mentioning "Interesting Links")
  - Switch to Haiku first for cost efficiency: `/model haiku`
