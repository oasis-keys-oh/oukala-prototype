#!/bin/bash
# usage: sla_shot.sh screen viewkey tab width [extra]
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
NODE_PATH=$(npm root -g) node shotw.js out_fix_sla $1 $4 --eval "S.v.$2=$3;go('$1')" $5 $6 >/dev/null
mv out_fix_sla/shots/$1-$4.png out_fix_sla/shots/$1_$3_$4.png 2>/dev/null || mv out_fix_sla/shots/$1-$4-dark.png out_fix_sla/shots/$1_$3_$4d.png
