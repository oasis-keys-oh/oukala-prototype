#!/bin/bash
cd "$(dirname "$0")"
{ cat fl/00_head.js fl/10_model.js fl/11_registry.js fl/12_logic.js fl/13_roles.js fl/20_list.js fl/21_canvas.js fl/22_inspector.js fl/23_bottom.js fl/24_events.js fl/30_asmt.js; [ -f fl/40_appr.js ] && cat fl/40_appr.js; cat fl/50_dmn.js fl/60_bpmn.js fl/70_agent.js fl/80_hub.js; [ -f fl/90_hooks.js ] && cat fl/90_hooks.js; echo; echo "})();"; } > mod_flow.js
cat fl/_old.css fl/_new.css $(ls fl/_apx.css 2>/dev/null) > mod_flow.css
node --check mod_flow.js && echo SYNTAX_OK
