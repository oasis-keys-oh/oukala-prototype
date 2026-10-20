#!/bin/bash
# assemble mod_svc.js from parts
D=/tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2
cd $D/svc_parts
cat p01_core.js p02_ill.js _kb.js p03_items.js p04_flows.js p05_engine.js p06_data.js p07_ui.js p08_form.js p09_cat.js p10_item.js p11_design.js p12_req.js p13_portal.js p14_asset.js p15_notify.js p16_events.js > $D/mod_svc.js
cp svc.css $D/mod_svc.css
node --check $D/mod_svc.js && echo SYNTAX_OK
