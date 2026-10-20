#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
export NODE_PATH=$(npm root -g)
for t in "allscreens.js out_v16b:all" "nestscan.js out_v16b:nest" "cardscan.js out_v16b:card" "whyscan.js out_v16b --n 80:why" "spacescan.js out_v16b:space" "fontscan.js out_v16b:font" "a14_geom.js out_v16b:geom"; do
  cmd="${t%%:*}"; name="${t##*:}"
  nice -n 10 node $cmd > s_work/scan_$name.txt 2>&1
  echo done $name >> s_work/chain.log
done
