#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
export NODE_PATH=$(npm root -g)
O=out_q17; L=r17_shots/q_logs; mkdir -p $L
S=r17q_value,r17q_thinking
node spacescan.js $O --w 1440 --only $S > $L/space_desk_light.log 2>&1
node spacescan.js $O --w 1440 --only $S --dark > $L/space_desk_dark.log 2>&1
node spacescan.js $O --phone --only $S > $L/space_phone_light.log 2>&1
node spacescan.js $O --phone --only $S --dark > $L/space_phone_dark.log 2>&1
node perm_test.js $O --quiet > $L/perm.log 2>&1
node allscreens.js $O > $L/all_desk.log 2>&1
node allscreens.js $O --phone > $L/all_phone.log 2>&1
echo done > $L/DONE
