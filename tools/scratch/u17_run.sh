#!/bin/bash
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
export NODE_PATH=$(npm root -g)
node u17_clickall.js out_u17 "$1" > "u17_log_$2.txt" 2>&1
echo done >> "u17_log_$2.txt"
