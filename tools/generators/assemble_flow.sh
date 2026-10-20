#!/bin/bash
# Generator (see tools/README.md). Writes mod_flow.js and mod_flow.css in src/ from tools/generators/fl/.
# SRC can point at a copy of src/ to compare without overwriting, for example: SRC=/tmp/srccopy bash assemble_flow.sh
set -e
G="$(cd "$(dirname "$0")" && pwd)"; SRC="${SRC:-$G/../../src}"
cd "$G"
{ cat fl/00_head.js fl/10_model.js fl/11_registry.js fl/12_logic.js fl/13_roles.js fl/20_list.js fl/21_canvas.js fl/22_inspector.js fl/23_bottom.js fl/24_events.js fl/30_asmt.js; [ -f fl/40_appr.js ] && cat fl/40_appr.js; cat fl/50_dmn.js fl/60_bpmn.js fl/70_agent.js fl/80_hub.js; [ -f fl/90_hooks.js ] && cat fl/90_hooks.js; echo; echo "})();"; } > "$SRC/mod_flow.js"
cat fl/_old.css fl/_new.css $(ls fl/_apx.css 2>/dev/null) > "$SRC/mod_flow.css"
node --check "$SRC/mod_flow.js" && echo SYNTAX_OK
