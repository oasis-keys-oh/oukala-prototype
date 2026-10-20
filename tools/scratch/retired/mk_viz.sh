#!/bin/bash
# Generator (see tools/README.md). Writes mod_viz.js and mod_viz2.js in src/ from tools/generators/vizsrc/.
# SRC can point at a copy of src/ to compare without overwriting, for example: SRC=/tmp/srccopy bash mk_viz.sh
set -e
G="$(cd "$(dirname "$0")" && pwd)"; SRC="${SRC:-$G/../../src}"
cd "$G"
SRC="$SRC" python3 mk_viz.py && node --check "$SRC/mod_viz.js" && node --check "$SRC/mod_viz2.js"
