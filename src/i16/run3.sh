#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
export NODE_PATH=$(npm root -g)
node spacescan.js out_i16 > i16/space.log 2>&1 &
node cardscan.js out_i16 > i16/card.log 2>&1 &
node nestscan.js out_i16 > i16/nest.log 2>&1 &
wait
echo done > i16/run3.done
