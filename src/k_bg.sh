#!/bin/bash
# usage: k_bg.sh outfile node-args...  (runs in background, writes output)
cd /tmp/claude-0/-home-claude/64b136d5-fe7c-54e7-be41-393e496f5667/scratchpad/v2/
o=$1; shift
export NODE_PATH=$(npm root -g)
nohup timeout 600 node "$@" > $o 2>&1 &
