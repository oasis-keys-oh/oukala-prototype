cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2
export NODE_PATH=$(npm root -g)
for a in "--w 1000" "--w 1440" "--phone"; do
 for pair in ppl_org:6 ppl_perf:8 ppl_cap:9 ppl_jrny:5; do s=${pair%:*}; n=${pair#*:}
  for ((t=0;t<n;t++)); do r=$(TAB=$t node spacescan_t.js out_people $a --only $s 2>&1 | grep -v "^total flagged 0" | head -6); [ -n "$r" ] && echo "[$a $s tab $t] $r"; done
 done
done
echo done
