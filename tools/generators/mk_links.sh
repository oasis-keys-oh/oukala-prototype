#!/bin/bash
# Generator (see tools/README.md). Writes mod_plat_links.js in src/ from tools/generators/plk_parts/.
# SRC can point at a copy of src/ to compare without overwriting, for example: SRC=/tmp/srccopy bash mk_links.sh
set -e
G="$(cd "$(dirname "$0")" && pwd)"; SRC="${SRC:-$G/../../src}"
cd "$G"
cat plk_parts/p1.js plk_parts/p2.js plk_parts/p3.js plk_parts/p4.js plk_parts/p5.js plk_parts/p6.js > "$SRC/mod_plat_links.js"
node --check "$SRC/mod_plat_links.js" && echo built
