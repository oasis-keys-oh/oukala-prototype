#!/bin/bash
# Generator (see tools/README.md). Writes mod_budget.js in src/ from tools/generators/bp/.
# SRC can point at a copy of src/ to compare without overwriting, for example: SRC=/tmp/srccopy bash rebuild_budget.sh
set -e
G="$(cd "$(dirname "$0")" && pwd)"; SRC="${SRC:-$G/../../src}"
cd "$G"
cat bp/p1.js bp/p2.js bp/p3.js bp/p4.js bp/p5.js bp/p6.js bp/p7.js bp/p8.js > "$SRC/mod_budget.js"
node --check "$SRC/mod_budget.js" && echo built
