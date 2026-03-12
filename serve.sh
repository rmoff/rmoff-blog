#!/usr/bin/env bash
set -e

docker build -t rmoff-blog:local .
docker run --rm -it \
  -v "$(pwd)":/src \
  -p "${1:-1313}":1313 \
  rmoff-blog:local \
  server --bind 0.0.0.0 --liveReloadPort "${1:-1313}"
