#!/bin/bash
# Generator (see tools/README.md). Writes mod_kgx.js in src/ from tools/generators/kgx_parts/.
# SRC can point at a copy of src/ to compare without overwriting, for example: SRC=/tmp/srccopy bash mk_kgx.sh
set -e
G="$(cd "$(dirname "$0")" && pwd)"; SRC="${SRC:-$G/../../src}"
cd "$G"
cat kgx_parts/01_engine.js kgx_parts/02_data.js kgx_parts/03_screen.js > "$SRC/mod_kgx.js"
node --check "$SRC/mod_kgx.js"
