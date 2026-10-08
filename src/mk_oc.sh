cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2
cat parts_sla/oc_a.js parts_sla/oc_b.js parts_sla/oc_c.js parts_sla/oc_d1.js parts_sla/oc_d2.js parts_sla/oc_d3.js parts_sla/oc_d4.js parts_sla/oc_e.js parts_sla/oc_f.js > mod_oncall.js
node --check mod_oncall.js && python3 build.py --only ${1:-oncall} --out ${2:-out_oncall} >/dev/null && node --check ${2:-out_oncall}/oukala-js.js && echo BUILD_OK
