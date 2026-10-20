#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2
export NODE_PATH=$(npm root -g)
node u17_fast.js out_u17 exe_dash 1 > u17_fast_exe.txt 2>&1
node u17_fast.js out_u17 r16j_dash 3 > u17_fast_r16j.txt 2>&1
node u17_fast.js out_u17 obs_dash 3 > u17_fast_obs.txt 2>&1
node allscreens.js out_u17 > u17_all.txt 2>&1
node spacescan.js out_u17 > u17_sp1.txt 2>&1
node spacescan.js out_u17 --dark > u17_sp2.txt 2>&1
node spacescan.js out_u17 --phone > u17_sp3.txt 2>&1
node perm_test.js out_u17 > u17_perm.txt 2>&1
node /tmp/s22.js out_u17 > u17_load.txt 2>&1
echo done > u17_suite.done
