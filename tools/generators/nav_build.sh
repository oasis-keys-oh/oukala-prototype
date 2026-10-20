#!/bin/bash
# Generator (see tools/README.md). Writes mod_nav.js in src/ from tools/generators/nav_parts/.
# SRC can point at a copy of src/ to compare without overwriting, for example: SRC=/tmp/srccopy bash nav_build.sh
set -e
G="$(cd "$(dirname "$0")" && pwd)"; SRC="${SRC:-$G/../../src}"
cd "$G"
{ cat nav_parts/01_core.js nav_parts/02_chrome.js nav_parts/03_search.js nav_parts/04_contract.js nav_parts/05_studio.js; } > "$SRC/mod_nav.js"
node --check "$SRC/mod_nav.js" && echo "mod_nav ok $(wc -c < "$SRC/mod_nav.js")"
