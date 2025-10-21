#!/bin/bash
# Build reveal.js presentations
find content/talks -name "slides.adoc" -type f | while read -r file; do
    dir=$(dirname "$file")
    echo "Building slides in $dir"
    asciidoctor-revealjs "$file" -D "$dir"
done
