#!/bin/bash
# Generator (see tools/README.md). Writes mod_oncall.js in src/ from tools/generators/parts_sla/.
# SRC can point at a copy of src/ to compare without overwriting, for example: SRC=/tmp/srccopy bash mk_oc.sh
set -e
G="$(cd "$(dirname "$0")" && pwd)"; SRC="${SRC:-$G/../../src}"
cd "$G"
cat parts_sla/oc_a.js parts_sla/oc_b.js parts_sla/oc_c.js parts_sla/oc_d1.js parts_sla/oc_d2.js parts_sla/oc_d3.js parts_sla/oc_d4.js parts_sla/oc_e.js parts_sla/oc_f.js > "$SRC/mod_oncall.js"
node --check "$SRC/mod_oncall.js" && echo BUILD_OK
