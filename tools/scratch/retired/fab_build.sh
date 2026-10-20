#!/bin/bash
# Generator (see tools/README.md). Writes mod_plat_fabric.js in src/ from tools/generators/fabparts/.
# SRC can point at a copy of src/ to compare without overwriting, for example: SRC=/tmp/srccopy bash fab_build.sh
set -e
G="$(cd "$(dirname "$0")" && pwd)"; SRC="${SRC:-$G/../../src}"
cd "$G"
cat fabparts/a.js fabparts/b.js fabparts/c.js fabparts/d.js fabparts/e.js fabparts/f.js fabparts/g.js > "$SRC/mod_plat_fabric.js"
node --check "$SRC/mod_plat_fabric.js" && echo BUILT
