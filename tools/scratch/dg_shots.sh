#!/bin/bash
# usage: dg_shots.sh OUT screen width [--dark]
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
OUT=$1; SC=$2; W=$3; shift 3
n=$(case $SC in plat_debt) echo 6;; plat_gate) echo 7;; plat_mcp) echo 6;; esac)
for i in $(seq 0 $((n-1))); do
 NODE_PATH=$(npm root -g) node shotw.js $OUT $SC $W "$@" --full --eval "S.v.$( [ $SC = plat_debt ] && echo debt || ([ $SC = plat_gate ] && echo gate || echo mcp) )=$i;render()" >/dev/null
 f=$OUT/shots/$SC-$W$( [[ "$*" == *--dark* ]] && echo -dark ).png; cp $f $OUT/shots/$SC-t$i-$W$( [[ "$*" == *--dark* ]] && echo -dark ).png
done
ls $OUT/shots | grep "$SC-t"
