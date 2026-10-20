#!/bin/bash
# Generator (see tools/README.md). Writes mod_sla.js (and mod_oncall.js through mk_oc.sh) in src/ from tools/generators/parts_sla/.
# SRC can point at a copy of src/ to compare without overwriting, for example: SRC=/tmp/srccopy bash mk_sla.sh
set -e
G="$(cd "$(dirname "$0")" && pwd)"; SRC="${SRC:-$G/../../src}"
cd "$G"
cat parts_sla/sl_a.js parts_sla/sl_b.js parts_sla/sl_c.js parts_sla/sl_d1.js parts_sla/sl_d2.js parts_sla/sl_d3.js parts_sla/sl_e.js > "$SRC/mod_sla.js"
node --check "$SRC/mod_sla.js" && SRC="$SRC" bash "$G/mk_oc.sh" >/dev/null && echo BUILD_OK
