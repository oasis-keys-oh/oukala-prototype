cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2
cat parts_sla/sl_a.js parts_sla/sl_b.js parts_sla/sl_c.js parts_sla/sl_d1.js parts_sla/sl_d2.js parts_sla/sl_d3.js parts_sla/sl_e.js > mod_sla.js
node --check mod_sla.js && bash mk_oc.sh oncall out_oncall >/dev/null && python3 build.py --only sla,oncall --out ${1:-out_sla} >/dev/null && node --check ${1:-out_sla}/oukala-js.js && echo BUILD_OK
