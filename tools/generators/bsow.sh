#!/bin/bash
# Generator (see tools/README.md). Writes mod_sow.js in src/ from tools/generators/sow_parts/.
# SRC can point at a copy of src/ to compare without overwriting, for example: SRC=/tmp/srccopy bash bsow.sh
set -e
G="$(cd "$(dirname "$0")" && pwd)"; SRC="${SRC:-$G/../../src}"
cd "$G"
cat sow_parts/p1_head.js sow_parts/p2_pb.js sow_parts/p3_engine.js sow_parts/p4_text.js sow_parts/p5_data.js sow_parts/p6_state.js sow_parts/p7_seed.js sow_parts/p8_ui1.js sow_parts/p9_analyzer.js sow_parts/p10_playbook.js sow_parts/p11_cmp_chg.js sow_parts/p12_obl.js sow_parts/p13_actions.js sow_parts/p14_events.js > "$SRC/mod_sow.js"
node --check "$SRC/mod_sow.js" && echo built
