cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2
for w in "--w 1000" "--w 1440" "--phone"; do
 for spec in "svc_sla:svc_slav:5" "svc_oncall:svc_ocv:5" "svc_skills:svc_skv:6"; do IFS=: read sc vk n <<<"$spec"
  for t in $(seq 0 $n); do echo "== $w $sc tab $t"; VK=$vk VT=$t NODE_PATH=$(npm root -g) node spacescan_tab.js ${1:-out_slafull} $w --only $sc 2>&1 | grep -v "^## " | head -8; done; done; done
