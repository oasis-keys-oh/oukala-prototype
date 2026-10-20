#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
export NODE_PATH=$(npm root -g)
run(){ name=$1; shift; for try in 1 2 3; do node "$@" > s_work/scan_$name.txt 2>&1; if ! grep -q "Target page, context or browser has been closed" s_work/scan_$name.txt; then break; fi; sleep 5; done; echo "done $name try$try" >> s_work/chain2.log; }
run nest nestscan.js out_v16b
run card cardscan.js out_v16b
run space spacescan.js out_v16b
run font fontscan.js out_v16b
run all allscreens.js out_v16b
run geom a14_geom.js out_v16b
