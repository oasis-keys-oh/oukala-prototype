#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
export NODE_PATH=$(npm root -g)
node whyscan.js out_i16 --n 44 > i16/why_d.log 2>&1
node whyscan.js out_i16 --n 44 --light > i16/why_l.log 2>&1
for i in 0 1 2; do node fontscan.js out_i16 --shard $i/3 --json i16/fe_$i.json > i16/fe_$i.log 2>&1 & done; wait
for i in 0 1 2; do node fontscan.js out_i16 --light --shard $i/3 --json i16/fl_$i.json > i16/fl_$i.log 2>&1 & done; wait
echo done > i16/runall.done
