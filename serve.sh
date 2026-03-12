#!/usr/bin/env bash
# Local Hugo development server.
#
# Builds the Docker image from the Dockerfile and starts Hugo in
# server mode with live reload.
#
# Usage:
#   ./serve.sh          # runs on port 1313
#   ./serve.sh 1314     # runs on port 1314 (useful for worktrees)
set -e

docker build -t rmoff-blog:local .
docker run --rm -it \
  -v "$(pwd)":/src \
  -p "${1:-1313}":1313 \
  rmoff-blog:local \
  server --bind 0.0.0.0 --liveReloadPort "${1:-1313}"
