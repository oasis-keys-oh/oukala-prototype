#!/bin/sh
cd "$(dirname "$0")/relparts"
{ cat p1_data.js p2_rel.js p3_relui.js p4_reldrawer.js p5_board.js p6_drawers.js p7_art.js p8_wire.js; echo '})();'; } > ../mod_rel.js
cd .. && node --check mod_rel.js && python3 build.py --only rel --out out_rel
