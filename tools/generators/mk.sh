#!/bin/bash
# Generator (see tools/README.md). Writes mod_people.js in src/ from tools/generators/pp/.
# SRC can point at a copy of src/ to compare without overwriting, for example: SRC=/tmp/srccopy bash mk.sh
set -e
G="$(cd "$(dirname "$0")" && pwd)"; SRC="${SRC:-$G/../../src}"
cd "$G"
cat pp/p0.js pp/p1.js pp/p2.js pp/p3.js pp/p4.js pp/p5.js pp/p6.js pp/p7.js > "$SRC/mod_people.js"
node --check "$SRC/mod_people.js" && echo built
